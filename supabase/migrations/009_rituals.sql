-- /supabase/migrations/009_rituals.sql
-- Tabelas de Rituais Matinais

CREATE TABLE public.rituals (
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

INSERT INTO public.rituals (title, description, ritual_type, duration_min, benefit, icon) VALUES
  ('Meditação',              'Reserve 5 minutos para respirar e focar sua mente',  'mental',       5,  'Clareza mental e foco',       '🧘'),
  ('Leitura Motivacional',   'Leia algo que te inspire para o dia',                'mental',       10, 'Motivação e aprendizado',     '📖'),
  ('Exercício Leve',         'Movimente seu corpo antes de começar o dia',         'physical',     15, 'Energia e disposição',        '🏃'),
  ('Visualização de Metas',  'Visualize seus objetivos sendo alcançados',          'mental',       5,  'Foco e determinação',         '🎯'),
  ('Hidratação Matinal',     'Beba pelo menos 2 copos de água ao acordar',         'physical',     2,  'Hidratação e clareza',        '💧'),
  ('Revisão de Prioridades', 'Defina as 3 tarefas mais importantes do dia',        'professional', 5,  'Produtividade e organização', '📋'),
  ('Gratidão',               'Escreva 3 coisas pelas quais você é grata',          'mental',       3,  'Bem-estar e positividade',    '🙏');

CREATE TABLE public.user_daily_rituals (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ritual_id    UUID NOT NULL REFERENCES public.rituals(id) ON DELETE CASCADE,
  ritual_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, ritual_id, ritual_date)
);
