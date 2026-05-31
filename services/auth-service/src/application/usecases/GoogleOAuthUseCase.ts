import jwt from 'jsonwebtoken';
import { User } from '../../domain/models/User';
import { IUserRepository } from '../ports/out/IUserRepository';
import { IGoogleOAuthPort } from '../ports/out/IGoogleOAuthPort';

export class GoogleOAuthUseCase {
  private readonly JWT_SECRET: string;
  private readonly JWT_EXPIRES_IN_HOURS: number;

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly googleOAuthPort: IGoogleOAuthPort,
    jwtSecret: string,
    jwtExpiresInHours: number = 6
  ) {
    this.JWT_SECRET = jwtSecret;
    this.JWT_EXPIRES_IN_HOURS = jwtExpiresInHours;
  }

  private signToken(userId: string, rol: string): string {
    return jwt.sign({ userId, rol }, this.JWT_SECRET, {
      expiresIn: `${this.JWT_EXPIRES_IN_HOURS}h`,
    });
  }

  private generateNickname(name: string): string {
    const clean = name.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 15);
    const suffix = Math.floor(100 + Math.random() * 900).toString();
    return `g_${clean}_${suffix}`;
  }

  async execute(code: string): Promise<{ token: string; user: Partial<User> }> {
    const googleUser = await this.googleOAuthPort.exchangeCode(code);

    let user = await this.userRepository.findByEmail(googleUser.email);

    if (!user) {
      const now = new Date();
      const newUser: Omit<User, 'id'> = {
        nombre: googleUser.name,
        correo: googleUser.email,
        password: 'google-oauth-' + Math.random().toString(36).substring(7),
        rol: 'estudiante',
        apodo: this.generateNickname(googleUser.name),
        puntos: 5,
        estaActivo: true,
        isVerified: true,
        failedLoginAttempts: 0,
        lockUntil: null,
        twoFactorEnabled: false,
        createdAt: now,
        updatedAt: now,
      };

      user = await this.userRepository.create(newUser);
    }

    if (!user.estaActivo) {
      throw new Error('Usuario deshabilitado');
    }

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
        twoFactorEnabled: user.twoFactorEnabled,
      },
    };
  }
}
