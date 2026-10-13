/** A user as the rest of the app sees it: a plain object, never a Mongoose document. */
export interface UserProfile {
  id: string;
  email: string;
  name: string;
}

export interface UserWithPasswordHash extends UserProfile {
  passwordHash: string;
}
