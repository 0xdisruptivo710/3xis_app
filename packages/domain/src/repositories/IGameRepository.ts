import { GameLevel } from '../entities/GameLevel';
import { Badge } from '../entities/Badge';
import { XPTransaction } from '../entities/XPTransaction';
import { XPSourceType } from '@3x/shared';

export interface IGameRepository {
  findAllLevels(): Promise<GameLevel[]>;
  findUserBadges(userId: string): Promise<Badge[]>;
  findXPTransactions(userId: string, limit?: number): Promise<XPTransaction[]>;
  awardXP(userId: string, amount: number, reason: string, sourceType: XPSourceType, sourceId: string): Promise<XPTransaction | null>;
  findLeaderboard(storeId: string, period: 'weekly' | 'monthly'): Promise<{ userId: string; fullName: string; avatarUrl: string | null; xp: number }[]>;
}
