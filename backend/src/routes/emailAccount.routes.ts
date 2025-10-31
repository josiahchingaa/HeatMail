import { Router } from 'express';
import {
  list,
  getOne,
  create,
  update,
  remove,
  testConnection,
  pauseWarmup,
  resumeWarmup
} from '../controllers/emailAccount.controller';
import { authenticate } from '../middleware/auth';
import { connectionTestLimiter } from '../middleware/rateLimiter';

const router = Router();

// All routes require authentication
router.use(authenticate);

// CRUD operations
router.get('/', list);
router.post('/', create);
router.get('/:id', getOne);
router.put('/:id', update);
router.delete('/:id', remove);

// Additional operations
router.post('/:id/test', connectionTestLimiter, testConnection);
router.post('/:id/pause', pauseWarmup);
router.post('/:id/resume', resumeWarmup);

export default router;
