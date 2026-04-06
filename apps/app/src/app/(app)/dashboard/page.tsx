'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Flame,
  Zap,
  Star,
  TrendingUp,
  BarChart3,
  MessageSquare,
  Trophy,
  StickyNote,
  CalendarDays,
  CheckSquare,
  Sunrise,
  Video,
  ChevronRight,
  Clock,
  Play,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChecklistProgress {
  total: number;
  completed: number;
  items: { id: string; label: string; isCompleted: boolean }[];
}

interface UpcomingEvent {
  id: string;
  title: string;
  eventType: string;
  startDatetime: string;
  color: string;
}

interface RitualStatus {
  total: number;
  completed: number;
  rituals: { id: string; title: string; icon: string; completed: boolean }[];
}

interface LatestVideo {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  categoryName: string;
  durationSeconds: number | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function getFirstName(fullName: string): string {
  return fullName.split(' ')[0];
}

function formatEventTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getEventTypeLabel(type: string): string {
  const map: Record<string, string> = {
    team_meeting: 'Reuniao',
    training: 'Treinamento',
    personal_reminder: 'Lembrete',
    goal: 'Meta',
    other: 'Evento',
  };
  return map[type] ?? 'Evento';
}

// ---------------------------------------------------------------------------
// Animation Variants
// ---------------------------------------------------------------------------

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 260, damping: 24 },
  },
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function XPProgressBar({
  progress,
  xpToNext,
  levelName,
  level,
}: {
  progress: number;
  xpToNext: number;
  levelName: string;
  level: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand-accent/20">
            <Star size={14} className="text-brand-accent" />
          </div>
          <span className="text-sm font-semibold text-brand-on-surface">
            Nivel {level}
          </span>
        </div>
        <span className="text-xs font-medium text-brand-muted">
          {levelName}
        </span>
      </div>
      <div className="relative h-3 rounded-full bg-gray-100 overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand-primary to-orange-400"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
        />
      </div>
      <p className="text-xs text-brand-muted text-right">
        {xpToNext > 0 ? `${xpToNext} XP para o proximo nivel` : 'Nivel maximo!'}
      </p>
    </div>
  );
}

function StatBadge({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: React.ElementType;
  value: string | number;
  label: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 min-w-0">
      <div
        className={cn(
          'flex items-center justify-center w-10 h-10 rounded-xl',
          color
        )}
      >
        <Icon size={18} />
      </div>
      <span className="font-display text-lg font-bold text-brand-on-surface leading-tight">
        {value}
      </span>
      <span className="text-[11px] text-brand-muted font-medium truncate w-full text-center">
        {label}
      </span>
    </div>
  );
}

function QuickAccessCard({
  href,
  icon: Icon,
  label,
  gradient,
  iconColor,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  gradient: string;
  iconColor: string;
}) {
  return (
    <Link href={href} className="block group">
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl p-4 min-h-[88px] flex flex-col justify-between',
          'transition-all duration-200 active:scale-[0.97]',
          gradient
        )}
      >
        <div
          className={cn(
            'flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm',
            iconColor
          )}
        >
          <Icon size={20} />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-semibold text-white">{label}</span>
          <ChevronRight
            size={16}
            className="text-white/60 group-hover:translate-x-0.5 transition-transform"
          />
        </div>
        {/* Decorative circle */}
        <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Main Dashboard Page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { levelName, progressToNextLevel, xpToNextLevel } = useProfile();

  const [checklist, setChecklist] = useState<ChecklistProgress | null>(null);
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [ritualStatus, setRitualStatus] = useState<RitualStatus | null>(null);
  const [latestVideo, setLatestVideo] = useState<LatestVideo | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  const greeting = useMemo(() => getGreeting(), []);
  const supabase = useMemo(() => createClient(), []);

  // ----- Data fetching -----
  useEffect(() => {
    if (!user?.id) return;

    async function fetchDashboardData() {
      setDataLoading(true);

      const today = new Date().toISOString().split('T')[0];

      const [checklistRes, eventsRes, ritualsRes, completedRitualsRes, videoRes] =
        await Promise.all([
          // 1. Today's checklist
          supabase
            .from('x3_daily_checklists')
            .select(
              'id, completed, x3_daily_checklist_items(id, label, is_completed)'
            )
            .eq('user_id', user!.id)
            .eq('checklist_date', today)
            .maybeSingle(),

          // 2. Upcoming events (next 3)
          supabase
            .from('x3_calendar_events')
            .select('id, title, event_type, start_datetime, color')
            .gte('start_datetime', new Date().toISOString())
            .order('start_datetime', { ascending: true })
            .limit(3),

          // 3. All active rituals
          supabase
            .from('x3_rituals')
            .select('id, title, icon')
            .eq('is_active', true)
            .order('sort_order', { ascending: true }),

          // 4. User's completed rituals today
          supabase
            .from('x3_user_daily_rituals')
            .select('ritual_id')
            .eq('user_id', user!.id)
            .eq('ritual_date', today),

          // 5. Latest published video
          supabase
            .from('x3_video_lessons')
            .select('id, title, thumbnail_url, duration_seconds, x3_video_categories(name)')
            .eq('is_published', true)
            .order('published_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

      // Process checklist
      if (checklistRes.data) {
        const items = (checklistRes.data.x3_daily_checklist_items as any[]) ?? [];
        setChecklist({
          total: items.length,
          completed: items.filter((i: any) => i.is_completed).length,
          items: items.map((i: any) => ({
            id: i.id,
            label: i.label,
            isCompleted: i.is_completed,
          })),
        });
      } else {
        setChecklist({ total: 0, completed: 0, items: [] });
      }

      // Process events
      setEvents(
        (eventsRes.data ?? []).map((e: any) => ({
          id: e.id,
          title: e.title,
          eventType: e.event_type,
          startDatetime: e.start_datetime,
          color: e.color,
        }))
      );

      // Process rituals
      const allRituals = ritualsRes.data ?? [];
      const completedIds = new Set(
        (completedRitualsRes.data ?? []).map((r: any) => r.ritual_id)
      );
      setRitualStatus({
        total: allRituals.length,
        completed: completedIds.size,
        rituals: allRituals.map((r: any) => ({
          id: r.id,
          title: r.title,
          icon: r.icon,
          completed: completedIds.has(r.id),
        })),
      });

      // Process latest video
      if (videoRes.data) {
        const v = videoRes.data as any;
        setLatestVideo({
          id: v.id,
          title: v.title,
          thumbnailUrl: v.thumbnail_url,
          categoryName: v.x3_video_categories?.name ?? '',
          durationSeconds: v.duration_seconds,
        });
      }

      setDataLoading(false);
    }

    fetchDashboardData();
  }, [user?.id, supabase]);

  // ----- Loading state -----
  if (authLoading) {
    return (
      <div className="px-4 pt-6 pb-8 max-w-lg mx-auto space-y-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-200" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-32 bg-gray-200 rounded" />
            <div className="h-3 w-24 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="card space-y-3">
          <div className="h-5 w-40 bg-gray-200 rounded" />
          <div className="h-3 w-full bg-gray-200 rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="px-4 pt-6 pb-8 max-w-lg mx-auto text-center">
        <div className="card-elevated p-8">
          <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star size={28} className="text-brand-primary" />
          </div>
          <h2 className="font-display text-lg font-bold text-brand-on-surface mb-2">
            Bem-vinda ao 3X
          </h2>
          <p className="text-sm text-brand-muted mb-4">
            Faça login para acessar seu dashboard
          </p>
          <a href="/login" className="btn-primary inline-block">Entrar</a>
        </div>
      </div>
    );
  }

  const checklistPercent =
    checklist && checklist.total > 0
      ? Math.round((checklist.completed / checklist.total) * 100)
      : 0;

  const ritualsAllDone =
    ritualStatus !== null &&
    ritualStatus.total > 0 &&
    ritualStatus.completed >= ritualStatus.total;

  const weeklyXpLabel = user.xpTotal.toLocaleString('pt-BR');

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="px-4 pt-6 pb-8 max-w-lg mx-auto space-y-5"
    >
      {/* ---------------------------------------------------------------- */}
      {/* HEADER: Greeting + Avatar                                        */}
      {/* ---------------------------------------------------------------- */}
      <motion.div variants={cardVariants} className="flex items-center gap-3">
        <div className="relative">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.fullName}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-brand-primary/30"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-primary to-orange-400 flex items-center justify-center ring-2 ring-brand-primary/30">
              <span className="text-white font-display font-bold text-lg">
                {user.fullName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          {/* Online dot */}
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-brand-success border-2 border-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-brand-muted font-medium">{greeting},</p>
          <h1 className="font-display text-xl font-bold text-brand-on-surface truncate">
            {getFirstName(user.fullName)}
          </h1>
        </div>
        <Link
          href="/profile"
          className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-brand-secondary/5 hover:bg-brand-secondary/10 transition-colors"
          aria-label="Perfil"
        >
          <Sparkles size={18} className="text-brand-secondary" />
        </Link>
      </motion.div>

      {/* ---------------------------------------------------------------- */}
      {/* STATS ROW: XP, Streak, Level                                     */}
      {/* ---------------------------------------------------------------- */}
      <motion.div variants={cardVariants} className="card-elevated">
        <div className="grid grid-cols-3 gap-2 mb-4">
          <StatBadge
            icon={Zap}
            value={weeklyXpLabel}
            label="XP Total"
            color="bg-brand-primary/10 text-brand-primary"
          />
          <StatBadge
            icon={Flame}
            value={user.streakDays}
            label={user.streakDays === 1 ? 'Dia seguido' : 'Dias seguidos'}
            color="bg-orange-100 text-orange-500"
          />
          <StatBadge
            icon={TrendingUp}
            value={`Lv.${user.currentLevel}`}
            label={levelName}
            color="bg-brand-accent/15 text-brand-accent"
          />
        </div>

        <XPProgressBar
          progress={progressToNextLevel}
          xpToNext={xpToNextLevel}
          levelName={levelName}
          level={user.currentLevel}
        />
      </motion.div>

      {/* ---------------------------------------------------------------- */}
      {/* MORNING RITUAL (if not all completed)                            */}
      {/* ---------------------------------------------------------------- */}
      {ritualStatus && !ritualsAllDone && ritualStatus.total > 0 && (
        <motion.div variants={cardVariants}>
          <Link href="/rituals" className="block">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-secondary to-[#2A2A4E] p-4">
              {/* Decorative glow */}
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-brand-accent/10 blur-2xl" />

              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <Sunrise size={18} className="text-brand-accent" />
                  <span className="text-xs font-bold tracking-wider uppercase text-brand-accent">
                    Ritual Matinal
                  </span>
                </div>
                <p className="text-white text-sm font-medium mb-3">
                  {ritualStatus.completed} de {ritualStatus.total} rituais concluidos hoje
                </p>

                {/* Mini ritual icons row */}
                <div className="flex items-center gap-2 flex-wrap">
                  {ritualStatus.rituals.slice(0, 6).map((r) => (
                    <div
                      key={r.id}
                      className={cn(
                        'flex items-center justify-center w-9 h-9 rounded-lg text-lg transition-all',
                        r.completed
                          ? 'bg-brand-accent/20'
                          : 'bg-white/10 opacity-50'
                      )}
                      title={r.title}
                    >
                      {r.icon}
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-1 mt-3 text-brand-accent/80">
                  <span className="text-xs font-medium">Completar rituais</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* CHECKLIST PROGRESS                                               */}
      {/* ---------------------------------------------------------------- */}
      <motion.div variants={cardVariants}>
        <Link href="/checklist" className="block">
          <div className="card hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-success/10">
                  <CheckSquare size={16} className="text-brand-success" />
                </div>
                <span className="text-sm font-semibold text-brand-on-surface">
                  Checklist do Dia
                </span>
              </div>
              <span
                className={cn(
                  'text-sm font-bold',
                  checklistPercent === 100
                    ? 'text-brand-success'
                    : checklistPercent >= 50
                      ? 'text-brand-warning'
                      : 'text-brand-muted'
                )}
              >
                {checklistPercent}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="relative h-2.5 rounded-full bg-gray-100 overflow-hidden mb-2">
              <motion.div
                className={cn(
                  'absolute inset-y-0 left-0 rounded-full',
                  checklistPercent === 100
                    ? 'bg-brand-success'
                    : 'bg-gradient-to-r from-brand-primary to-orange-400'
                )}
                initial={{ width: 0 }}
                animate={{ width: `${checklistPercent}%` }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: 0.4 }}
              />
            </div>

            <p className="text-xs text-brand-muted">
              {checklist
                ? checklist.total > 0
                  ? `${checklist.completed} de ${checklist.total} tarefas concluidas`
                  : 'Nenhuma tarefa configurada para hoje'
                : dataLoading
                  ? 'Carregando...'
                  : 'Nenhuma tarefa configurada para hoje'}
            </p>
          </div>
        </Link>
      </motion.div>

      {/* ---------------------------------------------------------------- */}
      {/* QUICK ACCESS GRID                                                */}
      {/* ---------------------------------------------------------------- */}
      <motion.div variants={cardVariants}>
        <h2 className="font-display text-sm font-bold text-brand-on-surface mb-3 flex items-center gap-2">
          <Zap size={14} className="text-brand-primary" />
          Acesso Rapido
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <QuickAccessCard
            href="/sales"
            icon={BarChart3}
            label="Vendas"
            gradient="bg-gradient-to-br from-brand-primary to-orange-500"
            iconColor="text-white"
          />
          <QuickAccessCard
            href="/scripts"
            icon={MessageSquare}
            label="Scripts"
            gradient="bg-gradient-to-br from-brand-secondary to-[#2E2E52]"
            iconColor="text-white"
          />
          <QuickAccessCard
            href="/game"
            icon={Trophy}
            label="Game"
            gradient="bg-gradient-to-br from-yellow-500 to-brand-accent"
            iconColor="text-white"
          />
          <QuickAccessCard
            href="/videos"
            icon={Video}
            label="Videoaulas"
            gradient="bg-gradient-to-br from-emerald-500 to-green-600"
            iconColor="text-white"
          />
        </div>
      </motion.div>

      {/* Secondary quick links */}
      <motion.div variants={cardVariants}>
        <div className="grid grid-cols-3 gap-2">
          {[
            { href: '/notes', icon: StickyNote, label: 'Notas', bg: 'bg-purple-50', fg: 'text-purple-500' },
            { href: '/calendar', icon: CalendarDays, label: 'Calendario', bg: 'bg-blue-50', fg: 'text-blue-500' },
            { href: '/leaderboard', icon: Trophy, label: 'Ranking', bg: 'bg-amber-50', fg: 'text-amber-500' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl transition-all active:scale-[0.97]',
                item.bg
              )}
            >
              <item.icon size={20} className={item.fg} />
              <span className={cn('text-xs font-semibold', item.fg)}>
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* ---------------------------------------------------------------- */}
      {/* UPCOMING EVENTS                                                  */}
      {/* ---------------------------------------------------------------- */}
      {events.length > 0 && (
        <motion.div variants={cardVariants}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-sm font-bold text-brand-on-surface flex items-center gap-2">
              <CalendarDays size={14} className="text-blue-500" />
              Proximos Eventos
            </h2>
            <Link
              href="/calendar"
              className="text-xs font-medium text-brand-primary hover:underline"
            >
              Ver todos
            </Link>
          </div>
          <div className="space-y-2">
            {events.map((event) => (
              <Link href="/calendar" key={event.id} className="block">
                <div className="card flex items-center gap-3 hover:shadow-md transition-shadow">
                  <div
                    className="w-1 h-10 rounded-full shrink-0"
                    style={{ backgroundColor: event.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-brand-on-surface truncate">
                      {event.title}
                    </p>
                    <p className="text-xs text-brand-muted">
                      {getEventTypeLabel(event.eventType)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-brand-muted shrink-0">
                    <Clock size={12} />
                    <span className="text-xs font-medium">
                      {formatEventTime(event.startDatetime)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* LATEST VIDEO                                                     */}
      {/* ---------------------------------------------------------------- */}
      {latestVideo && (
        <motion.div variants={cardVariants}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-sm font-bold text-brand-on-surface flex items-center gap-2">
              <Video size={14} className="text-emerald-500" />
              Nova Videoaula
            </h2>
            <Link
              href="/videos"
              className="text-xs font-medium text-brand-primary hover:underline"
            >
              Ver todas
            </Link>
          </div>
          <Link href={`/videos/${latestVideo.id}`} className="block">
            <div className="card-elevated overflow-hidden hover:shadow-lg transition-shadow group">
              {/* Thumbnail */}
              <div className="relative -mx-4 -mt-4 mb-3 aspect-video bg-gray-100">
                {latestVideo.thumbnailUrl ? (
                  <img
                    src={latestVideo.thumbnailUrl}
                    alt={latestVideo.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-brand-secondary to-[#2A2A4E] flex items-center justify-center">
                    <Video size={32} className="text-white/30" />
                  </div>
                )}
                {/* Play overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                    <Play size={20} className="text-brand-primary ml-0.5" />
                  </div>
                </div>
                {/* Duration badge */}
                {latestVideo.durationSeconds && (
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs font-medium px-2 py-0.5 rounded-md">
                    {formatDuration(latestVideo.durationSeconds)}
                  </div>
                )}
              </div>

              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-primary">
                  {latestVideo.categoryName}
                </span>
                <p className="text-sm font-semibold text-brand-on-surface mt-0.5 line-clamp-2">
                  {latestVideo.title}
                </p>
              </div>
            </div>
          </Link>
        </motion.div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* MOTIVATIONAL FOOTER                                              */}
      {/* ---------------------------------------------------------------- */}
      <motion.div
        variants={cardVariants}
        className="text-center py-4"
      >
        <p className="text-xs text-brand-muted">
          Cada dia e uma nova oportunidade de evoluir.
        </p>
        <p className="text-xs font-semibold text-brand-primary mt-0.5">
          Voce esta no caminho certo!
        </p>
      </motion.div>
    </motion.div>
  );
}
