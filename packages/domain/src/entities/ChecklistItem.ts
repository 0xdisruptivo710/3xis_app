export interface ChecklistItemProps {
  id: string;
  checklistId: string;
  label: string;
  isCompleted: boolean;
  completedAt: string | null;
  isCustom: boolean;
  xpReward: number;
  sortOrder: number;
}

export class ChecklistItem {
  constructor(private readonly props: ChecklistItemProps) {}

  get id() { return this.props.id; }
  get checklistId() { return this.props.checklistId; }
  get label() { return this.props.label; }
  get isCompleted() { return this.props.isCompleted; }
  get completedAt() { return this.props.completedAt; }
  get isCustom() { return this.props.isCustom; }
  get xpReward() { return this.props.xpReward; }
  get sortOrder() { return this.props.sortOrder; }

  toJSON(): ChecklistItemProps {
    return { ...this.props };
  }
}
