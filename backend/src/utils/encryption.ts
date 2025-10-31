import CryptoJS from 'crypto-js';
import dotenv from 'dotenv';

dotenv.config();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';

/**
 * Encrypt sensitive data (OAuth tokens, SMTP passwords)
 */
export const encrypt = (text: string): string => {
  try {
    const encrypted = CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt sensitive data
 */
export const decrypt = (encryptedText: string): string => {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
    const text = decrypted.toString(CryptoJS.enc.Utf8);

    if (!text) {
      throw new Error('Decryption failed - invalid data or key');
    }

    return text;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Hash data (one-way, for storing sensitive info that doesn't need to be retrieved)
 */
export const hash = (text: string): string => {
  return CryptoJS.SHA256(text).toString();
};

/**
 * Generate random token
 */
export const generateRandomToken = (length: number = 32): string => {
  return CryptoJS.lib.WordArray.random(length).toString();
};
