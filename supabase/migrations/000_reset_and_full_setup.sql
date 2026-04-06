-- =============================================
-- 3X APP — FULL DATABASE SETUP (x3_ prefix)
-- Shared Supabase project: ALL 3X tables use x3_ prefix
-- to avoid conflicts with existing pharmacy tables.
-- DO NOT drop or modify any existing tables.
-- =============================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================
-- 2. UTILITY FUNCTION (x3_ prefixed)
-- =============================================

CREATE OR REPLACE FUNCTION public.x3_handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 3. STORES
-- =============================================

CREATE TABLE IF NOT EXISTS public.x3_stores (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  city       TEXT,
  state      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- 4. PROFILES (references shared auth.users)
-- =============================================

CREATE TABLE IF NOT EXISTS public.x3_profiles (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name        TEXT NOT NULL,
  avatar_url       TEXT,
  role             TEXT NOT NULL DEFAULT 'sdr'
                   CHECK (role IN ('sdr', 'supervisor', 'admin')),
  store_id         UUID REFERENCES public.x3_stores(id),
  xp_total         INTEGER NOT NULL DEFAULT 0,
  current_level    INTEGER NOT NULL DEFAULT 1,
  streak_days      INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER x3_profiles_updated_at
  BEFORE UPDATE ON public.x3_profiles
  FOR EACH ROW EXECUTE FUNCTION public.x3_handle_updated_at();

-- Auto-create x3_profiles row when a new user signs up (separate from pharmacy trigger)
CREATE OR REPLACE FUNCTION public.x3_handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.x3_profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Nova SDR'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_x3 ON auth.users;
CREATE TRIGGER on_auth_user_created_x3
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.x3_handle_new_user();

-- =============================================
-- 5. GAMIFICATION — Levels, Badges, Phases, Missions, XP
-- =============================================

-- Game Levels
CREATE TABLE IF NOT EXISTS public.x3_game_levels (
  id           SERIAL PRIMARY KEY,
  level_number INTEGER NOT NULL UNIQUE,
  name         TEXT NOT NULL,
  xp_required  INTEGER NOT NULL,
  description  TEXT,
  icon_url     TEXT
);

INSERT INTO public.x3_game_levels (level_number, name, xp_required, description) VALUES
  (1, 'Iniciante SDR',          0,    'Seus primeiros passos na pre-venda'),
  (2, 'Aprendiz de Vendas',     501,  'Construindo as bases do sucesso'),
  (3, 'Vendedora em Ascensao',  1501, 'Evoluindo a cada dia'),
  (4, 'SDR Profissional',       3001, 'Dominando as tecnicas de venda'),
  (5, 'Expert 3X',              5001, 'Referencia na equipe'),
  (6, 'Mestre das Vendas',      8001, 'O topo da performance 3X')
ON CONFLICT (level_number) DO NOTHING;

-- Badges
CREATE TABLE IF NOT EXISTS public.x3_badges (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  description     TEXT NOT NULL,
  icon_url        TEXT NOT NULL DEFAULT '/icons/badge-default.svg',
  icon_locked_url TEXT NOT NULL DEFAULT '/icons/badge-locked.svg',
  badge_type      TEXT NOT NULL
                  CHECK (badge_type IN ('phase', 'streak', 'performance', 'special')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Game Phases
CREATE TABLE IF NOT EXISTS public.x3_game_phases (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phase_number INTEGER NOT NULL UNIQUE,
  title        TEXT NOT NULL,
  description  TEXT,
  badge_id     UUID REFERENCES public.x3_badges(id),
  xp_reward    INTEGER NOT NULL DEFAULT 500,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Game Missions
CREATE TABLE IF NOT EXISTS public.x3_game_missions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phase_id     UUID NOT NULL REFERENCES public.x3_game_phases(id) ON DELETE CASCADE,
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

-- User Mission Progress
CREATE TABLE IF NOT EXISTS public.x3_user_mission_progress (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.x3_profiles(id) ON DELETE CASCADE,
  mission_id    UUID NOT NULL REFERENCES public.x3_game_missions(id) ON DELETE CASCADE,
  current_count INTEGER NOT NULL DEFAULT 0,
  completed     BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at  TIMESTAMPTZ,
  UNIQUE(user_id, mission_id)
);

-- User Badges
CREATE TABLE IF NOT EXISTS public.x3_user_badges (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id   UUID NOT NULL REFERENCES public.x3_profiles(id) ON DELETE CASCADE,
  badge_id  UUID NOT NULL REFERENCES public.x3_badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- XP Transactions (idempotent via unique constraint)
CREATE TABLE IF NOT EXISTS public.x3_xp_transactions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.x3_profiles(id) ON DELETE CASCADE,
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

-- =============================================
-- 6. SALES TRACKING
-- =============================================

CREATE TABLE IF NOT EXISTS public.x3_sales_goals (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES public.x3_profiles(id) ON DELETE SET NULL,
  store_id     UUID REFERENCES public.x3_stores(id) ON DELETE SET NULL,
  goal_type    TEXT NOT NULL CHECK (goal_type IN ('daily', 'weekly', 'monthly')),
  metric       TEXT NOT NULL CHECK (metric IN (
    'calls_made', 'contacts_reached', 'appointments_set',
    'test_drives', 'proposals_sent', 'sales_closed'
  )),
  target_value INTEGER NOT NULL,
  period_start DATE NOT NULL,
  period_end   DATE NOT NULL,
  created_by   UUID REFERENCES public.x3_profiles(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.x3_sales_activities (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES public.x3_profiles(id) ON DELETE CASCADE,
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

CREATE TRIGGER x3_sales_activities_updated_at
  BEFORE UPDATE ON public.x3_sales_activities
  FOR EACH ROW EXECUTE FUNCTION public.x3_handle_updated_at();

-- =============================================
-- 7. SCRIPTS & OBJECTIONS
-- =============================================

CREATE TABLE IF NOT EXISTS public.x3_script_categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT,
  color       TEXT DEFAULT '#FF6B00',
  sort_order  INTEGER NOT NULL DEFAULT 0
);

INSERT INTO public.x3_script_categories (name, description, sort_order) VALUES
  ('Abordagem Inicial', 'Primeiros contatos com o cliente',   1),
  ('Qualificacao',      'Entender perfil e necessidade',      2),
  ('Apresentacao',      'Apresentar o veiculo ideal',         3),
  ('Negociacao',        'Condicoes e formas de pagamento',    4),
  ('Fechamento',        'Tecnicas para fechar a venda',       5),
  ('Objecoes',          'Respostas para resistencias comuns', 6);

CREATE TABLE IF NOT EXISTS public.x3_scripts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES public.x3_script_categories(id),
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  objection   TEXT,
  response    TEXT,
  tags        TEXT[],
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_by  UUID REFERENCES public.x3_profiles(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER x3_scripts_updated_at
  BEFORE UPDATE ON public.x3_scripts
  FOR EACH ROW EXECUTE FUNCTION public.x3_handle_updated_at();

CREATE TABLE IF NOT EXISTS public.x3_user_favorite_scripts (
  user_id    UUID NOT NULL REFERENCES public.x3_profiles(id) ON DELETE CASCADE,
  script_id  UUID NOT NULL REFERENCES public.x3_scripts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, script_id)
);

CREATE INDEX IF NOT EXISTS x3_scripts_fts_idx ON public.x3_scripts
  USING GIN (to_tsvector('portuguese', title || ' ' || content));

-- =============================================
-- 8. NOTES
-- =============================================

CREATE TABLE IF NOT EXISTS public.x3_note_categories (
  id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name  TEXT NOT NULL,
  color TEXT DEFAULT '#1A1A2E'
);

INSERT INTO public.x3_note_categories (name, color) VALUES
  ('Reuniao',      '#4CAF50'),
  ('Treinamento',  '#FF6B00'),
  ('Ideia',        '#FFD700'),
  ('Cliente',      '#2196F3'),
  ('Pessoal',      '#9C27B0');

CREATE TABLE IF NOT EXISTS public.x3_notes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.x3_profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.x3_note_categories(id) ON DELETE SET NULL,
  title       TEXT NOT NULL DEFAULT 'Sem titulo',
  content     TEXT NOT NULL DEFAULT '',
  is_pinned   BOOLEAN NOT NULL DEFAULT FALSE,
  is_shared   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER x3_notes_updated_at
  BEFORE UPDATE ON public.x3_notes
  FOR EACH ROW EXECUTE FUNCTION public.x3_handle_updated_at();

CREATE INDEX IF NOT EXISTS x3_notes_fts_idx ON public.x3_notes
  USING GIN (to_tsvector('portuguese', title || ' ' || content));

-- =============================================
-- 9. CALENDAR
-- =============================================

CREATE TABLE IF NOT EXISTS public.x3_calendar_events (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES public.x3_profiles(id) ON DELETE CASCADE,
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

CREATE TRIGGER x3_calendar_events_updated_at
  BEFORE UPDATE ON public.x3_calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.x3_handle_updated_at();

CREATE INDEX IF NOT EXISTS x3_calendar_events_user_date_idx
  ON public.x3_calendar_events (user_id, start_datetime);

-- =============================================
-- 10. CHECKLIST
-- =============================================

CREATE TABLE IF NOT EXISTS public.x3_checklist_templates (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id   UUID REFERENCES public.x3_stores(id),
  title      TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES public.x3_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.x3_checklist_template_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES public.x3_checklist_templates(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  xp_reward   INTEGER NOT NULL DEFAULT 10,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.x3_daily_checklists (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES public.x3_profiles(id) ON DELETE CASCADE,
  checklist_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed      BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, checklist_date)
);

CREATE TABLE IF NOT EXISTS public.x3_daily_checklist_items (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checklist_id UUID NOT NULL REFERENCES public.x3_daily_checklists(id) ON DELETE CASCADE,
  label        TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  is_custom    BOOLEAN NOT NULL DEFAULT FALSE,
  xp_reward    INTEGER NOT NULL DEFAULT 10,
  sort_order   INTEGER NOT NULL DEFAULT 0
);

-- =============================================
-- 11. MORNING RITUALS
-- =============================================

CREATE TABLE IF NOT EXISTS public.x3_rituals (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        TEXT NOT NULL,
  description  TEXT NOT NULL,
  ritual_type  TEXT NOT NULL CHECK (ritual_type IN ('mental', 'physical', 'professional')),
  duration_min INTEGER NOT NULL DEFAULT 5,
  benefit      TEXT,
  icon         TEXT DEFAULT '🌅',
  xp_reward    INTEGER NOT NULL DEFAULT 20,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.x3_rituals (title, description, ritual_type, duration_min, benefit, icon) VALUES
  ('Meditacao',              'Reserve 5 minutos para respirar e focar sua mente',  'mental',       5,  'Clareza mental e foco',       '🧘'),
  ('Leitura Motivacional',   'Leia algo que te inspire para o dia',                'mental',       10, 'Motivacao e aprendizado',     '📖'),
  ('Exercicio Leve',         'Movimente seu corpo antes de comecar o dia',         'physical',     15, 'Energia e disposicao',        '🏃'),
  ('Visualizacao de Metas',  'Visualize seus objetivos sendo alcancados',          'mental',       5,  'Foco e determinacao',         '🎯'),
  ('Hidratacao Matinal',     'Beba pelo menos 2 copos de agua ao acordar',         'physical',     2,  'Hidratacao e clareza',        '💧'),
  ('Revisao de Prioridades', 'Defina as 3 tarefas mais importantes do dia',        'professional', 5,  'Produtividade e organizacao', '📋'),
  ('Gratidao',               'Escreva 3 coisas pelas quais voce e grata',          'mental',       3,  'Bem-estar e positividade',    '🙏');

CREATE TABLE IF NOT EXISTS public.x3_user_daily_rituals (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.x3_profiles(id) ON DELETE CASCADE,
  ritual_id    UUID NOT NULL REFERENCES public.x3_rituals(id) ON DELETE CASCADE,
  ritual_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, ritual_id, ritual_date)
);

-- =============================================
-- 12. VIDEO LESSONS
-- =============================================

CREATE TABLE IF NOT EXISTS public.x3_video_categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT,
  color       TEXT DEFAULT '#FF6B00',
  sort_order  INTEGER NOT NULL DEFAULT 0
);

INSERT INTO public.x3_video_categories (name, description, sort_order) VALUES
  ('Onboarding',         'Primeiros passos na 3X',           1),
  ('Tecnicas de Vendas', 'Como vender mais e melhor',        2),
  ('Objecoes',           'Como superar as resistencias',     3),
  ('Motivacao',          'Conteudo motivacional',            4),
  ('Produto',            'Conhecimento de veiculos',         5),
  ('Processo',           'Rotinas e processos da pre-venda', 6);

CREATE TABLE IF NOT EXISTS public.x3_video_lessons (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id      UUID NOT NULL REFERENCES public.x3_video_categories(id),
  youtube_video_id TEXT NOT NULL UNIQUE,
  title            TEXT NOT NULL,
  description      TEXT,
  thumbnail_url    TEXT,
  duration_seconds INTEGER,
  xp_reward        INTEGER NOT NULL DEFAULT 30,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  is_published     BOOLEAN NOT NULL DEFAULT TRUE,
  published_at     TIMESTAMPTZ,
  created_by       UUID REFERENCES public.x3_profiles(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.x3_user_video_progress (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES public.x3_profiles(id) ON DELETE CASCADE,
  video_id         UUID NOT NULL REFERENCES public.x3_video_lessons(id) ON DELETE CASCADE,
  watch_percentage INTEGER NOT NULL DEFAULT 0 CHECK (watch_percentage BETWEEN 0 AND 100),
  completed        BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at     TIMESTAMPTZ,
  last_watched_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  xp_awarded       BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(user_id, video_id)
);

CREATE TABLE IF NOT EXISTS public.x3_video_notes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.x3_profiles(id) ON DELETE CASCADE,
  video_id    UUID NOT NULL REFERENCES public.x3_video_lessons(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  timestamp_s INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- 13. WEB PUSH NOTIFICATIONS
-- =============================================

CREATE TABLE IF NOT EXISTS public.x3_push_subscriptions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.x3_profiles(id) ON DELETE CASCADE,
  endpoint   TEXT NOT NULL UNIQUE,
  p256dh_key TEXT NOT NULL,
  auth_key   TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.x3_notification_preferences (
  user_id             UUID PRIMARY KEY REFERENCES public.x3_profiles(id) ON DELETE CASCADE,
  morning_ritual      BOOLEAN NOT NULL DEFAULT TRUE,
  morning_ritual_time TIME NOT NULL DEFAULT '07:00',
  daily_goal_reminder BOOLEAN NOT NULL DEFAULT TRUE,
  checklist_reminder  BOOLEAN NOT NULL DEFAULT TRUE,
  checklist_time      TIME NOT NULL DEFAULT '08:30',
  streak_warning      BOOLEAN NOT NULL DEFAULT TRUE,
  level_up            BOOLEAN NOT NULL DEFAULT TRUE,
  new_content         BOOLEAN NOT NULL DEFAULT TRUE
);

-- =============================================
-- 14. ROW LEVEL SECURITY (RLS)
-- All policy names prefixed with x3_ to avoid conflicts
-- =============================================

-- Enable RLS on all x3_ tables
ALTER TABLE public.x3_profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.x3_sales_activities      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.x3_sales_goals           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.x3_notes                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.x3_calendar_events       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.x3_daily_checklists      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.x3_daily_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.x3_user_daily_rituals    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.x3_user_video_progress   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.x3_user_mission_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.x3_user_badges           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.x3_xp_transactions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.x3_push_subscriptions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.x3_scripts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.x3_video_lessons        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.x3_rituals              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.x3_user_favorite_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.x3_video_notes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.x3_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.x3_checklist_templates  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.x3_checklist_template_items ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------
-- SDR: own data access
-- -----------------------------------------------

CREATE POLICY "x3_own_profile"
  ON public.x3_profiles FOR ALL
  USING (auth.uid() = id);

CREATE POLICY "x3_own_sales"
  ON public.x3_sales_activities FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "x3_own_notes"
  ON public.x3_notes FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "x3_own_calendar"
  ON public.x3_calendar_events FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "x3_own_checklist"
  ON public.x3_daily_checklists FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "x3_own_checklist_items"
  ON public.x3_daily_checklist_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.x3_daily_checklists dc
      WHERE dc.id = checklist_id AND dc.user_id = auth.uid()
    )
  );

CREATE POLICY "x3_own_rituals"
  ON public.x3_user_daily_rituals FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "x3_own_video_progress"
  ON public.x3_user_video_progress FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "x3_own_missions"
  ON public.x3_user_mission_progress FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "x3_own_badges"
  ON public.x3_user_badges FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "x3_own_xp"
  ON public.x3_xp_transactions FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "x3_own_push"
  ON public.x3_push_subscriptions FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "x3_own_favorite_scripts"
  ON public.x3_user_favorite_scripts FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "x3_own_video_notes"
  ON public.x3_video_notes FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "x3_own_notification_prefs"
  ON public.x3_notification_preferences FOR ALL
  USING (auth.uid() = user_id);

-- -----------------------------------------------
-- Supervisor: view members and sales in same store
-- -----------------------------------------------

CREATE POLICY "x3_supervisor_store_profiles"
  ON public.x3_profiles FOR SELECT
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.x3_profiles s
      WHERE s.id = auth.uid()
        AND s.role IN ('supervisor', 'admin')
        AND s.store_id = x3_profiles.store_id
    )
  );

CREATE POLICY "x3_supervisor_store_sales"
  ON public.x3_sales_activities FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.x3_profiles s
      JOIN public.x3_profiles m ON m.id = x3_sales_activities.user_id
      WHERE s.id = auth.uid()
        AND s.role IN ('supervisor', 'admin')
        AND s.store_id = m.store_id
    )
  );

-- -----------------------------------------------
-- Team events visible to entire store
-- -----------------------------------------------

CREATE POLICY "x3_team_events_visible"
  ON public.x3_calendar_events FOR SELECT
  USING (
    auth.uid() = user_id
    OR (
      is_team_event = TRUE
      AND EXISTS (
        SELECT 1 FROM public.x3_profiles viewer
        JOIN public.x3_profiles owner ON owner.id = x3_calendar_events.user_id
        WHERE viewer.id = auth.uid()
          AND viewer.store_id = owner.store_id
      )
    )
  );

-- -----------------------------------------------
-- Public content: readable by any authenticated user
-- -----------------------------------------------

CREATE POLICY "x3_auth_read_scripts"
  ON public.x3_scripts FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = TRUE);

CREATE POLICY "x3_auth_read_videos"
  ON public.x3_video_lessons FOR SELECT
  USING (auth.role() = 'authenticated' AND is_published = TRUE);

CREATE POLICY "x3_auth_read_rituals"
  ON public.x3_rituals FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = TRUE);

-- -----------------------------------------------
-- Sales goals: own user or admin/supervisor of the store
-- -----------------------------------------------

CREATE POLICY "x3_own_or_store_goals"
  ON public.x3_sales_goals FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.x3_profiles s
      WHERE s.id = auth.uid()
        AND s.role IN ('supervisor', 'admin')
        AND s.store_id = x3_sales_goals.store_id
    )
  );

CREATE POLICY "x3_admin_manage_goals"
  ON public.x3_sales_goals FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.x3_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
    )
  );

-- -----------------------------------------------
-- Admin: manage content
-- -----------------------------------------------

CREATE POLICY "x3_admin_manage_scripts"
  ON public.x3_scripts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.x3_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "x3_admin_manage_videos"
  ON public.x3_video_lessons FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.x3_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
    )
  );

-- -----------------------------------------------
-- Checklist templates: readable by authenticated, manageable by admin
-- -----------------------------------------------

CREATE POLICY "x3_auth_read_checklist_templates"
  ON public.x3_checklist_templates FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "x3_admin_manage_checklist_templates"
  ON public.x3_checklist_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.x3_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
    )
  );

CREATE POLICY "x3_auth_read_checklist_template_items"
  ON public.x3_checklist_template_items FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "x3_admin_manage_checklist_template_items"
  ON public.x3_checklist_template_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.x3_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
    )
  );

-- =============================================
-- SETUP COMPLETE
-- All 3X App tables created with x3_ prefix.
-- No existing pharmacy tables were modified.
-- =============================================
