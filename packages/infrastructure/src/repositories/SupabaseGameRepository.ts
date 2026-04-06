import { SupabaseClient } from '@supabase/supabase-js';
import { IGameRepository, GameLevel, Badge, XPTransaction } from '@3x/domain';
import { XPSourceType, BadgeType } from '@3x/shared';
import { Database } from '../supabase/types';

export class SupabaseGameRepository implements IGameRepository {
  constructor(private client: SupabaseClient<Database>) {}

  async findAllLevels(): Promise<GameLevel[]> {
    const { data, error } = await this.client
      .from('x3_game_levels')
      .select('*')
      .order('level_number');

    if (error || !data) return [];
    return data.map(row => new GameLevel({
      id: row.id,
      levelNumber: row.level_number,
      name: row.name,
      xpRequired: row.xp_required,
      description: row.description,
      iconUrl: row.icon_url,
    }));
  }

  async findUserBadges(userId: string): Promise<Badge[]> {
    const { data, error } = await this.client
      .from('x3_user_badges')
      .select('*, x3_badges(*)')
      .eq('user_id', userId);

    if (error || !data) return [];
    return data.map((row: any) => new Badge({
      id: row.badges.id,
      name: row.badges.name,
      description: row.badges.description,
      iconUrl: row.badges.icon_url,
      iconLockedUrl: row.badges.icon_locked_url,
      badgeType: row.badges.badge_type as BadgeType,
      createdAt: row.badges.created_at,
    }));
  }

  async findXPTransactions(userId: string, limit = 10): Promise<XPTransaction[]> {
    const { data, error } = await this.client
      .from('x3_xp_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data.map(row => new XPTransaction({
      id: row.id,
      userId: row.user_id,
      amount: row.amount,
      reason: row.reason,
      sourceType: row.source_type as XPSourceType,
      sourceId: row.source_id,
      createdAt: row.created_at,
    }));
  }

  async awardXP(
    userId: string,
    amount: number,
    reason: string,
    sourceType: XPSourceType,
    sourceId: string,
  ): Promise<XPTransaction | null> {
    const { data, error } = await this.client
      .from('x3_xp_transactions')
      .upsert(
        { user_id: userId, amount, reason, source_type: sourceType, source_id: sourceId },
        { onConflict: 'user_id,source_type,source_id', ignoreDuplicates: true }
      )
      .select()
      .single();

    if (error || !data) return null;
    return new XPTransaction({
      id: data.id,
      userId: data.user_id,
      amount: data.amount,
      reason: data.reason,
      sourceType: data.source_type as XPSourceType,
      sourceId: data.source_id,
      createdAt: data.created_at,
    });
  }

  async findLeaderboard(
    storeId: string,
    period: 'weekly' | 'monthly'
  ): Promise<{ userId: string; fullName: string; avatarUrl: string | null; xp: number }[]> {
    const now = new Date();
    let startDate: string;

    if (period === 'weekly') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(now.setDate(diff)).toISOString().split('T')[0];
    } else {
      startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    }

    const { data, error } = await this.client.rpc('get_leaderboard', {
      p_store_id: storeId,
      p_start_date: startDate,
    });

    if (error || !data) return [];
    return (data as any[]).map(row => ({
      userId: row.user_id,
      fullName: row.full_name,
      avatarUrl: row.avatar_url,
      xp: row.total_xp,
    }));
  }
}
