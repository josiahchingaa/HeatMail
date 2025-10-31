import logger from '../utils/logger';
import { setupRecurringJobs, closeQueues } from '../config/queue';

// Import all workers (this initializes them)
import './sendWarmupEmail.worker';
import './sendReply.worker';
import './archiveThread.worker';
import './checkInbox.worker';
import './updateHealthScore.worker';

/**
 * Initialize all workers
 */
export const initializeWorkers = async () => {
  try {
    logger.info('Initializing workers...');

    // Setup recurring jobs
    await setupRecurringJobs();

    logger.info('✅ All workers initialized successfully');
    logger.info('✅ Recurring jobs scheduled');
    logger.info('🔥 HeatMail worker system ready!');
  } catch (error: any) {
    logger.error('Failed to initialize workers', { error: error.message });
    throw error;
  }
};

/**
 * Gracefully shutdown workers
 */
export const shutdownWorkers = async () => {
  try {
    logger.info('Shutting down workers...');

    await closeQueues();

    logger.info('✅ All workers shut down successfully');
  } catch (error: any) {
    logger.error('Failed to shutdown workers', { error: error.message });
    throw error;
  }
};

// Handle process termination
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await shutdownWorkers();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await shutdownWorkers();
  process.exit(0);
});

// Start workers if this file is run directly
if (require.main === module) {
  initializeWorkers().catch((error) => {
    logger.error('Failed to start workers', { error });
    process.exit(1);
  });
}
