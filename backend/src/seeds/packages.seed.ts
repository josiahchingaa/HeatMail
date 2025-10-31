import { Package } from '../models';
import logger from '../utils/logger';

/**
 * Seed pricing packages
 */
export const seedPackages = async () => {
  try {
    logger.info('Seeding packages...');

    const packages = [
      {
        name: 'Free',
        price: 0,
        billingCycle: 'monthly' as const,
        maxMailboxes: 3,
        maxEmailsPerDayPerMailbox: 20,
        features: [
          'Up to 3 mailboxes',
          '20 emails per day per mailbox',
          'Basic warmup templates',
          'Email health score',
          'Basic support'
        ],
        isActive: true
      },
      {
        name: 'Starter',
        price: 29,
        billingCycle: 'monthly' as const,
        maxMailboxes: 10,
        maxEmailsPerDayPerMailbox: 40,
        features: [
          'Up to 10 mailboxes',
          '40 emails per day per mailbox',
          'All warmup templates',
          'Email health score & history',
          'Priority support',
          'Auto-reply conversations',
          'Gradual volume increase'
        ],
        isActive: true
      },
      {
        name: 'Pro',
        price: 79,
        billingCycle: 'monthly' as const,
        maxMailboxes: 50,
        maxEmailsPerDayPerMailbox: 50,
        features: [
          'Up to 50 mailboxes',
          '50 emails per day per mailbox',
          'All warmup templates',
          'Advanced health analytics',
          'Priority support',
          'Auto-reply conversations',
          'Gradual volume increase',
          'Custom templates',
          'API access'
        ],
        isActive: true
      },
      {
        name: 'Enterprise',
        price: 199,
        billingCycle: 'monthly' as const,
        maxMailboxes: 200,
        maxEmailsPerDayPerMailbox: 50,
        features: [
          'Up to 200 mailboxes',
          '50 emails per day per mailbox',
          'All warmup templates',
          'Advanced health analytics',
          'Dedicated support',
          'Auto-reply conversations',
          'Gradual volume increase',
          'Custom templates',
          'API access',
          'White-label option',
          'Domain-wide delegation',
          'Custom integrations'
        ],
        isActive: true
      }
    ];

    for (const pkgData of packages) {
      const [pkg, created] = await Package.findOrCreate({
        where: { name: pkgData.name },
        defaults: pkgData
      });

      if (created) {
        logger.info(` Package created: ${pkg.name} ($${pkg.price}/${pkg.billingCycle})`);
      } else {
        logger.info(`Package already exists: ${pkg.name}`);
      }
    }

    logger.info(' Packages seeded successfully');
  } catch (error: any) {
    logger.error('Failed to seed packages', { error: error.message });
    throw error;
  }
};

// Run seed if this file is executed directly
if (require.main === module) {
  const { sequelize } = require('../config/database');

  sequelize.authenticate()
    .then(() => seedPackages())
    .then(() => {
      logger.info('Packages seed completed');
      process.exit(0);
    })
    .catch((error: any) => {
      logger.error('Packages seed failed', { error: error.message });
      process.exit(1);
    });
}
