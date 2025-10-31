import { EmailAccount, WarmupConversation, WarmupEmail } from '../../models';
import { Op } from 'sequelize';
import logger from '../../utils/logger';

interface MatchPair {
  sender: EmailAccount;
  receiver: EmailAccount;
}

/**
 * Get all active email accounts eligible for warmup
 */
export const getActiveMailboxes = async (): Promise<EmailAccount[]> => {
  try {
    const accounts = await EmailAccount.findAll({
      where: {
        status: 'active',
        isWarmupEnabled: true
      }
    });

    // Filter out accounts that have reached daily limit
    const eligibleAccounts = accounts.filter(account => {
      // Reset counter if it's a new day
      const today = new Date().toDateString();
      const lastReset = new Date(account.lastResetDate).toDateString();

      if (today !== lastReset) {
        // Counter will be reset by resetDailyCounters job
        return true;
      }

      // Check if account has reached its limit
      const currentLimit = account.useGradualIncrease
        ? (account.gradualCurrentVolume || account.gradualStartVolume)
        : account.emailsPerDay;

      return account.dailyEmailsSent < currentLimit;
    });

    logger.info('Active mailboxes for warmup', {
      total: accounts.length,
      eligible: eligibleAccounts.length
    });

    return eligibleAccounts;
  } catch (error: any) {
    logger.error('Failed to get active mailboxes', { error: error.message });
    throw error;
  }
};

/**
 * Check if two accounts have recently interacted
 */
export const hasRecentInteraction = async (
  senderId: number,
  receiverId: number,
  hoursThreshold: number = 24
): Promise<boolean> => {
  try {
    const threshold = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000);

    const recentEmail = await WarmupEmail.findOne({
      where: {
        fromEmailAccountId: senderId,
        toEmailAccountId: receiverId,
        createdAt: {
          [Op.gte]: threshold
        }
      }
    });

    return recentEmail !== null;
  } catch (error: any) {
    logger.error('Failed to check recent interaction', { error: error.message });
    return false;
  }
};

/**
 * Find suitable receiver for a sender
 */
export const findSuitableReceiver = async (
  sender: EmailAccount,
  availableReceivers: EmailAccount[]
): Promise<EmailAccount | null> => {
  try {
    // Filter out self
    let candidates = availableReceivers.filter(r => r.id !== sender.id);

    if (candidates.length === 0) {
      return null;
    }

    // Check for recent interactions and filter them out
    const candidatesWithoutRecent = [];

    for (const candidate of candidates) {
      const hasRecent = await hasRecentInteraction(sender.id, candidate.id, 24);
      if (!hasRecent) {
        candidatesWithoutRecent.push(candidate);
      }
    }

    // If all have recent interactions, use all candidates
    const finalCandidates = candidatesWithoutRecent.length > 0
      ? candidatesWithoutRecent
      : candidates;

    // Select random receiver
    const randomIndex = Math.floor(Math.random() * finalCandidates.length);
    return finalCandidates[randomIndex];
  } catch (error: any) {
    logger.error('Failed to find suitable receiver', { error: error.message });
    return null;
  }
};

/**
 * Create sender-receiver pairs for warmup
 */
export const createSenderReceiverPairs = async (): Promise<MatchPair[]> => {
  try {
    const activeAccounts = await getActiveMailboxes();

    if (activeAccounts.length < 2) {
      logger.warn('Not enough active accounts for warmup', { count: activeAccounts.length });
      return [];
    }

    const pairs: MatchPair[] = [];
    const usedSenders = new Set<number>();

    // Create pairs
    for (const sender of activeAccounts) {
      // Skip if already used as sender
      if (usedSenders.has(sender.id)) {
        continue;
      }

      // Find receiver
      const receiver = await findSuitableReceiver(sender, activeAccounts);

      if (receiver) {
        pairs.push({ sender, receiver });
        usedSenders.add(sender.id);

        logger.debug('Created warmup pair', {
          from: sender.email,
          to: receiver.email
        });
      }
    }

    logger.info('Created sender-receiver pairs', { count: pairs.length });

    return pairs;
  } catch (error: any) {
    logger.error('Failed to create sender-receiver pairs', { error: error.message });
    throw error;
  }
};

/**
 * Create conversation record
 */
export const createConversation = async (
  senderId: number,
  receiverId: number
): Promise<WarmupConversation> => {
  try {
    // Generate unique thread ID
    const threadId = `warmup-${Date.now()}-${senderId}-${receiverId}`;

    // Random conversation length (2-4 exchanges)
    const maxSteps = Math.floor(Math.random() * 3) + 2; // 2, 3, or 4

    const conversation = await WarmupConversation.create({
      emailAccountId1: senderId,
      emailAccountId2: receiverId,
      threadId,
      currentStep: 1,
      maxSteps,
      status: 'active'
    });

    logger.info('Conversation created', {
      conversationId: conversation.id,
      threadId,
      maxSteps
    });

    return conversation;
  } catch (error: any) {
    logger.error('Failed to create conversation', { error: error.message });
    throw error;
  }
};

/**
 * Check if conversation is complete
 */
export const isConversationComplete = (conversation: WarmupConversation): boolean => {
  return conversation.currentStep >= conversation.maxSteps;
};

/**
 * Get conversation statistics
 */
export const getConversationStats = async (): Promise<{
  active: number;
  completed: number;
  archived: number;
  total: number;
}> => {
  try {
    const [active, completed, archived, total] = await Promise.all([
      WarmupConversation.count({ where: { status: 'active' } }),
      WarmupConversation.count({ where: { status: 'completed' } }),
      WarmupConversation.count({ where: { status: 'archived' } }),
      WarmupConversation.count()
    ]);

    return { active, completed, archived, total };
  } catch (error: any) {
    logger.error('Failed to get conversation stats', { error: error.message });
    throw error;
  }
};

/**
 * Get pool statistics
 */
export const getPoolStats = async (): Promise<{
  totalAccounts: number;
  activeAccounts: number;
  eligibleForWarmup: number;
  pausedAccounts: number;
  errorAccounts: number;
}> => {
  try {
    const [total, active, paused, error] = await Promise.all([
      EmailAccount.count(),
      EmailAccount.count({ where: { status: 'active', isWarmupEnabled: true } }),
      EmailAccount.count({ where: { status: 'paused' } }),
      EmailAccount.count({ where: { status: 'error' } })
    ]);

    const activeMailboxes = await getActiveMailboxes();

    return {
      totalAccounts: total,
      activeAccounts: active,
      eligibleForWarmup: activeMailboxes.length,
      pausedAccounts: paused,
      errorAccounts: error
    };
  } catch (error: any) {
    logger.error('Failed to get pool stats', { error: error.message });
    throw error;
  }
};
