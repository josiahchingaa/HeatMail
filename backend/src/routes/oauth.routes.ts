import { Router } from 'express';
import {
  initiateGoogleOAuth,
  googleCallback,
  initiateMicrosoftOAuth,
  microsoftCallback
} from '../controllers/oauth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Google OAuth routes
router.get('/google', authenticate, initiateGoogleOAuth);
router.get('/google/callback', googleCallback);

// Microsoft OAuth routes
router.get('/microsoft', authenticate, initiateMicrosoftOAuth);
router.get('/microsoft/callback', microsoftCallback);

export default router;
