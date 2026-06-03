// src/hooks/useUser.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface CurrentUser {
  id:        string;
  name:      string;
  email:     string;
  avatarUrl: string | null;
}

export function useUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);

  const loadUser = async (uid: string, email?: string) => {
    // Create profile row if it doesn't exist yet (no trigger in simplified schema)
    await supabase.from('profiles').upsert(
      { id: uid, name: email?.split('@')[0] ?? 'User' },
      { onConflict: 'id', ignoreDuplicates: true }
    );

    const { data } = await supabase
      .from('profiles')
      .select('name, avatar_url')
      .eq('id', uid)
      .single();

    setUser({
      id:        uid,
      name:      data?.name      ?? email?.split('@')[0] ?? 'User',
      email:     email           ?? '',
      avatarUrl: data?.avatar_url ?? null,
    });
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u) loadUser(u.id, u.email);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) loadUser(session.user.id, session.user.email);
      else setUser(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const updateAvatar = (newUrl: string) => {
    setUser(prev => prev ? { ...prev, avatarUrl: newUrl } : prev);
  };

  return { user, updateAvatar };
}
