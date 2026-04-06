import { ChecklistItem } from '../entities/ChecklistItem';

export interface DailyChecklist {
  id: string;
  userId: string;
  checklistDate: string;
  completed: boolean;
  completedAt: string | null;
  items: ChecklistItem[];
}

export interface IChecklistRepository {
  findByUserAndDate(userId: string, date: string): Promise<DailyChecklist | null>;
  createDailyChecklist(userId: string, date: string, items: { label: string; xpReward: number; sortOrder: number }[]): Promise<DailyChecklist>;
  toggleItem(itemId: string, isCompleted: boolean): Promise<void>;
  markChecklistComplete(checklistId: string): Promise<void>;
}
