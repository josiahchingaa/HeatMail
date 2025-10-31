import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import { encrypt } from '../../utils/encryption';
import logger from '../../utils/logger';

const SCOPES = ['https://mail.google.com/'];

interface ServiceAccountConfig {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

/**
 * Upload and store service account credentials
 */
export const uploadServiceAccountKey = async (
  domain: string,
  serviceAccountJson: string
): Promise<ServiceAccountConfig> => {
  try {
    const config: ServiceAccountConfig = JSON.parse(serviceAccountJson);

    // Validate required fields
    if (!config.private_key || !config.client_email || !config.client_id) {
      throw new Error('Invalid service account JSON - missing required fields');
    }

    logger.info('Service account key uploaded', { domain, clientEmail: config.client_email });

    return config;
  } catch (error: any) {
    logger.error('Failed to parse service account JSON', { error: error.message });
    throw new Error(`Invalid service account JSON: ${error.message}`);
  }
};

/**
 * Create JWT client for domain-wide delegation
 */
export const createDomainWideClient = (
  serviceAccount: ServiceAccountConfig,
  userEmail: string
): JWT => {
  const jwtClient = new JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: SCOPES,
    subject: userEmail // Impersonate this user
  });

  return jwtClient;
};

/**
 * Test domain-wide delegation access
 */
export const testDomainAccess = async (
  serviceAccount: ServiceAccountConfig,
  testEmail: string
): Promise<boolean> => {
  try {
    const jwtClient = createDomainWideClient(serviceAccount, testEmail);

    // Try to get user profile to verify access
    const gmail = google.gmail({ version: 'v1', auth: jwtClient });
    const profile = await gmail.users.getProfile({ userId: 'me' });

    if (profile.data.emailAddress !== testEmail) {
      throw new Error('Email mismatch - delegation may not be working correctly');
    }

    logger.info('Domain-wide delegation test successful', {
      email: testEmail,
      serviceAccount: serviceAccount.client_email
    });

    return true;
  } catch (error: any) {
    logger.error('Domain-wide delegation test failed', {
      error: error.message,
      email: testEmail
    });
    throw new Error(`Domain access test failed: ${error.message}`);
  }
};

/**
 * Fetch all users in a Google Workspace domain
 */
export const fetchAllUsersInDomain = async (
  serviceAccount: ServiceAccountConfig,
  adminEmail: string
): Promise<Array<{ email: string; name: string; suspended: boolean }>> => {
  try {
    // Use admin email to fetch directory
    const jwtClient = createDomainWideClient(serviceAccount, adminEmail);

    const admin = google.admin({ version: 'directory_v1', auth: jwtClient });

    // Get domain from admin email
    const domain = adminEmail.split('@')[1];

    // Fetch all users in the domain
    const response = await admin.users.list({
      domain,
      maxResults: 500,
      orderBy: 'email'
    });

    const users = response.data.users || [];

    const userList = users.map((user: any) => ({
      email: user.primaryEmail,
      name: user.name?.fullName || user.primaryEmail,
      suspended: user.suspended || false
    }));

    logger.info('Fetched users from domain', { domain, count: userList.length });

    return userList.filter(u => !u.suspended); // Only return active users
  } catch (error: any) {
    logger.error('Failed to fetch domain users', { error: error.message });
    throw new Error(`Failed to fetch domain users: ${error.message}`);
  }
};

/**
 * Send email as a specific user via domain-wide delegation
 */
export const sendEmailAsUser = async (
  serviceAccount: ServiceAccountConfig,
  userEmail: string,
  message: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    inReplyTo?: string;
    references?: string;
  }
): Promise<{ messageId: string; success: boolean }> => {
  try {
    const jwtClient = createDomainWideClient(serviceAccount, userEmail);

    const gmail = google.gmail({ version: 'v1', auth: jwtClient });

    // Create email message
    const emailLines = [
      `From: ${userEmail}`,
      `To: ${message.to}`,
      `Subject: ${message.subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      'X-Warmup-Email: true',
      ''
    ];

    if (message.inReplyTo) {
      emailLines.splice(3, 0, `In-Reply-To: ${message.inReplyTo}`);
    }

    if (message.references) {
      emailLines.splice(3, 0, `References: ${message.references}`);
    }

    emailLines.push(message.html || message.text || '');

    const rawEmail = emailLines.join('\r\n');
    const encodedEmail = Buffer.from(rawEmail)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send email
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail
      }
    });

    logger.info('Email sent via domain-wide delegation', {
      from: userEmail,
      to: message.to,
      messageId: response.data.id
    });

    return {
      messageId: response.data.id || '',
      success: true
    };
  } catch (error: any) {
    logger.error('Failed to send email via domain-wide delegation', {
      error: error.message,
      from: userEmail,
      to: message.to
    });
    throw new Error(`Domain-wide send error: ${error.message}`);
  }
};

/**
 * List messages for a user via domain-wide delegation
 */
export const listMessagesAsUser = async (
  serviceAccount: ServiceAccountConfig,
  userEmail: string,
  query?: string,
  maxResults: number = 10
): Promise<any[]> => {
  try {
    const jwtClient = createDomainWideClient(serviceAccount, userEmail);

    const gmail = google.gmail({ version: 'v1', auth: jwtClient });

    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query || 'is:unread',
      maxResults
    });

    return response.data.messages || [];
  } catch (error: any) {
    logger.error('Failed to list messages via domain-wide delegation', {
      error: error.message,
      userEmail
    });
    throw new Error(`Domain-wide list error: ${error.message}`);
  }
};

/**
 * Archive thread as a user via domain-wide delegation
 */
export const archiveThreadAsUser = async (
  serviceAccount: ServiceAccountConfig,
  userEmail: string,
  threadId: string
): Promise<void> => {
  try {
    const jwtClient = createDomainWideClient(serviceAccount, userEmail);

    const gmail = google.gmail({ version: 'v1', auth: jwtClient });

    await gmail.users.threads.modify({
      userId: 'me',
      id: threadId,
      requestBody: {
        removeLabelIds: ['INBOX']
      }
    });

    logger.info('Thread archived via domain-wide delegation', {
      userEmail,
      threadId
    });
  } catch (error: any) {
    logger.error('Failed to archive thread via domain-wide delegation', {
      error: error.message,
      userEmail,
      threadId
    });
    throw new Error(`Domain-wide archive error: ${error.message}`);
  }
};

/**
 * Get message as a user via domain-wide delegation
 */
export const getMessageAsUser = async (
  serviceAccount: ServiceAccountConfig,
  userEmail: string,
  messageId: string
): Promise<any> => {
  try {
    const jwtClient = createDomainWideClient(serviceAccount, userEmail);

    const gmail = google.gmail({ version: 'v1', auth: jwtClient });

    const response = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full'
    });

    return response.data;
  } catch (error: any) {
    logger.error('Failed to get message via domain-wide delegation', {
      error: error.message,
      userEmail,
      messageId
    });
    throw new Error(`Domain-wide get error: ${error.message}`);
  }
};

/**
 * Bulk add domain users to warmup pool
 */
export const bulkAddDomainUsers = async (
  serviceAccount: ServiceAccountConfig,
  adminEmail: string,
  selectedEmails: string[]
): Promise<Array<{ email: string; success: boolean; error?: string }>> => {
  const results = [];

  for (const email of selectedEmails) {
    try {
      // Test if we can impersonate this user
      await testDomainAccess(serviceAccount, email);

      results.push({
        email,
        success: true
      });

      logger.info('Domain user validated for warmup', { email });
    } catch (error: any) {
      results.push({
        email,
        success: false,
        error: error.message
      });

      logger.warn('Failed to validate domain user', { email, error: error.message });
    }
  }

  return results;
};
