import { ISalesRepository, SalesActivityLoggedEvent } from '@3x/domain';
import { CreateSalesActivityDTO, SalesActivityResponseDTO } from '../dtos/SalesDTO';
import { EventBus } from '../events/EventBus';

export class LogSalesActivityUseCase {
  constructor(
    private salesRepo: ISalesRepository,
    private eventBus: EventBus,
  ) {}

  async execute(dto: CreateSalesActivityDTO): Promise<SalesActivityResponseDTO> {
    const activity = await this.salesRepo.upsert({
      userId: dto.userId,
      activityDate: dto.activityDate,
      callsMade: dto.callsMade,
      contactsReached: dto.contactsReached,
      appointmentsSet: dto.appointmentsSet,
      testDrives: dto.testDrives,
      proposalsSent: dto.proposalsSent,
      salesClosed: dto.salesClosed,
      notes: dto.notes,
    });

    await this.eventBus.publish(new SalesActivityLoggedEvent({
      userId: dto.userId,
      activityId: activity.id,
      date: dto.activityDate,
    }));

    return {
      id: activity.id,
      activityDate: activity.activityDate,
      callsMade: activity.callsMade,
      contactsReached: activity.contactsReached,
      appointmentsSet: activity.appointmentsSet,
      testDrives: activity.testDrives,
      proposalsSent: activity.proposalsSent,
      salesClosed: activity.salesClosed,
      notes: activity.notes,
      totalActivities: activity.totalActivities,
    };
  }
}
