import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import adminRoutes from './admin.routes';
import emailAccountRoutes from './emailAccount.routes';
import oauthRoutes from './oauth.routes';
import templateRoutes from './template.routes';

const router = Router();

/**
 * Mount all routes
 */
router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/admin', adminRoutes);
router.use('/email-accounts', emailAccountRoutes);
router.use('/oauth', oauthRoutes);
router.use('/templates', templateRoutes);

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'HeatMail API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

export default router;
