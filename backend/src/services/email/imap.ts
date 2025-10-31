import Imap from 'imap';
import { simpleParser, ParsedMail } from 'mailparser';
import { decrypt } from '../../utils/encryption';
import logger from '../../utils/logger';

interface IMAPConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  tls: boolean;
}

interface EmailMessage {
  messageId: string;
  from: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
  date: Date;
  headers: Map<string, string>;
  inReplyTo?: string;
  references?: string[];
}

/**
 * Connect to IMAP server
 */
export const connectToIMAP = (config: IMAPConfig): Promise<Imap> => {
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: config.user,
      password: config.password,
      host: config.host,
      port: config.port,
      tls: config.tls,
      tlsOptions: { rejectUnauthorized: false }
    });

    imap.once('ready', () => {
      logger.info('IMAP connection established', { host: config.host, user: config.user });
      resolve(imap);
    });

    imap.once('error', (err: Error) => {
      logger.error('IMAP connection error', { error: err.message, host: config.host });
      reject(err);
    });

    imap.connect();
  });
};

/**
 * Test IMAP connection
 */
export const testIMAPConnection = async (config: IMAPConfig): Promise<boolean> => {
  try {
    const imap = await connectToIMAP(config);

    return new Promise((resolve, reject) => {
      imap.openBox('INBOX', true, (err) => {
        if (err) {
          imap.end();
          reject(new Error(`Failed to open INBOX: ${err.message}`));
        } else {
          imap.end();
          logger.info('IMAP connection test successful', { host: config.host });
          resolve(true);
        }
      });
    });
  } catch (error: any) {
    logger.error('IMAP connection test failed', { error: error.message });
    throw new Error(`IMAP connection failed: ${error.message}`);
  }
};

/**
 * Search for emails with specific header
 */
export const searchWarmupEmails = (imap: Imap): Promise<number[]> => {
  return new Promise((resolve, reject) => {
    // Search for unseen emails with X-Warmup-Email header
    imap.search([['HEADER', 'X-Warmup-Email', 'true']], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results || []);
      }
    });
  });
};

/**
 * Fetch email by UID
 */
export const fetchEmail = (imap: Imap, uid: number): Promise<EmailMessage> => {
  return new Promise((resolve, reject) => {
    const fetch = imap.fetch([uid], { bodies: '', markSeen: true });

    fetch.on('message', (msg) => {
      msg.on('body', (stream) => {
        simpleParser(stream, async (err, parsed: ParsedMail) => {
          if (err) {
            reject(err);
            return;
          }

          const headers = new Map<string, string>();
          if (parsed.headers) {
            parsed.headers.forEach((value: any, key: string) => {
              headers.set(key, Array.isArray(value) ? value.join(', ') : value);
            });
          }

          const emailMessage: EmailMessage = {
            messageId: parsed.messageId || '',
            from: parsed.from?.text || '',
            to: parsed.to?.text || '',
            subject: parsed.subject || '',
            text: parsed.text,
            html: parsed.html as string | undefined,
            date: parsed.date || new Date(),
            headers,
            inReplyTo: parsed.inReplyTo,
            references: parsed.references
          };

          resolve(emailMessage);
        });
      });
    });

    fetch.once('error', (err: Error) => {
      reject(err);
    });

    fetch.once('end', () => {
      logger.debug('Finished fetching email', { uid });
    });
  });
};

/**
 * Poll inbox for new warmup emails
 */
export const pollInbox = async (config: IMAPConfig): Promise<EmailMessage[]> => {
  try {
    const imap = await connectToIMAP(config);

    return new Promise((resolve, reject) => {
      imap.openBox('INBOX', false, async (err) => {
        if (err) {
          imap.end();
          reject(err);
          return;
        }

        try {
          const uids = await searchWarmupEmails(imap);

          if (uids.length === 0) {
            imap.end();
            resolve([]);
            return;
          }

          const emails: EmailMessage[] = [];

          for (const uid of uids) {
            try {
              const email = await fetchEmail(imap, uid);
              emails.push(email);
            } catch (error) {
              logger.error('Error fetching email', { uid, error });
            }
          }

          imap.end();
          resolve(emails);
        } catch (error) {
          imap.end();
          reject(error);
        }
      });
    });
  } catch (error: any) {
    logger.error('Failed to poll inbox', { error: error.message });
    throw error;
  }
};

/**
 * Archive email (move to Archive folder)
 */
export const archiveEmail = (imap: Imap, uid: number, archiveFolder: string = 'Archive'): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Add 'Deleted' flag to mark for archiving
    imap.move(uid, archiveFolder, (err) => {
      if (err) {
        reject(new Error(`Failed to archive email: ${err.message}`));
      } else {
        logger.info('Email archived', { uid, folder: archiveFolder });
        resolve();
      }
    });
  });
};

/**
 * Mark email as read
 */
export const markAsRead = (imap: Imap, uid: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    imap.addFlags(uid, '\\Seen', (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

/**
 * Get decrypted IMAP config from email account
 */
export const getDecryptedIMAPConfig = (emailAccount: any): IMAPConfig => {
  return {
    host: emailAccount.imapHost,
    port: emailAccount.imapPort,
    user: emailAccount.imapUsername,
    password: decrypt(emailAccount.imapPassword),
    tls: emailAccount.imapPort === 993 // Use TLS for port 993
  };
};

/**
 * Check if email is in spam folder
 */
export const checkIfInSpam = async (config: IMAPConfig, messageId: string): Promise<boolean> => {
  try {
    const imap = await connectToIMAP(config);

    return new Promise((resolve, reject) => {
      imap.openBox('[Gmail]/Spam', true, (err) => {
        if (err) {
          // If spam folder doesn't exist, email is not in spam
          imap.end();
          resolve(false);
          return;
        }

        imap.search([['HEADER', 'MESSAGE-ID', messageId]], (searchErr, results) => {
          imap.end();

          if (searchErr) {
            reject(searchErr);
          } else {
            resolve(results && results.length > 0);
          }
        });
      });
    });
  } catch (error) {
    logger.error('Error checking spam folder', { error });
    return false;
  }
};

/**
 * Get inbox folder name (Gmail vs others)
 */
export const getInboxFolder = (provider: string): string => {
  if (provider === 'gmail') {
    return 'INBOX';
  }
  return 'INBOX';
};

/**
 * Get spam folder name (Gmail vs others)
 */
export const getSpamFolder = (provider: string): string => {
  if (provider === 'gmail') {
    return '[Gmail]/Spam';
  } else if (provider === 'outlook') {
    return 'Junk';
  }
  return 'Spam';
};

/**
 * Get archive folder name (Gmail vs others)
 */
export const getArchiveFolder = (provider: string): string => {
  if (provider === 'gmail') {
    return '[Gmail]/All Mail';
  }
  return 'Archive';
};
