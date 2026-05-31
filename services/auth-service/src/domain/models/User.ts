export type UserRole = 'admin' | 'estudiante';

export interface User {
  id: string;
  nombre: string;
  correo: string;
  password: string;
  rol: UserRole;
  apodo: string;
  puntos: number;
  estaActivo: boolean;
  isVerified: boolean;
  failedLoginAttempts: number;
  lockUntil: Date | null;
  twoFactorSecret?: string;
  twoFactorEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
