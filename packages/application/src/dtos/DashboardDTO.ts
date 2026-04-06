export interface DashboardDTO {
  user: {
    fullName: string;
    avatarUrl: string | null;
    xpTotal: number;
    currentLevel: number;
    levelName: string;
    progressToNextLevel: number;
    xpToNextLevel: number;
    streakDays: number;
    isStreakActive: boolean;
  };
  checklist: {
    totalItems: number;
    completedItems: number;
    progressPercent: number;
  } | null;
  ritualsCompleted: number;
  ritualsTotal: number;
  upcomingEvents: {
    id: string;
    title: string;
    startDatetime: string;
    eventType: string;
    color: string;
  }[];
  recentXP: {
    amount: number;
    reason: string;
    createdAt: string;
  }[];
}
