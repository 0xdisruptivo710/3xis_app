import { User } from '../entities/User';

export interface IProfileRepository {
  findById(id: string): Promise<User | null>;
  findByStoreId(storeId: string): Promise<User[]>;
  updateXP(userId: string, newTotal: number, newLevel: number): Promise<void>;
  updateStreak(userId: string, streakDays: number, lastActiveDate: string): Promise<void>;
  updateProfile(userId: string, data: { fullName?: string; avatarUrl?: string }): Promise<void>;
}
