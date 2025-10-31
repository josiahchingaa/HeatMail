import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { sequelize } from './config/database';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { initializeWorkers } from './workers';
import logger from './utils/logger';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 5001;

/**
 * Middleware
 */
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
})); // CORS
app.use(express.json()); // JSON body parser
app.use(express.urlencoded({ extended: true })); // URL-encoded body parser
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } })); // HTTP request logger

/**
 * Routes
 */
app.use('/api', routes);

/**
 * Root endpoint
 */
app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Welcome to HeatMail API',
    version: '1.0.0',
    documentation: '/api/health'
  });
});

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

/**
 * Error handler (must be last)
 */
app.use(errorHandler);

/**
 * Initialize database and start server
 */
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    logger.info(' Database connection established');

    // Sync models (don't use force:true in production)
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: false });
      logger.info(' Database models synchronized');
    }

    // Initialize background workers (requires Redis - will skip if Redis unavailable)
    try {
      // Add timeout for Redis connection attempt
      await Promise.race([
        initializeWorkers(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Redis connection timeout')), 5000))
      ]);
      logger.info('✅ Workers initialized successfully');
    } catch (error: any) {
      logger.warn('⚠️  Workers disabled - Redis not available. API will work but background jobs will not run.');
      logger.warn('   To enable workers: Install Redis and start redis-server');
    }

    // Start Express server
    app.listen(PORT, () => {
      logger.info(`=� HeatMail API server running on port ${PORT}`);
      logger.info(`< Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`=� Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
      logger.info(`=% HeatMail is ready to warm up your emails!`);
    });
  } catch (error: any) {
    logger.error('Failed to start server', { error: error.message, stack: error.stack });
    process.exit(1);
  }
};

// Start the server
startServer();

/**
 * Graceful shutdown
 */
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');

  try {
    await sequelize.close();
    logger.info(' Database connection closed');

    process.exit(0);
  } catch (error: any) {
    logger.error('Error during graceful shutdown', { error: error.message });
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');

  try {
    await sequelize.close();
    logger.info(' Database connection closed');

    process.exit(0);
  } catch (error: any) {
    logger.error('Error during graceful shutdown', { error: error.message });
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Promise Rejection', { reason: reason?.message || reason, stack: reason?.stack });
  process.exit(1);
});

export default app;
