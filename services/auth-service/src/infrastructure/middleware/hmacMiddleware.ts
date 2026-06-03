import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { AppError } from './errorHandler';

export const hmacMiddleware = (secret: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const serviceId = req.headers['x-service-id'] as string;
      const timestamp = req.headers['x-service-timestamp'] as string;
      const signature = req.headers['x-service-signature'] as string;

      if (!serviceId || !timestamp || !signature) {
        throw new AppError('Missing HMAC headers (x-service-id, x-service-timestamp, x-service-signature)', 401);
      }

      // Check if timestamp is within 24 hours to prevent replay attacks
      const now = Date.now();
      const requestTime = parseInt(timestamp, 10);
      if (Math.abs(now - requestTime) > 24 * 60 * 60 * 1000) {
        throw new AppError('HMAC timestamp expired', 401);
      }

      // The sign path is what the caller signed.
      // e.g. "/internal/users/123/points"
      const signPath = req.originalUrl.replace('/api/auth', '');
      const method = req.method;

      // message = serviceId + ":" + timestamp + ":" + method + ":" + path
      const payloadToSign = `${serviceId}:${timestamp}:${method}:${signPath}`;

      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payloadToSign, 'utf8')
        .digest('base64');

      // The Java HmacSigner uses Base64 without padding. We should remove padding for comparison.
      const expectedSignatureNoPadding = expectedSignature.replace(/=+$/, '');
      const signatureNoPadding = signature.replace(/=+$/, '');

      if (signatureNoPadding !== expectedSignatureNoPadding) {
        console.warn(`HMAC mismatch. Expected: ${expectedSignatureNoPadding}, Got: ${signatureNoPadding}`);
        throw new AppError('Invalid HMAC signature', 401);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
