-- =============================================
-- Migration 015: Super Admin (Platform Owner) role
-- =============================================
-- Adds a new role above 'admin' that has cross-store visibility.
-- Used by the platform owner (3X) to monitor and manage ALL stores
-- without being tied to a specific store_id.
-- =============================================

-- =============================================
-- PART 1: Allow 'super_admin' value in role column
-- =============================================

ALTER TABLE public.x3_profiles
  DROP CONSTRAINT IF EXISTS x3_profiles_role_check;

ALTER TABLE public.x3_profiles
  ADD CONSTRAINT x3_profiles_role_check
  CHECK (role IN ('sdr', 'supervisor', 'admin', 'super_admin'));

-- =============================================
-- PART 2: Helper function — is_super_admin()
-- =============================================
-- SECURITY DEFINER bypasses RLS recursion when checking the role.

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.x3_profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- =============================================
-- PART 3: Bypass RLS policies for super_admin
-- =============================================
-- One FOR ALL policy per sensitive table — additive to existing admin policies.

-- Profiles (read every user across all stores)
CREATE POLICY "super_admin_all_profiles" ON public.x3_profiles FOR ALL
  USING (public.is_super_admin());

-- Stores
CREATE POLICY "super_admin_all_stores" ON public.x3_stores FOR ALL
  USING (public.is_super_admin());

-- Licensing & invitations
CREATE POLICY "super_admin_all_licenses" ON public.x3_store_licenses FOR ALL
  USING (public.is_super_admin());

CREATE POLICY "super_admin_all_codes" ON public.x3_access_codes FOR ALL
  USING (public.is_super_admin());

CREATE POLICY "super_admin_all_invitations" ON public.x3_invitations FOR ALL
  USING (public.is_super_admin());

-- User activity data (cross-store visibility)
CREATE POLICY "super_admin_all_sales" ON public.x3_sales_activities FOR ALL
  USING (public.is_super_admin());

CREATE POLICY "super_admin_all_goals" ON public.x3_sales_goals FOR ALL
  USING (public.is_super_admin());

CREATE POLICY "super_admin_all_checklists" ON public.x3_daily_checklists FOR ALL
  USING (public.is_super_admin());

CREATE POLICY "super_admin_all_checklist_items" ON public.x3_daily_checklist_items FOR ALL
  USING (public.is_super_admin());

CREATE POLICY "super_admin_all_xp" ON public.x3_xp_transactions FOR ALL
  USING (public.is_super_admin());

CREATE POLICY "super_admin_all_user_badges" ON public.x3_user_badges FOR ALL
  USING (public.is_super_admin());

CREATE POLICY "super_admin_all_video_progress" ON public.x3_user_video_progress FOR ALL
  USING (public.is_super_admin());

CREATE POLICY "super_admin_all_mission_progress" ON public.x3_user_mission_progress FOR ALL
  USING (public.is_super_admin());

CREATE POLICY "super_admin_all_user_rituals" ON public.x3_user_daily_rituals FOR ALL
  USING (public.is_super_admin());

CREATE POLICY "super_admin_all_notes" ON public.x3_notes FOR ALL
  USING (public.is_super_admin());

CREATE POLICY "super_admin_all_calendar" ON public.x3_calendar_events FOR ALL
  USING (public.is_super_admin());

-- Content tables
CREATE POLICY "super_admin_all_scripts" ON public.x3_scripts FOR ALL
  USING (public.is_super_admin());

CREATE POLICY "super_admin_all_videos" ON public.x3_video_lessons FOR ALL
  USING (public.is_super_admin());

CREATE POLICY "super_admin_all_rituals" ON public.x3_rituals FOR ALL
  USING (public.is_super_admin());

CREATE POLICY "super_admin_all_game_phases" ON public.x3_game_phases FOR ALL
  USING (public.is_super_admin());

CREATE POLICY "super_admin_all_game_missions" ON public.x3_game_missions FOR ALL
  USING (public.is_super_admin());

CREATE POLICY "super_admin_all_badges" ON public.x3_badges FOR ALL
  USING (public.is_super_admin());

CREATE POLICY "super_admin_all_checklist_templates" ON public.x3_checklist_templates FOR ALL
  USING (public.is_super_admin());

CREATE POLICY "super_admin_all_checklist_template_items" ON public.x3_checklist_template_items FOR ALL
  USING (public.is_super_admin());

-- =============================================
-- MIGRATION 015 COMPLETE
-- =============================================
-- Summary:
--   - 'super_admin' added to x3_profiles.role CHECK constraint
--   - is_super_admin() helper exposed as SQL function
--   - Bypass policies added on all sensitive tables — super_admin sees/edits everything
-- =============================================
