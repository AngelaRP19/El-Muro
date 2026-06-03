import { User } from '../../../domain/models/User';

export interface IUserRepository {
  findByEmail(correo: string): Promise<User | null>;
  findByApodo(apodo: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(user: Omit<User, 'id'>): Promise<User>;
  updateLoginAttempts(userId: string, attempts: number, lockUntil: Date | null): Promise<void>;
  updateTwoFactorSecret(userId: string, secret: string): Promise<void>;
  enableTwoFactor(userId: string): Promise<void>;
  disableTwoFactor(userId: string): Promise<void>;
  updatePoints(userId: string, points: number): Promise<void>;
  updateProfile(userId: string, updates: { nombre?: string; apodo?: string; password?: string }): Promise<User>;
}
