'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, Users, CalendarCheck, Car, FileText, Handshake,
  TrendingUp, TrendingDown, Minus, Save, Loader2, History,
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

interface SalesGoal {
  metric: string;
  target_value: number;
  goal_type: string;
}

const METRICS = [
  { key: 'calls_made', label: 'Ligacoes', icon: Phone, color: 'text-blue-500' },
  { key: 'contacts_reached', label: 'Contatos', icon: Users, color: 'text-purple-500' },
  { key: 'appointments_set', label: 'Agendamentos', icon: CalendarCheck, color: 'text-green-500' },
  { key: 'test_drives', label: 'Test Drives', icon: Car, color: 'text-brand-primary' },
  { key: 'proposals_sent', label: 'Propostas', icon: FileText, color: 'text-yellow-600' },
  { key: 'sales_closed', label: 'Fechamentos', icon: Handshake, color: 'text-brand-success' },
] as const;

type MetricKey = typeof METRICS[number]['key'];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function SalesPage() {
  const { user } = useAuth();
  const supabase = createClient();

  const [activity, setActivity] = useState<SalesActivity | null>(null);
  const [goals, setGoals] = useState<SalesGoal[]>([]);
  const [formValues, setFormValues] = useState<Record<MetricKey, number>>({
    calls_made: 0,
    contacts_reached: 0,
    appointments_set: 0,
    test_drives: 0,
    proposals_sent: 0,
    sales_closed: 0,
  });
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [activityRes, goalsRes] = await Promise.all([
      supabase
        .from('x3_sales_activities')
        .select('*')
        .eq('user_id', user.id)
        .eq('activity_date', today)
        .maybeSingle(),
      supabase
        .from('x3_sales_goals')
        .select('*')
        .or(`user_id.eq.${user.id},store_id.eq.${user.storeId}`)
        .eq('goal_type', 'daily')
        .lte('period_start', today)
        .gte('period_end', today),
    ]);

    if (activityRes.data) {
      setActivity(activityRes.data);
      setFormValues({
        calls_made: activityRes.data.calls_made,
        contacts_reached: activityRes.data.contacts_reached,
        appointments_set: activityRes.data.appointments_set,
        test_drives: activityRes.data.test_drives,
        proposals_sent: activityRes.data.proposals_sent,
        sales_closed: activityRes.data.sales_closed,
      });
      setNotes(activityRes.data.notes || '');
    }

    if (goalsRes.data) {
      setGoals(goalsRes.data);
    }

    setLoading(false);
  }, [user, today]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function getGoalForMetric(metric: MetricKey): SalesGoal | undefined {
    return goals.find((g) => g.metric === metric);
  }

  function getStatus(value: number, target: number): 'below' | 'on_target' | 'above' {
    const ratio = value / target;
    if (ratio >= 1) return 'above';
    if (ratio >= 0.7) return 'on_target';
    return 'below';
  }

  function getStatusColor(status: 'below' | 'on_target' | 'above') {
    switch (status) {
      case 'above': return 'text-brand-success bg-brand-success/10 border-brand-success/20';
      case 'on_target': return 'text-brand-warning bg-brand-warning/10 border-brand-warning/20';
      case 'below': return 'text-brand-error bg-brand-error/10 border-brand-error/20';
    }
  }

  function getStatusIcon(status: 'below' | 'on_target' | 'above') {
    switch (status) {
      case 'above': return TrendingUp;
      case 'on_target': return Minus;
      case 'below': return TrendingDown;
    }
  }

  function handleChange(key: MetricKey, delta: number) {
    setFormValues((prev) => ({
      ...prev,
      [key]: Math.max(0, prev[key] + delta),
    }));
    setSaved(false);
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);

    const payload = {
      user_id: user.id,
      activity_date: today,
      ...formValues,
      notes: notes || null,
    };

    if (activity) {
      await supabase
        .from('x3_sales_activities')
        .update(payload)
        .eq('id', activity.id);
    } else {
      await supabase
        .from('x3_sales_activities')
        .insert(payload);
    }

    setSaving(false);
    setSaved(true);
    fetchData();
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) return null;

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-brand-on-surface">
            Vendas
          </h1>
          <p className="text-sm text-brand-muted mt-0.5">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <Link
          href="/sales/history"
          className="flex items-center gap-1.5 text-sm text-brand-primary font-medium hover:underline"
        >
          <History size={16} />
          Historico
        </Link>
      </div>

      {/* Metric Cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-3"
      >
        {METRICS.map((metric) => {
          const goal = getGoalForMetric(metric.key);
          const value = formValues[metric.key];
          const status = goal ? getStatus(value, goal.target_value) : null;
          const StatusIcon = status ? getStatusIcon(status) : null;
          const Icon = metric.icon;

          return (
            <motion.div key={metric.key} variants={item} className="card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center bg-gray-100', metric.color)}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-brand-on-surface">{metric.label}</p>
                    {goal && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-brand-muted">
                          Meta: {goal.target_value}
                        </span>
                        {status && StatusIcon && (
                          <span className={cn('text-xs px-1.5 py-0.5 rounded-full border font-medium', getStatusColor(status))}>
                            <StatusIcon size={10} className="inline mr-0.5" />
                            {status === 'above' ? 'Acima' : status === 'on_target' ? 'Na meta' : 'Abaixo'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Counter */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleChange(metric.key, -1)}
                    className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-brand-on-surface font-bold text-lg transition-colors"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-display font-bold text-lg text-brand-on-surface">
                    {value}
                  </span>
                  <button
                    onClick={() => handleChange(metric.key, 1)}
                    className="w-9 h-9 rounded-lg bg-brand-primary hover:bg-brand-primary/90 flex items-center justify-center text-white font-bold text-lg transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Progress bar against goal */}
              {goal && (
                <div className="mt-3">
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      className={cn(
                        'h-full rounded-full',
                        status === 'above' ? 'bg-brand-success' :
                        status === 'on_target' ? 'bg-brand-warning' : 'bg-brand-error'
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((value / goal.target_value) * 100, 100)}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* Notes */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card"
      >
        <label className="text-sm font-medium text-brand-on-surface block mb-2">
          Observacoes do dia
        </label>
        <textarea
          value={notes}
          onChange={(e) => { setNotes(e.target.value); setSaved(false); }}
          placeholder="Alguma nota sobre o dia..."
          rows={3}
          className="input-field w-full resize-none"
        />
      </motion.div>

      {/* Save button */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Salvando...
            </>
          ) : saved ? (
            'Salvo!'
          ) : (
            <>
              <Save size={18} />
              Salvar atividades
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
}
