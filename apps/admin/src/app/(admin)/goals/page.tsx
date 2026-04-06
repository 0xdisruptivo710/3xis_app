'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Target, Trash2, X } from 'lucide-react';

interface Store {
  id: string;
  name: string;
}

interface Profile {
  id: string;
  full_name: string;
  store_id: string | null;
}

interface SalesGoal {
  id: string;
  user_id: string | null;
  store_id: string | null;
  goal_type: string;
  metric: string;
  target_value: number;
  period_start: string;
  period_end: string;
  x3_profiles?: { full_name: string } | null;
  x3_stores?: { name: string } | null;
}

const GOAL_TYPE_LABELS: Record<string, string> = {
  daily: 'Diaria',
  weekly: 'Semanal',
  monthly: 'Mensal',
};

const METRIC_LABELS: Record<string, string> = {
  calls_made: 'Ligacoes Feitas',
  contacts_reached: 'Contatos Alcancados',
  appointments_set: 'Agendamentos',
  test_drives: 'Test Drives',
  proposals_sent: 'Propostas Enviadas',
  sales_closed: 'Vendas Fechadas',
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<SalesGoal[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const supabase = createClient();

  const [formData, setFormData] = useState({
    scope: 'user' as 'user' | 'store',
    user_id: '',
    store_id: '',
    goal_type: 'daily',
    metric: 'calls_made',
    target_value: 10,
    period_start: new Date().toISOString().split('T')[0],
    period_end: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);

    const [goalsRes, storesRes, usersRes] = await Promise.all([
      supabase
        .from('x3_sales_goals')
        .select('id, user_id, store_id, goal_type, metric, target_value, period_start, period_end, x3_profiles(full_name), x3_stores(name)')
        .order('created_at', { ascending: false }),
      supabase.from('x3_stores').select('id, name').order('name'),
      supabase.from('x3_profiles').select('id, full_name, store_id').eq('role', 'sdr').order('full_name'),
    ]);

    setGoals((goalsRes.data as unknown as SalesGoal[]) ?? []);
    setStores(storesRes.data ?? []);
    setUsers(usersRes.data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function calculatePeriodEnd(type: string, start: string): string {
    const startDate = new Date(start + 'T00:00:00');
    if (type === 'daily') {
      return start;
    } else if (type === 'weekly') {
      const end = new Date(startDate);
      end.setDate(end.getDate() + 6);
      return end.toISOString().split('T')[0];
    } else {
      const end = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
      return end.toISOString().split('T')[0];
    }
  }

  function openNewForm() {
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      scope: 'user',
      user_id: users[0]?.id ?? '',
      store_id: stores[0]?.id ?? '',
      goal_type: 'daily',
      metric: 'calls_made',
      target_value: 10,
      period_start: today,
      period_end: today,
    });
    setShowForm(true);
  }

  async function handleSave() {
    const periodEnd = calculatePeriodEnd(formData.goal_type, formData.period_start);
    const payload = {
      user_id: formData.scope === 'user' ? formData.user_id : null,
      store_id: formData.scope === 'store' ? formData.store_id : null,
      goal_type: formData.goal_type,
      metric: formData.metric,
      target_value: formData.target_value,
      period_start: formData.period_start,
      period_end: periodEnd,
    };

    await supabase.from('x3_sales_goals').insert(payload);
    setShowForm(false);
    fetchData();
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta meta?')) return;
    await supabase.from('x3_sales_goals').delete().eq('id', id);
    fetchData();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-brand-on-surface">Metas de Vendas</h1>
          <p className="text-brand-muted text-sm mt-1">
            Configure metas para usuarios ou lojas
          </p>
        </div>
        <button onClick={openNewForm} className="btn-primary flex items-center gap-2 w-fit">
          <Plus size={18} />
          Nova Meta
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Nova Meta</h2>
              <button onClick={() => setShowForm(false)} className="text-brand-muted hover:text-brand-on-surface">
                <X size={20} />
              </button>
            </div>

            {/* Scope */}
            <div>
              <label className="label">Escopo</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFormData({ ...formData, scope: 'user' })}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                    formData.scope === 'user'
                      ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  Por Usuario
                </button>
                <button
                  onClick={() => setFormData({ ...formData, scope: 'store' })}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                    formData.scope === 'store'
                      ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  Por Loja
                </button>
              </div>
            </div>

            {formData.scope === 'user' ? (
              <div>
                <label className="label">Usuario</label>
                <select
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  className="select-field"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.full_name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="label">Loja</label>
                <select
                  value={formData.store_id}
                  onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
                  className="select-field"
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Periodo</label>
                <select
                  value={formData.goal_type}
                  onChange={(e) => setFormData({ ...formData, goal_type: e.target.value })}
                  className="select-field"
                >
                  <option value="daily">Diaria</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensal</option>
                </select>
              </div>
              <div>
                <label className="label">Metrica</label>
                <select
                  value={formData.metric}
                  onChange={(e) => setFormData({ ...formData, metric: e.target.value })}
                  className="select-field"
                >
                  {Object.entries(METRIC_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Valor Alvo</label>
                <input
                  type="number"
                  value={formData.target_value}
                  onChange={(e) => setFormData({ ...formData, target_value: parseInt(e.target.value) || 0 })}
                  className="input-field"
                  min={1}
                />
              </div>
              <div>
                <label className="label">Inicio</label>
                <input
                  type="date"
                  value={formData.period_start}
                  onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="btn-ghost flex-1">
                Cancelar
              </button>
              <button onClick={handleSave} className="btn-primary flex-1">
                Criar Meta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Goals table */}
      <div className="table-container overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="table-header">
              <th className="px-4 py-3">Destino</th>
              <th className="px-4 py-3">Metrica</th>
              <th className="px-4 py-3">Alvo</th>
              <th className="px-4 py-3">Periodo</th>
              <th className="px-4 py-3">Inicio</th>
              <th className="px-4 py-3">Fim</th>
              <th className="px-4 py-3">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="table-row animate-pulse">
                  <td className="table-cell"><div className="h-4 w-32 bg-gray-200 rounded" /></td>
                  <td className="table-cell"><div className="h-4 w-24 bg-gray-200 rounded" /></td>
                  <td className="table-cell"><div className="h-4 w-12 bg-gray-200 rounded" /></td>
                  <td className="table-cell"><div className="h-4 w-16 bg-gray-200 rounded" /></td>
                  <td className="table-cell"><div className="h-4 w-20 bg-gray-200 rounded" /></td>
                  <td className="table-cell"><div className="h-4 w-20 bg-gray-200 rounded" /></td>
                  <td className="table-cell"><div className="h-4 w-8 bg-gray-200 rounded" /></td>
                </tr>
              ))
            ) : goals.length > 0 ? (
              goals.map((goal) => (
                <tr key={goal.id} className="table-row">
                  <td className="table-cell font-medium">
                    {goal.x3_profiles?.full_name ?? goal.x3_stores?.name ?? '—'}
                  </td>
                  <td className="table-cell">
                    {METRIC_LABELS[goal.metric] ?? goal.metric}
                  </td>
                  <td className="table-cell font-semibold text-brand-primary">
                    {goal.target_value}
                  </td>
                  <td className="table-cell">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-primary/10 text-brand-primary">
                      {GOAL_TYPE_LABELS[goal.goal_type] ?? goal.goal_type}
                    </span>
                  </td>
                  <td className="table-cell text-brand-muted">{goal.period_start}</td>
                  <td className="table-cell text-brand-muted">{goal.period_end}</td>
                  <td className="table-cell">
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-brand-muted hover:text-brand-error transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="table-cell text-center text-brand-muted py-12">
                  <Target size={40} className="mx-auto mb-3 text-gray-300" />
                  <p>Nenhuma meta configurada.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
