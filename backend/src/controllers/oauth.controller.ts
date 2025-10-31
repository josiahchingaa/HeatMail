import { Request, Response } from 'express';
import { getAuthUrl as getGoogleAuthUrl, handleCallback as handleGoogleCallback } from '../services/oauth/google';
import { getAuthUrl as getMicrosoftAuthUrl, handleCallback as handleMicrosoftCallback } from '../services/oauth/microsoft';
import { EmailAccount, AuditLog } from '../models';
import { encrypt } from '../utils/encryption';
import logger from '../utils/logger';

/**
 * Redirect to Google OAuth
 */
export const initiateGoogleOAuth = (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const state = userId ? Buffer.from(JSON.stringify({ userId })).toString('base64') : '';

    const authUrl = getGoogleAuthUrl(state);

    res.json({
      success: true,
      authUrl
    });
  } catch (error: any) {
    logger.error('Failed to initiate Google OAuth', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to initiate Google OAuth'
    });
  }
};

/**
 * Handle Google OAuth callback
 */
export const googleCallback = async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Authorization code is required'
      });
    }

    // Decode state to get userId
    let userId: number | undefined;
    if (state && typeof state === 'string') {
      try {
        const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
        userId = decoded.userId;
      } catch (error) {
        logger.warn('Failed to decode OAuth state', { state });
      }
    }

    // Exchange code for tokens
    const result = await handleGoogleCallback(code);

    // Create or update email account
    if (userId) {
      const existingAccount = await EmailAccount.findOne({
        where: { email: result.email, userId }
      });

      if (existingAccount) {
        // Update existing account
        existingAccount.oauthAccessToken = result.accessToken;
        existingAccount.oauthRefreshToken = result.refreshToken;
        existingAccount.oauthTokenExpiry = result.expiryDate;
        existingAccount.status = 'active';
        existingAccount.lastTestedAt = new Date();
        await existingAccount.save();

        logger.info('Gmail account updated', { email: result.email, userId });
      } else {
        // Create new account
        await EmailAccount.create({
          userId,
          email: result.email,
          provider: 'gmail',
          connectionType: 'oauth',
          oauthAccessToken: result.accessToken,
          oauthRefreshToken: result.refreshToken,
          oauthTokenExpiry: result.expiryDate,
          status: 'active',
          isWarmupEnabled: true,
          emailsPerDay: 20
        });

        logger.info('Gmail account added', { email: result.email, userId });
      }

      // Create audit log
      await AuditLog.create({
        userId,
        action: 'email_account_connected',
        entity: 'EmailAccount',
        details: {
          email: result.email,
          provider: 'gmail',
          connectionType: 'oauth'
        }
      });
    }

    // Redirect to frontend success page
    res.redirect(`${process.env.FRONTEND_URL}/dashboard/mailboxes?success=true&email=${result.email}`);
  } catch (error: any) {
    logger.error('Google OAuth callback failed', { error: error.message });
    res.redirect(`${process.env.FRONTEND_URL}/dashboard/mailboxes?error=${encodeURIComponent(error.message)}`);
  }
};

/**
 * Redirect to Microsoft OAuth
 */
export const initiateMicrosoftOAuth = (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const state = userId ? Buffer.from(JSON.stringify({ userId })).toString('base64') : '';

    const authUrl = getMicrosoftAuthUrl(state);

    res.json({
      success: true,
      authUrl
    });
  } catch (error: any) {
    logger.error('Failed to initiate Microsoft OAuth', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to initiate Microsoft OAuth'
    });
  }
};

/**
 * Handle Microsoft OAuth callback
 */
export const microsoftCallback = async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Authorization code is required'
      });
    }

    // Decode state to get userId
    let userId: number | undefined;
    if (state && typeof state === 'string') {
      try {
        const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
        userId = decoded.userId;
      } catch (error) {
        logger.warn('Failed to decode OAuth state', { state });
      }
    }

    // Exchange code for tokens
    const result = await handleMicrosoftCallback(code);

    // Create or update email account
    if (userId) {
      const existingAccount = await EmailAccount.findOne({
        where: { email: result.email, userId }
      });

      if (existingAccount) {
        // Update existing account
        existingAccount.oauthAccessToken = result.accessToken;
        existingAccount.oauthRefreshToken = result.refreshToken;
        existingAccount.oauthTokenExpiry = result.expiryDate;
        existingAccount.status = 'active';
        existingAccount.lastTestedAt = new Date();
        await existingAccount.save();

        logger.info('Outlook account updated', { email: result.email, userId });
      } else {
        // Create new account
        await EmailAccount.create({
          userId,
          email: result.email,
          provider: 'outlook',
          connectionType: 'oauth',
          oauthAccessToken: result.accessToken,
          oauthRefreshToken: result.refreshToken,
          oauthTokenExpiry: result.expiryDate,
          status: 'active',
          isWarmupEnabled: true,
          emailsPerDay: 20
        });

        logger.info('Outlook account added', { email: result.email, userId });
      }

      // Create audit log
      await AuditLog.create({
        userId,
        action: 'email_account_connected',
        entity: 'EmailAccount',
        details: {
          email: result.email,
          provider: 'outlook',
          connectionType: 'oauth'
        }
      });
    }

    // Redirect to frontend success page
    res.redirect(`${process.env.FRONTEND_URL}/dashboard/mailboxes?success=true&email=${result.email}`);
  } catch (error: any) {
    logger.error('Microsoft OAuth callback failed', { error: error.message });
    res.redirect(`${process.env.FRONTEND_URL}/dashboard/mailboxes?error=${encodeURIComponent(error.message)}`);
  }
};
