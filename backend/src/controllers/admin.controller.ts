import { Request, Response } from 'express';
import { User, EmailAccount, WarmupEmail, WarmupConversation, Package, AuditLog } from '../models';
import { Op } from 'sequelize';
import { getHealthScoreCategory, getPlatformHealthStats } from '../services/health/calculator';
import logger from '../utils/logger';

/**
 * Get admin dashboard overview
 */
export const getDashboard = async (req: Request, res: Response) => {
  try {
    // Total users
    const totalUsers = await User.count();
    const activeUsers = await User.count({
      where: { isActive: true }
    });

    // Total mailboxes
    const totalMailboxes = await EmailAccount.count();
    const activeMailboxes = await EmailAccount.count({
      where: {
        status: 'active',
        isWarmupEnabled: true
      }
    });

    // Get platform health statistics
    const platformHealthStats = await getPlatformHealthStats();

    // Emails sent today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const emailsSentToday = await WarmupEmail.count({
      where: {
        sentAt: {
          [Op.gte]: today
        }
      }
    });

    // Active conversations
    const activeConversations = await WarmupConversation.count({
      where: {
        status: 'active'
      }
    });

    // Users by package
    const packages = await Package.findAll();
    const usersByPackage = await Promise.all(
      packages.map(async (pkg) => ({
        packageName: pkg.name,
        count: await User.count({ where: { packageId: pkg.id } })
      }))
    );

    // Recent activity (last 20 actions)
    const recentActivity = await AuditLog.findAll({
      order: [['createdAt', 'DESC']],
      limit: 20,
      attributes: ['id', 'userId', 'action', 'entity', 'details', 'createdAt'],
      include: [
        {
          association: 'user',
          attributes: ['id', 'email', 'firstName', 'lastName']
        }
      ]
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          activeUsers,
          totalMailboxes,
          activeMailboxes,
          emailsSentToday,
          activeConversations,
          averageHealthScore: platformHealthStats.averageHealthScore
        },
        healthDistribution: {
          excellent: platformHealthStats.excellentCount,
          good: platformHealthStats.goodCount,
          average: platformHealthStats.averageCount,
          poor: platformHealthStats.poorCount,
          critical: platformHealthStats.criticalCount
        },
        usersByPackage,
        recentActivity
      }
    });
  } catch (error: any) {
    logger.error('Failed to get admin dashboard', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get admin dashboard'
    });
  }
};

/**
 * Get all users with pagination and search
 */
export const getUsers = async (req: Request, res: Response) => {
  try {
    const {
      limit = 50,
      offset = 0,
      search = '',
      packageId,
      isActive
    } = req.query;

    const where: any = {};

    // Search by email, firstName, lastName, or company
    if (search) {
      where[Op.or] = [
        { email: { [Op.iLike]: `%${search}%` } },
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { company: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Filter by package
    if (packageId) {
      where.packageId = packageId;
    }

    // Filter by active status
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      order: [['createdAt', 'DESC']],
      include: [
        {
          association: 'package',
          attributes: ['id', 'name', 'maxMailboxes', 'maxEmailsPerDayPerMailbox']
        },
        {
          association: 'emailAccounts',
          attributes: ['id', 'email', 'status', 'healthScore']
        }
      ]
    });

    // Remove passwords from response
    const usersData = rows.map(user => {
      const userData = user.toJSON();
      delete (userData as any).password;
      return userData;
    });

    res.json({
      success: true,
      data: {
        total: count,
        users: usersData
      }
    });
  } catch (error: any) {
    logger.error('Failed to get users', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get users'
    });
  }
};

/**
 * Get single user details
 */
export const getUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      include: [
        {
          association: 'package',
          attributes: ['id', 'name', 'maxMailboxes', 'maxEmailsPerDayPerMailbox', 'features', 'price']
        },
        {
          association: 'emailAccounts',
          attributes: ['id', 'email', 'provider', 'status', 'healthScore', 'isWarmupEnabled', 'totalEmailsSent', 'totalEmailsReceived', 'createdAt']
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove password
    const userData = user.toJSON();
    delete (userData as any).password;

    // Get user's audit log (last 50 actions)
    const auditLog = await AuditLog.findAll({
      where: { userId: id },
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    res.json({
      success: true,
      data: {
        user: userData,
        auditLog
      }
    });
  } catch (error: any) {
    logger.error('Failed to get user', { error: error.message, userId: req.params.id });
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get user'
    });
  }
};

/**
 * Update user details (admin can change package, limits, status)
 */
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      packageId,
      isActive,
      maxMailboxes,
      maxEmailsPerDay,
      firstName,
      lastName,
      company,
      country,
      city
    } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update allowed fields
    if (packageId !== undefined) {
      // Verify package exists
      const pkg = await Package.findByPk(packageId);
      if (!pkg) {
        return res.status(400).json({
          success: false,
          message: 'Invalid package ID'
        });
      }
      user.packageId = packageId;
    }

    if (isActive !== undefined) user.isActive = isActive;
    if (maxMailboxes !== undefined) user.maxMailboxes = maxMailboxes;
    if (maxEmailsPerDay !== undefined) user.maxEmailsPerDay = maxEmailsPerDay;
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (company !== undefined) user.company = company;
    if (country !== undefined) user.country = country;
    if (city !== undefined) user.city = city;

    await user.save();

    // Audit log
    await AuditLog.create({
      userId: user.id,
      action: 'update_user',
      entity: 'user',
      entityId: user.id,
      details: `Admin ${req.user!.email} updated user ${user.email}`
    });

    logger.info('User updated by admin', {
      adminEmail: req.user!.email,
      userEmail: user.email,
      changes: req.body
    });

    // Return updated user without password
    const userData = user.toJSON();
    delete (userData as any).password;

    res.json({
      success: true,
      message: 'User updated successfully',
      data: userData
    });
  } catch (error: any) {
    logger.error('Failed to update user', { error: error.message, userId: req.params.id });
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update user'
    });
  }
};

/**
 * Delete user account
 */
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting admin users
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete admin users'
      });
    }

    const userEmail = user.email;

    // Delete user (cascades to email accounts, warmup emails, etc.)
    await user.destroy();

    // Audit log
    await AuditLog.create({
      userId: parseInt(id),
      action: 'delete_user',
      entity: 'user',
      entityId: parseInt(id),
      details: `Admin ${req.user!.email} deleted user ${userEmail}`
    });

    logger.warn('User deleted by admin', {
      adminEmail: req.user!.email,
      deletedUserEmail: userEmail
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error: any) {
    logger.error('Failed to delete user', { error: error.message, userId: req.params.id });
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete user'
    });
  }
};

/**
 * Get all mailboxes (admin view)
 */
export const getMailboxes = async (req: Request, res: Response) => {
  try {
    const {
      limit = 50,
      offset = 0,
      search = '',
      status,
      provider,
      connectionType
    } = req.query;

    const where: any = {};

    // Search by email
    if (search) {
      where.email = { [Op.iLike]: `%${search}%` };
    }

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Filter by provider
    if (provider) {
      where.provider = provider;
    }

    // Filter by connection type
    if (connectionType) {
      where.connectionType = connectionType;
    }

    const { count, rows } = await EmailAccount.findAndCountAll({
      where,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      order: [['createdAt', 'DESC']],
      include: [
        {
          association: 'user',
          attributes: ['id', 'email', 'firstName', 'lastName', 'company']
        }
      ]
    });

    // Add health categories and remove sensitive data
    const mailboxesData = rows.map(account => {
      const accountData = account.toJSON();

      // Remove sensitive data
      delete (accountData as any).smtpPassword;
      delete (accountData as any).imapPassword;
      delete (accountData as any).oauthAccessToken;
      delete (accountData as any).oauthRefreshToken;
      delete (accountData as any).serviceAccountJson;

      // Add health category
      const healthCategory = getHealthScoreCategory(parseFloat(account.healthScore.toString()));

      return {
        ...accountData,
        healthCategory
      };
    });

    res.json({
      success: true,
      data: {
        total: count,
        mailboxes: mailboxesData
      }
    });
  } catch (error: any) {
    logger.error('Failed to get mailboxes', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get mailboxes'
    });
  }
};

/**
 * Get single mailbox details
 */
export const getMailbox = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const account = await EmailAccount.findByPk(id, {
      include: [
        {
          association: 'user',
          attributes: ['id', 'email', 'firstName', 'lastName', 'company']
        }
      ]
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Email account not found'
      });
    }

    // Remove sensitive data
    const accountData = account.toJSON();
    delete (accountData as any).smtpPassword;
    delete (accountData as any).imapPassword;
    delete (accountData as any).oauthAccessToken;
    delete (accountData as any).oauthRefreshToken;
    delete (accountData as any).serviceAccountJson;

    // Add health category
    const healthCategory = getHealthScoreCategory(parseFloat(account.healthScore.toString()));

    // Get recent emails sent
    const recentEmailsSent = await WarmupEmail.findAll({
      where: { fromEmailAccountId: id },
      order: [['sentAt', 'DESC']],
      limit: 20,
      attributes: ['id', 'toEmailAccountId', 'subject', 'status', 'sentAt', 'wasOpened', 'wasReplied', 'landedInInbox', 'landedInSpam']
    });

    // Get recent emails received
    const recentEmailsReceived = await WarmupEmail.findAll({
      where: { toEmailAccountId: id },
      order: [['sentAt', 'DESC']],
      limit: 20,
      attributes: ['id', 'fromEmailAccountId', 'subject', 'status', 'sentAt', 'wasOpened', 'wasReplied', 'landedInInbox', 'landedInSpam']
    });

    res.json({
      success: true,
      data: {
        account: {
          ...accountData,
          healthCategory
        },
        recentEmailsSent,
        recentEmailsReceived
      }
    });
  } catch (error: any) {
    logger.error('Failed to get mailbox', { error: error.message, accountId: req.params.id });
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get mailbox'
    });
  }
};

/**
 * Update mailbox settings (admin override)
 */
export const updateMailbox = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      status,
      isWarmupEnabled,
      dailyLimit,
      currentDailyVolume,
      targetDailyVolume,
      increasePerDay
    } = req.body;

    const account = await EmailAccount.findByPk(id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Email account not found'
      });
    }

    // Update allowed fields
    if (status !== undefined) account.status = status;
    if (isWarmupEnabled !== undefined) account.isWarmupEnabled = isWarmupEnabled;
    if (dailyLimit !== undefined) account.dailyLimit = dailyLimit;
    if (currentDailyVolume !== undefined) account.currentDailyVolume = currentDailyVolume;
    if (targetDailyVolume !== undefined) account.targetDailyVolume = targetDailyVolume;
    if (increasePerDay !== undefined) account.increasePerDay = increasePerDay;

    await account.save();

    // Audit log
    await AuditLog.create({
      userId: account.userId,
      action: 'update_mailbox',
      entity: 'email_account',
      entityId: account.id,
      details: `Admin ${req.user!.email} updated mailbox ${account.email}`
    });

    logger.info('Mailbox updated by admin', {
      adminEmail: req.user!.email,
      mailboxEmail: account.email,
      changes: req.body
    });

    res.json({
      success: true,
      message: 'Mailbox updated successfully',
      data: account
    });
  } catch (error: any) {
    logger.error('Failed to update mailbox', { error: error.message, accountId: req.params.id });
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update mailbox'
    });
  }
};

/**
 * Pause warmup for a mailbox
 */
export const pauseMailbox = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const account = await EmailAccount.findByPk(id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Email account not found'
      });
    }

    account.isWarmupEnabled = false;
    await account.save();

    // Audit log
    await AuditLog.create({
      userId: account.userId,
      action: 'pause_warmup',
      entity: 'email_account',
      entityId: account.id,
      details: `Admin ${req.user!.email} paused warmup for ${account.email}`
    });

    logger.info('Warmup paused by admin', {
      adminEmail: req.user!.email,
      mailboxEmail: account.email
    });

    res.json({
      success: true,
      message: 'Warmup paused successfully'
    });
  } catch (error: any) {
    logger.error('Failed to pause warmup', { error: error.message, accountId: req.params.id });
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to pause warmup'
    });
  }
};

/**
 * Resume warmup for a mailbox
 */
export const resumeMailbox = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const account = await EmailAccount.findByPk(id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Email account not found'
      });
    }

    account.isWarmupEnabled = true;
    await account.save();

    // Audit log
    await AuditLog.create({
      userId: account.userId,
      action: 'resume_warmup',
      entity: 'email_account',
      entityId: account.id,
      details: `Admin ${req.user!.email} resumed warmup for ${account.email}`
    });

    logger.info('Warmup resumed by admin', {
      adminEmail: req.user!.email,
      mailboxEmail: account.email
    });

    res.json({
      success: true,
      message: 'Warmup resumed successfully'
    });
  } catch (error: any) {
    logger.error('Failed to resume warmup', { error: error.message, accountId: req.params.id });
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to resume warmup'
    });
  }
};

/**
 * Get platform statistics
 */
export const getStats = async (req: Request, res: Response) => {
  try {
    // Users statistics
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { isActive: true } });
    const newUsersThisWeek = await User.count({
      where: {
        createdAt: {
          [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });

    // Mailboxes statistics
    const totalMailboxes = await EmailAccount.count();
    const activeMailboxes = await EmailAccount.count({
      where: {
        status: 'active',
        isWarmupEnabled: true
      }
    });

    // Emails statistics
    const totalEmailsSent = await WarmupEmail.count();
    const emailsSentToday = await WarmupEmail.count({
      where: {
        sentAt: {
          [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });
    const emailsSentThisWeek = await WarmupEmail.count({
      where: {
        sentAt: {
          [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });

    // Conversations statistics
    const totalConversations = await WarmupConversation.count();
    const activeConversations = await WarmupConversation.count({
      where: { status: 'active' }
    });

    // Platform health statistics
    const platformHealthStats = await getPlatformHealthStats();

    // Users by package
    const packages = await Package.findAll();
    const usersByPackage = await Promise.all(
      packages.map(async (pkg) => ({
        packageId: pkg.id,
        packageName: pkg.name,
        count: await User.count({ where: { packageId: pkg.id } })
      }))
    );

    // Mailboxes by provider
    const providers = ['gmail', 'outlook', 'other'];
    const mailboxesByProvider = await Promise.all(
      providers.map(async (provider) => ({
        provider,
        count: await EmailAccount.count({ where: { provider } })
      }))
    );

    // Mailboxes by connection type
    const connectionTypes = ['oauth', 'smtp', 'appPassword', 'domainWide'];
    const mailboxesByConnectionType = await Promise.all(
      connectionTypes.map(async (type) => ({
        connectionType: type,
        count: await EmailAccount.count({ where: { connectionType: type } })
      }))
    );

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          newThisWeek: newUsersThisWeek
        },
        mailboxes: {
          total: totalMailboxes,
          active: activeMailboxes,
          byProvider: mailboxesByProvider,
          byConnectionType: mailboxesByConnectionType
        },
        emails: {
          totalSent: totalEmailsSent,
          sentToday: emailsSentToday,
          sentThisWeek: emailsSentThisWeek
        },
        conversations: {
          total: totalConversations,
          active: activeConversations
        },
        platformHealth: platformHealthStats,
        usersByPackage
      }
    });
  } catch (error: any) {
    logger.error('Failed to get platform stats', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get platform statistics'
    });
  }
};
