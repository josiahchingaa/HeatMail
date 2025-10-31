import { EmailAccount } from '../../models';
import { testSMTPConnection, getDecryptedSMTPConfig } from './smtp';
import { testIMAPConnection, getDecryptedIMAPConfig } from './imap';
import logger from '../../utils/logger';

interface ConnectionTestResult {
  success: boolean;
  smtpStatus: 'success' | 'failed';
  imapStatus: 'success' | 'failed';
  errors: string[];
}

/**
 * Test email account connection (both SMTP and IMAP)
 */
export const testEmailConnection = async (emailAccount: EmailAccount): Promise<ConnectionTestResult> => {
  const errors: string[] = [];
  let smtpStatus: 'success' | 'failed' = 'failed';
  let imapStatus: 'success' | 'failed' = 'failed';

  // Test SMTP connection
  if (emailAccount.connectionType === 'smtp' || emailAccount.connectionType === 'appPassword') {
    try {
      const smtpConfig = getDecryptedSMTPConfig(emailAccount);
      await testSMTPConnection(smtpConfig);
      smtpStatus = 'success';
      logger.info('SMTP connection test passed', { email: emailAccount.email });
    } catch (error: any) {
      smtpStatus = 'failed';
      errors.push(`SMTP: ${error.message}`);
      logger.error('SMTP connection test failed', { email: emailAccount.email, error: error.message });
    }

    // Test IMAP connection
    try {
      const imapConfig = getDecryptedIMAPConfig(emailAccount);
      await testIMAPConnection(imapConfig);
      imapStatus = 'success';
      logger.info('IMAP connection test passed', { email: emailAccount.email });
    } catch (error: any) {
      imapStatus = 'failed';
      errors.push(`IMAP: ${error.message}`);
      logger.error('IMAP connection test failed', { email: emailAccount.email, error: error.message });
    }
  }

  // OAuth connections - test separately (will be implemented in OAuth services)
  if (emailAccount.connectionType === 'oauth') {
    // OAuth testing will be done in oauth services
    smtpStatus = 'success'; // Assume OAuth is working if tokens exist
    imapStatus = 'success';
  }

  const success = smtpStatus === 'success' && imapStatus === 'success';

  // Update email account status
  if (success) {
    emailAccount.status = 'active';
    emailAccount.lastError = null;
    emailAccount.lastTestedAt = new Date();
  } else {
    emailAccount.status = 'error';
    emailAccount.lastError = errors.join('; ');
    emailAccount.lastTestedAt = new Date();
  }

  await emailAccount.save();

  return {
    success,
    smtpStatus,
    imapStatus,
    errors
  };
};

/**
 * Reconnect email account (retry connection)
 */
export const reconnectEmailAccount = async (emailAccount: EmailAccount): Promise<boolean> => {
  try {
    const result = await testEmailConnection(emailAccount);
    return result.success;
  } catch (error: any) {
    logger.error('Failed to reconnect email account', {
      email: emailAccount.email,
      error: error.message
    });
    return false;
  }
};

/**
 * Validate email account credentials before saving
 */
export const validateCredentials = async (
  connectionType: string,
  credentials: any
): Promise<{ valid: boolean; errors: string[] }> => {
  const errors: string[] = [];

  if (connectionType === 'smtp' || connectionType === 'appPassword') {
    if (!credentials.smtpHost) errors.push('SMTP host is required');
    if (!credentials.smtpPort) errors.push('SMTP port is required');
    if (!credentials.smtpUsername) errors.push('SMTP username is required');
    if (!credentials.smtpPassword) errors.push('SMTP password is required');
    if (!credentials.imapHost) errors.push('IMAP host is required');
    if (!credentials.imapPort) errors.push('IMAP port is required');
    if (!credentials.imapUsername) errors.push('IMAP username is required');
    if (!credentials.imapPassword) errors.push('IMAP password is required');
  }

  if (connectionType === 'oauth') {
    if (!credentials.oauthAccessToken) errors.push('OAuth access token is required');
    if (!credentials.oauthRefreshToken) errors.push('OAuth refresh token is required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Get common SMTP/IMAP settings for popular providers
 */
export const getProviderSettings = (provider: 'gmail' | 'outlook' | 'custom') => {
  const settings = {
    gmail: {
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      imapHost: 'imap.gmail.com',
      imapPort: 993
    },
    outlook: {
      smtpHost: 'smtp-mail.outlook.com',
      smtpPort: 587,
      imapHost: 'outlook.office365.com',
      imapPort: 993
    },
    custom: {
      smtpHost: '',
      smtpPort: 587,
      imapHost: '',
      imapPort: 993
    }
  };

  return settings[provider];
};

/**
 * Auto-detect email provider from email address
 */
export const detectProvider = (email: string): 'gmail' | 'outlook' | 'custom' => {
  const domain = email.split('@')[1].toLowerCase();

  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    return 'gmail';
  }

  if (domain.includes('outlook.com') || domain.includes('hotmail.com') || domain.includes('live.com')) {
    return 'outlook';
  }

  return 'custom';
};

/**
 * Check if email account has reached daily limit
 */
export const hasReachedDailyLimit = (emailAccount: EmailAccount): boolean => {
  // Reset counter if it's a new day
  const today = new Date().toDateString();
  const lastReset = new Date(emailAccount.lastResetDate).toDateString();

  if (today !== lastReset) {
    return false; // Counter will be reset
  }

  // Check if current volume has been reached
  const currentLimit = emailAccount.useGradualIncrease
    ? (emailAccount.gradualCurrentVolume || emailAccount.gradualStartVolume)
    : emailAccount.emailsPerDay;

  return emailAccount.dailyEmailsSent >= currentLimit;
};

/**
 * Reset daily counters for all accounts (runs at midnight)
 */
export const resetDailyCounters = async (): Promise<number> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [affectedRows] = await EmailAccount.update(
      {
        dailyEmailsSent: 0,
        dailyEmailsReceived: 0,
        lastResetDate: today
      },
      {
        where: {
          // Only reset accounts that haven't been reset today
          lastResetDate: {
            $lt: today
          } as any
        }
      }
    );

    logger.info(`Reset daily counters for ${affectedRows} email accounts`);
    return affectedRows;
  } catch (error: any) {
    logger.error('Failed to reset daily counters', { error: error.message });
    throw error;
  }
};
