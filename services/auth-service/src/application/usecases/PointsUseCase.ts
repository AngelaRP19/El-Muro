import { IUserRepository } from '../ports/out/IUserRepository';
import { AppError } from '../../infrastructure/middleware/errorHandler';

export class PointsUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async getUserPoints(userId: string): Promise<number> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }
    return user.puntos || 0;
  }

  async getUserProfile(userId: string): Promise<{ nombre: string }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }
    return { nombre: user.nombre };
  }

  async addPoints(userId: string, points: number): Promise<void> {
    if (points <= 0) {
      throw new AppError('Los puntos a agregar deben ser mayores a 0', 400);
    }
    await this.userRepository.updatePoints(userId, points);
  }

  async deductPoints(userId: string, points: number): Promise<void> {
    if (points <= 0) {
      throw new AppError('Los puntos a deducir deben ser mayores a 0', 400);
    }
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }
    if ((user.puntos || 0) < points) {
      throw new AppError('Puntos insuficientes', 400);
    }
    await this.userRepository.updatePoints(userId, -points);
  }
}
