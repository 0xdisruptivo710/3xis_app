'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Star, Lock, CheckCircle2, ChevronRight, Zap, Flame,
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';
import { cn } from '@/lib/utils';

interface GamePhase {
  id: string;
  phase_number: number;
  title: string;
  description: string | null;
  xp_reward: number;
  badge_id: string | null;
  missions: GameMission[];
}

interface GameMission {
  id: string;
  title: string;
  description: string;
  target_count: number;
  xp_reward: number;
  sort_order: number;
  progress?: {
    current_count: number;
    completed: boolean;
  };
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function GamePage() {
  const { user } = useAuth();
  const { levelName, progressToNextLevel, xpToNextLevel } = useProfile();
  const supabase = createClient();

  const [phases, setPhases] = useState<GamePhase[]>([]);
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchGameData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [phasesRes, missionsRes, progressRes] = await Promise.all([
      supabase
        .from('x3_game_phases')
        .select('*')
        .eq('is_active', true)
        .order('phase_number'),
      supabase
        .from('x3_game_missions')
        .select('*')
        .order('sort_order'),
      supabase
        .from('x3_user_mission_progress')
        .select('*')
        .eq('user_id', user.id),
    ]);

    const phasesData = phasesRes.data || [];
    const missionsData = missionsRes.data || [];
    const progressData = progressRes.data || [];

    const assembled: GamePhase[] = phasesData.map((phase) => {
      const phaseMissions = missionsData
        .filter((m) => m.phase_id === phase.id)
        .map((m) => {
          const prog = progressData.find((p) => p.mission_id === m.id);
          return {
            ...m,
            progress: prog
              ? { current_count: prog.current_count, completed: prog.completed }
              : undefined,
          };
        });

      return {
        ...phase,
        missions: phaseMissions,
      };
    });

    setPhases(assembled);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchGameData();
  }, [fetchGameData]);

  function isPhaseCompleted(phase: GamePhase): boolean {
    return phase.missions.length > 0 && phase.missions.every((m) => m.progress?.completed);
  }

  function isPhaseUnlocked(phase: GamePhase, index: number): boolean {
    if (index === 0) return true;
    return isPhaseCompleted(phases[index - 1]);
  }

  function getPhaseProgress(phase: GamePhase): number {
    if (phase.missions.length === 0) return 0;
    const completed = phase.missions.filter((m) => m.progress?.completed).length;
    return Math.round((completed / phase.missions.length) * 100);
  }

  if (loading) return null;

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-brand-on-surface">
            Treinamento
          </h1>
          <p className="text-sm text-brand-muted mt-0.5">Evolua sua carreira</p>
        </div>
        <Link
          href="/game/badges"
          className="flex items-center gap-1.5 text-sm text-brand-primary font-medium hover:underline"
        >
          <Trophy size={16} />
          Badges
        </Link>
      </div>

      {/* Current Level Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-elevated bg-gradient-to-br from-brand-secondary to-brand-secondary/90 text-white"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Star size={20} className="text-brand-accent" />
            <span className="font-display font-bold text-lg">{levelName}</span>
          </div>
          <span className="text-brand-accent font-display font-bold">
            Nivel {user?.currentLevel}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">
              <Zap size={14} className="inline text-brand-accent mr-1" />
              {user?.xpTotal?.toLocaleString()} XP
            </span>
            <span className="text-gray-300">
              {xpToNextLevel > 0 ? `${xpToNextLevel.toLocaleString()} XP para o proximo` : 'Nivel maximo!'}
            </span>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-brand-accent to-brand-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressToNextLevel}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/10">
          <div className="text-center flex-1">
            <p className="font-display font-bold text-lg text-brand-accent">
              {user?.streakDays}
            </p>
            <p className="text-xs text-gray-300">
              <Flame size={12} className="inline mr-0.5" />
              Streak
            </p>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center flex-1">
            <p className="font-display font-bold text-lg">
              {phases.filter((p, i) => isPhaseCompleted(p)).length}/{phases.length}
            </p>
            <p className="text-xs text-gray-300">Fases completas</p>
          </div>
        </div>
      </motion.div>

      {/* Phases */}
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
        {phases.map((phase, index) => {
          const unlocked = isPhaseUnlocked(phase, index);
          const completed = isPhaseCompleted(phase);
          const progress = getPhaseProgress(phase);
          const expanded = expandedPhase === phase.id;

          return (
            <motion.div key={phase.id} variants={item}>
              <button
                onClick={() => unlocked && setExpandedPhase(expanded ? null : phase.id)}
                disabled={!unlocked}
                className={cn(
                  'card w-full text-left transition-all',
                  !unlocked && 'opacity-50',
                  completed && 'border-brand-success/30 bg-brand-success/5',
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0',
                      completed
                        ? 'bg-brand-success/10 text-brand-success'
                        : unlocked
                        ? 'bg-brand-primary/10 text-brand-primary'
                        : 'bg-gray-100 text-brand-muted'
                    )}
                  >
                    {completed ? (
                      <CheckCircle2 size={24} />
                    ) : unlocked ? (
                      <span className="font-display font-bold text-lg">{phase.phase_number}</span>
                    ) : (
                      <Lock size={20} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold text-sm text-brand-on-surface">
                      Fase {phase.phase_number} — {phase.title}
                    </p>
                    <p className="text-xs text-brand-muted mt-0.5">
                      {completed
                        ? 'Completa!'
                        : `${phase.missions.filter((m) => m.progress?.completed).length}/${phase.missions.length} missoes`}
                    </p>
                    {unlocked && !completed && (
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2">
                        <motion.div
                          className="h-full bg-brand-primary rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    )}
                  </div>
                  <ChevronRight
                    size={18}
                    className={cn(
                      'text-brand-muted transition-transform flex-shrink-0',
                      expanded && 'rotate-90'
                    )}
                  />
                </div>
              </button>

              {/* Expanded missions */}
              <AnimatePresence>
                {expanded && unlocked && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="ml-6 pl-6 border-l-2 border-gray-100 space-y-2 py-2">
                      {phase.missions.map((mission) => {
                        const mCompleted = mission.progress?.completed;
                        const mProgress = mission.progress?.current_count || 0;

                        return (
                          <motion.div
                            key={mission.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={cn(
                              'p-3 rounded-xl',
                              mCompleted ? 'bg-brand-success/5' : 'bg-gray-50'
                            )}
                          >
                            <div className="flex items-start gap-2">
                              {mCompleted ? (
                                <CheckCircle2 size={16} className="text-brand-success mt-0.5 flex-shrink-0" />
                              ) : (
                                <div className="w-4 h-4 rounded-full border-2 border-gray-300 mt-0.5 flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className={cn(
                                  'text-sm font-medium',
                                  mCompleted ? 'text-brand-success line-through' : 'text-brand-on-surface'
                                )}>
                                  {mission.title}
                                </p>
                                <p className="text-xs text-brand-muted mt-0.5">{mission.description}</p>
                                {!mCompleted && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <div className="h-1 flex-1 bg-gray-200 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-brand-primary rounded-full"
                                        style={{ width: `${Math.min((mProgress / mission.target_count) * 100, 100)}%` }}
                                      />
                                    </div>
                                    <span className="text-[10px] text-brand-muted font-medium">
                                      {mProgress}/{mission.target_count}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <span className="text-[10px] font-medium text-brand-accent bg-brand-accent/10 px-1.5 py-0.5 rounded flex-shrink-0">
                                +{mission.xp_reward}
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                      {!completed && (
                        <p className="text-xs text-brand-accent font-medium pl-6 pt-1">
                          Recompensa da fase: +{phase.xp_reward} XP
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
