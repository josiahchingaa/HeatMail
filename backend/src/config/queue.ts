import Bull from 'bull';
import { bullRedisClient } from './redis';
import logger from '../utils/logger';

const redisConfig = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined
  },
  prefix: 'heatmail',
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: false // Keep failed jobs for debugging
  }
};

/**
 * Queue for sending warmup emails
 */
export const sendWarmupEmailQueue = new Bull('send-warmup-email', redisConfig);

/**
 * Queue for sending auto-replies
 */
export const sendReplyQueue = new Bull('send-reply', redisConfig);

/**
 * Queue for archiving threads
 */
export const archiveThreadQueue = new Bull('archive-thread', redisConfig);

/**
 * Queue for checking inbox (IMAP polling)
 */
export const checkInboxQueue = new Bull('check-inbox', redisConfig);

/**
 * Queue for updating health scores
 */
export const updateHealthScoreQueue = new Bull('update-health-score', redisConfig);

/**
 * Queue for adjusting gradual increase volume
 */
export const gradualIncreaseQueue = new Bull('gradual-increase', redisConfig);

/**
 * Queue for sending admin campaigns
 */
export const adminCampaignQueue = new Bull('admin-campaign', redisConfig);

// Queue event handlers
const queues = [
  sendWarmupEmailQueue,
  sendReplyQueue,
  archiveThreadQueue,
  checkInboxQueue,
  updateHealthScoreQueue,
  gradualIncreaseQueue,
  adminCampaignQueue
];

queues.forEach(queue => {
  queue.on('error', (error) => {
    logger.error(`Queue error in ${queue.name}`, { error: error.message });
  });

  queue.on('waiting', (jobId) => {
    logger.debug(`Job ${jobId} waiting in ${queue.name}`);
  });

  queue.on('active', (job) => {
    logger.info(`Job ${job.id} active in ${queue.name}`, {
      data: job.data
    });
  });

  queue.on('completed', (job) => {
    logger.info(`Job ${job.id} completed in ${queue.name}`);
  });

  queue.on('failed', (job, err) => {
    logger.error(`Job ${job.id} failed in ${queue.name}`, {
      error: err.message,
      data: job.data
    });
  });

  queue.on('stalled', (job) => {
    logger.warn(`Job ${job.id} stalled in ${queue.name}`);
  });
});

/**
 * Schedule recurring jobs
 */
export const setupRecurringJobs = async () => {
  try {
    // Schedule warmup batch every hour
    await sendWarmupEmailQueue.add(
      'schedule-warmup-batch',
      {},
      {
        repeat: {
          cron: '0 * * * *' // Every hour at minute 0
        },
        jobId: 'recurring-warmup-batch'
      }
    );

    // Check inbox every 15 minutes
    await checkInboxQueue.add(
      'poll-all-inboxes',
      {},
      {
        repeat: {
          cron: '*/15 * * * *' // Every 15 minutes
        },
        jobId: 'recurring-inbox-check'
      }
    );

    // Reset daily counters at midnight
    await sendWarmupEmailQueue.add(
      'reset-daily-counters',
      {},
      {
        repeat: {
          cron: '0 0 * * *' // Midnight every day
        },
        jobId: 'recurring-daily-reset'
      }
    );

    // Adjust gradual volume daily at 1 AM
    await gradualIncreaseQueue.add(
      'adjust-gradual-volume',
      {},
      {
        repeat: {
          cron: '0 1 * * *' // 1 AM every day
        },
        jobId: 'recurring-gradual-adjust'
      }
    );

    // Update health scores every 6 hours
    await updateHealthScoreQueue.add(
      'update-all-health-scores',
      {},
      {
        repeat: {
          cron: '0 */6 * * *' // Every 6 hours
        },
        jobId: 'recurring-health-update'
      }
    );

    logger.info('Recurring jobs scheduled successfully');
  } catch (error: any) {
    logger.error('Failed to setup recurring jobs', { error: error.message });
    throw error;
  }
};

/**
 * Get queue statistics
 */
export const getQueueStats = async () => {
  const stats = [];

  for (const queue of queues) {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount()
    ]);

    stats.push({
      name: queue.name,
      waiting,
      active,
      completed,
      failed,
      delayed
    });
  }

  return stats;
};

/**
 * Clean up completed jobs (optional - for maintenance)
 */
export const cleanupQueues = async () => {
  try {
    for (const queue of queues) {
      await queue.clean(24 * 60 * 60 * 1000, 'completed'); // Remove completed jobs older than 24 hours
      await queue.clean(7 * 24 * 60 * 60 * 1000, 'failed'); // Remove failed jobs older than 7 days
    }

    logger.info('Queue cleanup completed');
  } catch (error: any) {
    logger.error('Failed to cleanup queues', { error: error.message });
    throw error;
  }
};

/**
 * Gracefully close all queues
 */
export const closeQueues = async () => {
  try {
    await Promise.all(queues.map(queue => queue.close()));
    logger.info('All queues closed');
  } catch (error: any) {
    logger.error('Failed to close queues', { error: error.message });
    throw error;
  }
};

export default {
  sendWarmupEmailQueue,
  sendReplyQueue,
  archiveThreadQueue,
  checkInboxQueue,
  updateHealthScoreQueue,
  gradualIncreaseQueue,
  adminCampaignQueue,
  setupRecurringJobs,
  getQueueStats,
  cleanupQueues,
  closeQueues
};
