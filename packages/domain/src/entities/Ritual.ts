import { RitualType } from '@3x/shared';

export interface RitualProps {
  id: string;
  title: string;
  description: string;
  ritualType: RitualType;
  durationMin: number;
  benefit: string | null;
  icon: string;
  xpReward: number;
  isActive: boolean;
  sortOrder: number;
}

export class Ritual {
  constructor(private readonly props: RitualProps) {}

  get id() { return this.props.id; }
  get title() { return this.props.title; }
  get description() { return this.props.description; }
  get ritualType() { return this.props.ritualType; }
  get durationMin() { return this.props.durationMin; }
  get benefit() { return this.props.benefit; }
  get icon() { return this.props.icon; }
  get xpReward() { return this.props.xpReward; }

  toJSON(): RitualProps {
    return { ...this.props };
  }
}
