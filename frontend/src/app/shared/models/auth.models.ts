export type UserRole = 'admin' | 'worker';

export interface AuthUser {
  id: number;
  supabaseUid: string;
  email: string;
  displayName: string;
  role: UserRole;
  estado: string;
  choferId: number | null;
}