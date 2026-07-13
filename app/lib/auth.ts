import 'server-only';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from './supabase/server';
import { supabaseAdmin } from './supabase/admin';

export type AdminUser = {
  id: string;
  email: string | null;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
};

/**
 * Gate for every protected page/action. Resolves the logged-in Supabase user,
 * then confirms `profiles.is_admin = true` via the service role (a user cannot
 * self-promote — only the service role can set that flag). Redirects to /login
 * on any failure. Returns the admin's identity for display.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, username, display_name, avatar_url, is_admin')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.is_admin) redirect('/login?error=not_admin');

  return {
    id: user.id,
    email: user.email ?? null,
    username: profile.username,
    displayName: profile.display_name,
    avatarUrl: profile.avatar_url,
  };
}
