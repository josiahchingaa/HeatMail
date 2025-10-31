import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// All routes require authentication and admin role
router.use(authenticate, requireAdmin);

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin dashboard overview
 * @access  Private (Admin)
 */
router.get('/dashboard', adminController.getDashboard);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with pagination and search
 * @access  Private (Admin)
 */
router.get('/users', adminController.getUsers);

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get single user details
 * @access  Private (Admin)
 */
router.get('/users/:id', adminController.getUser);

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update user details
 * @access  Private (Admin)
 */
router.put('/users/:id', adminController.updateUser);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete user account
 * @access  Private (Admin)
 */
router.delete('/users/:id', adminController.deleteUser);

/**
 * @route   GET /api/admin/mailboxes
 * @desc    Get all mailboxes (admin view)
 * @access  Private (Admin)
 */
router.get('/mailboxes', adminController.getMailboxes);

/**
 * @route   GET /api/admin/mailboxes/:id
 * @desc    Get single mailbox details
 * @access  Private (Admin)
 */
router.get('/mailboxes/:id', adminController.getMailbox);

/**
 * @route   PUT /api/admin/mailboxes/:id
 * @desc    Update mailbox settings
 * @access  Private (Admin)
 */
router.put('/mailboxes/:id', adminController.updateMailbox);

/**
 * @route   POST /api/admin/mailboxes/:id/pause
 * @desc    Pause warmup for mailbox
 * @access  Private (Admin)
 */
router.post('/mailboxes/:id/pause', adminController.pauseMailbox);

/**
 * @route   POST /api/admin/mailboxes/:id/resume
 * @desc    Resume warmup for mailbox
 * @access  Private (Admin)
 */
router.post('/mailboxes/:id/resume', adminController.resumeMailbox);

/**
 * @route   GET /api/admin/stats
 * @desc    Get platform statistics
 * @access  Private (Admin)
 */
router.get('/stats', adminController.getStats);

export default router;
