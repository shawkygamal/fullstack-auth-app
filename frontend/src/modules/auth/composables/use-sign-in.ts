import { authService } from '../apis/AuthService';
import { useAuthRequest } from './use-auth-request';

export const useSignIn = () => useAuthRequest(authService.signIn);
