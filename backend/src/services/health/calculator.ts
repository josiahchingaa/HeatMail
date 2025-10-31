import { EmailAccount, WarmupEmail, HealthScoreHistory } from '../../models';
import { Op } from 'sequelize';
import logger from '../../utils/logger';

interface HealthMetrics {
  inboxRate: number;
  spamRate: number;
  openRate: number;
  replyRate: number;
  bounceRate: number;
  healthScore: number;
  sampleSize: number;
}

/**
 * Calculate health score from metrics
 * Formula: (inboxRate * 0.35) + (openRate * 0.25) + (replyRate * 0.20) + ((100 - spamRate) * 0.15) + ((100 - bounceRate) * 0.05)
 */
export const calculateHealthScore = (metrics: {
  inboxRate: number;
  spamRate: number;
  openRate: number;
  replyRate: number;
  bounceRate: number;
}): number => {
  const score = (
    (metrics.inboxRate * 0.35) +
    (metrics.openRate * 0.25) +
    (metrics.replyRate * 0.20) +
    ((100 - metrics.spamRate) * 0.15) +
    ((100 - metrics.bounceRate) * 0.05)
  );

  return Math.round(score * 100) / 100; // Round to 2 decimal places
};

/**
 * Calculate inbox rate for an email account
 */
export const calculateInboxRate = async (emailAccountId: number): Promise<number> => {
  try {
    const totalEmails = await WarmupEmail.count({
      where: {
        toEmailAccountId: emailAccountId,
        status: {
          [Op.in]: ['sent', 'delivered', 'opened', 'replied']
        }
      }
    });

    if (totalEmails === 0) return 0;

    const inboxEmails = await WarmupEmail.count({
      where: {
        toEmailAccountId: emailAccountId,
        landedInInbox: true
      }
    });

    return Math.round((inboxEmails / totalEmails) * 100 * 100) / 100;
  } catch (error: any) {
    logger.error('Failed to calculate inbox rate', { error: error.message, emailAccountId });
    return 0;
  }
};

/**
 * Calculate spam rate for an email account
 */
export const calculateSpamRate = async (emailAccountId: number): Promise<number> => {
  try {
    const totalEmails = await WarmupEmail.count({
      where: {
        toEmailAccountId: emailAccountId,
        status: {
          [Op.in]: ['sent', 'delivered', 'opened', 'replied', 'spam']
        }
      }
    });

    if (totalEmails === 0) return 0;

    const spamEmails = await WarmupEmail.count({
      where: {
        toEmailAccountId: emailAccountId,
        landedInSpam: true
      }
    });

    return Math.round((spamEmails / totalEmails) * 100 * 100) / 100;
  } catch (error: any) {
    logger.error('Failed to calculate spam rate', { error: error.message, emailAccountId });
    return 0;
  }
};

/**
 * Calculate open rate for an email account
 */
export const calculateOpenRate = async (emailAccountId: number): Promise<number> => {
  try {
    const totalEmails = await WarmupEmail.count({
      where: {
        toEmailAccountId: emailAccountId,
        status: {
          [Op.in]: ['sent', 'delivered', 'opened', 'replied']
        }
      }
    });

    if (totalEmails === 0) return 0;

    const openedEmails = await WarmupEmail.count({
      where: {
        toEmailAccountId: emailAccountId,
        wasOpened: true
      }
    });

    return Math.round((openedEmails / totalEmails) * 100 * 100) / 100;
  } catch (error: any) {
    logger.error('Failed to calculate open rate', { error: error.message, emailAccountId });
    return 0;
  }
};

/**
 * Calculate reply rate for an email account
 */
export const calculateReplyRate = async (emailAccountId: number): Promise<number> => {
  try {
    const totalEmails = await WarmupEmail.count({
      where: {
        toEmailAccountId: emailAccountId,
        status: {
          [Op.in]: ['sent', 'delivered', 'opened', 'replied']
        }
      }
    });

    if (totalEmails === 0) return 0;

    const repliedEmails = await WarmupEmail.count({
      where: {
        toEmailAccountId: emailAccountId,
        wasReplied: true
      }
    });

    return Math.round((repliedEmails / totalEmails) * 100 * 100) / 100;
  } catch (error: any) {
    logger.error('Failed to calculate reply rate', { error: error.message, emailAccountId });
    return 0;
  }
};

/**
 * Calculate bounce rate for an email account
 */
export const calculateBounceRate = async (emailAccountId: number): Promise<number> => {
  try {
    const totalEmails = await WarmupEmail.count({
      where: {
        fromEmailAccountId: emailAccountId,
        status: {
          [Op.in]: ['sent', 'delivered', 'opened', 'replied', 'bounced']
        }
      }
    });

    if (totalEmails === 0) return 0;

    const bouncedEmails = await WarmupEmail.count({
      where: {
        fromEmailAccountId: emailAccountId,
        wasBounced: true
      }
    });

    return Math.round((bouncedEmails / totalEmails) * 100 * 100) / 100;
  } catch (error: any) {
    logger.error('Failed to calculate bounce rate', { error: error.message, emailAccountId });
    return 0;
  }
};

/**
 * Calculate all health metrics for an email account
 */
export const calculateHealthMetrics = async (emailAccountId: number): Promise<HealthMetrics> => {
  try {
    const [inboxRate, spamRate, openRate, replyRate, bounceRate] = await Promise.all([
      calculateInboxRate(emailAccountId),
      calculateSpamRate(emailAccountId),
      calculateOpenRate(emailAccountId),
      calculateReplyRate(emailAccountId),
      calculateBounceRate(emailAccountId)
    ]);

    const healthScore = calculateHealthScore({
      inboxRate,
      spamRate,
      openRate,
      replyRate,
      bounceRate
    });

    // Get sample size
    const sampleSize = await WarmupEmail.count({
      where: {
        [Op.or]: [
          { fromEmailAccountId: emailAccountId },
          { toEmailAccountId: emailAccountId }
        ]
      }
    });

    return {
      inboxRate,
      spamRate,
      openRate,
      replyRate,
      bounceRate,
      healthScore,
      sampleSize
    };
  } catch (error: any) {
    logger.error('Failed to calculate health metrics', { error: error.message, emailAccountId });
    throw error;
  }
};

/**
 * Update health score for an email account
 */
export const updateAccountHealthScore = async (emailAccountId: number): Promise<void> => {
  try {
    const metrics = await calculateHealthMetrics(emailAccountId);

    const account = await EmailAccount.findByPk(emailAccountId);

    if (!account) {
      throw new Error('Email account not found');
    }

    // Update account
    account.healthScore = metrics.healthScore;
    account.inboxRate = metrics.inboxRate;
    account.spamRate = metrics.spamRate;
    account.openRate = metrics.openRate;
    account.replyRate = metrics.replyRate;
    account.bounceRate = metrics.bounceRate;
    account.lastHealthUpdate = new Date();
    await account.save();

    // Save to history
    await HealthScoreHistory.create({
      emailAccountId,
      healthScore: metrics.healthScore,
      inboxRate: metrics.inboxRate,
      spamRate: metrics.spamRate,
      openRate: metrics.openRate,
      replyRate: metrics.replyRate,
      bounceRate: metrics.bounceRate,
      totalEmailsSent: account.totalEmailsSent,
      totalEmailsReceived: account.totalEmailsReceived
    });

    logger.info('Health score updated', {
      email: account.email,
      healthScore: metrics.healthScore,
      sampleSize: metrics.sampleSize
    });
  } catch (error: any) {
    logger.error('Failed to update account health score', { error: error.message, emailAccountId });
    throw error;
  }
};

/**
 * Update health scores for all accounts
 */
export const updateAllHealthScores = async (): Promise<number> => {
  try {
    const accounts = await EmailAccount.findAll({
      where: {
        status: 'active'
      }
    });

    let updatedCount = 0;

    for (const account of accounts) {
      try {
        await updateAccountHealthScore(account.id);
        updatedCount++;
      } catch (error) {
        logger.error('Failed to update health score for account', {
          email: account.email,
          error
        });
      }
    }

    logger.info('All health scores updated', { updatedCount, total: accounts.length });

    return updatedCount;
  } catch (error: any) {
    logger.error('Failed to update all health scores', { error: error.message });
    throw error;
  }
};

/**
 * Get health score category (Excellent, Good, Average, Poor, Critical)
 */
export const getHealthScoreCategory = (score: number): {
  category: string;
  color: string;
  emoji: string;
} => {
  if (score >= 90) {
    return { category: 'Excellent', color: 'green', emoji: '🟢' };
  } else if (score >= 75) {
    return { category: 'Good', color: 'blue', emoji: '🔵' };
  } else if (score >= 60) {
    return { category: 'Average', color: 'yellow', emoji: '🟡' };
  } else if (score >= 40) {
    return { category: 'Poor', color: 'orange', emoji: '🟠' };
  } else {
    return { category: 'Critical', color: 'red', emoji: '🔴' };
  }
};

/**
 * Get platform-wide health statistics
 */
export const getPlatformHealthStats = async (): Promise<{
  averageHealthScore: number;
  totalAccounts: number;
  excellentCount: number;
  goodCount: number;
  averageCount: number;
  poorCount: number;
  criticalCount: number;
}> => {
  try {
    const accounts = await EmailAccount.findAll({
      where: {
        status: 'active'
      },
      attributes: ['healthScore']
    });

    if (accounts.length === 0) {
      return {
        averageHealthScore: 0,
        totalAccounts: 0,
        excellentCount: 0,
        goodCount: 0,
        averageCount: 0,
        poorCount: 0,
        criticalCount: 0
      };
    }

    const scores = accounts.map(a => parseFloat(a.healthScore.toString()));
    const averageHealthScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    const excellentCount = scores.filter(s => s >= 90).length;
    const goodCount = scores.filter(s => s >= 75 && s < 90).length;
    const averageCount = scores.filter(s => s >= 60 && s < 75).length;
    const poorCount = scores.filter(s => s >= 40 && s < 60).length;
    const criticalCount = scores.filter(s => s < 40).length;

    return {
      averageHealthScore: Math.round(averageHealthScore * 100) / 100,
      totalAccounts: accounts.length,
      excellentCount,
      goodCount,
      averageCount,
      poorCount,
      criticalCount
    };
  } catch (error: any) {
    logger.error('Failed to get platform health stats', { error: error.message });
    throw error;
  }
};
