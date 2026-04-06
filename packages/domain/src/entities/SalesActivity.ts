export interface SalesActivityProps {
  id: string;
  userId: string;
  activityDate: string;
  callsMade: number;
  contactsReached: number;
  appointmentsSet: number;
  testDrives: number;
  proposalsSent: number;
  salesClosed: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export class SalesActivity {
  constructor(private readonly props: SalesActivityProps) {}

  get id() { return this.props.id; }
  get userId() { return this.props.userId; }
  get activityDate() { return this.props.activityDate; }
  get callsMade() { return this.props.callsMade; }
  get contactsReached() { return this.props.contactsReached; }
  get appointmentsSet() { return this.props.appointmentsSet; }
  get testDrives() { return this.props.testDrives; }
  get proposalsSent() { return this.props.proposalsSent; }
  get salesClosed() { return this.props.salesClosed; }
  get notes() { return this.props.notes; }

  get totalActivities(): number {
    return (
      this.props.callsMade +
      this.props.contactsReached +
      this.props.appointmentsSet +
      this.props.testDrives +
      this.props.proposalsSent +
      this.props.salesClosed
    );
  }

  toJSON(): SalesActivityProps {
    return { ...this.props };
  }
}
