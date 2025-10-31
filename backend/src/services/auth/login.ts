import { User, AuditLog } from '../../models';
import { generateToken } from '../../utils/jwt';
import { validateEmail } from '../../utils/validators';

interface LoginData {
  email: string;
  password: string;
}

export const loginUser = async (data: LoginData) => {
  // Validate email format
  if (!validateEmail(data.email)) {
    throw new Error('Invalid email address');
  }

  // Find user
  const user = await User.findOne({ where: { email: data.email.toLowerCase() } });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Check if account is active
  if (!user.isActive) {
    throw new Error('Account is deactivated. Please contact support.');
  }

  // Validate password
  const isPasswordValid = await user.validatePassword(data.password);

  if (!isPasswordValid) {
    // Log failed login attempt
    await AuditLog.create({
      userId: user.id,
      userEmail: user.email,
      action: 'failed_login_attempt',
      entity: 'User',
      entityId: user.id,
      details: {
        attemptedAt: new Date(),
        reason: 'Invalid password'
      }
    });

    throw new Error('Invalid email or password');
  }

  // Update last login timestamp
  user.lastLoginAt = new Date();
  await user.save();

  // Create audit log
  await AuditLog.create({
    userId: user.id,
    userEmail: user.email,
    action: 'user_logged_in',
    entity: 'User',
    entityId: user.id,
    details: {
      loginAt: new Date()
    }
  });

  // Generate JWT token
  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role
  });

  // Return user and token
  return {
    user: user.toJSON(),
    token
  };
};
