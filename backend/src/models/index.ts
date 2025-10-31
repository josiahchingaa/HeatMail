import User from './User';
import EmailAccount from './EmailAccount';
import Package from './Package';
import WarmupEmail from './WarmupEmail';
import WarmupTemplate from './WarmupTemplate';
import WarmupConversation from './WarmupConversation';
import AdminCampaign from './AdminCampaign';
import HealthScoreHistory from './HealthScoreHistory';
import AuditLog from './AuditLog';

// Define associations

// User <-> Package (Many-to-One)
User.belongsTo(Package, { foreignKey: 'packageId', as: 'package' });
Package.hasMany(User, { foreignKey: 'packageId', as: 'users' });

// User <-> EmailAccount (One-to-Many)
User.hasMany(EmailAccount, { foreignKey: 'userId', as: 'emailAccounts', onDelete: 'CASCADE' });
EmailAccount.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> AdminCampaign (One-to-Many)
User.hasMany(AdminCampaign, { foreignKey: 'adminUserId', as: 'campaigns', onDelete: 'CASCADE' });
AdminCampaign.belongsTo(User, { foreignKey: 'adminUserId', as: 'admin' });

// User <-> AuditLog (One-to-Many)
User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs', onDelete: 'SET NULL' });
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> WarmupTemplate (One-to-Many)
User.hasMany(WarmupTemplate, { foreignKey: 'createdBy', as: 'templates' });
WarmupTemplate.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// EmailAccount <-> WarmupEmail (One-to-Many - From)
EmailAccount.hasMany(WarmupEmail, { foreignKey: 'fromEmailAccountId', as: 'sentEmails', onDelete: 'CASCADE' });
WarmupEmail.belongsTo(EmailAccount, { foreignKey: 'fromEmailAccountId', as: 'fromAccount' });

// EmailAccount <-> WarmupEmail (One-to-Many - To)
EmailAccount.hasMany(WarmupEmail, { foreignKey: 'toEmailAccountId', as: 'receivedEmails', onDelete: 'CASCADE' });
WarmupEmail.belongsTo(EmailAccount, { foreignKey: 'toEmailAccountId', as: 'toAccount' });

// EmailAccount <-> HealthScoreHistory (One-to-Many)
EmailAccount.hasMany(HealthScoreHistory, { foreignKey: 'emailAccountId', as: 'healthHistory', onDelete: 'CASCADE' });
HealthScoreHistory.belongsTo(EmailAccount, { foreignKey: 'emailAccountId', as: 'emailAccount' });

// EmailAccount <-> WarmupConversation (One-to-Many - Participant 1)
EmailAccount.hasMany(WarmupConversation, { foreignKey: 'emailAccountId1', as: 'conversations1', onDelete: 'CASCADE' });
WarmupConversation.belongsTo(EmailAccount, { foreignKey: 'emailAccountId1', as: 'participant1' });

// EmailAccount <-> WarmupConversation (One-to-Many - Participant 2)
EmailAccount.hasMany(WarmupConversation, { foreignKey: 'emailAccountId2', as: 'conversations2', onDelete: 'CASCADE' });
WarmupConversation.belongsTo(EmailAccount, { foreignKey: 'emailAccountId2', as: 'participant2' });

// WarmupTemplate <-> WarmupEmail (One-to-Many)
WarmupTemplate.hasMany(WarmupEmail, { foreignKey: 'templateId', as: 'emails' });
WarmupEmail.belongsTo(WarmupTemplate, { foreignKey: 'templateId', as: 'template' });

// WarmupConversation <-> WarmupEmail (One-to-Many)
WarmupConversation.hasMany(WarmupEmail, { foreignKey: 'conversationId', as: 'emails' });
WarmupEmail.belongsTo(WarmupConversation, { foreignKey: 'conversationId', as: 'conversation' });

export {
  User,
  EmailAccount,
  Package,
  WarmupEmail,
  WarmupTemplate,
  WarmupConversation,
  AdminCampaign,
  HealthScoreHistory,
  AuditLog
};

export default {
  User,
  EmailAccount,
  Package,
  WarmupEmail,
  WarmupTemplate,
  WarmupConversation,
  AdminCampaign,
  HealthScoreHistory,
  AuditLog
};
