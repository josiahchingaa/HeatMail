import { User, Package } from '../models';
import logger from '../utils/logger';

/**
 * Seed default admin user
 */
export const seedAdmin = async () => {
  try {
    logger.info('Seeding admin user...');

    // Get Enterprise package (assuming it exists)
    const enterprisePackage = await Package.findOne({
      where: { name: 'Enterprise' }
    });

    if (!enterprisePackage) {
      logger.warn('Enterprise package not found, admin will be created without package');
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      where: { email: 'admin@heatmail.io' }
    });

    if (existingAdmin) {
      logger.info('Admin user already exists, skipping...');
      return existingAdmin;
    }

    // Create admin user
    const admin = await User.create({
      email: 'admin@heatmail.io',
      password: 'Admin@123456', // Will be hashed by bcrypt hook
      role: 'admin',
      firstName: 'Admin',
      lastName: 'HeatMail',
      company: 'HeatMail',
      isActive: true,
      isEmailVerified: true,
      packageId: enterprisePackage?.id || null,
      maxMailboxes: 9999,
      maxEmailsPerDay: 999999
    });

    logger.info(' Admin user created successfully', {
      email: admin.email,
      role: admin.role
    });

    logger.warn('   IMPORTANT: Change the default admin password immediately!');
    logger.info('   Default credentials:');
    logger.info('   Email: admin@heatmail.io');
    logger.info('   Password: Admin@123456');

    return admin;
  } catch (error: any) {
    logger.error('Failed to seed admin user', { error: error.message });
    throw error;
  }
};

// Run seed if this file is executed directly
if (require.main === module) {
  const { sequelize } = require('../config/database');

  sequelize.authenticate()
    .then(() => seedAdmin())
    .then(() => {
      logger.info('Admin seed completed');
      process.exit(0);
    })
    .catch((error: any) => {
      logger.error('Admin seed failed', { error: error.message });
      process.exit(1);
    });
}
