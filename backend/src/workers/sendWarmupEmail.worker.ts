import { sendWarmupEmailQueue } from '../config/queue';
import { WarmupEmail, EmailAccount } from '../models';
import { sendWarmupEmail as sendViaSMTP, getDecryptedSMTPConfig } from '../services/email/smtp';
import { sendEmailViaGmail } from '../services/oauth/google';
import { sendEmailViaOutlook } from '../services/oauth/microsoft';
import { sendEmailAsUser } from '../services/oauth/domainWide';
import { scheduleWarmupBatch } from '../services/warmup/scheduler';
import logger from '../utils/logger';

/**
 * Process send warmup email job
 */
sendWarmupEmailQueue.process('send-email', async (job) => {
  const { warmupEmailId } = job.data;

  logger.info('Processing send warmup email', { warmupEmailId });

  try {
    // Fetch warmup email
    const warmupEmail = await WarmupEmail.findByPk(warmupEmailId);

    if (!warmupEmail) {
      throw new Error('Warmup email not found');
    }

    if (warmupEmail.status !== 'queued') {
      logger.warn('Warmup email already processed', { warmupEmailId, status: warmupEmail.status });
      return { success: false, reason: 'Already processed' };
    }

    // Fetch sender account
    const senderAccount = await EmailAccount.findByPk(warmupEmail.fromEmailAccountId);

    if (!senderAccount) {
      throw new Error('Sender account not found');
    }

    // Fetch receiver account
    const receiverAccount = await EmailAccount.findByPk(warmupEmail.toEmailAccountId);

    if (!receiverAccount) {
      throw new Error('Receiver account not found');
    }

    // Prepare message
    const message = {
      to: receiverAccount.email,
      subject: warmupEmail.subject,
      html: warmupEmail.body,
      inReplyTo: warmupEmail.inReplyToMessageId,
      references: warmupEmail.inReplyToMessageId
    };

    let messageId: string;

    // Send email based on connection type
    if (senderAccount.connectionType === 'oauth') {
      if (senderAccount.provider === 'gmail') {
        const result = await sendEmailViaGmail(senderAccount, message);
        messageId = result.messageId;
      } else if (senderAccount.provider === 'outlook') {
        const result = await sendEmailViaOutlook(senderAccount, message);
        messageId = result.messageId;
      } else {
        throw new Error('Unsupported OAuth provider');
      }
    } else if (senderAccount.connectionType === 'domainWide') {
      if (!senderAccount.serviceAccountJson) {
        throw new Error('Service account JSON not found');
      }

      const serviceAccount = JSON.parse(senderAccount.serviceAccountJson);
      const result = await sendEmailAsUser(serviceAccount, senderAccount.email, message);
      messageId = result.messageId;
    } else if (senderAccount.connectionType === 'smtp' || senderAccount.connectionType === 'appPassword') {
      const smtpConfig = getDecryptedSMTPConfig(senderAccount);
      const result = await sendViaSMTP(smtpConfig, {
        from: senderAccount.email,
        ...message
      });
      messageId = result.messageId;
    } else {
      throw new Error('Unsupported connection type');
    }

    // Update warmup email
    warmupEmail.status = 'sent';
    warmupEmail.messageId = messageId;
    warmupEmail.sentAt = new Date();
    await warmupEmail.save();

    // Update sender stats
    senderAccount.totalEmailsSent += 1;
    await senderAccount.save();

    // Update receiver stats
    receiverAccount.dailyEmailsReceived += 1;
    receiverAccount.totalEmailsReceived += 1;
    await receiverAccount.save();

    logger.info('Warmup email sent successfully', {
      warmupEmailId,
      from: senderAccount.email,
      to: receiverAccount.email,
      messageId
    });

    return { success: true, messageId };
  } catch (error: any) {
    logger.error('Failed to send warmup email', {
      error: error.message,
      warmupEmailId
    });

    // Update warmup email with error
    const warmupEmail = await WarmupEmail.findByPk(warmupEmailId);
    if (warmupEmail) {
      warmupEmail.status = 'error';
      warmupEmail.errorMessage = error.message;
      warmupEmail.retryCount += 1;
      await warmupEmail.save();
    }

    throw error;
  }
});

/**
 * Process schedule warmup batch job (recurring)
 */
sendWarmupEmailQueue.process('schedule-warmup-batch', async (job) => {
  logger.info('Processing schedule warmup batch');

  try {
    const count = await scheduleWarmupBatch();

    logger.info('Warmup batch scheduled', { count });

    return { success: true, count };
  } catch (error: any) {
    logger.error('Failed to schedule warmup batch', { error: error.message });
    throw error;
  }
});

/**
 * Process reset daily counters job (recurring - midnight)
 */
sendWarmupEmailQueue.process('reset-daily-counters', async (job) => {
  logger.info('Processing reset daily counters');

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

    return { success: true, affectedRows };
  } catch (error: any) {
    logger.error('Failed to reset daily counters', { error: error.message });
    throw error;
  }
});

logger.info('Send warmup email worker initialized');

export default sendWarmupEmailQueue;
