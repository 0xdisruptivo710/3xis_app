import { IRitualRepository, MorningRitualCompletedEvent } from '@3x/domain';
import { EventBus } from '../events/EventBus';

export class CompleteRitualUseCase {
  constructor(
    private ritualRepo: IRitualRepository,
    private eventBus: EventBus,
  ) {}

  async execute(userId: string, ritualId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    await this.ritualRepo.completeRitual(userId, ritualId, today);

    await this.eventBus.publish(new MorningRitualCompletedEvent({
      userId,
      ritualId,
    }));
  }
}
