import { DomainEvent } from '@3x/domain';

type EventHandler = (event: DomainEvent) => Promise<void>;

export class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();

  subscribe(eventName: string, handler: EventHandler): void {
    const existing = this.handlers.get(eventName) || [];
    existing.push(handler);
    this.handlers.set(eventName, existing);
  }

  async publish(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventName) || [];
    await Promise.allSettled(handlers.map(h => h(event)));
  }
}
