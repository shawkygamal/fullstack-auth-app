import type { UserInterface } from '@/app/models/user.interface';

export interface AuthenticatedUserInterface {
  accessToken: string;
  user: UserInterface;
}
