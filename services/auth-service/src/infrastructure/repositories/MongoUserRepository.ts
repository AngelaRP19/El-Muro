import { User } from '../../domain/models/User';
import { IUserRepository } from '../../application/ports/out/IUserRepository';
import { UserModel } from '../entities/UserEntity';

export class MongoUserRepository implements IUserRepository {
  async findByEmail(correo: string): Promise<User | null> {
    const user = await UserModel.findOne({ correo: correo.toLowerCase() })
      .select('+password +twoFactorSecret')
      .lean();

    if (!user) {
      return null;
    }

    return this.mapToDomain(user);
  }

  async findByApodo(apodo: string): Promise<User | null> {
    const user = await UserModel.findOne({ apodo: apodo.toLowerCase().trim() })
      .select('+password +twoFactorSecret')
      .lean();

    if (!user) {
      return null;
    }

    return this.mapToDomain(user);
  }

  async findById(id: string): Promise<User | null> {
    const user = await UserModel.findById(id)
      .select('+twoFactorSecret')
      .lean();

    if (!user) {
      return null;
    }

    return this.mapToDomain(user);
  }

  async create(user: Omit<User, 'id'>): Promise<User> {
    const newUser = await UserModel.create(user);
    return this.mapToDomain(newUser.toObject());
  }

  async updateLoginAttempts(userId: string, attempts: number, lockUntil: Date | null): Promise<void> {
    await UserModel.findByIdAndUpdate(userId, {
      failedLoginAttempts: attempts,
      lockUntil,
    });
  }

  async updateTwoFactorSecret(userId: string, secret: string): Promise<void> {
    await UserModel.findByIdAndUpdate(userId, {
      twoFactorSecret: secret,
    });
  }

  async enableTwoFactor(userId: string): Promise<void> {
    await UserModel.findByIdAndUpdate(userId, {
      twoFactorEnabled: true,
    });
  }

  async disableTwoFactor(userId: string): Promise<void> {
    await UserModel.findByIdAndUpdate(userId, {
      twoFactorEnabled: false,
      twoFactorSecret: null,
    });
  }

  async updatePoints(userId: string, points: number): Promise<void> {
    await UserModel.findByIdAndUpdate(userId, {
      $inc: { puntos: points }
    });
  }

  async updateProfile(userId: string, updates: { nombre?: string; apodo?: string; password?: string }): Promise<User> {
    const updated = await UserModel.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true }
    ).select('+password +twoFactorSecret').lean();

    if (!updated) {
      throw new Error('Usuario no encontrado');
    }
    return this.mapToDomain(updated);
  }

  private mapToDomain(doc: any): User {
    return {
      id: doc._id.toString(),
      nombre: doc.nombre,
      correo: doc.correo,
      password: doc.password,
      rol: doc.rol,
      apodo: doc.apodo,
      puntos: doc.puntos,
      estaActivo: doc.estaActivo,
      isVerified: doc.isVerified,
      failedLoginAttempts: doc.failedLoginAttempts,
      lockUntil: doc.lockUntil,
      twoFactorSecret: doc.twoFactorSecret,
      twoFactorEnabled: doc.twoFactorEnabled || false,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
