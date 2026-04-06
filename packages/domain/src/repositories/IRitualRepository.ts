import { Ritual } from '../entities/Ritual';

export interface UserDailyRitual {
  id: string;
  userId: string;
  ritualId: string;
  ritualDate: string;
  completedAt: string;
}

export interface IRitualRepository {
  findAllActive(): Promise<Ritual[]>;
  findCompletedByUserAndDate(userId: string, date: string): Promise<UserDailyRitual[]>;
  completeRitual(userId: string, ritualId: string, date: string): Promise<UserDailyRitual>;
}
