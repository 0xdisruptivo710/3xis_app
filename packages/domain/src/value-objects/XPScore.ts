import { LEVEL_THRESHOLDS } from '@3x/shared';

export class XPScore {
  constructor(private readonly value: number) {
    if (value < 0) throw new Error('XP cannot be negative');
  }

  get total(): number {
    return this.value;
  }

  get currentLevel(): number {
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (this.value >= LEVEL_THRESHOLDS[i].xpRequired) {
        return LEVEL_THRESHOLDS[i].level;
      }
    }
    return 1;
  }

  get currentLevelName(): string {
    const level = LEVEL_THRESHOLDS.find(l => l.level === this.currentLevel);
    return level?.name ?? 'Iniciante SDR';
  }

  get progressToNextLevel(): number {
    const currentIdx = this.currentLevel - 1;
    if (currentIdx >= LEVEL_THRESHOLDS.length - 1) return 100;

    const currentThreshold = LEVEL_THRESHOLDS[currentIdx].xpRequired;
    const nextThreshold = LEVEL_THRESHOLDS[currentIdx + 1].xpRequired;
    const range = nextThreshold - currentThreshold;
    const progress = this.value - currentThreshold;

    return Math.min(Math.round((progress / range) * 100), 100);
  }

  get xpToNextLevel(): number {
    const currentIdx = this.currentLevel - 1;
    if (currentIdx >= LEVEL_THRESHOLDS.length - 1) return 0;
    return LEVEL_THRESHOLDS[currentIdx + 1].xpRequired - this.value;
  }

  add(amount: number): XPScore {
    return new XPScore(this.value + amount);
  }
}
