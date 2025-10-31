import { WarmupEmail } from '../../models';
import logger from '../../utils/logger';

/**
 * Track where email landed (inbox or spam)
 */
export const trackEmailLanding = async (
  warmupEmailId: number,
  landedInInbox: boolean,
  landedInSpam: boolean
): Promise<void> => {
  try {
    const email = await WarmupEmail.findByPk(warmupEmailId);

    if (!email) {
      throw new Error('Warmup email not found');
    }

    email.landedInInbox = landedInInbox;
    email.landedInSpam = landedInSpam;

    if (landedInSpam) {
      email.status = 'spam';
    } else if (landedInInbox) {
      email.status = 'delivered';
    }

    await email.save();

    logger.info('Email landing tracked', {
      warmupEmailId,
      landedInInbox,
      landedInSpam
    });
  } catch (error: any) {
    logger.error('Failed to track email landing', { error: error.message, warmupEmailId });
    throw error;
  }
};

/**
 * Track email open
 */
export const trackEmailOpen = async (warmupEmailId: number): Promise<void> => {
  try {
    const email = await WarmupEmail.findByPk(warmupEmailId);

    if (!email) {
      throw new Error('Warmup email not found');
    }

    if (!email.wasOpened) {
      email.wasOpened = true;
      email.openedAt = new Date();
      email.status = 'opened';
      await email.save();

      logger.info('Email open tracked', { warmupEmailId });
    }
  } catch (error: any) {
    logger.error('Failed to track email open', { error: error.message, warmupEmailId });
    throw error;
  }
};

/**
 * Track email reply
 */
export const trackEmailReply = async (warmupEmailId: number): Promise<void> => {
  try {
    const email = await WarmupEmail.findByPk(warmupEmailId);

    if (!email) {
      throw new Error('Warmup email not found');
    }

    if (!email.wasReplied) {
      email.wasReplied = true;
      email.repliedAt = new Date();
      email.status = 'replied';
      await email.save();

      logger.info('Email reply tracked', { warmupEmailId });
    }
  } catch (error: any) {
    logger.error('Failed to track email reply', { error: error.message, warmupEmailId });
    throw error;
  }
};

/**
 * Track email bounce
 */
export const trackEmailBounce = async (warmupEmailId: number, bounceReason?: string): Promise<void> => {
  try {
    const email = await WarmupEmail.findByPk(warmupEmailId);

    if (!email) {
      throw new Error('Warmup email not found');
    }

    email.wasBounced = true;
    email.status = 'bounced';
    email.errorMessage = bounceReason || 'Email bounced';
    await email.save();

    logger.warn('Email bounce tracked', { warmupEmailId, bounceReason });
  } catch (error: any) {
    logger.error('Failed to track email bounce', { error: error.message, warmupEmailId });
    throw error;
  }
};

/**
 * Get deliverability stats for an account
 */
export const getDeliverabilityStats = async (emailAccountId: number): Promise<{
  totalSent: number;
  delivered: number;
  opened: number;
  replied: number;
  bounced: number;
  inSpam: number;
  deliveryRate: number;
  openRate: number;
  replyRate: number;
  bounceRate: number;
  spamRate: number;
}> => {
  try {
    const totalSent = await WarmupEmail.count({
      where: { fromEmailAccountId: emailAccountId }
    });

    const delivered = await WarmupEmail.count({
      where: {
        fromEmailAccountId: emailAccountId,
        landedInInbox: true
      }
    });

    const opened = await WarmupEmail.count({
      where: {
        fromEmailAccountId: emailAccountId,
        wasOpened: true
      }
    });

    const replied = await WarmupEmail.count({
      where: {
        fromEmailAccountId: emailAccountId,
        wasReplied: true
      }
    });

    const bounced = await WarmupEmail.count({
      where: {
        fromEmailAccountId: emailAccountId,
        wasBounced: true
      }
    });

    const inSpam = await WarmupEmail.count({
      where: {
        fromEmailAccountId: emailAccountId,
        landedInSpam: true
      }
    });

    const deliveryRate = totalSent > 0 ? Math.round((delivered / totalSent) * 100) : 0;
    const openRate = totalSent > 0 ? Math.round((opened / totalSent) * 100) : 0;
    const replyRate = totalSent > 0 ? Math.round((replied / totalSent) * 100) : 0;
    const bounceRate = totalSent > 0 ? Math.round((bounced / totalSent) * 100) : 0;
    const spamRate = totalSent > 0 ? Math.round((inSpam / totalSent) * 100) : 0;

    return {
      totalSent,
      delivered,
      opened,
      replied,
      bounced,
      inSpam,
      deliveryRate,
      openRate,
      replyRate,
      bounceRate,
      spamRate
    };
  } catch (error: any) {
    logger.error('Failed to get deliverability stats', { error: error.message, emailAccountId });
    throw error;
  }
};
