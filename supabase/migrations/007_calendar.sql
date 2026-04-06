-- /supabase/migrations/007_calendar.sql
-- Tabelas de Calendário

CREATE TABLE public.calendar_events (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT,
  event_type       TEXT NOT NULL DEFAULT 'personal_reminder'
                   CHECK (event_type IN ('team_meeting','training','personal_reminder','goal','other')),
  color            TEXT DEFAULT '#FF6B00',
  start_datetime   TIMESTAMPTZ NOT NULL,
  end_datetime     TIMESTAMPTZ,
  is_all_day       BOOLEAN NOT NULL DEFAULT FALSE,
  reminder_minutes INTEGER DEFAULT 30,
  is_team_event    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER calendar_events_updated_at
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX calendar_events_user_date_idx
  ON public.calendar_events (user_id, start_datetime);
