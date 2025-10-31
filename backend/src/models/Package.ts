import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface PackageAttributes {
  id: number;
  name: string;
  description?: string;

  // Pricing (to be set later)
  price?: number;
  billingCycle?: 'monthly' | 'yearly';

  // Limits
  maxMailboxes: number;
  maxEmailsPerDayPerMailbox: number;

  // Features (JSON - flexible)
  features: {
    advancedAnalytics?: boolean;
    apiAccess?: boolean;
    prioritySupport?: boolean;
    whiteLabel?: boolean;
    customTemplates?: boolean;
    domainWideDelegation?: boolean;
  };

  // Display
  displayOrder: number;
  isActive: boolean;

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

interface PackageCreationAttributes extends Optional<PackageAttributes, 'id' | 'displayOrder' | 'isActive' | 'features'> {}

class Package extends Model<PackageAttributes, PackageCreationAttributes> implements PackageAttributes {
  public id!: number;
  public name!: string;
  public description?: string;

  public price?: number;
  public billingCycle?: 'monthly' | 'yearly';

  public maxMailboxes!: number;
  public maxEmailsPerDayPerMailbox!: number;

  public features!: {
    advancedAnalytics?: boolean;
    apiAccess?: boolean;
    prioritySupport?: boolean;
    whiteLabel?: boolean;
    customTemplates?: boolean;
    domainWideDelegation?: boolean;
  };

  public displayOrder!: number;
  public isActive!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Package.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    billingCycle: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        isIn: [['monthly', 'yearly']]
      }
    },
    maxMailboxes: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    maxEmailsPerDayPerMailbox: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    features: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  },
  {
    sequelize,
    tableName: 'Packages',
    timestamps: true
  }
);

export default Package;
