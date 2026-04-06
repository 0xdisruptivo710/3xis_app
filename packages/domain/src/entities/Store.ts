export interface StoreProps {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  createdAt: string;
}

export class Store {
  constructor(private readonly props: StoreProps) {}

  get id() { return this.props.id; }
  get name() { return this.props.name; }
  get city() { return this.props.city; }
  get state() { return this.props.state; }

  get displayLocation(): string {
    if (this.props.city && this.props.state) {
      return `${this.props.city}/${this.props.state}`;
    }
    return this.props.city || this.props.state || '';
  }

  toJSON(): StoreProps {
    return { ...this.props };
  }
}
