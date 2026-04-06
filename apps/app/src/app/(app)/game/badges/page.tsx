'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Award, Lock } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  icon_locked_url: string;
  badge_type: string;
  earned: boolean;
  earned_at: string | null;
}

const BADGE_TYPE_LABELS: Record<string, string> = {
  phase: 'Fases',
  streak: 'Streaks',
  performance: 'Performance',
  special: 'Especial',
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, scale: 0.8 },
  show: { opacity: 1, scale: 1 },
};

export default function BadgesPage() {
  const { user } = useAuth();
  const supabase = createClient();

  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  const fetchBadges = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [badgesRes, userBadgesRes] = await Promise.all([
      supabase.from('x3_badges').select('*').order('badge_type'),
      supabase.from('x3_user_badges').select('badge_id, earned_at').eq('user_id', user.id),
    ]);

    const allBadges = badgesRes.data || [];
    const earned = userBadgesRes.data || [];
    const earnedMap = new Map(earned.map((e) => [e.badge_id, e.earned_at]));

    const mapped: Badge[] = allBadges.map((b) => ({
      ...b,
      earned: earnedMap.has(b.id),
      earned_at: earnedMap.get(b.id) || null,
    }));

    setBadges(mapped);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  const earnedCount = badges.filter((b) => b.earned).length;

  const groupedBadges = badges.reduce<Record<string, Badge[]>>((acc, b) => {
    if (!acc[b.badge_type]) acc[b.badge_type] = [];
    acc[b.badge_type].push(b);
    return acc;
  }, {});

  if (loading) return null;

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/game" className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-brand-on-surface" />
        </Link>
        <div>
          <h1 className="font-display text-xl font-bold text-brand-on-surface">
            Conquistas
          </h1>
          <p className="text-sm text-brand-muted mt-0.5">
            {earnedCount} de {badges.length} desbloqueadas
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-brand-on-surface">Progresso</span>
          <span className="text-sm font-display font-bold text-brand-accent">
            {badges.length > 0 ? Math.round((earnedCount / badges.length) * 100) : 0}%
          </span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-brand-accent to-brand-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${badges.length > 0 ? (earnedCount / badges.length) * 100 : 0}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Badge groups */}
      {Object.entries(groupedBadges).map(([type, typeBadges]) => (
        <div key={type}>
          <h2 className="font-display font-bold text-sm text-brand-muted uppercase tracking-wider mb-3">
            {BADGE_TYPE_LABELS[type] || type}
          </h2>
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-3 gap-3"
          >
            {typeBadges.map((badge) => (
              <motion.button
                key={badge.id}
                variants={item}
                onClick={() => setSelectedBadge(badge)}
                className={cn(
                  'flex flex-col items-center p-4 rounded-2xl transition-all text-center',
                  badge.earned
                    ? 'bg-white shadow-md border border-brand-accent/20'
                    : 'bg-gray-50 opacity-40'
                )}
              >
                <div className={cn(
                  'w-14 h-14 rounded-2xl flex items-center justify-center mb-2',
                  badge.earned
                    ? 'bg-brand-accent/10'
                    : 'bg-gray-200'
                )}>
                  {badge.earned ? (
                    badge.icon_url ? (
                      <img src={badge.icon_url} alt={badge.name} className="w-8 h-8" />
                    ) : (
                      <Award size={28} className="text-brand-accent" />
                    )
                  ) : (
                    <Lock size={20} className="text-brand-muted" />
                  )}
                </div>
                <p className={cn(
                  'text-xs font-medium line-clamp-2',
                  badge.earned ? 'text-brand-on-surface' : 'text-brand-muted'
                )}>
                  {badge.name}
                </p>
              </motion.button>
            ))}
          </motion.div>
        </div>
      ))}

      {/* Empty state */}
      {badges.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Award size={24} className="text-brand-muted" />
          </div>
          <p className="text-brand-muted text-sm">
            Nenhuma conquista disponivel ainda.
          </p>
        </div>
      )}

      {/* Badge detail modal */}
      {selectedBadge && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
          onClick={() => setSelectedBadge(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-sm text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={cn(
              'w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4',
              selectedBadge.earned ? 'bg-brand-accent/10' : 'bg-gray-100'
            )}>
              {selectedBadge.earned ? (
                selectedBadge.icon_url ? (
                  <img src={selectedBadge.icon_url} alt={selectedBadge.name} className="w-12 h-12" />
                ) : (
                  <Award size={40} className="text-brand-accent" />
                )
              ) : (
                <Lock size={28} className="text-brand-muted" />
              )}
            </div>
            <h3 className="font-display font-bold text-lg text-brand-on-surface mb-1">
              {selectedBadge.name}
            </h3>
            <p className="text-sm text-brand-muted mb-3">{selectedBadge.description}</p>
            {selectedBadge.earned && selectedBadge.earned_at && (
              <p className="text-xs text-brand-success font-medium">
                Desbloqueada em {new Date(selectedBadge.earned_at).toLocaleDateString('pt-BR')}
              </p>
            )}
            {!selectedBadge.earned && (
              <p className="text-xs text-brand-muted">
                Complete as missoes para desbloquear
              </p>
            )}
            <button
              onClick={() => setSelectedBadge(null)}
              className="btn-ghost mt-4 w-full"
            >
              Fechar
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
