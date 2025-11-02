import { Request, Response } from 'express';
import { registerUser } from '../services/auth/register';
import { loginUser } from '../services/auth/login';
import { User } from '../models';
import { getAuthUrl, handleCallback } from '../services/oauth/google';
import jwt from 'jsonwebtoken';

export const register = async (req: Request, res: Response) => {
  try {
    const result = await registerUser(req.body);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Registration failed'
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const result = await loginUser(req.body);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: error.message || 'Login failed'
    });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const user = await User.findByPk(req.user.id, {
      include: [
        {
          association: 'package',
          attributes: ['id', 'name', 'maxMailboxes', 'maxEmailsPerDayPerMailbox', 'features']
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user.toJSON()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch user data'
    });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    // For now, just return current user with new token
    // In production, implement proper refresh token logic
    const result = await loginUser(req.body);
    res.status(200).json({
      success: true,
      message: 'Token refreshed',
      data: result
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: error.message || 'Token refresh failed'
    });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { firstName, lastName, company, country, city, occupation, phoneNumber } = req.body;

    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (company !== undefined) user.company = company;
    if (country !== undefined) user.country = country;
    if (city !== undefined) user.city = city;
    if (occupation !== undefined) user.occupation = occupation;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user.toJSON()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Profile update failed'
    });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { currentPassword, newPassword } = req.body;
    const bcrypt = require('bcryptjs');

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password (will be hashed by bcrypt hook)
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Password change failed'
    });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    // In a stateless JWT setup, logout is handled client-side by removing the token
    // But we can log the logout action

    if (req.user) {
      const { AuditLog } = await import('../models');
      await AuditLog.create({
        userId: req.user.id,
        userEmail: req.user.email,
        action: 'user_logged_out',
        entity: 'User',
        entityId: req.user.id,
        details: {
          logoutAt: new Date()
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Logout failed'
    });
  }
};

/**
 * Initiate Google OAuth flow
 */
export const googleAuth = async (req: Request, res: Response) => {
  try {
    const isSignup = req.query.signup === 'true';
    const state = JSON.stringify({ isSignup });
    const authUrl = getAuthUrl(state);

    res.redirect(authUrl);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Google OAuth initialization failed'
    });
  }
};

/**
 * Handle Google OAuth callback
 */
export const googleCallback = async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;

    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
    }

    // Exchange code for tokens and get user email
    const { email, accessToken, refreshToken, expiryDate } = await handleCallback(code as string);

    // Parse state to determine if this is signup or login
    const stateData = state ? JSON.parse(state as string) : {};
    const isSignup = stateData.isSignup === true;

    let user = await User.findOne({ where: { email } });

    if (!user && isSignup) {
      // Create new user account
      const bcrypt = require('bcryptjs');
      const randomPassword = Math.random().toString(36).slice(-12);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      // Extract name from email
      const emailName = email.split('@')[0];
      const firstName = emailName.split('.')[0] || emailName;
      const lastName = emailName.split('.')[1] || '';

      user = await User.create({
        email,
        password: hashedPassword,
        firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1),
        lastName: lastName ? lastName.charAt(0).toUpperCase() + lastName.slice(1) : '',
        isEmailVerified: true,
        emailVerificationToken: null,
        status: 'active'
      });
    } else if (!user) {
      // User doesn't exist and not signing up
      return res.redirect(`${process.env.FRONTEND_URL}/register?error=account_not_found`);
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  } catch (error: any) {
    console.error('Google OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=${encodeURIComponent(error.message)}`);
  }
};
