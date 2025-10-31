import { Router } from 'express';
import * as templateController from '../controllers/template.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

/**
 * @route   GET /api/templates
 * @desc    Get all templates with pagination and filters
 * @access  Private
 */
router.get('/', authenticate, templateController.getAll);

/**
 * @route   GET /api/templates/categories
 * @desc    Get template categories and counts
 * @access  Private
 */
router.get('/categories', authenticate, templateController.getCategories);

/**
 * @route   GET /api/templates/stats
 * @desc    Get template statistics
 * @access  Private (Admin)
 */
router.get('/stats', authenticate, requireAdmin, templateController.getStats);

/**
 * @route   GET /api/templates/random
 * @desc    Get random initial template
 * @access  Private
 */
router.get('/random', authenticate, templateController.getRandom);

/**
 * @route   GET /api/templates/:id
 * @desc    Get single template by ID
 * @access  Private
 */
router.get('/:id', authenticate, templateController.getOne);

/**
 * @route   GET /api/templates/:id/reply
 * @desc    Get random reply template for a given template
 * @access  Private
 */
router.get('/:id/reply', authenticate, templateController.getRandomReply);

/**
 * @route   POST /api/templates
 * @desc    Create new template
 * @access  Private (Admin)
 */
router.post('/', authenticate, requireAdmin, templateController.create);

/**
 * @route   PUT /api/templates/:id
 * @desc    Update template
 * @access  Private (Admin)
 */
router.put('/:id', authenticate, requireAdmin, templateController.update);

/**
 * @route   DELETE /api/templates/:id
 * @desc    Delete template
 * @access  Private (Admin)
 */
router.delete('/:id', authenticate, requireAdmin, templateController.remove);

export default router;
