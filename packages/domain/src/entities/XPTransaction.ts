import { XPSourceType } from '@3x/shared';

export interface XPTransactionProps {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  sourceType: XPSourceType;
  sourceId: string | null;
  createdAt: string;
}

export class XPTransaction {
  constructor(private readonly props: XPTransactionProps) {}

  get id() { return this.props.id; }
  get userId() { return this.props.userId; }
  get amount() { return this.props.amount; }
  get reason() { return this.props.reason; }
  get sourceType() { return this.props.sourceType; }
  get sourceId() { return this.props.sourceId; }
  get createdAt() { return this.props.createdAt; }

  toJSON(): XPTransactionProps {
    return { ...this.props };
  }
}
