import { UserRole } from '@3x/shared';

export interface UserProps {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  role: UserRole;
  storeId: string | null;
  xpTotal: number;
  currentLevel: number;
  streakDays: number;
  lastActiveDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export class User {
  constructor(private readonly props: UserProps) {}

  get id() { return this.props.id; }
  get fullName() { return this.props.fullName; }
  get avatarUrl() { return this.props.avatarUrl; }
  get role() { return this.props.role; }
  get storeId() { return this.props.storeId; }
  get xpTotal() { return this.props.xpTotal; }
  get currentLevel() { return this.props.currentLevel; }
  get streakDays() { return this.props.streakDays; }
  get lastActiveDate() { return this.props.lastActiveDate; }

  isAdmin(): boolean {
    return this.props.role === 'admin';
  }

  isSupervisor(): boolean {
    return this.props.role === 'supervisor';
  }

  isSdr(): boolean {
    return this.props.role === 'sdr';
  }

  canManageContent(): boolean {
    return this.props.role === 'admin' || this.props.role === 'supervisor';
  }

  toJSON(): UserProps {
    return { ...this.props };
  }
}
