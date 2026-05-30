import jwt from 'jsonwebtoken';
import { User } from '../../domain/models/User';
import { IUserRepository } from '../ports/out/IUserRepository';

export interface TokenPayload {
  userId: string;
  rol: string;
}

export class VerifyTokenUseCase {
  private readonly JWT_SECRET: string;

  constructor(
    private readonly userRepository: IUserRepository,
    jwtSecret: string
  ) {
    this.JWT_SECRET = jwtSecret;
  }

  async execute(token: string): Promise<Partial<User>> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as TokenPayload;
      const user = await this.userRepository.findById(decoded.userId);

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      if (!user.estaActivo) {
        throw new Error('Usuario deshabilitado');
      }

      return {
        id: user.id,
        nombre: user.nombre,
        correo: user.correo,
        rol: user.rol,
        apodo: user.apodo,
        puntos: user.puntos,
        isVerified: user.isVerified,
        estaActivo: user.estaActivo,
        twoFactorEnabled: user.twoFactorEnabled,
      };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Token inválido');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expirado');
      }
      throw error;
    }
  }
}
