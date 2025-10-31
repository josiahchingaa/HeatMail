import { EmailAccount, WarmupEmail, WarmupConversation } from '../../models';
import { archiveGmailThread } from '../oauth/google';
import { archiveOutlookMessage } from '../oauth/microsoft';
import { archiveThreadAsUser } from '../oauth/domainWide';
import { connectToIMAP, archiveEmail, getArchiveFolder } from '../email/imap';
import { getDecryptedIMAPConfig } from '../email/imap';
import logger from '../../utils/logger';

/**
 * Archive email thread via Gmail API
 */
export const archiveViaGmail = async (
  emailAccount: EmailAccount,
  threadId: string
): Promise<void> => {
  try {
    if (emailAccount.connectionType === 'oauth') {
      await archiveGmailThread(emailAccount, threadId);
    } else if (emailAccount.connectionType === 'domainWide' && emailAccount.serviceAccountJson) {
      const serviceAccount = JSON.parse(emailAccount.serviceAccountJson);
      await archiveThreadAsUser(serviceAccount, emailAccount.email, threadId);
    } else {
      throw new Error('Invalid connection type for Gmail archiving');
    }

    logger.info('Email archived via Gmail API', {
      email: emailAccount.email,
      threadId
    });
  } catch (error: any) {
    logger.error('Failed to archive via Gmail API', {
      error: error.message,
      email: emailAccount.email,
      threadId
    });
    throw error;
  }
};

/**
 * Archive email thread via Outlook API
 */
export const archiveViaOutlook = async (
  emailAccount: EmailAccount,
  messageId: string
): Promise<void> => {
  try {
    await archiveOutlookMessage(emailAccount, messageId);

    logger.info('Email archived via Outlook API', {
      email: emailAccount.email,
      messageId
    });
  } catch (error: any) {
    logger.error('Failed to archive via Outlook API', {
      error: error.message,
      email: emailAccount.email,
      messageId
    });
    throw error;
  }
};

/**
 * Archive email thread via IMAP
 */
export const archiveViaIMAP = async (
  emailAccount: EmailAccount,
  uid: number
): Promise<void> => {
  try {
    const imapConfig = getDecryptedIMAPConfig(emailAccount);
    const imap = await connectToIMAP(imapConfig);

    const archiveFolder = getArchiveFolder(emailAccount.provider);

    await imap.openBox('INBOX', false, async (err: any) => {
      if (err) throw err;

      await archiveEmail(imap, uid, archiveFolder);
      imap.end();
    });

    logger.info('Email archived via IMAP', {
      email: emailAccount.email,
      uid
    });
  } catch (error: any) {
    logger.error('Failed to archive via IMAP', {
      error: error.message,
      email: emailAccount.email,
      uid
    });
    throw error;
  }
};

/**
 * Archive warmup email thread (auto-detect method)
 */
export const archiveWarmupThread = async (
  emailAccount: EmailAccount,
  warmupEmail: WarmupEmail
): Promise<void> => {
  try {
    // Determine archive method based on connection type and provider
    if (emailAccount.provider === 'gmail') {
      if (emailAccount.connectionType === 'oauth' || emailAccount.connectionType === 'domainWide') {
        if (warmupEmail.threadId) {
          await archiveViaGmail(emailAccount, warmupEmail.threadId);
        }
      } else {
        logger.warn('Cannot archive Gmail via SMTP, skipping', {
          email: emailAccount.email
        });
      }
    } else if (emailAccount.provider === 'outlook') {
      if (emailAccount.connectionType === 'oauth') {
        if (warmupEmail.messageId) {
          await archiveViaOutlook(emailAccount, warmupEmail.messageId);
        }
      } else {
        logger.warn('Cannot archive Outlook via SMTP, skipping', {
          email: emailAccount.email
        });
      }
    } else {
      // Custom provider - try IMAP if available
      if (emailAccount.imapHost) {
        logger.info('Archiving via IMAP not fully implemented for custom providers', {
          email: emailAccount.email
        });
      }
    }

    // Update warmup email status
    warmupEmail.status = 'archived';
    warmupEmail.archivedAt = new Date();
    await warmupEmail.save();

    logger.info('Warmup email archived', {
      warmupEmailId: warmupEmail.id,
      email: emailAccount.email
    });
  } catch (error: any) {
    logger.error('Failed to archive warmup thread', {
      error: error.message,
      warmupEmailId: warmupEmail.id
    });
    throw error;
  }
};

/**
 * Archive completed conversation (archive all emails in conversation)
 */
export const archiveConversation = async (
  conversationId: number
): Promise<void> => {
  try {
    const conversation = await WarmupConversation.findByPk(conversationId);

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Get all emails in conversation
    const emails = await WarmupEmail.findAll({
      where: { conversationId }
    });

    logger.info('Archiving conversation', {
      conversationId,
      emailCount: emails.length
    });

    // Archive each email
    for (const email of emails) {
      try {
        // Get sender account
        const account = await EmailAccount.findByPk(email.fromEmailAccountId);

        if (account) {
          await archiveWarmupThread(account, email);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error: any) {
        logger.error('Failed to archive email in conversation', {
          error: error.message,
          warmupEmailId: email.id,
          conversationId
        });
        // Continue with other emails even if one fails
      }
    }

    // Mark conversation as archived
    conversation.status = 'archived';
    conversation.archivedAt = new Date();
    await conversation.save();

    logger.info('Conversation archived', { conversationId });
  } catch (error: any) {
    logger.error('Failed to archive conversation', {
      error: error.message,
      conversationId
    });
    throw error;
  }
};

/**
 * Get archive statistics
 */
export const getArchiveStats = async (): Promise<{
  totalArchived: number;
  archivedToday: number;
  failedArchives: number;
}> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalArchived, archivedToday] = await Promise.all([
      WarmupEmail.count({ where: { status: 'archived' } }),
      WarmupEmail.count({
        where: {
          status: 'archived',
          archivedAt: {
            $gte: today
          } as any
        }
      })
    ]);

    // Failed archives are emails that should be archived but aren't
    const failedArchives = await WarmupEmail.count({
      where: {
        status: 'sent',
        sentAt: {
          $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) // More than 24 hours old
        } as any
      }
    });

    return { totalArchived, archivedToday, failedArchives };
  } catch (error: any) {
    logger.error('Failed to get archive stats', { error: error.message });
    throw error;
  }
};

/**
 * Clean up old archived conversations (optional - for maintenance)
 */
export const cleanupOldArchivedConversations = async (daysOld: number = 30): Promise<number> => {
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

    logger.info('Old archived conversations cleaned up', { count: result, daysOld });

    return result;
  } catch (error: any) {
    logger.error('Failed to cleanup old conversations', { error: error.message });
    throw error;
  }
};
