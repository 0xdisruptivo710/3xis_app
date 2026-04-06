export interface DomainEvent {
  eventName: string;
  occurredAt: Date;
  payload: Record<string, unknown>;
}

export class ChecklistCompletedEvent implements DomainEvent {
  readonly eventName = 'ChecklistCompleted';
  readonly occurredAt = new Date();
  constructor(readonly payload: { userId: string; checklistId: string; date: string }) {}
}

export class GameLevelAdvancedEvent implements DomainEvent {
  readonly eventName = 'GameLevelAdvanced';
  readonly occurredAt = new Date();
  constructor(readonly payload: { userId: string; oldLevel: number; newLevel: number }) {}
}

export class DailyStreakAchievedEvent implements DomainEvent {
  readonly eventName = 'DailyStreakAchieved';
  readonly occurredAt = new Date();
  constructor(readonly payload: { userId: string; streakDays: number }) {}
}

export class SalesActivityLoggedEvent implements DomainEvent {
  readonly eventName = 'SalesActivityLogged';
  readonly occurredAt = new Date();
  constructor(readonly payload: { userId: string; activityId: string; date: string }) {}
}

export class MorningRitualCompletedEvent implements DomainEvent {
  readonly eventName = 'MorningRitualCompleted';
  readonly occurredAt = new Date();
  constructor(readonly payload: { userId: string; ritualId: string }) {}
}

export class XPAwardedEvent implements DomainEvent {
  readonly eventName = 'XPAwarded';
  readonly occurredAt = new Date();
  constructor(readonly payload: { userId: string; amount: number; reason: string; newTotal: number }) {}
}
