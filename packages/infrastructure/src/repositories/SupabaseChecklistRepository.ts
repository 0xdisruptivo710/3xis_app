import { SupabaseClient } from '@supabase/supabase-js';
import { IChecklistRepository, DailyChecklist, ChecklistItem } from '@3x/domain';
import { Database } from '../supabase/types';

export class SupabaseChecklistRepository implements IChecklistRepository {
  constructor(private client: SupabaseClient<Database>) {}

  async findByUserAndDate(userId: string, date: string): Promise<DailyChecklist | null> {
    const { data: checklist, error } = await this.client
      .from('x3_daily_checklists')
      .select('*, x3_daily_checklist_items(*)')
      .eq('user_id', userId)
      .eq('checklist_date', date)
      .single();

    if (error || !checklist) return null;

    const items = ((checklist as any).x3_daily_checklist_items || []).map((item: any) =>
      new ChecklistItem({
        id: item.id,
        checklistId: item.checklist_id,
        label: item.label,
        isCompleted: item.is_completed,
        completedAt: item.completed_at,
        isCustom: item.is_custom,
        xpReward: item.xp_reward,
        sortOrder: item.sort_order,
      })
    );

    return {
      id: checklist.id,
      userId: checklist.user_id,
      checklistDate: checklist.checklist_date,
      completed: checklist.completed,
      completedAt: checklist.completed_at,
      items: items.sort((a: ChecklistItem, b: ChecklistItem) => a.sortOrder - b.sortOrder),
    };
  }

  async createDailyChecklist(
    userId: string,
    date: string,
    items: { label: string; xpReward: number; sortOrder: number }[]
  ): Promise<DailyChecklist> {
    const { data: checklist, error: checklistError } = await this.client
      .from('x3_daily_checklists')
      .insert({ user_id: userId, checklist_date: date })
      .select()
      .single();

    if (checklistError || !checklist) {
      throw new Error(`Failed to create checklist: ${checklistError?.message}`);
    }

    const itemInserts = items.map(item => ({
      checklist_id: checklist.id,
      label: item.label,
      xp_reward: item.xpReward,
      sort_order: item.sortOrder,
    }));

    const { data: insertedItems, error: itemsError } = await this.client
      .from('x3_daily_checklist_items')
      .insert(itemInserts)
      .select();

    if (itemsError) throw new Error(`Failed to create checklist items: ${itemsError.message}`);

    const checklistItems = (insertedItems || []).map((item: any) =>
      new ChecklistItem({
        id: item.id,
        checklistId: item.checklist_id,
        label: item.label,
        isCompleted: item.is_completed,
        completedAt: item.completed_at,
        isCustom: item.is_custom,
        xpReward: item.xp_reward,
        sortOrder: item.sort_order,
      })
    );

    return {
      id: checklist.id,
      userId: checklist.user_id,
      checklistDate: checklist.checklist_date,
      completed: checklist.completed,
      completedAt: checklist.completed_at,
      items: checklistItems,
    };
  }

  async toggleItem(itemId: string, isCompleted: boolean): Promise<void> {
    await this.client
      .from('x3_daily_checklist_items')
      .update({
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
      } as any)
      .eq('id', itemId);
  }

  async markChecklistComplete(checklistId: string): Promise<void> {
    await this.client
      .from('x3_daily_checklists')
      .update({ completed: true, completed_at: new Date().toISOString() } as any)
      .eq('id', checklistId);
  }
}
