import { WarmupEmail, WarmupTemplate, EmailAccount } from '../../models';
import { createSenderReceiverPairs, createConversation } from './poolMatcher';
import { generateTemplateVariables, fillTemplate } from './replyGenerator';
import logger from '../../utils/logger';

/**
 * Get a random initial template
 */
export const getRandomInitialTemplate = async (): Promise<WarmupTemplate | null> => {
  try {
    const templates = await WarmupTemplate.findAll({
      where: {
        isActive: true,
        hasReplyTemplate: true // Get templates that expect replies
      }
    });

    if (templates.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * templates.length);
    return templates[randomIndex];
  } catch (error: any) {
    logger.error('Failed to get initial template', { error: error.message });
    return null;
  }
};

/**
 * Schedule warmup batch - runs periodically (every hour)
 */
export const scheduleWarmupBatch = async (): Promise<number> => {
  try {
    logger.info('Starting warmup batch scheduler');

    // Get sender-receiver pairs
    const pairs = await createSenderReceiverPairs();

    if (pairs.length === 0) {
      logger.warn('No pairs available for warmup batch');
      return 0;
    }

    let scheduledCount = 0;

    for (const { sender, receiver } of pairs) {
      try {
        // Create conversation
        const conversation = await createConversation(sender.id, receiver.id);

        // Get template
        const template = await getRandomInitialTemplate();

        if (!template) {
          logger.warn('No templates available, skipping pair', {
            from: sender.email,
            to: receiver.email
          });
          continue;
        }

        // Generate content
        const variables = generateTemplateVariables(sender.email, receiver.email);
        const subject = fillTemplate(template.subject, variables);
        const body = fillTemplate(template.body, variables);

        // Create warmup email record
        await WarmupEmail.create({
          fromEmailAccountId: sender.id,
          toEmailAccountId: receiver.id,
          subject,
          body,
          templateId: template.id,
          conversationId: conversation.id,
          conversationStep: 1,
          status: 'queued',
          scheduledAt: new Date()
        });

        // Increment daily counter
        sender.dailyEmailsSent += 1;
        await sender.save();

        scheduledCount++;

        logger.info('Warmup email scheduled', {
          from: sender.email,
          to: receiver.email,
          conversationId: conversation.id
        });
      } catch (error: any) {
        logger.error('Failed to schedule warmup email for pair', {
          error: error.message,
          from: sender.email,
          to: receiver.email
        });
      }
    }

    logger.info('Warmup batch scheduled', { count: scheduledCount });

    return scheduledCount;
  } catch (error: any) {
    logger.error('Failed to schedule warmup batch', { error: error.message });
    throw error;
  }
};

/**
 * Reset daily counters for all accounts (runs at midnight)
 */
export const resetDailyCounters = async (): Promise<number> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await EmailAccount.update(
      {
        dailyEmailsSent: 0,
        dailyEmailsReceived: 0,
        lastResetDate: today
      },
      {
        where: {
          lastResetDate: {
            $lt: today
          } as any
        }
      }
    );

    const affectedRows = result[0];

    logger.info('Daily counters reset', { affectedRows });

    return affectedRows;
  } catch (error: any) {
    logger.error('Failed to reset daily counters', { error: error.message });
    throw error;
  }
};

/**
 * Get warmup schedule stats
 */
export const getScheduleStats = async (): Promise<{
  queued: number;
  sent: number;
  failed: number;
  today: number;
}> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [queued, sent, failed, todayCount] = await Promise.all([
      WarmupEmail.count({ where: { status: 'queued' } }),
      WarmupEmail.count({ where: { status: 'sent' } }),
      WarmupEmail.count({ where: { status: 'error' } }),
      WarmupEmail.count({
        where: {
          sentAt: {
            $gte: today
          } as any
        }
      })
    ]);

    return { queued, sent, failed, today: todayCount };
  } catch (error: any) {
    logger.error('Failed to get schedule stats', { error: error.message });
    throw error;
  }
};

/**
 * Adjust gradual increase volume (runs daily)
 */
export const adjustGradualVolume = async (): Promise<number> => {
  try {
    const accounts = await EmailAccount.findAll({
      where: {
        useGradualIncrease: true,
        status: 'active'
      }
    });

    let adjustedCount = 0;

    for (const account of accounts) {
      if (!account.gradualStartDate) {
        account.gradualStartDate = new Date();
        account.gradualCurrentVolume = account.gradualStartVolume;
        await account.save();
        continue;
      }

      // Calculate days since start
      const daysSinceStart = Math.floor(
        (Date.now() - new Date(account.gradualStartDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      const durationDays = account.gradualDurationWeeks * 7;

      // If duration complete, set to target volume
      if (daysSinceStart >= durationDays) {
        if (account.gradualCurrentVolume !== account.gradualTargetVolume) {
          account.gradualCurrentVolume = account.gradualTargetVolume;
          account.useGradualIncrease = false; // Turn off gradual increase
          await account.save();
          adjustedCount++;

          logger.info('Gradual increase completed', {
            email: account.email,
            finalVolume: account.gradualTargetVolume
          });
        }
        continue;
      }

      // Calculate increment
      const totalIncrement = account.gradualTargetVolume - account.gradualStartVolume;
      const dailyIncrement = totalIncrement / durationDays;
      const newVolume = Math.min(
        account.gradualStartVolume + Math.floor(dailyIncrement * daysSinceStart),
        account.gradualTargetVolume
      );

      if (newVolume !== account.gradualCurrentVolume) {
        account.gradualCurrentVolume = newVolume;
        await account.save();
        adjustedCount++;

        logger.info('Gradual volume adjusted', {
          email: account.email,
          newVolume,
          daysSinceStart,
          targetVolume: account.gradualTargetVolume
        });
      }
    }

    logger.info('Gradual volume adjustment complete', { adjustedCount });

    return adjustedCount;
  } catch (error: any) {
    logger.error('Failed to adjust gradual volume', { error: error.message });
    throw error;
  }
};
