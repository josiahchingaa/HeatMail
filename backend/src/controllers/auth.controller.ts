import { Request, Response } from 'express';
import { registerUser } from '../services/auth/register';
import { loginUser } from '../services/auth/login';
import { User } from '../models';

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
