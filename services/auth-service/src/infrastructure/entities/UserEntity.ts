import mongoose, { Schema, Document } from 'mongoose';

export interface IUserDocument extends Document {
  nombre: string;
  correo: string;
  password: string;
  rol: 'admin' | 'estudiante';
  apodo: string;
  puntos: number;
  estaActivo: boolean;
  isVerified: boolean;
  failedLoginAttempts: number;
  lockUntil: Date | null;
  twoFactorSecret?: string;
  twoFactorEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    correo: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-zA-Z0-9._%+-]+@uptc\.edu\.co$/, 'El correo debe ser institucional (@uptc.edu.co)'],
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    rol: {
      type: String,
      enum: ['admin', 'estudiante'],
      required: true,
      default: 'estudiante',
    },
    apodo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    puntos: {
      type: Number,
      default: 0,
      required: true,
      min: 0,
    },
    estaActivo: {
      type: Boolean,
      default: true,
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
      required: true,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
      required: true,
      min: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
    twoFactorSecret: {
      type: String,
      select: false,
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const UserModel = mongoose.model<IUserDocument>('User', userSchema);
