import { SupabaseClient } from '@supabase/supabase-js';
import { IProfileRepository, User, UserProps } from '@3x/domain';
import { Database } from '../supabase/types';

type ProfileRow = Database['public']['Tables']['x3_profiles']['Row'];

function mapRowToUser(row: ProfileRow): User {
  return new User({
    id: row.id,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    role: row.role as UserProps['role'],
    storeId: row.store_id,
    xpTotal: row.xp_total,
    currentLevel: row.current_level,
    streakDays: row.streak_days,
    lastActiveDate: row.last_active_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export class SupabaseProfileRepository implements IProfileRepository {
  constructor(private client: SupabaseClient<Database>) {}

  async findById(id: string): Promise<User | null> {
    const { data, error } = await this.client
      .from('x3_profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return mapRowToUser(data);
  }

  async findByStoreId(storeId: string): Promise<User[]> {
    const { data, error } = await this.client
      .from('x3_profiles')
      .select('*')
      .eq('store_id', storeId)
      .order('xp_total', { ascending: false });

    if (error || !data) return [];
    return data.map(mapRowToUser);
  }

  async updateXP(userId: string, newTotal: number, newLevel: number): Promise<void> {
    await this.client
      .from('x3_profiles')
      .update({ xp_total: newTotal, current_level: newLevel })
      .eq('id', userId);
  }

  async updateStreak(userId: string, streakDays: number, lastActiveDate: string): Promise<void> {
    await this.client
      .from('x3_profiles')
      .update({ streak_days: streakDays, last_active_date: lastActiveDate })
      .eq('id', userId);
  }

  async updateProfile(userId: string, data: { fullName?: string; avatarUrl?: string }): Promise<void> {
    const update: Record<string, string> = {};
    if (data.fullName) update.full_name = data.fullName;
    if (data.avatarUrl) update.avatar_url = data.avatarUrl;
    await this.client.from('x3_profiles').update(update).eq('id', userId);
  }
}
