-- /supabase/migrations/006_notes.sql
-- Tabelas de Notas

CREATE TABLE public.note_categories (
  id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name  TEXT NOT NULL,
  color TEXT DEFAULT '#1A1A2E'
);

INSERT INTO public.note_categories (name, color) VALUES
  ('Reunião',     '#4CAF50'),
  ('Treinamento', '#FF6B00'),
  ('Ideia',       '#FFD700'),
  ('Cliente',     '#2196F3'),
  ('Pessoal',     '#9C27B0');

CREATE TABLE public.notes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.note_categories(id) ON DELETE SET NULL,
  title       TEXT NOT NULL DEFAULT 'Sem título',
  content     TEXT NOT NULL DEFAULT '',
  is_pinned   BOOLEAN NOT NULL DEFAULT FALSE,
  is_shared   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX notes_fts_idx ON public.notes
  USING GIN (to_tsvector('portuguese', title || ' ' || content));
