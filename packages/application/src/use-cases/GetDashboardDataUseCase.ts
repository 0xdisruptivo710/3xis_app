import { IProfileRepository, IChecklistRepository, IRitualRepository, IGameRepository, XPScore, StreakCount } from '@3x/domain';
import { LEVEL_THRESHOLDS } from '@3x/shared';
import { DashboardDTO } from '../dtos/DashboardDTO';

export class GetDashboardDataUseCase {
  constructor(
    private profileRepo: IProfileRepository,
    private checklistRepo: IChecklistRepository,
    private ritualRepo: IRitualRepository,
    private gameRepo: IGameRepository,
  ) {}

  async execute(userId: string): Promise<DashboardDTO> {
    const user = await this.profileRepo.findById(userId);
    if (!user) throw new Error('User not found');

    const today = new Date().toISOString().split('T')[0];
    const xpScore = new XPScore(user.xpTotal);
    const streak = new StreakCount(user.streakDays, user.lastActiveDate);

    const [checklist, rituals, allRituals, recentXP] = await Promise.all([
      this.checklistRepo.findByUserAndDate(userId, today),
      this.ritualRepo.findCompletedByUserAndDate(userId, today),
      this.ritualRepo.findAllActive(),
      this.gameRepo.findXPTransactions(userId, 5),
    ]);

    const checklistData = checklist
      ? {
          totalItems: checklist.items.length,
          completedItems: checklist.items.filter(i => i.isCompleted).length,
          progressPercent: checklist.items.length > 0
            ? Math.round((checklist.items.filter(i => i.isCompleted).length / checklist.items.length) * 100)
            : 0,
        }
      : null;

    return {
      user: {
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        xpTotal: user.xpTotal,
        currentLevel: xpScore.currentLevel,
        levelName: xpScore.currentLevelName,
        progressToNextLevel: xpScore.progressToNextLevel,
        xpToNextLevel: xpScore.xpToNextLevel,
        streakDays: user.streakDays,
        isStreakActive: streak.isActiveToday,
      },
      checklist: checklistData,
      ritualsCompleted: rituals.length,
      ritualsTotal: allRituals.length,
      upcomingEvents: [],
      recentXP: recentXP.map(tx => ({
        amount: tx.amount,
        reason: tx.reason,
        createdAt: tx.createdAt,
      })),
    };
  }
}
