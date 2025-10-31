import { checkInboxQueue, sendReplyQueue } from '../config/queue';
import { EmailAccount, WarmupEmail } from '../models';
import { pollInbox, getDecryptedIMAPConfig } from '../services/email/imap';
import { listGmailMessages, getGmailMessage } from '../services/oauth/google';
import { listOutlookMessages, getOutlookMessage } from '../services/oauth/microsoft';
import { listMessagesAsUser, getMessageAsUser } from '../services/oauth/domainWide';
import { calculateReplyDelay } from '../services/warmup/replyGenerator';
import logger from '../utils/logger';

/**
 * Check single inbox for new warmup emails
 */
checkInboxQueue.process('check-inbox', async (job) => {
  const { emailAccountId } = job.data;

  logger.info('Processing check inbox', { emailAccountId });

  try {
    const emailAccount = await EmailAccount.findByPk(emailAccountId);

    if (!emailAccount) {
      throw new Error('Email account not found');
    }

    if (emailAccount.status !== 'active') {
      logger.warn('Email account not active, skipping', {
        email: emailAccount.email,
        status: emailAccount.status
      });
      return { success: false, reason: 'Account not active' };
    }

    let newWarmupEmails: any[] = [];

    // Check inbox based on connection type
    if (emailAccount.connectionType === 'oauth') {
      if (emailAccount.provider === 'gmail') {
        // List messages with warmup header
        const messages = await listGmailMessages(
          emailAccount,
          'X-Warmup-Email:true is:unread',
          50
        );

        for (const msg of messages) {
          try {
            const fullMessage = await getGmailMessage(emailAccount, msg.id);

            // Check if we already have this email
            const existing = await WarmupEmail.findOne({
              where: { messageId: msg.id }
            });

            if (!existing) {
              newWarmupEmails.push({
                messageId: msg.id,
                threadId: fullMessage.threadId,
                subject: getHeaderValue(fullMessage.payload.headers, 'Subject'),
                from: getHeaderValue(fullMessage.payload.headers, 'From')
              });
            }
          } catch (error) {
            logger.warn('Failed to fetch Gmail message', { messageId: msg.id, error });
          }
        }
      } else if (emailAccount.provider === 'outlook') {
        // List messages with warmup header
        const messages = await listOutlookMessages(
          emailAccount,
          "isRead eq false and internetMessageHeaders/any(h:h/name eq 'X-Warmup-Email' and h/value eq 'true')",
          50
        );

        for (const msg of messages) {
          try {
            // Check if we already have this email
            const existing = await WarmupEmail.findOne({
              where: { messageId: msg.id }
            });

            if (!existing) {
              newWarmupEmails.push({
                messageId: msg.id,
                threadId: msg.conversationId,
                subject: msg.subject,
                from: msg.from?.emailAddress?.address
              });
            }
          } catch (error) {
            logger.warn('Failed to process Outlook message', { messageId: msg.id, error });
          }
        }
      }
    } else if (emailAccount.connectionType === 'domainWide') {
      if (!emailAccount.serviceAccountJson) {
        throw new Error('Service account JSON not found');
      }

      const serviceAccount = JSON.parse(emailAccount.serviceAccountJson);

      const messages = await listMessagesAsUser(
        serviceAccount,
        emailAccount.email,
        'X-Warmup-Email:true is:unread',
        50
      );

      for (const msg of messages) {
        try {
          const fullMessage = await getMessageAsUser(serviceAccount, emailAccount.email, msg.id);

          const existing = await WarmupEmail.findOne({
            where: { messageId: msg.id }
          });

          if (!existing) {
            newWarmupEmails.push({
              messageId: msg.id,
              threadId: fullMessage.threadId,
              subject: getHeaderValue(fullMessage.payload.headers, 'Subject'),
              from: getHeaderValue(fullMessage.payload.headers, 'From')
            });
          }
        } catch (error) {
          logger.warn('Failed to fetch domain-wide message', { messageId: msg.id, error });
        }
      }
    } else if (emailAccount.connectionType === 'smtp' || emailAccount.connectionType === 'appPassword') {
      // Use IMAP to check inbox
      const imapConfig = getDecryptedIMAPConfig(emailAccount);
      const emails = await pollInbox(imapConfig);

      for (const email of emails) {
        const existing = await WarmupEmail.findOne({
          where: { messageId: email.messageId }
        });

        if (!existing) {
          newWarmupEmails.push({
            messageId: email.messageId,
            threadId: email.messageId, // IMAP doesn't have threadId
            subject: email.subject,
            from: email.from
          });
        }
      }
    }

    logger.info('Inbox checked', {
      email: emailAccount.email,
      newEmails: newWarmupEmails.length
    });

    // Schedule reply jobs for new warmup emails
    for (const email of newWarmupEmails) {
      try {
        // Find the original email that this is a reply to
        const originalEmail = await WarmupEmail.findOne({
          where: {
            fromEmailAccountId: emailAccount.id,
            status: 'sent'
          },
          order: [['sentAt', 'DESC']]
        });

        if (originalEmail) {
          // Schedule reply with delay
          const delay = calculateReplyDelay();

          await sendReplyQueue.add('send-reply', {
            originalEmailId: originalEmail.id
          }, {
            delay
          });

          logger.info('Reply scheduled for warmup email', {
            originalEmailId: originalEmail.id,
            delayMs: delay
          });
        }
      } catch (error) {
        logger.error('Failed to schedule reply', { email: email.messageId, error });
      }
    }

    return { success: true, newEmails: newWarmupEmails.length };
  } catch (error: any) {
    logger.error('Failed to check inbox', {
      error: error.message,
      emailAccountId
    });

    throw error;
  }
});

/**
 * Poll all inboxes (recurring job)
 */
checkInboxQueue.process('poll-all-inboxes', async (job) => {
  logger.info('Processing poll all inboxes');

  try {
    const accounts = await EmailAccount.findAll({
      where: {
        status: 'active',
        isWarmupEnabled: true
      }
    });

    logger.info('Polling inboxes for all accounts', { count: accounts.length });

    let checkedCount = 0;

    for (const account of accounts) {
      try {
        await checkInboxQueue.add('check-inbox', {
          emailAccountId: account.id
        });

        checkedCount++;
      } catch (error) {
        logger.error('Failed to queue inbox check', {
          email: account.email,
          error
        });
      }
    }

    logger.info('All inboxes queued for checking', { checkedCount });

    return { success: true, checkedCount };
  } catch (error: any) {
    logger.error('Failed to poll all inboxes', { error: error.message });
    throw error;
  }
});

/**
 * Helper: Get header value from message
 */
function getHeaderValue(headers: any[], name: string): string {
  const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
  return header ? header.value : '';
}

logger.info('Check inbox worker initialized');

export default checkInboxQueue;
