-- /supabase/migrations/008_checklist.sql
-- Tabelas de Checklist Diário

CREATE TABLE public.checklist_templates (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id   UUID REFERENCES public.stores(id),
  title      TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.checklist_template_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES public.checklist_templates(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  xp_reward   INTEGER NOT NULL DEFAULT 10,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE public.daily_checklists (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  checklist_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed      BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, checklist_date)
);

CREATE TABLE public.daily_checklist_items (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checklist_id UUID NOT NULL REFERENCES public.daily_checklists(id) ON DELETE CASCADE,
  label        TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  is_custom    BOOLEAN NOT NULL DEFAULT FALSE,
  xp_reward    INTEGER NOT NULL DEFAULT 10,
  sort_order   INTEGER NOT NULL DEFAULT 0
);
