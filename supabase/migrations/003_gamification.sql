-- /supabase/migrations/003_gamification.sql
-- Tabelas de Gamificação: Níveis, Badges, Fases, Missões, XP

CREATE TABLE public.game_levels (
  id           SERIAL PRIMARY KEY,
  level_number INTEGER NOT NULL UNIQUE,
  name         TEXT NOT NULL,
  xp_required  INTEGER NOT NULL,
  description  TEXT,
  icon_url     TEXT
);

INSERT INTO public.game_levels (level_number, name, xp_required, description) VALUES
  (1, 'Iniciante SDR',          0,    'Seus primeiros passos na pré-venda'),
  (2, 'Aprendiz de Vendas',     501,  'Construindo as bases do sucesso'),
  (3, 'Vendedora em Ascensão',  1501, 'Evoluindo a cada dia'),
  (4, 'SDR Profissional',       3001, 'Dominando as técnicas de venda'),
  (5, 'Expert 3X',              5001, 'Referência na equipe'),
  (6, 'Mestre das Vendas',      8001, 'O topo da performance 3X');

CREATE TABLE public.badges (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  description     TEXT NOT NULL,
  icon_url        TEXT NOT NULL,
  icon_locked_url TEXT NOT NULL,
  badge_type      TEXT NOT NULL
                  CHECK (badge_type IN ('phase', 'streak', 'performance', 'special')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.game_phases (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phase_number INTEGER NOT NULL UNIQUE,
  title        TEXT NOT NULL,
  description  TEXT,
  badge_id     UUID REFERENCES public.badges(id),
  xp_reward    INTEGER NOT NULL DEFAULT 500,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.game_missions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phase_id     UUID NOT NULL REFERENCES public.game_phases(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT NOT NULL,
  mission_type TEXT NOT NULL CHECK (mission_type IN (
    'watch_videos', 'complete_checklist', 'log_sales',
    'complete_profile', 'read_scripts', 'favorite_scripts',
    'complete_rituals', 'streak_days', 'hit_daily_goal'
  )),
  target_count INTEGER NOT NULL DEFAULT 1,
  xp_reward    INTEGER NOT NULL DEFAULT 50,
  sort_order   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE public.user_mission_progress (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mission_id    UUID NOT NULL REFERENCES public.game_missions(id) ON DELETE CASCADE,
  current_count INTEGER NOT NULL DEFAULT 0,
  completed     BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at  TIMESTAMPTZ,
  UNIQUE(user_id, mission_id)
);

CREATE TABLE public.user_badges (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id  UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Histórico de XP com constraint de idempotência
CREATE TABLE public.xp_transactions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount      INTEGER NOT NULL,
  reason      TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN (
    'checklist', 'video', 'sales_log', 'daily_goal',
    'weekly_goal', 'ritual', 'streak', 'mission', 'manual'
  )),
  source_id   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, source_type, source_id)
);
