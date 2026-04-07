-- =============================================
-- Migration 013: Rename tables to x3_ prefix + Licensing/Invitation system
-- =============================================
-- This migration does three things:
--   1. Renames all existing non-prefixed tables to x3_ (idempotent with IF EXISTS)
--   2. Updates triggers and functions to reference x3_ table names
--   3. Creates new tables for store licensing, access codes, and invitations
--   4. Updates seed data (rituals and checklist templates) for car dealership context
--   5. Enables RLS and adds policies for the new tables
-- =============================================

-- =============================================
-- PART 1: Rename existing tables to x3_ prefix
-- =============================================
-- Order: leaf tables (no dependents) first, then work up to root tables.
-- Using IF EXISTS so this migration is idempotent — safe to run even if
-- 000_reset_and_full_setup.sql already created x3_ tables directly.

-- 1a. Leaf tables (no other table references these)
ALTER TABLE IF EXISTS public.user_mission_progress   RENAME TO x3_user_mission_progress;
ALTER TABLE IF EXISTS public.user_badges             RENAME TO x3_user_badges;
ALTER TABLE IF EXISTS public.xp_transactions         RENAME TO x3_xp_transactions;
ALTER TABLE IF EXISTS public.sales_activities        RENAME TO x3_sales_activities;
ALTER TABLE IF EXISTS public.sales_goals             RENAME TO x3_sales_goals;
ALTER TABLE IF EXISTS public.user_favorite_scripts   RENAME TO x3_user_favorite_scripts;
ALTER TABLE IF EXISTS public.notes                   RENAME TO x3_notes;
ALTER TABLE IF EXISTS public.calendar_events         RENAME TO x3_calendar_events;
ALTER TABLE IF EXISTS public.daily_checklist_items   RENAME TO x3_daily_checklist_items;
ALTER TABLE IF EXISTS public.daily_checklists        RENAME TO x3_daily_checklists;
ALTER TABLE IF EXISTS public.checklist_template_items RENAME TO x3_checklist_template_items;
ALTER TABLE IF EXISTS public.user_daily_rituals      RENAME TO x3_user_daily_rituals;
ALTER TABLE IF EXISTS public.user_video_progress     RENAME TO x3_user_video_progress;
ALTER TABLE IF EXISTS public.video_notes             RENAME TO x3_video_notes;
ALTER TABLE IF EXISTS public.push_subscriptions      RENAME TO x3_push_subscriptions;
ALTER TABLE IF EXISTS public.notification_preferences RENAME TO x3_notification_preferences;

-- 1b. Mid-level tables (referenced by leaf tables above)
ALTER TABLE IF EXISTS public.game_missions           RENAME TO x3_game_missions;
ALTER TABLE IF EXISTS public.scripts                 RENAME TO x3_scripts;
ALTER TABLE IF EXISTS public.checklist_templates     RENAME TO x3_checklist_templates;
ALTER TABLE IF EXISTS public.video_lessons           RENAME TO x3_video_lessons;

-- 1c. Tables referenced by mid-level tables
ALTER TABLE IF EXISTS public.game_phases             RENAME TO x3_game_phases;
ALTER TABLE IF EXISTS public.script_categories       RENAME TO x3_script_categories;
ALTER TABLE IF EXISTS public.note_categories         RENAME TO x3_note_categories;
ALTER TABLE IF EXISTS public.video_categories        RENAME TO x3_video_categories;
ALTER TABLE IF EXISTS public.rituals                 RENAME TO x3_rituals;
ALTER TABLE IF EXISTS public.badges                  RENAME TO x3_badges;
ALTER TABLE IF EXISTS public.game_levels             RENAME TO x3_game_levels;

-- 1d. Root tables (profiles depends on stores, many tables depend on profiles)
ALTER TABLE IF EXISTS public.profiles                RENAME TO x3_profiles;
ALTER TABLE IF EXISTS public.stores                  RENAME TO x3_stores;


-- =============================================
-- PART 2: Update triggers and functions
-- =============================================
-- The handle_updated_at() function is generic and works regardless of table name,
-- but we create the x3_ prefixed version for consistency with 000_reset_and_full_setup.sql.

-- 2a. Create x3_handle_updated_at if it doesn't already exist
CREATE OR REPLACE FUNCTION public.x3_handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2b. Drop old triggers on renamed tables and recreate with x3_ prefix
-- (Triggers survive table renames but we want consistent naming)

-- profiles_updated_at -> x3_profiles_updated_at
DROP TRIGGER IF EXISTS profiles_updated_at ON public.x3_profiles;
DROP TRIGGER IF EXISTS x3_profiles_updated_at ON public.x3_profiles;
CREATE TRIGGER x3_profiles_updated_at
  BEFORE UPDATE ON public.x3_profiles
  FOR EACH ROW EXECUTE FUNCTION public.x3_handle_updated_at();

-- sales_activities_updated_at -> x3_sales_activities_updated_at
DROP TRIGGER IF EXISTS sales_activities_updated_at ON public.x3_sales_activities;
DROP TRIGGER IF EXISTS x3_sales_activities_updated_at ON public.x3_sales_activities;
CREATE TRIGGER x3_sales_activities_updated_at
  BEFORE UPDATE ON public.x3_sales_activities
  FOR EACH ROW EXECUTE FUNCTION public.x3_handle_updated_at();

-- scripts_updated_at -> x3_scripts_updated_at
DROP TRIGGER IF EXISTS scripts_updated_at ON public.x3_scripts;
DROP TRIGGER IF EXISTS x3_scripts_updated_at ON public.x3_scripts;
CREATE TRIGGER x3_scripts_updated_at
  BEFORE UPDATE ON public.x3_scripts
  FOR EACH ROW EXECUTE FUNCTION public.x3_handle_updated_at();

-- notes_updated_at -> x3_notes_updated_at
DROP TRIGGER IF EXISTS notes_updated_at ON public.x3_notes;
DROP TRIGGER IF EXISTS x3_notes_updated_at ON public.x3_notes;
CREATE TRIGGER x3_notes_updated_at
  BEFORE UPDATE ON public.x3_notes
  FOR EACH ROW EXECUTE FUNCTION public.x3_handle_updated_at();

-- calendar_events_updated_at -> x3_calendar_events_updated_at
DROP TRIGGER IF EXISTS calendar_events_updated_at ON public.x3_calendar_events;
DROP TRIGGER IF EXISTS x3_calendar_events_updated_at ON public.x3_calendar_events;
CREATE TRIGGER x3_calendar_events_updated_at
  BEFORE UPDATE ON public.x3_calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.x3_handle_updated_at();

-- 2c. Update the handle_new_user function to reference x3_profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
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

-- Also create/update the x3_ prefixed version (used by 000_reset_and_full_setup.sql)
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

-- Ensure the auth trigger exists (it fires on auth.users INSERT)
-- The original trigger name on_auth_user_created still works since it's on auth.users
-- We also ensure the x3_ version exists for consistency
DROP TRIGGER IF EXISTS on_auth_user_created_x3 ON auth.users;
CREATE TRIGGER on_auth_user_created_x3
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.x3_handle_new_user();


-- =============================================
-- PART 3: Create new tables for licensing and invitations
-- =============================================

-- Store licenses (for selling the platform per store)
CREATE TABLE IF NOT EXISTS public.x3_store_licenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES public.x3_stores(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL DEFAULT 'basic' CHECK (plan_type IN ('basic', 'pro', 'enterprise')),
  max_users INTEGER NOT NULL DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Access codes for checkout/registration
CREATE TABLE IF NOT EXISTS public.x3_access_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  store_id UUID REFERENCES public.x3_stores(id),
  plan_type TEXT NOT NULL DEFAULT 'basic',
  max_uses INTEGER NOT NULL DEFAULT 1,
  used_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES public.x3_profiles(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User invitations
CREATE TABLE IF NOT EXISTS public.x3_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  store_id UUID NOT NULL REFERENCES public.x3_stores(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'sdr' CHECK (role IN ('sdr', 'supervisor', 'admin')),
  invited_by UUID NOT NULL REFERENCES public.x3_profiles(id),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================
-- PART 4: Update seed data for car dealership SDR context
-- =============================================

-- 4a. Replace generic rituals with car-dealership-specific rituals
DELETE FROM public.x3_rituals;

INSERT INTO public.x3_rituals (title, description, ritual_type, duration_min, benefit, icon, xp_reward, sort_order) VALUES
  ('Revisar metas do dia', 'Confira suas metas de ligacoes, agendamentos e vendas para hoje', 'professional', 5, 'Foco e direcao', '🎯', 20, 1),
  ('Checar novos leads', 'Verifique leads que entraram durante a noite no site e redes sociais', 'professional', 10, 'Nao perder oportunidades', '📱', 20, 2),
  ('Revisar estoque disponivel', 'Confira veiculos disponiveis, novidades e promocoes do dia', 'professional', 10, 'Conhecimento do produto', '🚗', 20, 3),
  ('Organizar agenda do dia', 'Verifique test drives agendados, retornos e follow-ups pendentes', 'professional', 5, 'Organizacao e produtividade', '📋', 20, 4),
  ('Leitura motivacional', 'Leia uma pagina de um livro de vendas ou desenvolvimento pessoal', 'mental', 10, 'Motivacao e aprendizado', '📖', 20, 5),
  ('Hidratacao e preparo', 'Beba agua, cuide da aparencia e prepare-se para receber clientes', 'physical', 5, 'Energia e boa apresentacao', '💧', 20, 6),
  ('Visualizacao de fechamento', 'Visualize-se fechando vendas e atingindo suas metas do mes', 'mental', 5, 'Mentalidade vencedora', '🏆', 20, 7),
  ('Estudo de ficha tecnica', 'Estude a ficha tecnica de um veiculo diferente a cada dia', 'professional', 10, 'Dominio do produto', '📚', 20, 8);

-- 4b. Replace generic checklist template with car-dealership-specific template
DELETE FROM public.x3_checklist_template_items;
DELETE FROM public.x3_checklist_templates;

-- Create the default template for automotive SDR
INSERT INTO public.x3_checklist_templates (id, title, is_default, store_id) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Rotina Diaria SDR Automotiva', true, NULL);

INSERT INTO public.x3_checklist_template_items (template_id, label, xp_reward, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Revisar pipeline de leads e oportunidades', 15, 1),
  ('00000000-0000-0000-0000-000000000001', 'Responder leads do site, WhatsApp e redes sociais', 15, 2),
  ('00000000-0000-0000-0000-000000000001', 'Realizar ligacoes de prospecao (minimo 15)', 10, 3),
  ('00000000-0000-0000-0000-000000000001', 'Fazer follow-up de clientes em negociacao', 15, 4),
  ('00000000-0000-0000-0000-000000000001', 'Atualizar status dos leads no sistema', 10, 5),
  ('00000000-0000-0000-0000-000000000001', 'Confirmar test drives agendados para hoje', 10, 6),
  ('00000000-0000-0000-0000-000000000001', 'Enviar propostas e condicoes pendentes', 15, 7),
  ('00000000-0000-0000-0000-000000000001', 'Verificar estoque e novos veiculos disponiveis', 10, 8),
  ('00000000-0000-0000-0000-000000000001', 'Registrar atividades do dia no app', 10, 9),
  ('00000000-0000-0000-0000-000000000001', 'Estudar um script ou ficha tecnica', 10, 10),
  ('00000000-0000-0000-0000-000000000001', 'Assistir videoaula do dia', 10, 11),
  ('00000000-0000-0000-0000-000000000001', 'Reportar resultados do dia para supervisora', 10, 12);


-- =============================================
-- PART 5: Enable RLS on new tables and add policies
-- =============================================

ALTER TABLE public.x3_store_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.x3_access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.x3_invitations ENABLE ROW LEVEL SECURITY;

-- Admin can manage licenses
CREATE POLICY "admin_manage_licenses" ON public.x3_store_licenses FOR ALL
  USING (EXISTS (SELECT 1 FROM public.x3_profiles WHERE id = auth.uid() AND role = 'admin'));

-- Admin and supervisors can manage access codes
CREATE POLICY "admin_manage_codes" ON public.x3_access_codes FOR ALL
  USING (EXISTS (SELECT 1 FROM public.x3_profiles WHERE id = auth.uid() AND role IN ('admin', 'supervisor')));

-- Supervisors can manage invitations for their store; admins can manage all
CREATE POLICY "manage_invitations" ON public.x3_invitations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.x3_profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'supervisor')
        AND (store_id = x3_invitations.store_id OR role = 'admin')
    )
  );

-- Anyone can read invitations (needed for registration flow to validate tokens)
CREATE POLICY "read_invitation_by_token" ON public.x3_invitations FOR SELECT
  USING (true);


-- =============================================
-- MIGRATION 013 COMPLETE
-- =============================================
-- Summary:
--   - All 29 tables renamed from public.X to public.x3_X (idempotent)
--   - Triggers recreated with x3_ prefix pointing to x3_handle_updated_at()
--   - handle_new_user() and x3_handle_new_user() updated to INSERT into x3_profiles
--   - New tables: x3_store_licenses, x3_access_codes, x3_invitations
--   - Seed data updated: car dealership rituals and checklist template
--   - RLS enabled + policies added for licensing/invitation tables
-- =============================================
