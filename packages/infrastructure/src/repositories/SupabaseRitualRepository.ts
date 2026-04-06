import { SupabaseClient } from '@supabase/supabase-js';
import { IRitualRepository, Ritual, UserDailyRitual } from '@3x/domain';
import { RitualType } from '@3x/shared';
import { Database } from '../supabase/types';

export class SupabaseRitualRepository implements IRitualRepository {
  constructor(private client: SupabaseClient<Database>) {}

  async findAllActive(): Promise<Ritual[]> {
    const { data, error } = await this.client
      .from('x3_rituals')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error || !data) return [];
    return data.map(row => new Ritual({
      id: row.id,
      title: row.title,
      description: row.description,
      ritualType: row.ritual_type as RitualType,
      durationMin: row.duration_min,
      benefit: row.benefit,
      icon: row.icon,
      xpReward: row.xp_reward,
      isActive: row.is_active,
      sortOrder: row.sort_order,
    }));
  }

  async findCompletedByUserAndDate(userId: string, date: string): Promise<UserDailyRitual[]> {
    const { data, error } = await this.client
      .from('x3_user_daily_rituals')
      .select('*')
      .eq('user_id', userId)
      .eq('ritual_date', date);

    if (error || !data) return [];
    return data.map(row => ({
      id: row.id,
      userId: row.user_id,
      ritualId: row.ritual_id,
      ritualDate: row.ritual_date,
      completedAt: row.completed_at,
    }));
  }

  async completeRitual(userId: string, ritualId: string, date: string): Promise<UserDailyRitual> {
    const { data, error } = await this.client
      .from('x3_user_daily_rituals')
      .upsert(
        { user_id: userId, ritual_id: ritualId, ritual_date: date },
        { onConflict: 'user_id,ritual_id,ritual_date' }
      )
      .select()
      .single();

    if (error || !data) throw new Error(`Failed to complete ritual: ${error?.message}`);
    return {
      id: data.id,
      userId: data.user_id,
      ritualId: data.ritual_id,
      ritualDate: data.ritual_date,
      completedAt: data.completed_at,
    };
  }
}
