import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { LoginResult } from '../ports/out/AuthTypes';
import { ILoginUseCase, LoginInput } from '../ports/in/ILoginUseCase';
import { IUserRepository } from '../ports/out/IUserRepository';

export class LoginUseCase implements ILoginUseCase {
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOGIN_LOCK_MINUTES = 15;
  private readonly JWT_SECRET: string;
  private readonly JWT_EXPIRES_IN_HOURS: number;

  constructor(
    private readonly userRepository: IUserRepository,
    jwtSecret: string,
    jwtExpiresInHours: number = 6
  ) {
    this.JWT_SECRET = jwtSecret;
    this.JWT_EXPIRES_IN_HOURS = jwtExpiresInHours;
  }

  private normalizeEmail(correo: string): string {
    if (typeof correo !== 'string' || !correo.trim()) {
      throw new Error('El campo "correo" es obligatorio');
    }
    return correo.trim().toLowerCase();
  }

  private isAccountLocked(lockUntil: Date | null): boolean {
    return Boolean(lockUntil && lockUntil.getTime() > Date.now());
  }

  private getLockUntilDate(): Date {
    const lockMs = this.LOGIN_LOCK_MINUTES * 60 * 1000;
    return new Date(Date.now() + lockMs);
  }

  private signToken(userId: string, rol: string): string {
    return jwt.sign({ userId, rol }, this.JWT_SECRET, {
      expiresIn: `${this.JWT_EXPIRES_IN_HOURS}h`,
    });
  }

  async execute(input: LoginInput): Promise<LoginResult> {
    const correo = this.normalizeEmail(input.correo);
    const user = await this.userRepository.findByEmail(correo);

    if (!user) {
      throw new Error('Credenciales invalidas');
    }

    if (this.isAccountLocked(user.lockUntil)) {
      throw new Error('Cuenta bloqueada temporalmente por multiples intentos fallidos');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.password);
    if (!isPasswordValid) {
      const newAttempts = user.failedLoginAttempts + 1;
      const lockUntil = newAttempts >= this.MAX_LOGIN_ATTEMPTS
        ? this.getLockUntilDate()
        : null;

      await this.userRepository.updateLoginAttempts(
        user.id,
        newAttempts >= this.MAX_LOGIN_ATTEMPTS ? 0 : newAttempts,
        lockUntil
      );

      throw new Error('Credenciales invalidas');
    }

    if (!user.isVerified) {
      throw new Error('Usuario no verificado');
    }

    if (!user.estaActivo) {
      throw new Error('Usuario deshabilitado');
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      return {
        token: '',
        user: {
          id: user.id,
          nombre: user.nombre,
          correo: user.correo,
          rol: user.rol,
          apodo: user.apodo,
          puntos: user.puntos,
          isVerified: user.isVerified,
          estaActivo: user.estaActivo,
          twoFactorEnabled: true,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        requires2FA: true,
      };
    }

    await this.userRepository.updateLoginAttempts(user.id, 0, null);

    const token = this.signToken(user.id, user.rol);

    return {
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        correo: user.correo,
        rol: user.rol,
        apodo: user.apodo,
        puntos: user.puntos,
        isVerified: user.isVerified,
        estaActivo: user.estaActivo,
        twoFactorEnabled: false,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }
}
