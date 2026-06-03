import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../../domain/models/User';
import { IUserRepository } from '../ports/out/IUserRepository';
import { LoginResult } from '../ports/out/AuthTypes';

export interface RegisterInput {
  nombre: string;
  correo: string;
  password: string;
}

export interface RegisterOtpResult {
  message: string;
  otp?: string;
}

export class RegisterUseCase {
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

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private signToken(userId: string, rol: string): string {
    return jwt.sign({ userId, rol }, this.JWT_SECRET, {
      expiresIn: `${this.JWT_EXPIRES_IN_HOURS}h`,
    });
  }

  async execute(input: RegisterInput): Promise<RegisterOtpResult> {
    const correo = input.correo.trim().toLowerCase();

    const existingUser = await this.userRepository.findByEmail(correo);
    if (existingUser) {
      throw new Error('El correo ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);
    const otp = this.generateOtp();
    const now = new Date();

    const newUser: Omit<User, 'id'> = {
      nombre: input.nombre.trim(),
      correo,
      password: hashedPassword,
      rol: 'estudiante',
      apodo: input.nombre.trim().toLowerCase().replace(/\s+/g, '_').substring(0, 15),
      puntos: 7,
      estaActivo: true,
      isVerified: true,
      failedLoginAttempts: 0,
      lockUntil: null,
      twoFactorEnabled: false,
      createdAt: now,
      updatedAt: now,
    };

    const user = await this.userRepository.create(newUser);

    console.log(`[DEV] OTP for ${correo}: ${otp}`);

    return {
      message: 'Usuario registrado. Por favor verifica tu cuenta con el código OTP.',
      otp,
    };
  }

  async verifyOtp(correo: string, otpCode: string): Promise<LoginResult> {
    const user = await this.userRepository.findByEmail(correo);

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (user.isVerified) {
      throw new Error('La cuenta ya ha sido verificada');
    }

    throw new Error('OTP no implementado - necesita integración con sistema de emails');
  }
}
