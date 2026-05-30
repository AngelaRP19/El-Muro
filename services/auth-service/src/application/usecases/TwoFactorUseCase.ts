import speakeasy from 'speakeasy';
import jwt from 'jsonwebtoken';
import { IUserRepository } from '../ports/out/IUserRepository';

export interface TwoFactorSetupResult {
  secret: string;
  otpauthUrl: string;
}

export interface TwoFactorVerifyResult {
  valid: boolean;
  token?: string;
  user?: any;
}

export class TwoFactorUseCase {
  private readonly appName: string;
  private readonly jwtSecret: string;
  private readonly jwtExpiresInHours: number;

  constructor(
    private readonly userRepository: IUserRepository,
    jwtSecret: string,
    jwtExpiresInHours: number
  ) {
    this.appName = process.env.TWO_FACTOR_APP_NAME || 'El-Muro';
    this.jwtSecret = jwtSecret;
    this.jwtExpiresInHours = jwtExpiresInHours;
  }

  async setup(userId: string): Promise<TwoFactorSetupResult> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const secret = speakeasy.generateSecret({
      name: `${this.appName}:${user.correo}`,
      length: 20,
    });

    await this.userRepository.updateTwoFactorSecret(userId, secret.base32);

    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url || '',
    };
  }

  async enable(userId: string, code: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (!user.twoFactorSecret) {
      throw new Error('Primero genera el secreto 2FA');
    }

    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
    });

    if (!isValid) {
      throw new Error('Código 2FA inválido');
    }

    await this.userRepository.enableTwoFactor(userId);
  }

  async verify(correo: string, code: string): Promise<TwoFactorVerifyResult> {
    const user = await this.userRepository.findByEmail(correo);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return { valid: true };
    }

    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
    });

    if (!isValid) {
      return { valid: false };
    }

    const token = jwt.sign(
      { userId: user.id, rol: user.rol },
      this.jwtSecret,
      { expiresIn: `${this.jwtExpiresInHours}h` }
    );

    return {
      valid: true,
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
        twoFactorEnabled: true,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  async disable(userId: string, code: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new Error('2FA no está habilitado');
    }

    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
    });

    if (!isValid) {
      throw new Error('Código 2FA inválido');
    }

    await this.userRepository.disableTwoFactor(userId);
  }
}