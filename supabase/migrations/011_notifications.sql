-- /supabase/migrations/011_notifications.sql
-- Tabelas de Notificações Web Push

CREATE TABLE public.push_subscriptions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint   TEXT NOT NULL UNIQUE,
  p256dh_key TEXT NOT NULL,
  auth_key   TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.notification_preferences (
  user_id             UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  morning_ritual      BOOLEAN NOT NULL DEFAULT TRUE,
  morning_ritual_time TIME NOT NULL DEFAULT '07:00',
  daily_goal_reminder BOOLEAN NOT NULL DEFAULT TRUE,
  checklist_reminder  BOOLEAN NOT NULL DEFAULT TRUE,
  checklist_time      TIME NOT NULL DEFAULT '08:30',
  streak_warning      BOOLEAN NOT NULL DEFAULT TRUE,
  level_up            BOOLEAN NOT NULL DEFAULT TRUE,
  new_content         BOOLEAN NOT NULL DEFAULT TRUE
);
