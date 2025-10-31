import { updateHealthScoreQueue } from '../config/queue';
import { updateAccountHealthScore, updateAllHealthScores } from '../services/health/calculator';
import logger from '../utils/logger';

/**
 * Update health score for single account
 */
updateHealthScoreQueue.process('update-account-health', async (job) => {
  const { emailAccountId } = job.data;

  logger.info('Processing update account health score', { emailAccountId });

  try {
    await updateAccountHealthScore(emailAccountId);

    logger.info('Account health score updated', { emailAccountId });

    return { success: true };
  } catch (error: any) {
    logger.error('Failed to update account health score', {
      error: error.message,
      emailAccountId
    });

    throw error;
  }
});

/**
 * Update health scores for all accounts (recurring)
 */
updateHealthScoreQueue.process('update-all-health-scores', async (job) => {
  logger.info('Processing update all health scores');

  try {
    const updatedCount = await updateAllHealthScores();

    logger.info('All health scores updated', { updatedCount });

    return { success: true, updatedCount };
  } catch (error: any) {
    logger.error('Failed to update all health scores', { error: error.message });
    throw error;
  }
});

logger.info('Update health score worker initialized');

export default updateHealthScoreQueue;
