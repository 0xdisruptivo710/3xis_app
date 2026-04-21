-- =============================================
-- Migration 016: Fix orphan role CHECK constraint
-- =============================================
-- Migration 013 renamed public.profiles -> public.x3_profiles, but PostgreSQL
-- keeps constraint names across table renames. So the original constraint
-- `profiles_role_check` (from migration 002) was still blocking 'super_admin'
-- even after migration 015 added a new `x3_profiles_role_check` constraint.
--
-- This migration drops ALL possible old names and ensures a single,
-- correctly-named constraint allowing sdr/supervisor/admin/super_admin.
-- =============================================

ALTER TABLE public.x3_profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.x3_profiles
  DROP CONSTRAINT IF EXISTS x3_profiles_role_check;

ALTER TABLE public.x3_profiles
  ADD CONSTRAINT x3_profiles_role_check
  CHECK (role IN ('sdr', 'supervisor', 'admin', 'super_admin'));

-- =============================================
-- MIGRATION 016 COMPLETE
-- =============================================
