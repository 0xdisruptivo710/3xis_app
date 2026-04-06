'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Search, UserPlus } from 'lucide-react';

interface Profile {
  id: string;
  full_name: string;
  role: string;
  xp_total: number;
  current_level: number;
  streak_days: number;
  last_active_date: string | null;
  store_id: string | null;
  x3_stores?: { name: string } | null;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  supervisor: 'Supervisora',
  sdr: 'SDR',
};

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  supervisor: 'bg-blue-100 text-blue-700',
  sdr: 'bg-gray-100 text-gray-700',
};

const LEVEL_NAMES: Record<number, string> = {
  1: 'Iniciante SDR',
  2: 'Aprendiz de Vendas',
  3: 'Vendedora em Ascensao',
  4: 'SDR Profissional',
  5: 'Expert 3X',
  6: 'Mestre das Vendas',
};

export default function UsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const supabase = createClient();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('x3_profiles')
      .select('id, full_name, role, xp_total, current_level, streak_days, last_active_date, store_id, x3_stores(name)')
      .order('created_at', { ascending: false });

    if (roleFilter !== 'all') {
      query = query.eq('role', roleFilter);
    }

    if (search.trim()) {
      query = query.ilike('full_name', `%${search.trim()}%`);
    }

    const { data } = await query;
    setUsers((data as unknown as Profile[]) ?? []);
    setLoading(false);
  }, [supabase, roleFilter, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleRoleChange(userId: string, newRole: string) {
    await supabase
      .from('x3_profiles')
      .update({ role: newRole })
      .eq('id', userId);
    fetchUsers();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-brand-on-surface">Usuarios</h1>
          <p className="text-brand-muted text-sm mt-1">
            Gerencie os usuarios da plataforma
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="select-field w-auto"
        >
          <option value="all">Todos os cargos</option>
          <option value="sdr">SDR</option>
          <option value="supervisor">Supervisora</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-container overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="table-header">
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Cargo</th>
              <th className="px-4 py-3">Loja</th>
              <th className="px-4 py-3">Nivel</th>
              <th className="px-4 py-3">XP</th>
              <th className="px-4 py-3">Streak</th>
              <th className="px-4 py-3">Ultima Atividade</th>
              <th className="px-4 py-3">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="table-row animate-pulse">
                  <td className="table-cell"><div className="h-4 w-32 bg-gray-200 rounded" /></td>
                  <td className="table-cell"><div className="h-4 w-20 bg-gray-200 rounded" /></td>
                  <td className="table-cell"><div className="h-4 w-24 bg-gray-200 rounded" /></td>
                  <td className="table-cell"><div className="h-4 w-12 bg-gray-200 rounded" /></td>
                  <td className="table-cell"><div className="h-4 w-16 bg-gray-200 rounded" /></td>
                  <td className="table-cell"><div className="h-4 w-12 bg-gray-200 rounded" /></td>
                  <td className="table-cell"><div className="h-4 w-20 bg-gray-200 rounded" /></td>
                  <td className="table-cell"><div className="h-4 w-16 bg-gray-200 rounded" /></td>
                </tr>
              ))
            ) : users.length > 0 ? (
              users.map((user) => (
                <tr key={user.id} className="table-row">
                  <td className="table-cell font-medium">{user.full_name}</td>
                  <td className="table-cell">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[user.role] ?? ROLE_COLORS.sdr}`}>
                      {ROLE_LABELS[user.role] ?? user.role}
                    </span>
                  </td>
                  <td className="table-cell text-brand-muted">
                    {user.x3_stores?.name ?? '—'}
                  </td>
                  <td className="table-cell">
                    <span title={LEVEL_NAMES[user.current_level] ?? ''}>
                      {user.current_level}
                    </span>
                  </td>
                  <td className="table-cell">{user.xp_total.toLocaleString('pt-BR')}</td>
                  <td className="table-cell">
                    {user.streak_days > 0 ? `${user.streak_days}d` : '—'}
                  </td>
                  <td className="table-cell text-brand-muted">
                    {user.last_active_date ?? 'Nunca'}
                  </td>
                  <td className="table-cell">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="select-field py-1 px-2 text-xs w-auto"
                    >
                      <option value="sdr">SDR</option>
                      <option value="supervisor">Supervisora</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="table-cell text-center text-brand-muted py-12">
                  <UserPlus size={40} className="mx-auto mb-3 text-gray-300" />
                  <p>Nenhum usuario encontrado.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
