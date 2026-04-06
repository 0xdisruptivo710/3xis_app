-- /supabase/migrations/005_scripts.sql
-- Tabelas de Scripts e Objeções

CREATE TABLE public.script_categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT,
  color       TEXT DEFAULT '#FF6B00',
  sort_order  INTEGER NOT NULL DEFAULT 0
);

INSERT INTO public.script_categories (name, description, sort_order) VALUES
  ('Abordagem Inicial', 'Primeiros contatos com o cliente',   1),
  ('Qualificação',      'Entender perfil e necessidade',      2),
  ('Apresentação',      'Apresentar o veículo ideal',         3),
  ('Negociação',        'Condições e formas de pagamento',    4),
  ('Fechamento',        'Técnicas para fechar a venda',       5),
  ('Objeções',          'Respostas para resistências comuns', 6);

CREATE TABLE public.scripts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES public.script_categories(id),
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  objection   TEXT,
  response    TEXT,
  tags        TEXT[],
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_by  UUID REFERENCES public.profiles(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER scripts_updated_at
  BEFORE UPDATE ON public.scripts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE public.user_favorite_scripts (
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  script_id  UUID NOT NULL REFERENCES public.scripts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, script_id)
);

CREATE INDEX scripts_fts_idx ON public.scripts
  USING GIN (to_tsvector('portuguese', title || ' ' || content));
