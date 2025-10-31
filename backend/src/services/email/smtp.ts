import nodemailer from 'nodemailer';
import { decrypt } from '../../utils/encryption';
import logger from '../../utils/logger';

interface SMTPConfig {
  host: string;
  port: number;
  secure?: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailMessage {
  from: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
  headers?: Record<string, string>;
  inReplyTo?: string;
  references?: string;
}

/**
 * Create SMTP transporter
 */
export const createTransporter = (config: SMTPConfig) => {
  return nodemailer.createTransporter({
    host: config.host,
    port: config.port,
    secure: config.secure || (config.port === 465), // true for 465, false for other ports
    auth: {
      user: config.auth.user,
      pass: config.auth.pass
    },
    tls: {
      rejectUnauthorized: false // Allow self-signed certificates
    }
  });
};

/**
 * Send email via SMTP
 */
export const sendEmail = async (
  config: SMTPConfig,
  message: EmailMessage
): Promise<{ messageId: string; success: boolean }> => {
  try {
    const transporter = createTransporter(config);

    const info = await transporter.sendMail({
      from: message.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
      headers: message.headers,
      inReplyTo: message.inReplyTo,
      references: message.references
    });

    logger.info('Email sent successfully', {
      messageId: info.messageId,
      from: message.from,
      to: message.to
    });

    return {
      messageId: info.messageId,
      success: true
    };
  } catch (error: any) {
    logger.error('Failed to send email', {
      error: error.message,
      from: message.from,
      to: message.to
    });

    throw new Error(`SMTP Error: ${error.message}`);
  }
};

/**
 * Test SMTP connection
 */
export const testSMTPConnection = async (config: SMTPConfig): Promise<boolean> => {
  try {
    const transporter = createTransporter(config);
    await transporter.verify();
    logger.info('SMTP connection test successful', { host: config.host });
    return true;
  } catch (error: any) {
    logger.error('SMTP connection test failed', {
      error: error.message,
      host: config.host
    });
    throw new Error(`SMTP connection failed: ${error.message}`);
  }
};

/**
 * Send warmup email with special headers
 */
export const sendWarmupEmail = async (
  config: SMTPConfig,
  message: EmailMessage
): Promise<{ messageId: string; success: boolean }> => {
  // Add warmup header (invisible to email clients)
  const warmupMessage = {
    ...message,
    headers: {
      ...message.headers,
      'X-Warmup-Email': 'true',
      'X-Heatmail-Id': `warmup-${Date.now()}`
    }
  };

  return sendEmail(config, warmupMessage);
};

/**
 * Get SMTP config from encrypted email account data
 */
export const getDecryptedSMTPConfig = (emailAccount: any): SMTPConfig => {
  return {
    host: emailAccount.smtpHost,
    port: emailAccount.smtpPort,
    auth: {
      user: emailAccount.smtpUsername,
      pass: decrypt(emailAccount.smtpPassword)
    }
  };
};
