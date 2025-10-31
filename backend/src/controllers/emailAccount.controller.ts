import { Request, Response } from 'express';
import { EmailAccount, User, AuditLog } from '../models';
import { encrypt } from '../utils/encryption';
import { testEmailConnection } from '../services/email/connection';
import { detectProvider, getProviderSettings } from '../services/email/connection';
import { validateEmail, validateSMTPConfig, validateIMAPConfig } from '../utils/validators';
import logger from '../utils/logger';

/**
 * List user's email accounts
 */
export const list = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const accounts = await EmailAccount.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      attributes: {
        exclude: ['smtpPassword', 'imapPassword', 'oauthAccessToken', 'oauthRefreshToken', 'serviceAccountJson']
      }
    });

    res.json({
      success: true,
      data: accounts
    });
  } catch (error: any) {
    logger.error('Failed to list email accounts', { error: error.message, userId: req.user?.id });
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to list email accounts'
    });
  }
};

/**
 * Get single email account
 */
export const getOne = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const account = await EmailAccount.findOne({
      where: { id, userId },
      attributes: {
        exclude: ['smtpPassword', 'imapPassword', 'oauthAccessToken', 'oauthRefreshToken', 'serviceAccountJson']
      }
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Email account not found'
      });
    }

    res.json({
      success: true,
      data: account
    });
  } catch (error: any) {
    logger.error('Failed to get email account', { error: error.message, accountId: req.params.id });
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get email account'
    });
  }
};

/**
 * Create new email account (SMTP/IMAP or App Password)
 */
export const create = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      email,
      connectionType, // 'smtp' or 'appPassword'
      smtpHost,
      smtpPort,
      smtpUsername,
      smtpPassword,
      imapHost,
      imapPort,
      imapUsername,
      imapPassword
    } = req.body;

    // Validate email
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address'
      });
    }

    // Check if account already exists
    const existing = await EmailAccount.findOne({
      where: { email, userId }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Email account already exists'
      });
    }

    // Check user's mailbox limit
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const accountCount = await EmailAccount.count({ where: { userId } });
    if (accountCount >= user.maxMailboxes) {
      return res.status(403).json({
        success: false,
        message: `You have reached your mailbox limit (${user.maxMailboxes})`
      });
    }

    // Auto-detect provider
    const provider = detectProvider(email);

    // If no SMTP/IMAP provided, use provider defaults
    let finalSmtpHost = smtpHost;
    let finalSmtpPort = smtpPort;
    let finalImapHost = imapHost;
    let finalImapPort = imapPort;

    if (!smtpHost && provider !== 'custom') {
      const settings = getProviderSettings(provider);
      finalSmtpHost = settings.smtpHost;
      finalSmtpPort = settings.smtpPort;
      finalImapHost = settings.imapHost;
      finalImapPort = settings.imapPort;
    }

    // Validate SMTP config
    const smtpValidation = validateSMTPConfig({
      host: finalSmtpHost,
      port: finalSmtpPort,
      username: smtpUsername || email,
      password: smtpPassword
    });

    if (!smtpValidation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid SMTP configuration',
        errors: smtpValidation.errors
      });
    }

    // Validate IMAP config
    const imapValidation = validateIMAPConfig({
      host: finalImapHost,
      port: finalImapPort,
      username: imapUsername || email,
      password: imapPassword
    });

    if (!imapValidation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid IMAP configuration',
        errors: imapValidation.errors
      });
    }

    // Create email account
    const account = await EmailAccount.create({
      userId,
      email,
      provider,
      connectionType,
      smtpHost: finalSmtpHost,
      smtpPort: finalSmtpPort,
      smtpUsername: smtpUsername || email,
      smtpPassword: encrypt(smtpPassword),
      imapHost: finalImapHost,
      imapPort: finalImapPort,
      imapUsername: imapUsername || email,
      imapPassword: encrypt(imapPassword),
      status: 'active',
      isWarmupEnabled: true,
      emailsPerDay: user.maxEmailsPerDay
    });

    // Test connection
    try {
      await testEmailConnection(account);
    } catch (error: any) {
      logger.warn('Email connection test failed', { email, error: error.message });
      // Don't fail creation, just log warning
    }

    // Create audit log
    await AuditLog.create({
      userId,
      action: 'email_account_created',
      entity: 'EmailAccount',
      entityId: account.id,
      details: {
        email,
        provider,
        connectionType
      }
    });

    logger.info('Email account created', { email, userId });

    // Return account (without sensitive data)
    const accountData = account.toJSON();
    delete (accountData as any).smtpPassword;
    delete (accountData as any).imapPassword;

    res.status(201).json({
      success: true,
      message: 'Email account added successfully',
      data: accountData
    });
  } catch (error: any) {
    logger.error('Failed to create email account', { error: error.message, userId: req.user?.id });
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create email account'
    });
  }
};

/**
 * Update email account settings
 */
export const update = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const {
      isWarmupEnabled,
      emailsPerDay,
      useGradualIncrease,
      gradualStartVolume,
      gradualTargetVolume,
      gradualDurationWeeks
    } = req.body;

    const account = await EmailAccount.findOne({
      where: { id, userId }
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Email account not found'
      });
    }

    // Update settings
    if (isWarmupEnabled !== undefined) account.isWarmupEnabled = isWarmupEnabled;
    if (emailsPerDay !== undefined) account.emailsPerDay = emailsPerDay;
    if (useGradualIncrease !== undefined) {
      account.useGradualIncrease = useGradualIncrease;
      if (useGradualIncrease) {
        account.gradualStartDate = new Date();
        account.gradualCurrentVolume = gradualStartVolume || account.gradualStartVolume;
      }
    }
    if (gradualStartVolume !== undefined) account.gradualStartVolume = gradualStartVolume;
    if (gradualTargetVolume !== undefined) account.gradualTargetVolume = gradualTargetVolume;
    if (gradualDurationWeeks !== undefined) account.gradualDurationWeeks = gradualDurationWeeks;

    await account.save();

    // Create audit log
    await AuditLog.create({
      userId,
      action: 'email_account_updated',
      entity: 'EmailAccount',
      entityId: account.id,
      details: {
        email: account.email,
        changes: req.body
      }
    });

    logger.info('Email account updated', { email: account.email, userId });

    res.json({
      success: true,
      message: 'Email account updated successfully',
      data: account
    });
  } catch (error: any) {
    logger.error('Failed to update email account', { error: error.message, accountId: req.params.id });
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update email account'
    });
  }
};

/**
 * Delete email account
 */
export const remove = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const account = await EmailAccount.findOne({
      where: { id, userId }
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Email account not found'
      });
    }

    const email = account.email;

    await account.destroy();

    // Create audit log
    await AuditLog.create({
      userId,
      action: 'email_account_deleted',
      entity: 'EmailAccount',
      entityId: parseInt(id),
      details: {
        email
      }
    });

    logger.info('Email account deleted', { email, userId });

    res.json({
      success: true,
      message: 'Email account deleted successfully'
    });
  } catch (error: any) {
    logger.error('Failed to delete email account', { error: error.message, accountId: req.params.id });
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete email account'
    });
  }
};

/**
 * Test email account connection
 */
export const testConnection = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const account = await EmailAccount.findOne({
      where: { id, userId }
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Email account not found'
      });
    }

    const result = await testEmailConnection(account);

    res.json({
      success: result.success,
      message: result.success ? 'Connection test successful' : 'Connection test failed',
      data: result
    });
  } catch (error: any) {
    logger.error('Connection test failed', { error: error.message, accountId: req.params.id });
    res.status(500).json({
      success: false,
      message: error.message || 'Connection test failed'
    });
  }
};

/**
 * Pause warmup for account
 */
export const pauseWarmup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const account = await EmailAccount.findOne({
      where: { id, userId }
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Email account not found'
      });
    }

    account.status = 'paused';
    account.isWarmupEnabled = false;
    await account.save();

    logger.info('Warmup paused', { email: account.email, userId });

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
 * Resume warmup for account
 */
export const resumeWarmup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const account = await EmailAccount.findOne({
      where: { id, userId }
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Email account not found'
      });
    }

    account.status = 'active';
    account.isWarmupEnabled = true;
    await account.save();

    logger.info('Warmup resumed', { email: account.email, userId });

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
