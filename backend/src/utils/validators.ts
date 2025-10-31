import validator from 'validator';

export const validateEmail = (email: string): boolean => {
  return validator.isEmail(email);
};

export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const validateSMTPConfig = (config: {
  host: string;
  port: number;
  username: string;
  password: string;
}): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!config.host || config.host.trim() === '') {
    errors.push('SMTP host is required');
  }

  if (!config.port || config.port < 1 || config.port > 65535) {
    errors.push('SMTP port must be between 1 and 65535');
  }

  if (!config.username || config.username.trim() === '') {
    errors.push('SMTP username is required');
  }

  if (!config.password || config.password.trim() === '') {
    errors.push('SMTP password is required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const validateIMAPConfig = (config: {
  host: string;
  port: number;
  username: string;
  password: string;
}): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!config.host || config.host.trim() === '') {
    errors.push('IMAP host is required');
  }

  if (!config.port || config.port < 1 || config.port > 65535) {
    errors.push('IMAP port must be between 1 and 65535');
  }

  if (!config.username || config.username.trim() === '') {
    errors.push('IMAP username is required');
  }

  if (!config.password || config.password.trim() === '') {
    errors.push('IMAP password is required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const sanitizeInput = (input: string): string => {
  return validator.escape(input.trim());
};

export const validateURL = (url: string): boolean => {
  return validator.isURL(url);
};
