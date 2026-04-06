'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sunrise, Brain, Dumbbell, Briefcase, CheckCircle2, Zap, Sparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

interface Ritual {
  id: string;
  title: string;
  description: string;
  ritual_type: 'mental' | 'physical' | 'professional';
  duration_min: number;
  benefit: string | null;
  icon: string;
  xp_reward: number;
  completed: boolean;
}

const TYPE_CONFIG = {
  mental: { label: 'Mental', icon: Brain, color: 'text-purple-500', bg: 'bg-purple-50' },
  physical: { label: 'Fisico', icon: Dumbbell, color: 'text-blue-500', bg: 'bg-blue-50' },
  professional: { label: 'Profissional', icon: Briefcase, color: 'text-brand-primary', bg: 'bg-brand-primary/5' },
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function RitualsPage() {
  const { user } = useAuth();
  const supabase = createClient();

  const [rituals, setRituals] = useState<Ritual[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const fetchRituals = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [ritualsRes, completedRes] = await Promise.all([
      supabase
        .from('x3_rituals')
        .select('*')
        .eq('is_active', true)
        .order('sort_order'),
      supabase
        .from('x3_user_daily_rituals')
        .select('ritual_id')
        .eq('user_id', user.id)
        .eq('ritual_date', today),
    ]);

    const completedSet = new Set((completedRes.data || []).map((r) => r.ritual_id));

    const mapped: Ritual[] = (ritualsRes.data || []).map((r) => ({
      ...r,
      completed: completedSet.has(r.id),
    }));

    setRituals(mapped);
    setLoading(false);
  }, [user, today]);

  useEffect(() => {
    fetchRituals();
  }, [fetchRituals]);

  async function completeRitual(ritualId: string) {
    if (!user || completing) return;
    setCompleting(ritualId);

    await supabase
      .from('x3_user_daily_rituals')
      .insert({
        user_id: user.id,
        ritual_id: ritualId,
        ritual_date: today,
      });

    setRituals((prev) =>
      prev.map((r) => (r.id === ritualId ? { ...r, completed: true } : r))
    );

    // Check if all completed
    const updatedRituals = rituals.map((r) =>
      r.id === ritualId ? { ...r, completed: true } : r
    );
    if (updatedRituals.every((r) => r.completed)) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    }

    setCompleting(null);
  }

  const completedCount = rituals.filter((r) => r.completed).length;
  const totalCount = rituals.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const totalXP = rituals.reduce((sum, r) => sum + (r.completed ? r.xp_reward : 0), 0);

  const groupedRituals = rituals.reduce<Record<string, Ritual[]>>((acc, r) => {
    if (!acc[r.ritual_type]) acc[r.ritual_type] = [];
    acc[r.ritual_type].push(r);
    return acc;
  }, {});

  if (loading) return null;

  return (
    <div className="p-4 space-y-5">
      {/* Celebration */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 pointer-events-none"
          >
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              className="bg-white rounded-2xl p-8 text-center shadow-2xl"
            >
              <Sparkles size={48} className="mx-auto text-brand-accent mb-3" />
              <h3 className="font-display font-bold text-xl text-brand-on-surface">
                Ritual matinal completo!
              </h3>
              <p className="text-sm text-brand-muted mt-1">+{totalXP} XP ganhos</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div>
        <h1 className="font-display text-xl font-bold text-brand-on-surface">
          Rituais Matinais
        </h1>
        <p className="text-sm text-brand-muted mt-0.5">
          Comece seu dia com energia
        </p>
      </div>

      {/* Progress */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card bg-gradient-to-br from-brand-primary/5 to-brand-accent/5"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sunrise size={20} className="text-brand-primary" />
            <span className="font-display font-bold text-brand-on-surface">
              Progresso de hoje
            </span>
          </div>
          <div className="flex items-center gap-1 text-brand-accent">
            <Zap size={14} />
            <span className="text-sm font-bold">{totalXP} XP</span>
          </div>
        </div>
        <div className="h-2.5 bg-white/60 rounded-full overflow-hidden">
          <motion.div
            className={cn(
              'h-full rounded-full',
              progress === 100
                ? 'bg-gradient-to-r from-brand-success to-brand-accent'
                : 'bg-brand-primary'
            )}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <p className="text-xs text-brand-muted mt-2">
          {completedCount} de {totalCount} rituais completados
        </p>
      </motion.div>

      {/* Rituals by type */}
      {Object.entries(groupedRituals).map(([type, typeRituals]) => {
        const config = TYPE_CONFIG[type as keyof typeof TYPE_CONFIG];
        const TypeIcon = config.icon;

        return (
          <div key={type}>
            <div className="flex items-center gap-2 mb-3">
              <TypeIcon size={16} className={config.color} />
              <h2 className="font-display font-bold text-sm text-brand-on-surface">
                {config.label}
              </h2>
              <span className="text-xs text-brand-muted">
                {typeRituals.filter((r) => r.completed).length}/{typeRituals.length}
              </span>
            </div>

            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="space-y-2"
            >
              {typeRituals.map((ritual) => (
                <motion.div
                  key={ritual.id}
                  variants={item}
                  className={cn(
                    'card flex items-center gap-3 transition-all',
                    ritual.completed && 'bg-brand-success/5 border-brand-success/10'
                  )}
                >
                  <span className="text-2xl flex-shrink-0">{ritual.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'font-medium text-sm',
                      ritual.completed ? 'text-brand-success line-through' : 'text-brand-on-surface'
                    )}>
                      {ritual.title}
                    </p>
                    <p className="text-xs text-brand-muted mt-0.5 line-clamp-1">
                      {ritual.description}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-brand-muted">
                        {ritual.duration_min} min
                      </span>
                      {ritual.benefit && (
                        <span className="text-[10px] text-brand-muted">
                          {ritual.benefit}
                        </span>
                      )}
                    </div>
                  </div>

                  {ritual.completed ? (
                    <div className="flex items-center gap-1 text-brand-success flex-shrink-0">
                      <CheckCircle2 size={20} />
                    </div>
                  ) : (
                    <button
                      onClick={() => completeRitual(ritual.id)}
                      disabled={completing === ritual.id}
                      className="btn-primary px-3 py-1.5 text-xs flex-shrink-0 flex items-center gap-1"
                    >
                      {completing === ritual.id ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1 }}
                          className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full"
                        />
                      ) : (
                        <>
                          <CheckCircle2 size={12} />
                          Feito
                        </>
                      )}
                    </button>
                  )}

                  <span className={cn(
                    'text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0',
                    ritual.completed
                      ? 'text-brand-success bg-brand-success/10'
                      : 'text-brand-accent bg-brand-accent/10'
                  )}>
                    +{ritual.xp_reward}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        );
      })}

      {/* Empty state */}
      {rituals.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Sunrise size={24} className="text-brand-muted" />
          </div>
          <p className="text-brand-muted text-sm">
            Nenhum ritual configurado ainda.
          </p>
        </div>
      )}
    </div>
  );
}
