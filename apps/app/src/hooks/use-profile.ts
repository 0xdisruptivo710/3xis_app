'use client';

import { useAuthStore } from '@/stores/auth-store';
import { LEVEL_THRESHOLDS } from '@3x/shared';

export function useProfile() {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return {
      user: null,
      levelName: '',
      progressToNextLevel: 0,
      xpToNextLevel: 0,
    };
  }

  const currentThreshold = LEVEL_THRESHOLDS.find(
    (l) => l.level === user.currentLevel
  );
  const nextThreshold = LEVEL_THRESHOLDS.find(
    (l) => l.level === user.currentLevel + 1
  );

  const levelName = currentThreshold?.name ?? 'Iniciante SDR';

  let progressToNextLevel = 100;
  let xpToNextLevel = 0;

  if (nextThreshold && currentThreshold) {
    const range = nextThreshold.xpRequired - currentThreshold.xpRequired;
    const progress = user.xpTotal - currentThreshold.xpRequired;
    progressToNextLevel = Math.min(Math.round((progress / range) * 100), 100);
    xpToNextLevel = nextThreshold.xpRequired - user.xpTotal;
  }

  return {
    user,
    levelName,
    progressToNextLevel,
    xpToNextLevel,
  };
}
