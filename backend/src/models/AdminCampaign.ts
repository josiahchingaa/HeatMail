import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface AdminCampaignAttributes {
  id: number;

  // Campaign Info
  adminUserId: number;
  name: string;
  subject: string;
  body: string;

  // Target Pool Members
  targetEmailAccountIds: number[];

  // Sending Settings
  emailsPerDay: number;

  // Status
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused';

  // Statistics
  totalTargets: number;
  emailsSent: number;
  repliesReceived: number;
  opensReceived: number;

  // Timestamps
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AdminCampaignCreationAttributes extends Optional<AdminCampaignAttributes,
  'id' | 'targetEmailAccountIds' | 'emailsPerDay' | 'status' | 'totalTargets' |
  'emailsSent' | 'repliesReceived' | 'opensReceived'> {}

class AdminCampaign extends Model<AdminCampaignAttributes, AdminCampaignCreationAttributes> implements AdminCampaignAttributes {
  public id!: number;

  public adminUserId!: number;
  public name!: string;
  public subject!: string;
  public body!: string;

  public targetEmailAccountIds!: number[];

  public emailsPerDay!: number;

  public status!: 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused';

  public totalTargets!: number;
  public emailsSent!: number;
  public repliesReceived!: number;
  public opensReceived!: number;

  public scheduledAt?: Date;
  public startedAt?: Date;
  public completedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

AdminCampaign.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    adminUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    subject: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    targetEmailAccountIds: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    emailsPerDay: {
      type: DataTypes.INTEGER,
      defaultValue: 50
    },
    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'draft',
      validate: {
        isIn: [['draft', 'scheduled', 'sending', 'completed', 'paused']]
      }
    },
    totalTargets: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    emailsSent: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    repliesReceived: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    opensReceived: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    scheduledAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'AdminCampaigns',
    timestamps: true,
    indexes: [
      { fields: ['adminUserId'] },
      { fields: ['status'] }
    ]
  }
);

export default AdminCampaign;
