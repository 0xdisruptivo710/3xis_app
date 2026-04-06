export class StreakCount {
  constructor(
    private readonly days: number,
    private readonly lastActiveDate: string | null
  ) {}

  get current(): number {
    return this.days;
  }

  get isActiveToday(): boolean {
    if (!this.lastActiveDate) return false;
    const today = new Date().toISOString().split('T')[0];
    return this.lastActiveDate === today;
  }

  get isAtRisk(): boolean {
    if (!this.lastActiveDate) return false;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    return this.lastActiveDate === yesterdayStr && !this.isActiveToday;
  }

  get hasStreakBonus(): boolean {
    return this.days > 0 && this.days % 7 === 0;
  }
}
