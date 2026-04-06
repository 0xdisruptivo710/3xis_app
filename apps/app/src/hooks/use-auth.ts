'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';

export function useAuth() {
  const { user, isLoading, setUser, setLoading } = useAuthStore();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        setUser(null);
        return;
      }

      const { data: profile } = await supabase
        .from('x3_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profile) {
        setUser({
          id: profile.id,
          fullName: profile.full_name ?? 'SDR',
          avatarUrl: profile.avatar_url ?? null,
          role: profile.role ?? 'sdr',
          storeId: profile.store_id ?? null,
          xpTotal: profile.xp_total ?? 0,
          currentLevel: profile.current_level ?? 1,
          streakDays: profile.streak_days ?? 0,
        });
      } else {
        // Profile doesn't exist yet — set minimal user from auth data
        setUser({
          id: authUser.id,
          fullName: authUser.user_metadata?.full_name ?? 'SDR',
          avatarUrl: authUser.user_metadata?.avatar_url ?? null,
          role: 'sdr',
          storeId: null,
          xpTotal: 0,
          currentLevel: 1,
          streakDays: 0,
        });
      }
    }

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          router.push('/login');
        } else if (event === 'SIGNED_IN') {
          getUser();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/login');
  }

  return { user, isLoading, signOut };
}
