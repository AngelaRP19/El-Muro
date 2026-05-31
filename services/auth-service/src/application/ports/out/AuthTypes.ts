import { User } from '../../../domain/models/User';

export interface LoginResult {
  token: string;
  user: Omit<User, 'password' | 'failedLoginAttempts' | 'lockUntil' | 'twoFactorSecret'>;
  requires2FA?: boolean;
}

export interface TokenPayload {
  userId: string;
  rol: string;
}
