import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { TokenPayload } from '../../application/ports/out/AuthTypes';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRol?: string;
    }
  }
}

export const authMiddleware = (jwtSecret: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Token no proporcionado' });
      return;
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, jwtSecret) as TokenPayload;
      req.userId = decoded.userId;
      req.userRol = decoded.rol;
      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({ message: 'Token expirado' });
        return;
      }
      if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({ message: 'Token inválido' });
        return;
      }
      res.status(401).json({ message: 'No autorizado' });
    }
  };
};
