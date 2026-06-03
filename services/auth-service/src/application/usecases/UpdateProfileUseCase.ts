import bcrypt from 'bcryptjs';
import { IUserRepository } from '../ports/out/IUserRepository';
import { AppError } from '../../infrastructure/middleware/errorHandler';
import { User } from '../../domain/models/User';

export interface UpdateProfileInput {
  nombre?: string;
  apodo?: string;
  password?: string;
}

export class UpdateProfileUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(userId: string, input: UpdateProfileInput): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    const updates: Partial<User> = {};

    if (input.nombre !== undefined) {
      const nombreTrimmed = input.nombre.trim();
      if (nombreTrimmed.length === 0) {
        throw new AppError('El nombre no puede estar vacío', 400);
      }
      updates.nombre = nombreTrimmed;
    }

    if (input.apodo !== undefined) {
      const apodoCleaned = input.apodo.trim().toLowerCase().replace(/\s+/g, '_').substring(0, 15);
      if (apodoCleaned.length === 0) {
        throw new AppError('El apodo no puede estar vacío', 400);
      }

      // Validar si el apodo ya existe y no pertenece al usuario actual
      if (apodoCleaned !== user.apodo) {
        const existingApodo = await this.userRepository.findByApodo(apodoCleaned);
        if (existingApodo) {
          throw new AppError('El apodo ya está en uso', 400);
        }
        updates.apodo = apodoCleaned;
      }
    }

    if (input.password !== undefined && input.password.length > 0) {
      if (input.password.length < 8) {
        throw new AppError('La contraseña debe tener al menos 8 caracteres', 400);
      }
      updates.password = await bcrypt.hash(input.password, 10);
    }

    if (Object.keys(updates).length === 0) {
      return user;
    }

    // Actualizar el perfil en la base de datos
    return this.userRepository.updateProfile(userId, updates);
  }
}
