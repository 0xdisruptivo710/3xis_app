export interface GameLevelProps {
  id: number;
  levelNumber: number;
  name: string;
  xpRequired: number;
  description: string | null;
  iconUrl: string | null;
}

export class GameLevel {
  constructor(private readonly props: GameLevelProps) {}

  get id() { return this.props.id; }
  get levelNumber() { return this.props.levelNumber; }
  get name() { return this.props.name; }
  get xpRequired() { return this.props.xpRequired; }
  get description() { return this.props.description; }
  get iconUrl() { return this.props.iconUrl; }

  isUnlockedWith(xp: number): boolean {
    return xp >= this.props.xpRequired;
  }

  toJSON(): GameLevelProps {
    return { ...this.props };
  }
}
