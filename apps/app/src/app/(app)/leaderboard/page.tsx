'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Crown, Flame, Zap } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

interface RankEntry {
  id: string;
  full_name: string;
  avatar_url: string | null;
  xp_total: number;
  current_level: number;
  streak_days: number;
  rank: number;
  is_current_user: boolean;
}

type Period = 'weekly' | 'monthly';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0 },
};

export default function LeaderboardPage() {
  const { user } = useAuth();
  const supabase = createClient();

  const [rankings, setRankings] = useState<RankEntry[]>([]);
  const [period, setPeriod] = useState<Period>('weekly');
  const [loading, setLoading] = useState(true);

  const fetchRankings = useCallback(async () => {
    if (!user || !user.storeId) return;
    setLoading(true);

    // Get XP transactions for the period
    const now = new Date();
    const startDate = new Date();
    if (period === 'weekly') {
      startDate.setDate(now.getDate() - 7);
    } else {
      startDate.setDate(1);
    }

    // Get all profiles in the same store
    const { data: profiles } = await supabase
      .from('x3_profiles')
      .select('id, full_name, avatar_url, xp_total, current_level, streak_days')
      .eq('store_id', user.storeId)
      .eq('role', 'sdr');

    if (!profiles) {
      setLoading(false);
      return;
    }

    // Get XP per user for this period
    const { data: xpData } = await supabase
      .from('x3_xp_transactions')
      .select('user_id, amount')
      .in('user_id', profiles.map((p) => p.id))
      .gte('created_at', startDate.toISOString());

    const xpByUser = new Map<string, number>();
    (xpData || []).forEach((t) => {
      xpByUser.set(t.user_id, (xpByUser.get(t.user_id) || 0) + t.amount);
    });

    const ranked: RankEntry[] = profiles
      .map((p) => ({
        id: p.id,
        full_name: p.full_name,
        avatar_url: p.avatar_url,
        xp_total: xpByUser.get(p.id) || 0,
        current_level: p.current_level,
        streak_days: p.streak_days,
        rank: 0,
        is_current_user: p.id === user.id,
      }))
      .sort((a, b) => b.xp_total - a.xp_total)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    setRankings(ranked);
    setLoading(false);
  }, [user, period]);

  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  const currentUserRank = rankings.find((r) => r.is_current_user);
  const top3 = rankings.slice(0, 3);
  const rest = rankings.slice(3);

  function getRankColor(rank: number) {
    switch (rank) {
      case 1: return 'text-brand-accent';
      case 2: return 'text-gray-400';
      case 3: return 'text-amber-600';
      default: return 'text-brand-muted';
    }
  }

  function getRankBg(rank: number) {
    switch (rank) {
      case 1: return 'bg-brand-accent/10 border-brand-accent/20';
      case 2: return 'bg-gray-100 border-gray-200';
      case 3: return 'bg-amber-50 border-amber-200';
      default: return '';
    }
  }

  if (loading) return null;

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div>
        <h1 className="font-display text-xl font-bold text-brand-on-surface">
          Ranking
        </h1>
        <p className="text-sm text-brand-muted mt-0.5">
          Competicao da sua loja
        </p>
      </div>

      {/* Period toggle */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
        {(['weekly', 'monthly'] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              'flex-1 py-2 rounded-lg text-sm font-medium transition-all',
              period === p
                ? 'bg-white text-brand-on-surface shadow-sm'
                : 'text-brand-muted'
            )}
          >
            {p === 'weekly' ? 'Semanal' : 'Mensal'}
          </button>
        ))}
      </div>

      {/* Current user position */}
      {currentUserRank && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card bg-brand-primary/5 border-brand-primary/10"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center text-white font-display font-bold text-sm">
              {currentUserRank.rank}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-brand-on-surface">Sua posicao</p>
              <p className="text-xs text-brand-muted">
                {currentUserRank.xp_total.toLocaleString()} XP {period === 'weekly' ? 'esta semana' : 'este mes'}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-brand-accent">
                <Flame size={14} />
                <span className="text-sm font-bold">{currentUserRank.streak_days}</span>
              </div>
              <p className="text-[10px] text-brand-muted">streak</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Top 3 podium */}
      {top3.length >= 3 && (
        <div className="flex items-end justify-center gap-3 py-4">
          {/* 2nd place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center w-24"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-gray-300">
                {top3[1].avatar_url ? (
                  <img src={top3[1].avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-bold text-gray-500">
                    {top3[1].full_name.charAt(0)}
                  </span>
                )}
              </div>
              <Medal size={16} className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-gray-400" />
            </div>
            <p className="text-xs font-medium text-brand-on-surface mt-2 truncate w-full text-center">
              {top3[1].full_name.split(' ')[0]}
            </p>
            <p className="text-[10px] text-brand-muted">{top3[1].xp_total} XP</p>
            <div className="w-full h-16 bg-gray-100 rounded-t-lg mt-2" />
          </motion.div>

          {/* 1st place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center w-24"
          >
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-brand-accent/10 flex items-center justify-center overflow-hidden border-2 border-brand-accent">
                {top3[0].avatar_url ? (
                  <img src={top3[0].avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-brand-accent">
                    {top3[0].full_name.charAt(0)}
                  </span>
                )}
              </div>
              <Crown size={20} className="absolute -top-3 left-1/2 -translate-x-1/2 text-brand-accent" />
            </div>
            <p className="text-xs font-bold text-brand-on-surface mt-2 truncate w-full text-center">
              {top3[0].full_name.split(' ')[0]}
            </p>
            <p className="text-[10px] text-brand-accent font-medium">{top3[0].xp_total} XP</p>
            <div className="w-full h-24 bg-brand-accent/10 rounded-t-lg mt-2" />
          </motion.div>

          {/* 3rd place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center w-24"
          >
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center overflow-hidden border-2 border-amber-300">
                {top3[2].avatar_url ? (
                  <img src={top3[2].avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-bold text-amber-600">
                    {top3[2].full_name.charAt(0)}
                  </span>
                )}
              </div>
              <Medal size={14} className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-amber-600" />
            </div>
            <p className="text-xs font-medium text-brand-on-surface mt-2 truncate w-full text-center">
              {top3[2].full_name.split(' ')[0]}
            </p>
            <p className="text-[10px] text-brand-muted">{top3[2].xp_total} XP</p>
            <div className="w-full h-10 bg-amber-50 rounded-t-lg mt-2" />
          </motion.div>
        </div>
      )}

      {/* Remaining rankings */}
      {rest.length > 0 && (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-2"
        >
          {rest.map((entry) => (
            <motion.div
              key={entry.id}
              variants={item}
              className={cn(
                'card flex items-center gap-3',
                entry.is_current_user && 'bg-brand-primary/5 border-brand-primary/10'
              )}
            >
              <span className={cn(
                'w-8 text-center font-display font-bold text-sm',
                getRankColor(entry.rank)
              )}>
                {entry.rank}
              </span>
              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {entry.avatar_url ? (
                  <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-medium text-brand-muted">
                    {entry.full_name.charAt(0)}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'text-sm truncate',
                  entry.is_current_user ? 'font-bold text-brand-primary' : 'font-medium text-brand-on-surface'
                )}>
                  {entry.full_name}
                  {entry.is_current_user && ' (voce)'}
                </p>
                <p className="text-xs text-brand-muted">Nivel {entry.current_level}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-display font-bold text-brand-on-surface flex items-center gap-1">
                  <Zap size={12} className="text-brand-accent" />
                  {entry.xp_total.toLocaleString()}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Empty state */}
      {rankings.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Trophy size={24} className="text-brand-muted" />
          </div>
          <p className="text-brand-muted text-sm">
            Nenhum ranking disponivel. Continue ganhando XP!
          </p>
        </div>
      )}
    </div>
  );
}
