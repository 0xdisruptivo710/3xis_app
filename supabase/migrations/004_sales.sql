-- /supabase/migrations/004_sales.sql
-- Tabelas de Acompanhamento de Vendas

CREATE TABLE public.sales_goals (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  store_id     UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  goal_type    TEXT NOT NULL CHECK (goal_type IN ('daily', 'weekly', 'monthly')),
  metric       TEXT NOT NULL CHECK (metric IN (
    'calls_made', 'contacts_reached', 'appointments_set',
    'test_drives', 'proposals_sent', 'sales_closed'
  )),
  target_value INTEGER NOT NULL,
  period_start DATE NOT NULL,
  period_end   DATE NOT NULL,
  created_by   UUID REFERENCES public.profiles(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.sales_activities (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  calls_made       INTEGER NOT NULL DEFAULT 0,
  contacts_reached INTEGER NOT NULL DEFAULT 0,
  appointments_set INTEGER NOT NULL DEFAULT 0,
  test_drives      INTEGER NOT NULL DEFAULT 0,
  proposals_sent   INTEGER NOT NULL DEFAULT 0,
  sales_closed     INTEGER NOT NULL DEFAULT 0,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, activity_date)
);

CREATE TRIGGER sales_activities_updated_at
  BEFORE UPDATE ON public.sales_activities
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
