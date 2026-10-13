import { http, type HttpClient } from '@/app/api/http';
import type { AuthenticatedUserInterface, AuthLoginType, AuthSignupType } from '../models';

class AuthService {
  constructor(private readonly http: HttpClient) {}

  signUp = (body: AuthSignupType) =>
    this.http.post<AuthenticatedUserInterface>('/auth/register', body, { authenticated: false });

  signIn = (body: AuthLoginType) =>
    this.http.post<AuthenticatedUserInterface>('/auth/login', body, { authenticated: false });
}

export const authService = new AuthService(http);
