// src/services/authService.ts
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { User, LoginFormData, AuthProvider } from '../types';

function mapSupabaseUser(u: SupabaseUser): User {
  return {
    id: u.id,
    name: (u.user_metadata?.name as string) ?? u.email?.split('@')[0] ?? 'User',
    email: u.email ?? '',
    avatar: u.user_metadata?.avatar_url as string | undefined,
    createdAt: u.created_at,
  };
}

/**
 * Sends a magic-link / OTP to the given email or phone.
 * The user is NOT logged in yet — they become authenticated
 * once they click the link (handled by onAuthStateChange in App.tsx).
 */
export async function loginWithIdentifier(
  data: LoginFormData
): Promise<{ success: boolean; otpSent?: boolean; user?: User; error?: string }> {
  const iden = data.identifier.trim();

  if (!iden || iden.length < 5) {
    return { success: false, error: 'Por favor ingresa un email o teléfono válido.' };
  }

  const isEmail = iden.includes('@');

  if (isEmail) {
    const { error } = await supabase.auth.signInWithOtp({
      email: iden,
      options: { shouldCreateUser: true },
    });
    if (error) return { success: false, error: error.message };
    return { success: true, otpSent: true };
  }

  // Phone OTP — requires "Phone" provider enabled in Supabase Auth settings
  const { error } = await supabase.auth.signInWithOtp({ phone: iden });
  if (error) return { success: false, error: error.message };
  return { success: true, otpSent: true };
}

/**
 * Initiates an OAuth redirect. The browser will navigate away;
 * authentication is completed when the user returns and
 * onAuthStateChange fires in App.tsx.
 */
export async function loginWithProvider(
  provider: AuthProvider
): Promise<{ success: boolean; error?: string }> {
  if (provider === 'email') {
    return { success: false, error: 'Use loginWithIdentifier for email login.' };
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: window.location.origin },
  });

  if (error) return { success: false, error: error.message };
  return { success: true }; // browser will redirect immediately
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return mapSupabaseUser(user);
}

export function validateIdentifier(value: string): string | null {
  if (!value.trim()) return 'Este campo es requerido.';

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[\+]?[\d\s\-\(\)]{7,15}$/;

  if (!emailRegex.test(value) && !phoneRegex.test(value)) {
    return 'Ingresa un email o número de teléfono válido.';
  }
  return null;
}
