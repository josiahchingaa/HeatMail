import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/user/dashboard
 * @desc    Get user dashboard overview
 * @access  Private
 */
router.get('/dashboard', userController.getDashboard);

/**
 * @route   GET /api/user/mailboxes
 * @desc    Get user's mailboxes with health details
 * @access  Private
 */
router.get('/mailboxes', userController.getMailboxes);

/**
 * @route   GET /api/user/health-history/:id
 * @desc    Get mailbox health history
 * @access  Private
 */
router.get('/health-history/:id', userController.getHealthHistory);

/**
 * @route   GET /api/user/activity
 * @desc    Get user's activity log
 * @access  Private
 */
router.get('/activity', userController.getActivity);

/**
 * @route   GET /api/user/stats
 * @desc    Get user statistics
 * @access  Private
 */
router.get('/stats', userController.getStats);

export default router;
