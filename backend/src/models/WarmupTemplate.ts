import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface WarmupTemplateAttributes {
  id: number;
  category: 'business' | 'networking' | 'feedback' | 'collaboration' | 'casual';
  subject: string;
  body: string;
  language: string;
  replyToTemplateId?: number | null;
  variables: string[];
  usageCount: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface WarmupTemplateCreationAttributes extends Optional<WarmupTemplateAttributes,
  'id' | 'language' | 'replyToTemplateId' | 'variables' | 'usageCount' | 'isActive' | 'createdAt' | 'updatedAt'> {}

class WarmupTemplate extends Model<WarmupTemplateAttributes, WarmupTemplateCreationAttributes> implements WarmupTemplateAttributes {
  public id!: number;
  public category!: 'business' | 'networking' | 'feedback' | 'collaboration' | 'casual';
  public subject!: string;
  public body!: string;
  public language!: string;
  public replyToTemplateId?: number | null;
  public variables!: string[];
  public usageCount!: number;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

WarmupTemplate.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        isIn: [['business', 'networking', 'feedback', 'collaboration', 'casual']]
      }
    },
    subject: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    language: {
      type: DataTypes.STRING(10),
      defaultValue: 'en'
    },
    replyToTemplateId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'WarmupTemplates',
        key: 'id'
      }
    },
    variables: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    usageCount: {
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
    tableName: 'WarmupTemplates',
    timestamps: true,
    indexes: [
      { fields: ['category'] },
      { fields: ['isActive'] }
    ]
  }
);

export default WarmupTemplate;
