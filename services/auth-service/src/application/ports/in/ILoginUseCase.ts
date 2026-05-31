import { LoginResult } from '../out/AuthTypes';

export interface LoginInput {
  correo: string;
  password: string;
}

export interface ILoginUseCase {
  execute(input: LoginInput): Promise<LoginResult>;
}
