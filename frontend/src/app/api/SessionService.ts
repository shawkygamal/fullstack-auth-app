import type { UserInterface } from '../models/user.interface';
import { http, type HttpClient } from './http';

/** The session routes every module relies on; signing in and up belong to the auth module. */
class SessionService {
  constructor(private readonly http: HttpClient) {}

  refresh = () => this.http.post<{ accessToken: string }>('/auth/refresh', undefined, { authenticated: false });

  signOut = () => this.http.post<void>('/auth/logout', undefined, { authenticated: false });

  getProfile = () => this.http.get<UserInterface>('/users/me');
}

export const sessionService = new SessionService(http);
