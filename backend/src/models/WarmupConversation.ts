import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface WarmupConversationAttributes {
  id: number;

  // Participants
  emailAccountId1: number;
  emailAccountId2: number;

  // Thread Info
  threadId: string;

  // Conversation Progress
  currentStep: number;
  maxSteps: number;

  // Status
  status: 'active' | 'completed' | 'archived' | 'error';

  // Timestamps
  startedAt: Date;
  lastReplyAt?: Date;
  completedAt?: Date;
  archivedAt?: Date;
}

interface WarmupConversationCreationAttributes extends Optional<WarmupConversationAttributes,
  'id' | 'currentStep' | 'status' | 'startedAt'> {}

class WarmupConversation extends Model<WarmupConversationAttributes, WarmupConversationCreationAttributes> implements WarmupConversationAttributes {
  public id!: number;

  public emailAccountId1!: number;
  public emailAccountId2!: number;

  public threadId!: string;

  public currentStep!: number;
  public maxSteps!: number;

  public status!: 'active' | 'completed' | 'archived' | 'error';

  public startedAt!: Date;
  public lastReplyAt?: Date;
  public completedAt?: Date;
  public archivedAt?: Date;
}

WarmupConversation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    emailAccountId1: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'EmailAccounts',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    emailAccountId2: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'EmailAccounts',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    threadId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    currentStep: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    maxSteps: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'active',
      validate: {
        isIn: [['active', 'completed', 'archived', 'error']]
      }
    },
    startedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    lastReplyAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    archivedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'WarmupConversations',
    timestamps: false,
    indexes: [
      { fields: ['emailAccountId1'] },
      { fields: ['emailAccountId2'] },
      { fields: ['status'] },
      { fields: ['threadId'] }
    ]
  }
);

export default WarmupConversation;
