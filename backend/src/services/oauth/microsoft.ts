import { Client } from '@microsoft/microsoft-graph-client';
import { ConfidentialClientApplication, AuthorizationUrlRequest, AuthorizationCodeRequest } from '@azure/msal-node';
import { encrypt, decrypt } from '../../utils/encryption';
import logger from '../../utils/logger';

const SCOPES = ['Mail.Send', 'Mail.ReadWrite', 'offline_access'];

/**
 * Create MSAL client
 */
export const createMSALClient = (): ConfidentialClientApplication => {
  const config = {
    auth: {
      clientId: process.env.MICROSOFT_CLIENT_ID || '',
      authority: 'https://login.microsoftonline.com/common',
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || ''
    }
  };

  return new ConfidentialClientApplication(config);
};

/**
 * Get Microsoft OAuth authorization URL
 */
export const getAuthUrl = (state?: string): string => {
  const msalClient = createMSALClient();

  const authCodeUrlParameters: AuthorizationUrlRequest = {
    scopes: SCOPES,
    redirectUri: process.env.MICROSOFT_REDIRECT_URI || '',
    state: state || '',
    prompt: 'consent' // Force consent to get refresh token
  };

  return msalClient.getAuthCodeUrl(authCodeUrlParameters);
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
    const msalClient = createMSALClient();

    const tokenRequest: AuthorizationCodeRequest = {
      code,
      scopes: SCOPES,
      redirectUri: process.env.MICROSOFT_REDIRECT_URI || ''
    };

    const response = await msalClient.acquireTokenByCode(tokenRequest);

    if (!response || !response.accessToken) {
      throw new Error('Failed to obtain access token from Microsoft');
    }

    // Create Graph client to get user email
    const client = Client.init({
      authProvider: (done) => {
        done(null, response.accessToken);
      }
    });

    const user = await client.api('/me').get();
    const email = user.mail || user.userPrincipalName;

    if (!email) {
      throw new Error('Failed to retrieve email address from Microsoft');
    }

    const expiryDate = response.expiresOn || new Date(Date.now() + 3600 * 1000);

    logger.info('Microsoft OAuth callback successful', { email });

    return {
      accessToken: encrypt(response.accessToken),
      refreshToken: encrypt(response.refreshToken || ''),
      expiryDate,
      email
    };
  } catch (error: any) {
    logger.error('Microsoft OAuth callback failed', { error: error.message });
    throw new Error(`Microsoft OAuth error: ${error.message}`);
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
    const msalClient = createMSALClient();
    const refreshToken = decrypt(encryptedRefreshToken);

    const refreshTokenRequest = {
      refreshToken,
      scopes: SCOPES
    };

    const response = await msalClient.acquireTokenByRefreshToken(refreshTokenRequest);

    if (!response || !response.accessToken) {
      throw new Error('Failed to refresh access token');
    }

    const expiryDate = response.expiresOn || new Date(Date.now() + 3600 * 1000);

    logger.info('Microsoft access token refreshed successfully');

    return {
      accessToken: encrypt(response.accessToken),
      expiryDate
    };
  } catch (error: any) {
    logger.error('Failed to refresh Microsoft access token', { error: error.message });
    throw new Error(`Token refresh failed: ${error.message}`);
  }
};

/**
 * Send email via Microsoft Graph API
 */
export const sendEmailViaOutlook = async (
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

    const accessToken = decrypt(emailAccount.oauthAccessToken);

    const client = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      }
    });

    // Create email message
    const email: any = {
      message: {
        subject: message.subject,
        body: {
          contentType: message.html ? 'HTML' : 'Text',
          content: message.html || message.text || ''
        },
        toRecipients: [
          {
            emailAddress: {
              address: message.to
            }
          }
        ],
        internetMessageHeaders: [
          {
            name: 'X-Warmup-Email',
            value: 'true'
          }
        ]
      }
    };

    // Add reply headers if this is a reply
    if (message.inReplyTo) {
      email.message.internetMessageHeaders.push({
        name: 'In-Reply-To',
        value: message.inReplyTo
      });
    }

    if (message.references) {
      email.message.internetMessageHeaders.push({
        name: 'References',
        value: message.references
      });
    }

    // Send email
    const response = await client.api('/me/sendMail').post(email);

    logger.info('Email sent via Microsoft Graph API', {
      from: emailAccount.email,
      to: message.to
    });

    return {
      messageId: response?.id || '',
      success: true
    };
  } catch (error: any) {
    logger.error('Failed to send email via Outlook', {
      error: error.message,
      from: emailAccount.email,
      to: message.to
    });
    throw new Error(`Microsoft Graph API error: ${error.message}`);
  }
};

/**
 * List Outlook messages
 */
export const listOutlookMessages = async (
  emailAccount: any,
  filter?: string,
  top: number = 10
): Promise<any[]> => {
  try {
    // Check if token needs refresh
    if (new Date() >= new Date(emailAccount.oauthTokenExpiry)) {
      const refreshed = await refreshAccessToken(emailAccount.oauthRefreshToken);
      emailAccount.oauthAccessToken = refreshed.accessToken;
      emailAccount.oauthTokenExpiry = refreshed.expiryDate;
      await emailAccount.save();
    }

    const accessToken = decrypt(emailAccount.oauthAccessToken);

    const client = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      }
    });

    let query = client.api('/me/messages').top(top);

    if (filter) {
      query = query.filter(filter);
    }

    const response = await query.get();

    return response.value || [];
  } catch (error: any) {
    logger.error('Failed to list Outlook messages', { error: error.message });
    throw new Error(`Microsoft Graph API error: ${error.message}`);
  }
};

/**
 * Archive Outlook message (move to archive folder)
 */
export const archiveOutlookMessage = async (
  emailAccount: any,
  messageId: string
): Promise<void> => {
  try {
    const accessToken = decrypt(emailAccount.oauthAccessToken);

    const client = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      }
    });

    // Get Archive folder ID
    const folders = await client.api('/me/mailFolders').get();
    const archiveFolder = folders.value.find((f: any) => f.displayName === 'Archive');

    if (!archiveFolder) {
      logger.warn('Archive folder not found, skipping archive', { messageId });
      return;
    }

    // Move message to archive
    await client.api(`/me/messages/${messageId}/move`).post({
      destinationId: archiveFolder.id
    });

    logger.info('Outlook message archived', { messageId });
  } catch (error: any) {
    logger.error('Failed to archive Outlook message', { error: error.message, messageId });
    throw new Error(`Microsoft Graph API error: ${error.message}`);
  }
};

/**
 * Get Outlook message by ID
 */
export const getOutlookMessage = async (
  emailAccount: any,
  messageId: string
): Promise<any> => {
  try {
    const accessToken = decrypt(emailAccount.oauthAccessToken);

    const client = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      }
    });

    const message = await client.api(`/me/messages/${messageId}`).get();

    return message;
  } catch (error: any) {
    logger.error('Failed to get Outlook message', { error: error.message, messageId });
    throw new Error(`Microsoft Graph API error: ${error.message}`);
  }
};

/**
 * Check if Outlook message is in junk folder
 */
export const isInOutlookJunk = async (
  emailAccount: any,
  messageId: string
): Promise<boolean> => {
  try {
    const message = await getOutlookMessage(emailAccount, messageId);
    return message.parentFolderId?.includes('junkemail') || false;
  } catch (error) {
    return false;
  }
};
