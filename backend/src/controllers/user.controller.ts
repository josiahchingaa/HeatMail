import { Request, Response } from 'express';
import { EmailAccount, WarmupEmail, WarmupConversation, HealthScoreHistory, AuditLog } from '../models';
import { Op } from 'sequelize';
import { getHealthScoreCategory } from '../services/health/calculator';
import { getDeliverabilityStats } from '../services/health/tracker';
import logger from '../utils/logger';

/**
 * Get user dashboard overview
 */
export const getDashboard = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Get user's email accounts
    const accounts = await EmailAccount.findAll({
      where: { userId },
      attributes: ['id', 'email', 'status', 'isWarmupEnabled', 'healthScore', 'totalEmailsSent', 'totalEmailsReceived']
    });

    // Calculate stats
    const totalMailboxes = accounts.length;
    const activeMailboxes = accounts.filter(a => a.status === 'active' && a.isWarmupEnabled).length;
    const averageHealthScore = accounts.length > 0
      ? Math.round(accounts.reduce((sum, a) => sum + parseFloat(a.healthScore.toString()), 0) / accounts.length * 100) / 100
      : 0;

    // Get today's emails sent
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const emailsSentToday = await WarmupEmail.count({
      where: {
        fromEmailAccountId: {
          [Op.in]: accounts.map(a => a.id)
        },
        sentAt: {
          [Op.gte]: today
        }
      }
    });

    // Get active conversations
    const activeConversations = await WarmupConversation.count({
      where: {
        [Op.or]: [
          { emailAccountId1: { [Op.in]: accounts.map(a => a.id) } },
          { emailAccountId2: { [Op.in]: accounts.map(a => a.id) } }
        ],
        status: 'active'
      }
    });

    // Recent activity
    const recentActivity = await AuditLog.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: 10,
      attributes: ['id', 'action', 'entity', 'details', 'createdAt']
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalMailboxes,
          activeMailboxes,
          averageHealthScore,
          emailsSentToday,
          activeConversations
        },
        accounts: accounts.map(a => ({
          ...a.toJSON(),
          healthCategory: getHealthScoreCategory(parseFloat(a.healthScore.toString()))
        })),
        recentActivity
      }
    });
  } catch (error: any) {
    logger.error('Failed to get user dashboard', { error: error.message, userId: req.user?.id });
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get dashboard data'
    });
  }
};

/**
 * Get user's mailboxes with health details
 */
export const getMailboxes = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const accounts = await EmailAccount.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });

    const mailboxesWithDetails = await Promise.all(
      accounts.map(async (account) => {
        const accountData = account.toJSON();

        // Remove sensitive data
        delete (accountData as any).smtpPassword;
        delete (accountData as any).imapPassword;
        delete (accountData as any).oauthAccessToken;
        delete (accountData as any).oauthRefreshToken;
        delete (accountData as any).serviceAccountJson;

        // Add health category
        const healthCategory = getHealthScoreCategory(parseFloat(account.healthScore.toString()));

        // Get deliverability stats
        const stats = await getDeliverabilityStats(account.id);

        return {
          ...accountData,
          healthCategory,
          deliverabilityStats: stats
        };
      })
    );

    res.json({
      success: true,
      data: mailboxesWithDetails
    });
  } catch (error: any) {
    logger.error('Failed to get mailboxes', { error: error.message, userId: req.user?.id });
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get mailboxes'
    });
  }
};

/**
 * Get mailbox health history
 */
export const getHealthHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { days = 30 } = req.query;

    // Verify account belongs to user
    const account = await EmailAccount.findOne({
      where: { id, userId }
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Email account not found'
      });
    }

    const daysAgo = new Date(Date.now() - parseInt(days as string) * 24 * 60 * 60 * 1000);

    const history = await HealthScoreHistory.findAll({
      where: {
        emailAccountId: id,
        recordedAt: {
          [Op.gte]: daysAgo
        }
      },
      order: [['recordedAt', 'ASC']]
    });

    res.json({
      success: true,
      data: history
    });
  } catch (error: any) {
    logger.error('Failed to get health history', { error: error.message, accountId: req.params.id });
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get health history'
    });
  }
};

/**
 * Get user's activity log
 */
export const getActivity = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { limit = 50, offset = 0 } = req.query;

    const { count, rows } = await AuditLog.findAndCountAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });

    res.json({
      success: true,
      data: {
        total: count,
        activities: rows
      }
    });
  } catch (error: any) {
    logger.error('Failed to get user activity', { error: error.message, userId: req.user?.id });
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get activity'
    });
  }
};

/**
 * Get user statistics
 */
export const getStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const accounts = await EmailAccount.findAll({
      where: { userId }
    });

    const accountIds = accounts.map(a => a.id);

    // Total emails sent and received
    const [emailsSent, emailsReceived, conversations, repliesSent] = await Promise.all([
      WarmupEmail.count({
        where: { fromEmailAccountId: { [Op.in]: accountIds } }
      }),
      WarmupEmail.count({
        where: { toEmailAccountId: { [Op.in]: accountIds } }
      }),
      WarmupConversation.count({
        where: {
          [Op.or]: [
            { emailAccountId1: { [Op.in]: accountIds } },
            { emailAccountId2: { [Op.in]: accountIds } }
          ]
        }
      }),
      WarmupEmail.count({
        where: {
          fromEmailAccountId: { [Op.in]: accountIds },
          wasReplied: true
        }
      })
    ]);

    // This week stats
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const emailsSentThisWeek = await WarmupEmail.count({
      where: {
        fromEmailAccountId: { [Op.in]: accountIds },
        sentAt: { [Op.gte]: weekAgo }
      }
    });

    res.json({
      success: true,
      data: {
        lifetime: {
          emailsSent,
          emailsReceived,
          conversations,
          repliesSent
        },
        thisWeek: {
          emailsSent: emailsSentThisWeek
        }
      }
    });
  } catch (error: any) {
    logger.error('Failed to get user stats', { error: error.message, userId: req.user?.id });
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get statistics'
    });
  }
};
