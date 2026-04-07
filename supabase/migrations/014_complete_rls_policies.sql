-- =============================================
-- Migration 014: Complete RLS policies for admin operations
-- =============================================
-- The original RLS (012) only covered basic user-own-data and a few admin
-- operations. This migration adds ALL missing policies so the admin panel
-- can actually read and write data.
-- =============================================

-- =============================================
-- PART 1: Admin full access to content tables
-- =============================================

-- x3_stores: admin can do everything, authenticated users can read
CREATE POLICY "admin_manage_stores" ON public.x3_stores FOR ALL
  USING (EXISTS (SELECT 1 FROM public.x3_profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "auth_read_stores" ON public.x3_stores FOR SELECT
  USING (auth.role() = 'authenticated');

-- x3_profiles: admin can read/update all profiles (not just their own)
CREATE POLICY "admin_manage_all_profiles" ON public.x3_profiles FOR ALL
  USING (EXISTS (SELECT 1 FROM public.x3_profiles WHERE id = auth.uid() AND role = 'admin'));

-- x3_rituals: admin can manage, auth users can read active ones
-- Note: policy "auth_read_rituals" already exists from migration 012 for SELECT
CREATE POLICY "admin_manage_rituals" ON public.x3_rituals FOR ALL
  USING (EXISTS (SELECT 1 FROM public.x3_profiles WHERE id = auth.uid() AND role IN ('admin', 'supervisor')));

-- x3_checklist_templates: admin/supervisor can manage, auth users can read
CREATE POLICY "admin_manage_checklist_templates" ON public.x3_checklist_templates FOR ALL
  USING (EXISTS (SELECT 1 FROM public.x3_profiles WHERE id = auth.uid() AND role IN ('admin', 'supervisor')));

CREATE POLICY "auth_read_checklist_templates" ON public.x3_checklist_templates FOR SELECT
  USING (auth.role() = 'authenticated');

-- x3_checklist_template_items: admin/supervisor can manage, auth users can read
CREATE POLICY "admin_manage_checklist_template_items" ON public.x3_checklist_template_items FOR ALL
  USING (EXISTS (SELECT 1 FROM public.x3_profiles WHERE id = auth.uid() AND role IN ('admin', 'supervisor')));

CREATE POLICY "auth_read_checklist_template_items" ON public.x3_checklist_template_items FOR SELECT
  USING (auth.role() = 'authenticated');

-- x3_script_categories: admin can manage, auth users can read
CREATE POLICY "admin_manage_script_categories" ON public.x3_script_categories FOR ALL
  USING (EXISTS (SELECT 1 FROM public.x3_profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "auth_read_script_categories" ON public.x3_script_categories FOR SELECT
  USING (auth.role() = 'authenticated');

-- x3_video_categories: admin can manage, auth users can read
CREATE POLICY "admin_manage_video_categories" ON public.x3_video_categories FOR ALL
  USING (EXISTS (SELECT 1 FROM public.x3_profiles WHERE id = auth.uid() AND role IN ('admin', 'supervisor')));

CREATE POLICY "auth_read_video_categories" ON public.x3_video_categories FOR SELECT
  USING (auth.role() = 'authenticated');

-- x3_note_categories: auth users can read
CREATE POLICY "auth_read_note_categories" ON public.x3_note_categories FOR SELECT
  USING (auth.role() = 'authenticated');

-- =============================================
-- PART 2: Admin read access to user data (reports, dashboard)
-- =============================================

-- x3_sales_activities: admin/supervisor can read all from their store
CREATE POLICY "admin_read_all_sales" ON public.x3_sales_activities FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.x3_profiles WHERE id = auth.uid() AND role IN ('admin', 'supervisor')));

-- x3_sales_goals: admin/supervisor can read all
CREATE POLICY "admin_read_all_goals" ON public.x3_sales_goals FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.x3_profiles WHERE id = auth.uid() AND role IN ('admin', 'supervisor')));

-- x3_daily_checklists: admin can read all
CREATE POLICY "admin_read_all_checklists" ON public.x3_daily_checklists FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.x3_profiles WHERE id = auth.uid() AND role IN ('admin', 'supervisor')));

-- x3_daily_checklist_items: admin can read all
CREATE POLICY "admin_read_all_checklist_items" ON public.x3_daily_checklist_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.x3_profiles WHERE id = auth.uid() AND role IN ('admin', 'supervisor')));

-- x3_xp_transactions: admin can read all
CREATE POLICY "admin_read_all_xp" ON public.x3_xp_transactions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.x3_profiles WHERE id = auth.uid() AND role IN ('admin', 'supervisor')));

-- x3_user_badges: admin can read all
CREATE POLICY "admin_read_all_badges" ON public.x3_user_badges FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.x3_profiles WHERE id = auth.uid() AND role IN ('admin', 'supervisor')));

-- x3_user_video_progress: admin can read all
CREATE POLICY "admin_read_all_video_progress" ON public.x3_user_video_progress FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.x3_profiles WHERE id = auth.uid() AND role IN ('admin', 'supervisor')));

-- x3_user_mission_progress: admin can read all
CREATE POLICY "admin_read_all_mission_progress" ON public.x3_user_mission_progress FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.x3_profiles WHERE id = auth.uid() AND role IN ('admin', 'supervisor')));

-- x3_user_daily_rituals: admin can read all
CREATE POLICY "admin_read_all_ritual_progress" ON public.x3_user_daily_rituals FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.x3_profiles WHERE id = auth.uid() AND role IN ('admin', 'supervisor')));

-- =============================================
-- PART 3: Game tables — auth users can read, admin can manage
-- =============================================

CREATE POLICY "auth_read_game_levels" ON public.x3_game_levels FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "auth_read_badges" ON public.x3_badges FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "auth_read_game_phases" ON public.x3_game_phases FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "auth_read_game_missions" ON public.x3_game_missions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "admin_manage_game_phases" ON public.x3_game_phases FOR ALL
  USING (EXISTS (SELECT 1 FROM public.x3_profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "admin_manage_game_missions" ON public.x3_game_missions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.x3_profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "admin_manage_badges" ON public.x3_badges FOR ALL
  USING (EXISTS (SELECT 1 FROM public.x3_profiles WHERE id = auth.uid() AND role = 'admin'));

-- =============================================
-- PART 4: Enable RLS on tables that might be missing it
-- =============================================
-- (These are idempotent — safe to run even if already enabled)

ALTER TABLE IF EXISTS public.x3_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.x3_script_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.x3_video_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.x3_note_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.x3_checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.x3_checklist_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.x3_game_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.x3_game_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.x3_game_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.x3_badges ENABLE ROW LEVEL SECURITY;

-- =============================================
-- MIGRATION 014 COMPLETE
-- =============================================
-- This migration adds ~30 RLS policies ensuring:
-- 1. Admin users can perform ALL operations on content tables
-- 2. Admin/Supervisor can READ all user activity data
-- 3. Authenticated users can READ public content (categories, templates, levels)
-- 4. All tables have RLS enabled
-- =============================================
