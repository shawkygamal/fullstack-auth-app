import { authService } from '../apis/AuthService';
import { useAuthRequest } from './use-auth-request';

export const useSignUp = () => useAuthRequest(authService.signUp);
