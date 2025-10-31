import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface HealthScoreHistoryAttributes {
  id: number;
  emailAccountId: number;

  // Score Snapshot
  healthScore: number;
  inboxRate: number;
  spamRate: number;
  openRate: number;
  replyRate: number;
  bounceRate: number;

  // Sample Size
  totalEmailsSent: number;
  totalEmailsReceived: number;

  recordedAt: Date;
}

interface HealthScoreHistoryCreationAttributes extends Optional<HealthScoreHistoryAttributes, 'id' | 'recordedAt'> {}

class HealthScoreHistory extends Model<HealthScoreHistoryAttributes, HealthScoreHistoryCreationAttributes> implements HealthScoreHistoryAttributes {
  public id!: number;
  public emailAccountId!: number;

  public healthScore!: number;
  public inboxRate!: number;
  public spamRate!: number;
  public openRate!: number;
  public replyRate!: number;
  public bounceRate!: number;

  public totalEmailsSent!: number;
  public totalEmailsReceived!: number;

  public recordedAt!: Date;
}

HealthScoreHistory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    emailAccountId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'EmailAccounts',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    healthScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false
    },
    inboxRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false
    },
    spamRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false
    },
    openRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false
    },
    replyRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false
    },
    bounceRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false
    },
    totalEmailsSent: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    totalEmailsReceived: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    recordedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'HealthScoreHistory',
    timestamps: false,
    indexes: [
      { fields: ['emailAccountId', 'recordedAt'] }
    ]
  }
);

export default HealthScoreHistory;
