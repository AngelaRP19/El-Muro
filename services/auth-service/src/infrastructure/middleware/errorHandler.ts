import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Error:', err);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  if (err.message.includes('obligatorio') || err.message.includes('requerido')) {
    res.status(400).json({ message: err.message });
    return;
  }

  if (err.message === 'Credenciales invalidas') {
    res.status(401).json({ message: err.message });
    return;
  }

  if (err.message === 'Usuario no verificado') {
    res.status(401).json({ message: err.message });
    return;
  }

  if (err.message === 'Usuario deshabilitado') {
    res.status(403).json({ message: err.message });
    return;
  }

  if (err.message === 'Token inválido' || err.message === 'Token expirado') {
    res.status(401).json({ message: err.message });
    return;
  }

  if (err.message.includes('bloqueada temporalmente')) {
    res.status(429).json({ message: err.message });
    return;
  }

  if (err.message.includes('Google')) {
    res.status(502).json({ message: err.message });
    return;
  }

  res.status(500).json({ message: 'Error interno' });
};
