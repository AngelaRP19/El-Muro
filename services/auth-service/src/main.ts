import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import yaml from 'yamljs';
import path from 'path';
import bcrypt from 'bcryptjs';

import { MongoUserRepository } from './infrastructure/repositories/MongoUserRepository';
import { GoogleOAuthAdapter } from './infrastructure/adapters/GoogleOAuthAdapter';
import { LoginUseCase } from './application/usecases/LoginUseCase';
import { GoogleOAuthUseCase } from './application/usecases/GoogleOAuthUseCase';
import { VerifyTokenUseCase } from './application/usecases/VerifyTokenUseCase';
import { RegisterUseCase } from './application/usecases/RegisterUseCase';
import { TwoFactorUseCase } from './application/usecases/TwoFactorUseCase';
import { PointsUseCase } from './application/usecases/PointsUseCase';
import { UpdateProfileUseCase } from './application/usecases/UpdateProfileUseCase';
import { AuthController } from './infrastructure/controllers/AuthController';
import { authMiddleware } from './infrastructure/middleware/authMiddleware';
import { hmacMiddleware } from './infrastructure/middleware/hmacMiddleware';
import { errorHandler } from './infrastructure/middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:password@localhost:27017/auth_service?authSource=admin';
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
const HMAC_SECRET = process.env.HMAC_SECRET || 'change-this-hmac-secret';
const JWT_EXPIRES_IN_HOURS = parseInt(process.env.JWT_EXPIRES_IN_HOURS || '6', 10);
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5173/auth/google/callback';

const userRepository = new MongoUserRepository();
const googleOAuthAdapter = new GoogleOAuthAdapter(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL);

const loginUseCase = new LoginUseCase(userRepository, JWT_SECRET, JWT_EXPIRES_IN_HOURS);
const googleOAuthUseCase = new GoogleOAuthUseCase(userRepository, googleOAuthAdapter, JWT_SECRET, JWT_EXPIRES_IN_HOURS);
const verifyTokenUseCase = new VerifyTokenUseCase(userRepository, JWT_SECRET);
const registerUseCase = new RegisterUseCase(userRepository, JWT_SECRET, JWT_EXPIRES_IN_HOURS);
const twoFactorUseCase = new TwoFactorUseCase(userRepository, JWT_SECRET, JWT_EXPIRES_IN_HOURS);
const pointsUseCase = new PointsUseCase(userRepository);
const updateProfileUseCase = new UpdateProfileUseCase(userRepository);

const authController = new AuthController(
  loginUseCase,
  googleOAuthUseCase,
  verifyTokenUseCase,
  registerUseCase,
  twoFactorUseCase,
  pointsUseCase,
  updateProfileUseCase
);

const authenticate = authMiddleware(JWT_SECRET);
const internalMeshAuth = hmacMiddleware(HMAC_SECRET);

async function seedDefaultAdmin(): Promise<void> {
  const adminEmail = 'admin@uptc.edu.co';
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'password123';
  const existingAdmin = await userRepository.findByEmail(adminEmail);
  
  if (!existingAdmin) {
    console.log('[SEED] Creating default admin user...');
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const now = new Date();
    
    await userRepository.create({
      nombre: 'Administrador',
      correo: adminEmail,
      password: hashedPassword,
      rol: 'admin',
      apodo: 'admin',
      puntos: 100,
      estaActivo: true,
      isVerified: true,
      failedLoginAttempts: 0,
      lockUntil: null,
      twoFactorEnabled: false,
      createdAt: now,
      updatedAt: now,
    });
    console.log('[SEED] Default admin user created successfully');
  } else {
    console.log('[SEED] Admin user already exists');
  }
}

app.get('/health', (_req, res) => {
  res.status(200).json({ message: 'auth-service online' });
});

app.post('/api/auth/login', (req, res, next) => authController.login(req, res, next));
app.post('/api/auth/register', (req, res, next) => authController.register(req, res, next));
app.post('/api/auth/verify-otp', (req, res, next) => authController.verifyOtp(req, res, next));
app.post('/api/auth/verify-2fa', (req, res, next) => authController.verify2fa(req, res, next));
app.post('/api/auth/google/callback', (req, res, next) => authController.googleCallback(req, res, next));

app.get('/api/auth/me', authenticate, (req, res, next) => authController.me(req, res, next));
app.get('/api/auth/me/puntos', authenticate, (req, res, next) => authController.puntos(req, res, next));
app.put('/api/auth/profile', authenticate, (req, res, next) => authController.updateProfile(req, res, next));

// Swagger API Documentation
const swaggerDocument = yaml.load(path.join(__dirname, 'swagger.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Internal Mesh Endpoints
app.get('/api/auth/internal/users/:userId/points', internalMeshAuth, (req, res, next) => authController.internalGetPoints(req, res, next));
app.get('/api/auth/internal/users/:userId/profile', internalMeshAuth, (req, res, next) => authController.internalGetProfile(req, res, next));
app.patch('/api/auth/internal/users/:userId/deduct-points', internalMeshAuth, (req, res, next) => authController.internalDeductPoints(req, res, next));
app.patch('/api/auth/internal/users/:userId/add-points', internalMeshAuth, (req, res, next) => authController.internalAddPoints(req, res, next));

app.use(errorHandler);

const bootstrap = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    await seedDefaultAdmin();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  console.log('Shutting down auth-service...');
  await mongoose.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down auth-service...');
  await mongoose.disconnect();
  process.exit(0);
});

bootstrap();
