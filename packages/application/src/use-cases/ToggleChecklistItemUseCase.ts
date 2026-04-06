import { IChecklistRepository, ChecklistCompletedEvent } from '@3x/domain';
import { EventBus } from '../events/EventBus';

export class ToggleChecklistItemUseCase {
  constructor(
    private checklistRepo: IChecklistRepository,
    private eventBus: EventBus,
  ) {}

  async execute(userId: string, itemId: string, isCompleted: boolean): Promise<void> {
    await this.checklistRepo.toggleItem(itemId, isCompleted);

    if (isCompleted) {
      const today = new Date().toISOString().split('T')[0];
      const checklist = await this.checklistRepo.findByUserAndDate(userId, today);
      if (checklist) {
        const allDone = checklist.items.every(i => i.isCompleted);
        if (allDone) {
          await this.checklistRepo.markChecklistComplete(checklist.id);
          await this.eventBus.publish(new ChecklistCompletedEvent({
            userId,
            checklistId: checklist.id,
            date: today,
          }));
        }
      }
    }
  }
}
