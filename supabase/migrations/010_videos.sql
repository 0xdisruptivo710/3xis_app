-- /supabase/migrations/010_videos.sql
-- Tabelas de Videoaulas

CREATE TABLE public.video_categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT,
  color       TEXT DEFAULT '#FF6B00',
  sort_order  INTEGER NOT NULL DEFAULT 0
);

INSERT INTO public.video_categories (name, description, sort_order) VALUES
  ('Onboarding',         'Primeiros passos na 3X',           1),
  ('Técnicas de Vendas', 'Como vender mais e melhor',        2),
  ('Objeções',           'Como superar as resistências',     3),
  ('Motivação',          'Conteúdo motivacional',            4),
  ('Produto',            'Conhecimento de veículos',         5),
  ('Processo',           'Rotinas e processos da pré-venda', 6);

CREATE TABLE public.video_lessons (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id      UUID NOT NULL REFERENCES public.video_categories(id),
  youtube_video_id TEXT NOT NULL UNIQUE,
  title            TEXT NOT NULL,
  description      TEXT,
  thumbnail_url    TEXT,
  duration_seconds INTEGER,
  xp_reward        INTEGER NOT NULL DEFAULT 30,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  is_published     BOOLEAN NOT NULL DEFAULT TRUE,
  published_at     TIMESTAMPTZ,
  created_by       UUID REFERENCES public.profiles(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.user_video_progress (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_id         UUID NOT NULL REFERENCES public.video_lessons(id) ON DELETE CASCADE,
  watch_percentage INTEGER NOT NULL DEFAULT 0 CHECK (watch_percentage BETWEEN 0 AND 100),
  completed        BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at     TIMESTAMPTZ,
  last_watched_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  xp_awarded       BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(user_id, video_id)
);

CREATE TABLE public.video_notes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_id    UUID NOT NULL REFERENCES public.video_lessons(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  timestamp_s INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
