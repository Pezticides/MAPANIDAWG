import type { User } from '@supabase/supabase-js';

export const AUTH_CALLBACK_URL = 'ustpcampus://auth/callback';

export function isEmailVerified(user: User | null | undefined): boolean {
  return Boolean(user?.email_confirmed_at || user?.confirmed_at);
}
