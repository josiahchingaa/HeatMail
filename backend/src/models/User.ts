import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import bcrypt from 'bcryptjs';

interface UserAttributes {
  id: number;
  email: string;
  password: string;
  role: 'admin' | 'user';

  // Personal Information
  firstName?: string;
  lastName?: string;
  company?: string;
  country?: string;
  city?: string;
  occupation?: string;
  phoneNumber?: string;

  // Package & Subscription
  packageId?: number;
  subscriptionStatus: 'free' | 'trial' | 'active' | 'cancelled';
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;

  // Account Status
  isActive: boolean;
  isEmailVerified: boolean;
  emailVerificationToken?: string;

  // Usage Limits
  maxMailboxes: number;
  maxEmailsPerDay: number;

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
  lastLoginAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'role' | 'subscriptionStatus' | 'isActive' | 'isEmailVerified' | 'maxMailboxes' | 'maxEmailsPerDay'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public email!: string;
  public password!: string;
  public role!: 'admin' | 'user';

  public firstName?: string;
  public lastName?: string;
  public company?: string;
  public country?: string;
  public city?: string;
  public occupation?: string;
  public phoneNumber?: string;

  public packageId?: number;
  public subscriptionStatus!: 'free' | 'trial' | 'active' | 'cancelled';
  public subscriptionStartDate?: Date;
  public subscriptionEndDate?: Date;

  public isActive!: boolean;
  public isEmailVerified!: boolean;
  public emailVerificationToken?: string;

  public maxMailboxes!: number;
  public maxEmailsPerDay!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public lastLoginAt?: Date;

  // Helper methods
  public async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  public toJSON(): any {
    const values = Object.assign({}, this.get());
    delete values.password;
    delete values.emailVerificationToken;
    return values;
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    role: {
      type: DataTypes.STRING(50),
      defaultValue: 'user',
      validate: {
        isIn: [['admin', 'user']]
      }
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    company: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    occupation: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    phoneNumber: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    packageId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    subscriptionStatus: {
      type: DataTypes.STRING(50),
      defaultValue: 'free',
      validate: {
        isIn: [['free', 'trial', 'active', 'cancelled']]
      }
    },
    subscriptionStartDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    subscriptionEndDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    emailVerificationToken: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    maxMailboxes: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    maxEmailsPerDay: {
      type: DataTypes.INTEGER,
      defaultValue: 20
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'Users',
    timestamps: true,
    hooks: {
      beforeCreate: async (user: User) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user: User) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  }
);

export default User;
