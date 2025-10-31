import { sequelize } from '../config/database';
import { seedPackages } from './packages.seed';
import { seedAdmin } from './admin.seed';
import { seedTemplates } from './templates.seed';
import logger from '../utils/logger';

/**
 * Run all seeds in order
 */
const runAllSeeds = async () => {
  try {
    logger.info('<1 Starting database seeding...');

    // Test connection
    await sequelize.authenticate();
    logger.info(' Database connection established');

    // Run seeds in order
    logger.info('\n=æ Seeding packages...');
    await seedPackages();

    logger.info('\n=d Seeding admin user...');
    await seedAdmin();

    logger.info('\n=ç Seeding email templates...');
    await seedTemplates();

    logger.info('\n<‰ All seeds completed successfully!');
    process.exit(0);
  } catch (error: any) {
    logger.error('Seeding failed', { error: error.message, stack: error.stack });
    process.exit(1);
  }
};

// Run if this file is executed directly
if (require.main === module) {
  runAllSeeds();
}

export default runAllSeeds;
