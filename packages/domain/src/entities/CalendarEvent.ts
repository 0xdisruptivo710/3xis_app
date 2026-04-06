import { EventType } from '@3x/shared';

export interface CalendarEventProps {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  eventType: EventType;
  color: string;
  startDatetime: string;
  endDatetime: string | null;
  isAllDay: boolean;
  reminderMinutes: number;
  isTeamEvent: boolean;
  createdAt: string;
  updatedAt: string;
}

export class CalendarEvent {
  constructor(private readonly props: CalendarEventProps) {}

  get id() { return this.props.id; }
  get userId() { return this.props.userId; }
  get title() { return this.props.title; }
  get description() { return this.props.description; }
  get eventType() { return this.props.eventType; }
  get color() { return this.props.color; }
  get startDatetime() { return this.props.startDatetime; }
  get endDatetime() { return this.props.endDatetime; }
  get isAllDay() { return this.props.isAllDay; }
  get isTeamEvent() { return this.props.isTeamEvent; }

  isUpcoming(): boolean {
    return new Date(this.props.startDatetime) > new Date();
  }

  toJSON(): CalendarEventProps {
    return { ...this.props };
  }
}
