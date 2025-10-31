import { archiveThreadQueue } from '../config/queue';
import { WarmupEmail, WarmupConversation, EmailAccount } from '../models';
import { archiveWarmupThread, archiveConversation } from '../services/warmup/archiver';
import logger from '../utils/logger';

/**
 * Process archive single email job
 */
archiveThreadQueue.process('archive-email', async (job) => {
  const { warmupEmailId } = job.data;

  logger.info('Processing archive email', { warmupEmailId });

  try {
    const warmupEmail = await WarmupEmail.findByPk(warmupEmailId);

    if (!warmupEmail) {
      throw new Error('Warmup email not found');
    }

    if (warmupEmail.status === 'archived') {
      logger.warn('Email already archived', { warmupEmailId });
      return { success: false, reason: 'Already archived' };
    }

    const emailAccount = await EmailAccount.findByPk(warmupEmail.fromEmailAccountId);

    if (!emailAccount) {
      throw new Error('Email account not found');
    }

    await archiveWarmupThread(emailAccount, warmupEmail);

    logger.info('Email archived successfully', {
      warmupEmailId,
      email: emailAccount.email
    });

    return { success: true };
  } catch (error: any) {
    logger.error('Failed to archive email', {
      error: error.message,
      warmupEmailId
    });

    throw error;
  }
});

/**
 * Process archive conversation job
 */
archiveThreadQueue.process('archive-conversation', async (job) => {
  const { conversationId } = job.data;

  logger.info('Processing archive conversation', { conversationId });

  try {
    await archiveConversation(conversationId);

    logger.info('Conversation archived successfully', { conversationId });

    return { success: true };
  } catch (error: any) {
    logger.error('Failed to archive conversation', {
      error: error.message,
      conversationId
    });

    throw error;
  }
});

/**
 * Process cleanup old archives job (optional maintenance)
 */
archiveThreadQueue.process('cleanup-old-archives', async (job) => {
  const { daysOld } = job.data;

  logger.info('Processing cleanup old archives', { daysOld });

  try {
    const threshold = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

    const result = await WarmupConversation.destroy({
      where: {
        status: 'archived',
        archivedAt: {
          $lt: threshold
        } as any
      }
    });

    logger.info('Old archives cleaned up', { count: result, daysOld });

    return { success: true, count: result };
  } catch (error: any) {
    logger.error('Failed to cleanup old archives', { error: error.message });
    throw error;
  }
});

logger.info('Archive thread worker initialized');

export default archiveThreadQueue;
