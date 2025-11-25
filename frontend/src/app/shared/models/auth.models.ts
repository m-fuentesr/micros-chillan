export type UserRole = 'admin' | 'worker';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  avatarColor?: string;
}

