import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface WarmupEmailAttributes {
  id: number;

  // Sender & Receiver
  fromEmailAccountId: number;
  toEmailAccountId: number;

  // Email Content
  subject: string;
  body: string;
  templateId?: number;

  // Email Identifiers
  messageId?: string;
  threadId?: string;
  inReplyToMessageId?: string;

  // Conversation Tracking
  conversationId?: number;
  conversationStep: number;

  // Status Tracking
  status: 'queued' | 'sent' | 'delivered' | 'opened' | 'replied' | 'bounced' | 'spam' | 'archived';

  // Deliverability Tracking
  landedInInbox?: boolean;
  landedInSpam?: boolean;
  wasOpened: boolean;
  wasReplied: boolean;
  wasBounced: boolean;

  // Timestamps
  scheduledAt?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  repliedAt?: Date;
  archivedAt?: Date;

  // Error Tracking
  errorMessage?: string;
  retryCount: number;

  createdAt?: Date;
  updatedAt?: Date;
}

interface WarmupEmailCreationAttributes extends Optional<WarmupEmailAttributes,
  'id' | 'conversationStep' | 'status' | 'wasOpened' | 'wasReplied' | 'wasBounced' | 'retryCount'> {}

class WarmupEmail extends Model<WarmupEmailAttributes, WarmupEmailCreationAttributes> implements WarmupEmailAttributes {
  public id!: number;

  public fromEmailAccountId!: number;
  public toEmailAccountId!: number;

  public subject!: string;
  public body!: string;
  public templateId?: number;

  public messageId?: string;
  public threadId?: string;
  public inReplyToMessageId?: string;

  public conversationId?: number;
  public conversationStep!: number;

  public status!: 'queued' | 'sent' | 'delivered' | 'opened' | 'replied' | 'bounced' | 'spam' | 'archived';

  public landedInInbox?: boolean;
  public landedInSpam?: boolean;
  public wasOpened!: boolean;
  public wasReplied!: boolean;
  public wasBounced!: boolean;

  public scheduledAt?: Date;
  public sentAt?: Date;
  public deliveredAt?: Date;
  public openedAt?: Date;
  public repliedAt?: Date;
  public archivedAt?: Date;

  public errorMessage?: string;
  public retryCount!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

WarmupEmail.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    fromEmailAccountId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'EmailAccounts',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    toEmailAccountId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'EmailAccounts',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    subject: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    templateId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'WarmupTemplates',
        key: 'id'
      }
    },
    messageId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true
    },
    threadId: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    inReplyToMessageId: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    conversationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'WarmupConversations',
        key: 'id'
      }
    },
    conversationStep: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'queued',
      validate: {
        isIn: [['queued', 'sent', 'delivered', 'opened', 'replied', 'bounced', 'spam', 'archived']]
      }
    },
    landedInInbox: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    landedInSpam: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    wasOpened: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    wasReplied: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    wasBounced: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    scheduledAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    deliveredAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    openedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    repliedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    archivedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    retryCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  },
  {
    sequelize,
    tableName: 'WarmupEmails',
    timestamps: true,
    indexes: [
      { fields: ['fromEmailAccountId'] },
      { fields: ['toEmailAccountId'] },
      { fields: ['threadId'] },
      { fields: ['status'] },
      { fields: ['conversationId'] }
    ]
  }
);

export default WarmupEmail;
