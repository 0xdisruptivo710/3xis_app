export type UserRole = 'sdr' | 'supervisor' | 'admin';

export type GoalType = 'daily' | 'weekly' | 'monthly';

export type SalesMetric =
  | 'calls_made'
  | 'contacts_reached'
  | 'appointments_set'
  | 'test_drives'
  | 'proposals_sent'
  | 'sales_closed';

export type XPSourceType =
  | 'checklist'
  | 'video'
  | 'sales_log'
  | 'daily_goal'
  | 'weekly_goal'
  | 'ritual'
  | 'streak'
  | 'mission'
  | 'manual';

export type BadgeType = 'phase' | 'streak' | 'performance' | 'special';

export type MissionType =
  | 'watch_videos'
  | 'complete_checklist'
  | 'log_sales'
  | 'complete_profile'
  | 'read_scripts'
  | 'favorite_scripts'
  | 'complete_rituals'
  | 'streak_days'
  | 'hit_daily_goal';

export type RitualType = 'mental' | 'physical' | 'professional';

export type EventType = 'team_meeting' | 'training' | 'personal_reminder' | 'goal' | 'other';

export type NoteCategory = 'Reunião' | 'Treinamento' | 'Ideia' | 'Cliente' | 'Pessoal';
