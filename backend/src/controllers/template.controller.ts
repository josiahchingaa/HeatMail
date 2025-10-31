import { Request, Response } from 'express';
import { WarmupTemplate } from '../models';
import { Op } from 'sequelize';
import logger from '../utils/logger';

/**
 * Get all templates with pagination and filters
 */
export const getAll = async (req: Request, res: Response) => {
  try {
    const {
      limit = 50,
      offset = 0,
      category,
      language = 'en',
      isReply
    } = req.query;

    const where: any = {
      language,
      isActive: true
    };

    // Filter by category
    if (category) {
      where.category = category;
    }

    // Filter by reply templates
    if (isReply !== undefined) {
      if (isReply === 'true') {
        where.replyToTemplateId = { [Op.ne]: null };
      } else {
        where.replyToTemplateId = null;
      }
    }

    const { count, rows } = await WarmupTemplate.findAndCountAll({
      where,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      order: [['category', 'ASC'], ['id', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        total: count,
        templates: rows
      }
    });
  } catch (error: any) {
    logger.error('Failed to get templates', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get templates'
    });
  }
};

/**
 * Get single template by ID
 */
export const getOne = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const template = await WarmupTemplate.findByPk(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Get reply templates for this template
    const replyTemplates = await WarmupTemplate.findAll({
      where: {
        replyToTemplateId: id,
        isActive: true
      }
    });

    res.json({
      success: true,
      data: {
        template,
        replyTemplates
      }
    });
  } catch (error: any) {
    logger.error('Failed to get template', { error: error.message, templateId: req.params.id });
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get template'
    });
  }
};

/**
 * Get random initial template (for warmup emails)
 */
export const getRandom = async (req: Request, res: Response) => {
  try {
    const { category, language = 'en' } = req.query;

    const where: any = {
      language,
      isActive: true,
      replyToTemplateId: null // Only initial templates
    };

    if (category) {
      where.category = category;
    }

    const templates = await WarmupTemplate.findAll({ where });

    if (templates.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No templates found'
      });
    }

    // Select random template
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];

    // Update usage counter
    randomTemplate.usageCount += 1;
    await randomTemplate.save();

    res.json({
      success: true,
      data: randomTemplate
    });
  } catch (error: any) {
    logger.error('Failed to get random template', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get random template'
    });
  }
};

/**
 * Get random reply template for a given template
 */
export const getRandomReply = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const replyTemplates = await WarmupTemplate.findAll({
      where: {
        replyToTemplateId: id,
        isActive: true
      }
    });

    if (replyTemplates.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No reply templates found'
      });
    }

    // Select random reply template
    const randomReply = replyTemplates[Math.floor(Math.random() * replyTemplates.length)];

    // Update usage counter
    randomReply.usageCount += 1;
    await randomReply.save();

    res.json({
      success: true,
      data: randomReply
    });
  } catch (error: any) {
    logger.error('Failed to get random reply template', { error: error.message, templateId: req.params.id });
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get random reply template'
    });
  }
};

/**
 * Create new template (admin only)
 */
export const create = async (req: Request, res: Response) => {
  try {
    const {
      category,
      subject,
      body,
      language = 'en',
      replyToTemplateId,
      variables
    } = req.body;

    // Validate required fields
    if (!category || !subject || !body) {
      return res.status(400).json({
        success: false,
        message: 'Category, subject, and body are required'
      });
    }

    // Validate category
    const validCategories = ['business', 'networking', 'feedback', 'collaboration', 'casual'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }

    // If this is a reply template, verify parent template exists
    if (replyToTemplateId) {
      const parentTemplate = await WarmupTemplate.findByPk(replyToTemplateId);
      if (!parentTemplate) {
        return res.status(400).json({
          success: false,
          message: 'Parent template not found'
        });
      }
    }

    const template = await WarmupTemplate.create({
      category,
      subject,
      body,
      language,
      replyToTemplateId: replyToTemplateId || null,
      variables: variables || [],
      isActive: true,
      usageCount: 0
    });

    logger.info('Template created', {
      templateId: template.id,
      category: template.category,
      createdBy: req.user!.email
    });

    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: template
    });
  } catch (error: any) {
    logger.error('Failed to create template', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create template'
    });
  }
};

/**
 * Update template (admin only)
 */
export const update = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      category,
      subject,
      body,
      language,
      replyToTemplateId,
      variables,
      isActive
    } = req.body;

    const template = await WarmupTemplate.findByPk(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Update fields
    if (category !== undefined) {
      const validCategories = ['business', 'networking', 'feedback', 'collaboration', 'casual'];
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category'
        });
      }
      template.category = category;
    }

    if (subject !== undefined) template.subject = subject;
    if (body !== undefined) template.body = body;
    if (language !== undefined) template.language = language;
    if (variables !== undefined) template.variables = variables;
    if (isActive !== undefined) template.isActive = isActive;

    if (replyToTemplateId !== undefined) {
      if (replyToTemplateId) {
        const parentTemplate = await WarmupTemplate.findByPk(replyToTemplateId);
        if (!parentTemplate) {
          return res.status(400).json({
            success: false,
            message: 'Parent template not found'
          });
        }
      }
      template.replyToTemplateId = replyToTemplateId;
    }

    await template.save();

    logger.info('Template updated', {
      templateId: template.id,
      updatedBy: req.user!.email
    });

    res.json({
      success: true,
      message: 'Template updated successfully',
      data: template
    });
  } catch (error: any) {
    logger.error('Failed to update template', { error: error.message, templateId: req.params.id });
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update template'
    });
  }
};

/**
 * Delete template (admin only)
 */
export const remove = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const template = await WarmupTemplate.findByPk(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Check if this template has reply templates
    const replyTemplates = await WarmupTemplate.count({
      where: { replyToTemplateId: id }
    });

    if (replyTemplates > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete template that has reply templates. Delete reply templates first.'
      });
    }

    await template.destroy();

    logger.info('Template deleted', {
      templateId: id,
      deletedBy: req.user!.email
    });

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error: any) {
    logger.error('Failed to delete template', { error: error.message, templateId: req.params.id });
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete template'
    });
  }
};

/**
 * Get template categories and counts
 */
export const getCategories = async (req: Request, res: Response) => {
  try {
    const { language = 'en' } = req.query;

    const categories = ['business', 'networking', 'feedback', 'collaboration', 'casual'];

    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const count = await WarmupTemplate.count({
          where: {
            category,
            language,
            isActive: true,
            replyToTemplateId: null // Only initial templates
          }
        });

        const replyCount = await WarmupTemplate.count({
          where: {
            category,
            language,
            isActive: true,
            replyToTemplateId: { [Op.ne]: null } // Only reply templates
          }
        });

        return {
          category,
          initialTemplates: count,
          replyTemplates: replyCount,
          total: count + replyCount
        };
      })
    );

    res.json({
      success: true,
      data: categoriesWithCounts
    });
  } catch (error: any) {
    logger.error('Failed to get template categories', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get template categories'
    });
  }
};

/**
 * Get template statistics
 */
export const getStats = async (req: Request, res: Response) => {
  try {
    const totalTemplates = await WarmupTemplate.count({
      where: { isActive: true }
    });

    const initialTemplates = await WarmupTemplate.count({
      where: {
        isActive: true,
        replyToTemplateId: null
      }
    });

    const replyTemplates = await WarmupTemplate.count({
      where: {
        isActive: true,
        replyToTemplateId: { [Op.ne]: null }
      }
    });

    // Most used templates
    const mostUsed = await WarmupTemplate.findAll({
      where: { isActive: true },
      order: [['usageCount', 'DESC']],
      limit: 10,
      attributes: ['id', 'category', 'subject', 'usageCount']
    });

    // Least used templates
    const leastUsed = await WarmupTemplate.findAll({
      where: { isActive: true },
      order: [['usageCount', 'ASC']],
      limit: 10,
      attributes: ['id', 'category', 'subject', 'usageCount']
    });

    res.json({
      success: true,
      data: {
        total: totalTemplates,
        initial: initialTemplates,
        replies: replyTemplates,
        mostUsed,
        leastUsed
      }
    });
  } catch (error: any) {
    logger.error('Failed to get template stats', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get template statistics'
    });
  }
};
