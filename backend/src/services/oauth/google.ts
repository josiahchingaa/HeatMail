import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { encrypt, decrypt } from '../../utils/encryption';
import logger from '../../utils/logger';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.readonly'
];

/**
 * Create OAuth2 client
 */
export const createOAuth2Client = (): OAuth2Client => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
};

/**
 * Get Google OAuth authorization URL
 */
export const getAuthUrl = (state?: string): string => {
  const oauth2Client = createOAuth2Client();

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // Force consent screen to get refresh token
    state: state || ''
  });

  return authUrl;
};

/**
 * Handle OAuth callback and exchange code for tokens
 */
export const handleCallback = async (code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiryDate: Date;
  email: string;
}> => {
  try {
    const oauth2Client = createOAuth2Client();

    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('Failed to obtain tokens from Google');
    }

    oauth2Client.setCredentials(tokens);

    // Get user's email address
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const profile = await gmail.users.getProfile({ userId: 'me' });
    const email = profile.data.emailAddress;

    if (!email) {
      throw new Error('Failed to retrieve email address from Google');
    }

    const expiryDate = tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + 3600 * 1000); // Default 1 hour

    logger.info('Google OAuth callback successful', { email });

    return {
      accessToken: encrypt(tokens.access_token),
      refreshToken: encrypt(tokens.refresh_token),
      expiryDate,
      email
    };
  } catch (error: any) {
    logger.error('Google OAuth callback failed', { error: error.message });
    throw new Error(`Google OAuth error: ${error.message}`);
  }
};

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async (encryptedRefreshToken: string): Promise<{
  accessToken: string;
  expiryDate: Date;
}> => {
  try {
    const oauth2Client = createOAuth2Client();
    const refreshToken = decrypt(encryptedRefreshToken);

    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });

    const { credentials } = await oauth2Client.refreshAccessToken();

    if (!credentials.access_token) {
      throw new Error('Failed to refresh access token');
    }

    const expiryDate = credentials.expiry_date
      ? new Date(credentials.expiry_date)
      : new Date(Date.now() + 3600 * 1000);

    logger.info('Google access token refreshed successfully');

    return {
      accessToken: encrypt(credentials.access_token),
      expiryDate
    };
  } catch (error: any) {
    logger.error('Failed to refresh Google access token', { error: error.message });
    throw new Error(`Token refresh failed: ${error.message}`);
  }
};

/**
 * Send email via Gmail API
 */
export const sendEmailViaGmail = async (
  emailAccount: any,
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
    // Check if token needs refresh
    if (new Date() >= new Date(emailAccount.oauthTokenExpiry)) {
      const refreshed = await refreshAccessToken(emailAccount.oauthRefreshToken);
      emailAccount.oauthAccessToken = refreshed.accessToken;
      emailAccount.oauthTokenExpiry = refreshed.expiryDate;
      await emailAccount.save();
    }

    const oauth2Client = createOAuth2Client();
    const accessToken = decrypt(emailAccount.oauthAccessToken);

    oauth2Client.setCredentials({
      access_token: accessToken
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Create email message
    const emailLines = [
      `From: ${emailAccount.email}`,
      `To: ${message.to}`,
      `Subject: ${message.subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      'X-Warmup-Email: true', // Warmup header
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

    logger.info('Email sent via Gmail API', {
      from: emailAccount.email,
      to: message.to,
      messageId: response.data.id
    });

    return {
      messageId: response.data.id || '',
      success: true
    };
  } catch (error: any) {
    logger.error('Failed to send email via Gmail', {
      error: error.message,
      from: emailAccount.email,
      to: message.to
    });
    throw new Error(`Gmail API error: ${error.message}`);
  }
};

/**
 * List Gmail messages
 */
export const listGmailMessages = async (
  emailAccount: any,
  query?: string,
  maxResults: number = 10
): Promise<any[]> => {
  try {
    // Check if token needs refresh
    if (new Date() >= new Date(emailAccount.oauthTokenExpiry)) {
      const refreshed = await refreshAccessToken(emailAccount.oauthRefreshToken);
      emailAccount.oauthAccessToken = refreshed.accessToken;
      emailAccount.oauthTokenExpiry = refreshed.expiryDate;
      await emailAccount.save();
    }

    const oauth2Client = createOAuth2Client();
    const accessToken = decrypt(emailAccount.oauthAccessToken);

    oauth2Client.setCredentials({
      access_token: accessToken
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query || 'is:unread',
      maxResults
    });

    return response.data.messages || [];
  } catch (error: any) {
    logger.error('Failed to list Gmail messages', { error: error.message });
    throw new Error(`Gmail API error: ${error.message}`);
  }
};

/**
 * Archive Gmail thread
 */
export const archiveGmailThread = async (
  emailAccount: any,
  threadId: string
): Promise<void> => {
  try {
    const oauth2Client = createOAuth2Client();
    const accessToken = decrypt(emailAccount.oauthAccessToken);

    oauth2Client.setCredentials({
      access_token: accessToken
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Remove INBOX label (archives the thread)
    await gmail.users.threads.modify({
      userId: 'me',
      id: threadId,
      requestBody: {
        removeLabelIds: ['INBOX']
      }
    });

    logger.info('Gmail thread archived', { threadId });
  } catch (error: any) {
    logger.error('Failed to archive Gmail thread', { error: error.message, threadId });
    throw new Error(`Gmail archive error: ${error.message}`);
  }
};

/**
 * Get Gmail message by ID
 */
export const getGmailMessage = async (
  emailAccount: any,
  messageId: string
): Promise<any> => {
  try {
    const oauth2Client = createOAuth2Client();
    const accessToken = decrypt(emailAccount.oauthAccessToken);

    oauth2Client.setCredentials({
      access_token: accessToken
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const response = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full'
    });

    return response.data;
  } catch (error: any) {
    logger.error('Failed to get Gmail message', { error: error.message, messageId });
    throw new Error(`Gmail API error: ${error.message}`);
  }
};

/**
 * Check if Gmail message is in spam
 */
export const isInGmailSpam = async (
  emailAccount: any,
  messageId: string
): Promise<boolean> => {
  try {
    const message = await getGmailMessage(emailAccount, messageId);
    return message.labelIds?.includes('SPAM') || false;
  } catch (error) {
    return false;
  }
};
