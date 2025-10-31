import { sequelize } from './database';
import logger from '../utils/logger';
// Import all models to ensure they're registered
import '../models';

/**
 * Run database migrations
 * This will create all tables based on the models
 */
const migrate = async () => {
  try {
    logger.info('Starting database migration...');

    // Test connection
    await sequelize.authenticate();
    logger.info('✅ Database connection established');

    // Sync all models (create tables)
    await sequelize.sync({ force: false, alter: true });
    logger.info('✅ Database tables created/updated successfully');

    logger.info('🎉 Migration completed successfully!');
    process.exit(0);
  } catch (error: any) {
    logger.error('Migration failed', { error: error.message, stack: error.stack });
    process.exit(1);
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  migrate();
}

export default migrate;
