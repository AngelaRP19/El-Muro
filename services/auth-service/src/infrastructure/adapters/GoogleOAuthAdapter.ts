import { IGoogleOAuthPort, GoogleUserInfo } from '../../application/ports/out/IGoogleOAuthPort';

export class GoogleOAuthAdapter implements IGoogleOAuthPort {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly callbackUrl: string;

  constructor(clientId: string, clientSecret: string, callbackUrl: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.callbackUrl = callbackUrl;
  }

  async exchangeCode(code: string): Promise<GoogleUserInfo> {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.callbackUrl,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.error('Google OAuth Exchange Failed:', tokenResponse.status, errText);
      throw new Error(`Error al intercambiar código con Google: ${errText}`);
    }

    const tokenData = await tokenResponse.json() as { access_token: string };

    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userInfoResponse.ok) {
      throw new Error('Error al obtener información del usuario de Google');
    }

    return userInfoResponse.json() as Promise<GoogleUserInfo>;
  }
}
