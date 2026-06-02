import { Request, Response, NextFunction } from 'express';
import { ILoginUseCase } from '../../application/ports/in/ILoginUseCase';
import { GoogleOAuthUseCase } from '../../application/usecases/GoogleOAuthUseCase';
import { VerifyTokenUseCase } from '../../application/usecases/VerifyTokenUseCase';
import { RegisterUseCase } from '../../application/usecases/RegisterUseCase';
import { TwoFactorUseCase } from '../../application/usecases/TwoFactorUseCase';
import { PointsUseCase } from '../../application/usecases/PointsUseCase';
import { AppError } from '../middleware/errorHandler';

export class AuthController {
  constructor(
    private readonly loginUseCase: ILoginUseCase,
    private readonly googleOAuthUseCase: GoogleOAuthUseCase,
    private readonly verifyTokenUseCase: VerifyTokenUseCase,
    private readonly registerUseCase: RegisterUseCase,
    private readonly twoFactorUseCase: TwoFactorUseCase,
    private readonly pointsUseCase: PointsUseCase
  ) {}

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { correo, password } = req.body;

      if (!correo || !password) {
        throw new AppError('Correo y password son obligatorios', 400);
      }

      const result = await this.loginUseCase.execute({ correo, password });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async googleCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code } = req.body;

      if (!code) {
        throw new AppError('Código de autorización requerido', 400);
      }

      const result = await this.googleOAuthUseCase.execute(code);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { nombre, correo, password } = req.body;

      if (!nombre || !correo || !password) {
        throw new AppError('Nombre, correo y password son obligatorios', 400);
      }

      const result = await this.registerUseCase.execute({ nombre, correo, password });
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { correo, otpCode } = req.body;

      if (!correo || !otpCode) {
        throw new AppError('Correo y código OTP son obligatorios', 400);
      }

      const result = await this.registerUseCase.verifyOtp(correo, otpCode);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async verify2fa(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { correo, code } = req.body;

      if (!correo || !code) {
        throw new AppError('Correo y código 2FA son obligatorios', 400);
      }

      const result = await this.twoFactorUseCase.verify(correo, code);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        throw new AppError('Token no proporcionado', 401);
      }

      const user = await this.verifyTokenUseCase.execute(token);
      res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  }

  async puntos(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId;
      if (!userId) {
        throw new AppError('No autorizado', 401);
      }
      const puntos = await this.pointsUseCase.getUserPoints(userId);
      res.status(200).json({ puntos });
    } catch (error) {
      next(error);
    }
  }

  // --- Internal Mesh Endpoints ---

  async internalGetPoints(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const puntos = await this.pointsUseCase.getUserPoints(userId);
      res.status(200).json({ points: puntos });
    } catch (error) {
      next(error);
    }
  }

  async internalGetProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const profile = await this.pointsUseCase.getUserProfile(userId);
      res.status(200).json(profile);
    } catch (error) {
      next(error);
    }
  }

  async internalDeductPoints(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const { points } = req.body;
      await this.pointsUseCase.deductPoints(userId, points);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async internalAddPoints(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const { points } = req.body;
      await this.pointsUseCase.addPoints(userId, points);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
