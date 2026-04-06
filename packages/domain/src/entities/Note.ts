export interface NoteProps {
  id: string;
  userId: string;
  categoryId: string | null;
  title: string;
  content: string;
  isPinned: boolean;
  isShared: boolean;
  createdAt: string;
  updatedAt: string;
}

export class Note {
  constructor(private readonly props: NoteProps) {}

  get id() { return this.props.id; }
  get userId() { return this.props.userId; }
  get categoryId() { return this.props.categoryId; }
  get title() { return this.props.title; }
  get content() { return this.props.content; }
  get isPinned() { return this.props.isPinned; }
  get isShared() { return this.props.isShared; }

  get preview(): string {
    return this.props.content.slice(0, 120) + (this.props.content.length > 120 ? '...' : '');
  }

  toJSON(): NoteProps {
    return { ...this.props };
  }
}
