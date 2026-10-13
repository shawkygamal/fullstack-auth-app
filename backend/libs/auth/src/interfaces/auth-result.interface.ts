import { UserProfile } from "@auth-app/lib/user";

export interface AuthenticatedSession {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

export interface RefreshedAccess {
  accessToken: string;
  /** Present only when the refresh token was rotated; the client must then store the new one. */
  refreshToken?: string;
}
