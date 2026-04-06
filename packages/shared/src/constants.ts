export const XP_REWARDS = {
  CHECKLIST_COMPLETE: 50,
  VIDEO_WATCHED: 30,
  SALES_LOG: 10,
  DAILY_GOAL: 100,
  WEEKLY_GOAL: 300,
  RITUAL_COMPLETE: 20,
  STREAK_7_DAYS: 200,
  PHASE_COMPLETE: 500,
  CHECKLIST_ITEM: 10,
} as const;

export const LEVEL_THRESHOLDS = [
  { level: 1, name: 'Iniciante SDR', xpRequired: 0 },
  { level: 2, name: 'Aprendiz de Vendas', xpRequired: 501 },
  { level: 3, name: 'Vendedora em Ascensão', xpRequired: 1501 },
  { level: 4, name: 'SDR Profissional', xpRequired: 3001 },
  { level: 5, name: 'Expert 3X', xpRequired: 5001 },
  { level: 6, name: 'Mestre das Vendas', xpRequired: 8001 },
] as const;

export const BRAND_COLORS = {
  primary: '#FF6B00',
  secondary: '#1A1A2E',
  accent: '#FFD700',
  surface: '#F8F8F8',
  onSurface: '#212121',
  success: '#00C853',
  warning: '#FFB300',
  error: '#D50000',
  muted: '#9E9E9E',
} as const;
