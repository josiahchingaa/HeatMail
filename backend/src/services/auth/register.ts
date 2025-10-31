import { User } from '../../models';
import { validateEmail, validatePassword } from '../../utils/validators';
import { generateToken } from '../../utils/jwt';
import { AuditLog } from '../../models';

interface RegisterData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  country?: string;
  city?: string;
  occupation?: string;
  phoneNumber?: string;
}

export const registerUser = async (data: RegisterData) => {
  // Validate email
  if (!validateEmail(data.email)) {
    throw new Error('Invalid email address');
  }

  // Validate password
  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.valid) {
    throw new Error(passwordValidation.errors.join(', '));
  }

  // Check if user already exists
  const existingUser = await User.findOne({ where: { email: data.email.toLowerCase() } });
  if (existingUser) {
    throw new Error('Email already registered');
  }

  // Create user
  const user = await User.create({
    email: data.email.toLowerCase(),
    password: data.password, // Will be hashed by User model hook
    firstName: data.firstName,
    lastName: data.lastName,
    company: data.company,
    country: data.country,
    city: data.city,
    occupation: data.occupation,
    phoneNumber: data.phoneNumber,
    role: 'user',
    subscriptionStatus: 'free',
    maxMailboxes: 1,
    maxEmailsPerDay: 20,
    isActive: true,
    isEmailVerified: false
  });

  // Create audit log
  await AuditLog.create({
    userId: user.id,
    userEmail: user.email,
    action: 'user_registered',
    entity: 'User',
    entityId: user.id,
    details: {
      email: user.email,
      registeredAt: new Date()
    }
  });

  // Generate JWT token
  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role
  });

  // Return user (password will be excluded by toJSON method)
  return {
    user: user.toJSON(),
    token
  };
};
