import { IProfileRepository, IGameRepository, XPScore, XPAwardedEvent, GameLevelAdvancedEvent } from '@3x/domain';
import { XPSourceType } from '@3x/shared';
import { EventBus } from '../events/EventBus';

export interface AwardXPInput {
  userId: string;
  amount: number;
  reason: string;
  sourceType: XPSourceType;
  sourceId: string;
}

export class AwardXPUseCase {
  constructor(
    private profileRepo: IProfileRepository,
    private gameRepo: IGameRepository,
    private eventBus: EventBus,
  ) {}

  async execute(input: AwardXPInput): Promise<{ newTotal: number; newLevel: number; leveledUp: boolean }> {
    const user = await this.profileRepo.findById(input.userId);
    if (!user) throw new Error('User not found');

    // Idempotent: awardXP returns null if already awarded for this source
    const tx = await this.gameRepo.awardXP(
      input.userId,
      input.amount,
      input.reason,
      input.sourceType,
      input.sourceId,
    );

    if (!tx) {
      return { newTotal: user.xpTotal, newLevel: user.currentLevel, leveledUp: false };
    }

    const oldScore = new XPScore(user.xpTotal);
    const newScore = oldScore.add(input.amount);
    const leveledUp = newScore.currentLevel > oldScore.currentLevel;

    await this.profileRepo.updateXP(input.userId, newScore.total, newScore.currentLevel);

    await this.eventBus.publish(new XPAwardedEvent({
      userId: input.userId,
      amount: input.amount,
      reason: input.reason,
      newTotal: newScore.total,
    }));

    if (leveledUp) {
      await this.eventBus.publish(new GameLevelAdvancedEvent({
        userId: input.userId,
        oldLevel: oldScore.currentLevel,
        newLevel: newScore.currentLevel,
      }));
    }

    return {
      newTotal: newScore.total,
      newLevel: newScore.currentLevel,
      leveledUp,
    };
  }
}
