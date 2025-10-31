import { sendReplyQueue } from '../config/queue';
import { WarmupEmail, EmailAccount, WarmupConversation } from '../models';
import { sendWarmupEmail as sendViaSMTP, getDecryptedSMTPConfig } from '../services/email/smtp';
import { sendEmailViaGmail } from '../services/oauth/google';
import { sendEmailViaOutlook } from '../services/oauth/microsoft';
import { sendEmailAsUser } from '../services/oauth/domainWide';
import { generateConversationReply, calculateReplyDelay } from '../services/warmup/replyGenerator';
import { isConversationComplete } from '../services/warmup/poolMatcher';
import { archiveThreadQueue } from '../config/queue';
import logger from '../utils/logger';

/**
 * Process send reply job
 */
sendReplyQueue.process('send-reply', async (job) => {
  const { originalEmailId } = job.data;

  logger.info('Processing send reply', { originalEmailId });

  try {
    // Fetch original email
    const originalEmail = await WarmupEmail.findByPk(originalEmailId);

    if (!originalEmail) {
      throw new Error('Original email not found');
    }

    // Fetch conversation
    const conversation = await WarmupConversation.findByPk(originalEmail.conversationId!);

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Check if already replied
    const existingReply = await WarmupEmail.findOne({
      where: {
        conversationId: conversation.id,
        conversationStep: conversation.currentStep + 1
      }
    });

    if (existingReply) {
      logger.warn('Reply already exists', { originalEmailId });
      return { success: false, reason: 'Reply already exists' };
    }

    // Get sender and receiver accounts (reversed from original)
    const senderAccount = await EmailAccount.findByPk(originalEmail.toEmailAccountId); // Original receiver is now sender
    const receiverAccount = await EmailAccount.findByPk(originalEmail.fromEmailAccountId); // Original sender is now receiver

    if (!senderAccount || !receiverAccount) {
      throw new Error('Sender or receiver account not found');
    }

    // Check if sender has reached daily limit
    const today = new Date().toDateString();
    const lastReset = new Date(senderAccount.lastResetDate).toDateString();

    if (today === lastReset) {
      const currentLimit = senderAccount.useGradualIncrease
        ? (senderAccount.gradualCurrentVolume || senderAccount.gradualStartVolume)
        : senderAccount.emailsPerDay;

      if (senderAccount.dailyEmailsSent >= currentLimit) {
        logger.warn('Sender has reached daily limit, delaying reply', {
          email: senderAccount.email,
          limit: currentLimit
        });
        // Delay job by 1 hour
        throw new Error('DELAY_RETRY');
      }
    }

    // Generate reply content
    const replyContent = await generateConversationReply(
      originalEmail,
      conversation.currentStep + 1,
      senderAccount.email,
      receiverAccount.email
    );

    // Prepare message
    const message = {
      to: receiverAccount.email,
      subject: replyContent.subject,
      html: replyContent.body,
      inReplyTo: originalEmail.messageId,
      references: originalEmail.messageId
    };

    let messageId: string;

    // Send reply based on connection type
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

    // Create reply email record
    const replyEmail = await WarmupEmail.create({
      fromEmailAccountId: senderAccount.id,
      toEmailAccountId: receiverAccount.id,
      subject: replyContent.subject,
      body: replyContent.body,
      templateId: replyContent.templateId,
      messageId,
      threadId: originalEmail.threadId,
      inReplyToMessageId: originalEmail.messageId,
      conversationId: conversation.id,
      conversationStep: conversation.currentStep + 1,
      status: 'sent',
      sentAt: new Date()
    });

    // Update original email
    originalEmail.status = 'replied';
    originalEmail.wasReplied = true;
    originalEmail.repliedAt = new Date();
    await originalEmail.save();

    // Update conversation
    conversation.currentStep += 1;
    conversation.lastReplyAt = new Date();
    await conversation.save();

    // Update sender stats
    senderAccount.dailyEmailsSent += 1;
    senderAccount.totalEmailsSent += 1;
    senderAccount.totalRepliesSent += 1;
    await senderAccount.save();

    // Update receiver stats
    receiverAccount.dailyEmailsReceived += 1;
    receiverAccount.totalEmailsReceived += 1;
    await receiverAccount.save();

    logger.info('Reply sent successfully', {
      originalEmailId,
      replyEmailId: replyEmail.id,
      from: senderAccount.email,
      to: receiverAccount.email,
      conversationStep: conversation.currentStep
    });

    // Check if conversation is complete
    if (isConversationComplete(conversation)) {
      conversation.status = 'completed';
      conversation.completedAt = new Date();
      await conversation.save();

      // Schedule archive job
      await archiveThreadQueue.add('archive-conversation', {
        conversationId: conversation.id
      });

      logger.info('Conversation completed, archive scheduled', {
        conversationId: conversation.id
      });
    } else {
      // Schedule next reply with delay
      const delay = calculateReplyDelay();

      await sendReplyQueue.add('send-reply', {
        originalEmailId: replyEmail.id
      }, {
        delay
      });

      logger.info('Next reply scheduled', {
        originalEmailId: replyEmail.id,
        delayMs: delay
      });
    }

    return { success: true, messageId, conversationComplete: isConversationComplete(conversation) };
  } catch (error: any) {
    if (error.message === 'DELAY_RETRY') {
      // Retry after 1 hour
      throw error;
    }

    logger.error('Failed to send reply', {
      error: error.message,
      originalEmailId
    });

    throw error;
  }
});

logger.info('Send reply worker initialized');

export default sendReplyQueue;
