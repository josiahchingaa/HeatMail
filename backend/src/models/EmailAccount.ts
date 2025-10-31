import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface EmailAccountAttributes {
  id: number;
  userId: number;

  // Email Info
  email: string;
  provider: 'gmail' | 'outlook' | 'custom';
  connectionType: 'oauth' | 'smtp' | 'appPassword' | 'domainWide';

  // Connection Credentials (Encrypted)
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string;
  imapHost?: string;
  imapPort?: number;
  imapUsername?: string;
  imapPassword?: string;

  // OAuth Tokens (Encrypted)
  oauthAccessToken?: string;
  oauthRefreshToken?: string;
  oauthTokenExpiry?: Date;

  // Domain-Wide Delegation
  isDomainWide: boolean;
  domainName?: string;
  serviceAccountJson?: string;

  // Status
  status: 'active' | 'paused' | 'error' | 'disconnected';
  lastError?: string;
  lastTestedAt?: Date;

  // Warmup Settings
  isWarmupEnabled: boolean;
  emailsPerDay: number;

  // Gradual Increase Settings
  useGradualIncrease: boolean;
  gradualStartVolume: number;
  gradualTargetVolume: number;
  gradualDurationWeeks: number;
  gradualStartDate?: Date;
  gradualCurrentVolume?: number;

  // Daily Counters
  dailyEmailsSent: number;
  dailyEmailsReceived: number;
  lastResetDate: Date;

  // Health Score Metrics
  healthScore: number;
  inboxRate: number;
  spamRate: number;
  openRate: number;
  replyRate: number;
  bounceRate: number;
  lastHealthUpdate?: Date;

  // Statistics
  totalEmailsSent: number;
  totalEmailsReceived: number;
  totalRepliesSent: number;
  totalConversations: number;

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

interface EmailAccountCreationAttributes extends Optional<EmailAccountAttributes,
  'id' | 'isDomainWide' | 'status' | 'isWarmupEnabled' | 'emailsPerDay' |
  'useGradualIncrease' | 'gradualStartVolume' | 'gradualTargetVolume' |
  'gradualDurationWeeks' | 'dailyEmailsSent' | 'dailyEmailsReceived' | 'lastResetDate' |
  'healthScore' | 'inboxRate' | 'spamRate' | 'openRate' | 'replyRate' | 'bounceRate' |
  'totalEmailsSent' | 'totalEmailsReceived' | 'totalRepliesSent' | 'totalConversations'> {}

class EmailAccount extends Model<EmailAccountAttributes, EmailAccountCreationAttributes> implements EmailAccountAttributes {
  public id!: number;
  public userId!: number;

  public email!: string;
  public provider!: 'gmail' | 'outlook' | 'custom';
  public connectionType!: 'oauth' | 'smtp' | 'appPassword' | 'domainWide';

  public smtpHost?: string;
  public smtpPort?: number;
  public smtpUsername?: string;
  public smtpPassword?: string;
  public imapHost?: string;
  public imapPort?: number;
  public imapUsername?: string;
  public imapPassword?: string;

  public oauthAccessToken?: string;
  public oauthRefreshToken?: string;
  public oauthTokenExpiry?: Date;

  public isDomainWide!: boolean;
  public domainName?: string;
  public serviceAccountJson?: string;

  public status!: 'active' | 'paused' | 'error' | 'disconnected';
  public lastError?: string;
  public lastTestedAt?: Date;

  public isWarmupEnabled!: boolean;
  public emailsPerDay!: number;

  public useGradualIncrease!: boolean;
  public gradualStartVolume!: number;
  public gradualTargetVolume!: number;
  public gradualDurationWeeks!: number;
  public gradualStartDate?: Date;
  public gradualCurrentVolume?: number;

  public dailyEmailsSent!: number;
  public dailyEmailsReceived!: number;
  public lastResetDate!: Date;

  public healthScore!: number;
  public inboxRate!: number;
  public spamRate!: number;
  public openRate!: number;
  public replyRate!: number;
  public bounceRate!: number;
  public lastHealthUpdate?: Date;

  public totalEmailsSent!: number;
  public totalEmailsReceived!: number;
  public totalRepliesSent!: number;
  public totalConversations!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

EmailAccount.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    provider: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [['gmail', 'outlook', 'custom']]
      }
    },
    connectionType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [['oauth', 'smtp', 'appPassword', 'domainWide']]
      }
    },
    smtpHost: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    smtpPort: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    smtpUsername: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    smtpPassword: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    imapHost: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    imapPort: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    imapUsername: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    imapPassword: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    oauthAccessToken: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    oauthRefreshToken: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    oauthTokenExpiry: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isDomainWide: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    domainName: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    serviceAccountJson: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'active',
      validate: {
        isIn: [['active', 'paused', 'error', 'disconnected']]
      }
    },
    lastError: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    lastTestedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isWarmupEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    emailsPerDay: {
      type: DataTypes.INTEGER,
      defaultValue: 20
    },
    useGradualIncrease: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    gradualStartVolume: {
      type: DataTypes.INTEGER,
      defaultValue: 5
    },
    gradualTargetVolume: {
      type: DataTypes.INTEGER,
      defaultValue: 100
    },
    gradualDurationWeeks: {
      type: DataTypes.INTEGER,
      defaultValue: 4
    },
    gradualStartDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    gradualCurrentVolume: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    dailyEmailsSent: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    dailyEmailsReceived: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    lastResetDate: {
      type: DataTypes.DATEONLY,
      defaultValue: DataTypes.NOW
    },
    healthScore: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0
    },
    inboxRate: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0
    },
    spamRate: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0
    },
    openRate: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0
    },
    replyRate: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0
    },
    bounceRate: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0
    },
    lastHealthUpdate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    totalEmailsSent: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    totalEmailsReceived: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    totalRepliesSent: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    totalConversations: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  },
  {
    sequelize,
    tableName: 'EmailAccounts',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['email'] },
      { fields: ['status'] },
      { fields: ['domainName'] }
    ]
  }
);

export default EmailAccount;
