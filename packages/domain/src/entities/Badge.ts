import { BadgeType } from '@3x/shared';

export interface BadgeProps {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  iconLockedUrl: string;
  badgeType: BadgeType;
  createdAt: string;
}

export class Badge {
  constructor(private readonly props: BadgeProps) {}

  get id() { return this.props.id; }
  get name() { return this.props.name; }
  get description() { return this.props.description; }
  get iconUrl() { return this.props.iconUrl; }
  get iconLockedUrl() { return this.props.iconLockedUrl; }
  get badgeType() { return this.props.badgeType; }

  toJSON(): BadgeProps {
    return { ...this.props };
  }
}
