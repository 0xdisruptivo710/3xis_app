-- /supabase/migrations/012_rls.sql
-- Row Level Security (RLS) Policies

-- Habilitar RLS em todas as tabelas com dados de usuário
ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_activities      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_goals           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_checklists      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_rituals    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_video_progress   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_mission_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_transactions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scripts               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_lessons         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rituals               ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SDR acessa apenas seus próprios dados
-- ============================================
CREATE POLICY "own_profile"         ON public.profiles              FOR ALL USING (auth.uid() = id);
CREATE POLICY "own_sales"           ON public.sales_activities      FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_notes"           ON public.notes                 FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_calendar"        ON public.calendar_events       FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_checklist"       ON public.daily_checklists      FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_checklist_items" ON public.daily_checklist_items FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.daily_checklists dc
    WHERE dc.id = daily_checklist_items.checklist_id
      AND dc.user_id = auth.uid()
  )
);
CREATE POLICY "own_rituals"         ON public.user_daily_rituals    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_video_progress"  ON public.user_video_progress   FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_missions"        ON public.user_mission_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_badges"          ON public.user_badges           FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_xp"              ON public.xp_transactions       FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_push"            ON public.push_subscriptions    FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- Supervisoras veem membros da mesma loja
-- ============================================
CREATE POLICY "supervisor_store_profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles s
      WHERE s.id = auth.uid()
        AND s.role IN ('supervisor', 'admin')
        AND s.store_id = profiles.store_id
    )
  );

CREATE POLICY "supervisor_store_sales"
  ON public.sales_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles s
      JOIN public.profiles m ON m.id = sales_activities.user_id
      WHERE s.id = auth.uid()
        AND s.role IN ('supervisor', 'admin')
        AND s.store_id = m.store_id
    )
  );

-- ============================================
-- Eventos de equipe visíveis para toda a loja
-- ============================================
CREATE POLICY "team_events_visible"
  ON public.calendar_events FOR SELECT
  USING (
    auth.uid() = user_id
    OR (
      is_team_event = TRUE
      AND EXISTS (
        SELECT 1 FROM public.profiles viewer
        JOIN public.profiles owner ON owner.id = calendar_events.user_id
        WHERE viewer.id = auth.uid()
          AND viewer.store_id = owner.store_id
      )
    )
  );

-- ============================================
-- Conteúdo público (leitura) para autenticados
-- ============================================
CREATE POLICY "auth_read_scripts"
  ON public.scripts       FOR SELECT USING (auth.role() = 'authenticated' AND is_active = TRUE);
CREATE POLICY "auth_read_videos"
  ON public.video_lessons FOR SELECT USING (auth.role() = 'authenticated' AND is_published = TRUE);
CREATE POLICY "auth_read_rituals"
  ON public.rituals       FOR SELECT USING (auth.role() = 'authenticated' AND is_active = TRUE);

-- ============================================
-- Admin gerencia conteúdo
-- ============================================
CREATE POLICY "admin_manage_scripts"
  ON public.scripts FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "admin_manage_videos"
  ON public.video_lessons FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','supervisor')));

-- ============================================
-- Goals: SDR lê as próprias, supervisor gerencia
-- ============================================
CREATE POLICY "own_goals"
  ON public.sales_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "supervisor_manage_goals"
  ON public.sales_goals FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles s
      WHERE s.id = auth.uid()
        AND s.role IN ('supervisor', 'admin')
    )
  );
