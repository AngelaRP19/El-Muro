export interface GoogleUserInfo {
  email: string;
  name: string;
  picture?: string;
}

export interface IGoogleOAuthPort {
  exchangeCode(code: string): Promise<GoogleUserInfo>;
}
