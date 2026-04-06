'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, CalendarDays, Phone, Users, CalendarCheck,
  Car, FileText, Handshake, Filter,
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

interface SalesActivity {
  id: string;
  activity_date: string;
  calls_made: number;
  contacts_reached: number;
  appointments_set: number;
  test_drives: number;
  proposals_sent: number;
  sales_closed: number;
  notes: string | null;
}

type Period = '7d' | '30d' | '90d';

const METRIC_ICONS: Record<string, typeof Phone> = {
  calls_made: Phone,
  contacts_reached: Users,
  appointments_set: CalendarCheck,
  test_drives: Car,
  proposals_sent: FileText,
  sales_closed: Handshake,
};

const METRIC_LABELS: Record<string, string> = {
  calls_made: 'Ligacoes',
  contacts_reached: 'Contatos',
  appointments_set: 'Agendamentos',
  test_drives: 'Test Drives',
  proposals_sent: 'Propostas',
  sales_closed: 'Fechamentos',
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function SalesHistoryPage() {
  const { user } = useAuth();
  const supabase = createClient();

  const [activities, setActivities] = useState<SalesActivity[]>([]);
  const [period, setPeriod] = useState<Period>('30d');
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const daysBack = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const { data } = await supabase
      .from('x3_sales_activities')
      .select('*')
      .eq('user_id', user.id)
      .gte('activity_date', startDate.toISOString().split('T')[0])
      .order('activity_date', { ascending: false });

    setActivities(data || []);
    setLoading(false);
  }, [user, period]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const totals = activities.reduce(
    (acc, a) => ({
      calls_made: acc.calls_made + a.calls_made,
      contacts_reached: acc.contacts_reached + a.contacts_reached,
      appointments_set: acc.appointments_set + a.appointments_set,
      test_drives: acc.test_drives + a.test_drives,
      proposals_sent: acc.proposals_sent + a.proposals_sent,
      sales_closed: acc.sales_closed + a.sales_closed,
    }),
    { calls_made: 0, contacts_reached: 0, appointments_set: 0, test_drives: 0, proposals_sent: 0, sales_closed: 0 }
  );

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/sales" className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-brand-on-surface" />
        </Link>
        <div>
          <h1 className="font-display text-xl font-bold text-brand-on-surface">
            Historico de Vendas
          </h1>
          <p className="text-sm text-brand-muted mt-0.5">{activities.length} registros</p>
        </div>
      </div>

      {/* Period filter */}
      <div className="flex gap-2">
        {(['7d', '30d', '90d'] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
              period === p
                ? 'bg-brand-primary text-white'
                : 'bg-gray-100 text-brand-muted hover:bg-gray-200'
            )}
          >
            {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : '90 dias'}
          </button>
        ))}
      </div>

      {/* Totals summary */}
      <div className="grid grid-cols-3 gap-2">
        {Object.entries(totals).map(([key, value]) => {
          const Icon = METRIC_ICONS[key];
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card text-center py-3"
            >
              <Icon size={16} className="mx-auto text-brand-muted mb-1" />
              <p className="font-display font-bold text-lg text-brand-on-surface">{value}</p>
              <p className="text-[10px] text-brand-muted">{METRIC_LABELS[key]}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Activities list */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="card h-28" />
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <CalendarDays size={24} className="text-brand-muted" />
          </div>
          <p className="text-brand-muted text-sm">
            Nenhum registro encontrado neste periodo.
          </p>
        </div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
          {activities.map((a) => (
            <motion.div key={a.id} variants={item} className="card">
              <div className="flex items-center justify-between mb-3">
                <p className="font-medium text-sm text-brand-on-surface">
                  {new Date(a.activity_date + 'T12:00:00').toLocaleDateString('pt-BR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                </p>
                <span className="text-xs text-brand-primary font-medium bg-brand-primary/10 px-2 py-0.5 rounded-full">
                  {a.sales_closed} venda{a.sales_closed !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(METRIC_LABELS).map(([key, label]) => (
                  <div key={key} className="text-center">
                    <p className="font-display font-bold text-sm text-brand-on-surface">
                      {a[key as keyof SalesActivity] as number}
                    </p>
                    <p className="text-[10px] text-brand-muted">{label}</p>
                  </div>
                ))}
              </div>
              {a.notes && (
                <p className="mt-2 text-xs text-brand-muted border-t border-gray-100 pt-2 line-clamp-2">
                  {a.notes}
                </p>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
