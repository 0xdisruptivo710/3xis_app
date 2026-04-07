'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Search, UserPlus, Mail, Shield, ShieldCheck, User,
  MoreVertical, X, Loader2, Store, Filter, RefreshCw,
  Check, Ban, Trash2, Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Profile {
  id: string;
  full_name: string;
  role: string;
  xp_total: number;
  current_level: number;
  streak_days: number;
  last_active_date: string | null;
  store_id: string | null;
  avatar_url: string | null;
  created_at: string;
  x3_stores?: { name: string } | null;
}

interface StoreOption {
  id: string;
  name: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
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
  sdr: 'bg-orange-100 text-orange-700',
};

const ROLE_ICONS: Record<string, typeof Shield> = {
  admin: ShieldCheck,
  supervisor: Shield,
  sdr: User,
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
  const supabase = createClient();

  const [users, setUsers] = useState<Profile[]>([]);
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [storeFilter, setStoreFilter] = useState<string>('all');

  // Modal states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateStoreModal, setShowCreateStoreModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'invites'>('users');

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('sdr');
  const [inviteStoreId, setInviteStoreId] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit form
  const [editRole, setEditRole] = useState('');
  const [editStoreId, setEditStoreId] = useState('');
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);

  // Create store form
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreCity, setNewStoreCity] = useState('');
  const [newStoreState, setNewStoreState] = useState('');
  const [creatingStore, setCreatingStore] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);

    // Fetch users
    let query = supabase
      .from('x3_profiles')
      .select('id, full_name, role, xp_total, current_level, streak_days, last_active_date, store_id, avatar_url, created_at, x3_stores(name)')
      .order('created_at', { ascending: false });

    if (roleFilter !== 'all') {
      query = query.eq('role', roleFilter);
    }
    if (storeFilter !== 'all') {
      query = query.eq('store_id', storeFilter);
    }
    if (search.trim()) {
      query = query.ilike('full_name', `%${search.trim()}%`);
    }

    const [usersRes, storesRes, invitesRes] = await Promise.all([
      query,
      supabase.from('x3_stores').select('id, name').order('name'),
      supabase
        .from('x3_invitations')
        .select('id, email, role, status, created_at, expires_at, x3_stores(name)')
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    setUsers((usersRes.data as unknown as Profile[]) ?? []);
    setStores(storesRes.data ?? []);
    setInvitations((invitesRes.data as unknown as Invitation[]) ?? []);
    setLoading(false);
  }, [supabase, roleFilter, storeFilter, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ---- Actions ----

  async function handleInvite() {
    if (!inviteEmail.trim() || !inviteStoreId) return;
    setInviting(true);
    setInviteMessage(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setInviteMessage({ type: 'error', text: 'Voce precisa estar logado.' });
      setInviting(false);
      return;
    }

    const { error } = await supabase.from('x3_invitations').insert({
      email: inviteEmail.trim().toLowerCase(),
      store_id: inviteStoreId,
      role: inviteRole,
      invited_by: user.id,
    });

    if (error) {
      setInviteMessage({ type: 'error', text: 'Erro ao enviar convite. Tente novamente.' });
    } else {
      setInviteMessage({ type: 'success', text: `Convite enviado para ${inviteEmail}!` });
      setInviteEmail('');
      fetchData();
    }
    setInviting(false);
  }

  async function handleRoleChange(userId: string, newRole: string) {
    await supabase.from('x3_profiles').update({ role: newRole }).eq('id', userId);
    fetchData();
  }

  async function handleStoreChange(userId: string, newStoreId: string | null) {
    await supabase.from('x3_profiles').update({ store_id: newStoreId }).eq('id', userId);
    fetchData();
  }

  function openEditModal(user: Profile) {
    setSelectedUser(user);
    setEditRole(user.role);
    setEditStoreId(user.store_id ?? '');
    setEditName(user.full_name);
    setShowEditModal(true);
  }

  async function saveUserEdit() {
    if (!selectedUser) return;
    setSaving(true);

    await supabase.from('x3_profiles').update({
      full_name: editName.trim(),
      role: editRole,
      store_id: editStoreId || null,
    }).eq('id', selectedUser.id);

    setSaving(false);
    setShowEditModal(false);
    setSelectedUser(null);
    fetchData();
  }

  async function revokeInvitation(inviteId: string) {
    await supabase.from('x3_invitations').update({ status: 'revoked' }).eq('id', inviteId);
    fetchData();
  }

  async function createStore() {
    if (!newStoreName.trim()) return;
    setCreatingStore(true);

    await supabase.from('x3_stores').insert({
      name: newStoreName.trim(),
      city: newStoreCity.trim() || null,
      state: newStoreState.trim() || null,
    });

    setCreatingStore(false);
    setShowCreateStoreModal(false);
    setNewStoreName('');
    setNewStoreCity('');
    setNewStoreState('');
    fetchData();
  }

  const userCount = users.length;
  const sdrCount = users.filter((u) => u.role === 'sdr').length;
  const pendingInvites = invitations.filter((i) => i.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-brand-on-surface">Usuarios</h1>
          <p className="text-brand-muted text-sm mt-1">
            {userCount} usuarios • {sdrCount} SDRs • {pendingInvites} convites pendentes
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateStoreModal(true)}
            className="btn-secondary px-4 py-2.5 text-sm flex items-center gap-2"
          >
            <Store size={16} />
            Nova Loja
          </button>
          <button
            onClick={() => {
              setShowInviteModal(true);
              setInviteMessage(null);
            }}
            className="btn-primary px-4 py-2.5 text-sm flex items-center gap-2"
          >
            <UserPlus size={16} />
            Convidar Usuario
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: userCount, color: 'bg-blue-50 text-blue-700' },
          { label: 'SDRs', value: sdrCount, color: 'bg-orange-50 text-orange-700' },
          { label: 'Supervisoras', value: users.filter((u) => u.role === 'supervisor').length, color: 'bg-indigo-50 text-indigo-700' },
          { label: 'Convites Pendentes', value: pendingInvites, color: 'bg-amber-50 text-amber-700' },
        ].map((stat) => (
          <div key={stat.label} className={cn('rounded-xl p-4', stat.color)}>
            <p className="text-2xl font-display font-bold">{stat.value}</p>
            <p className="text-xs opacity-70">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('users')}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-md transition-colors',
            activeTab === 'users' ? 'bg-white text-brand-on-surface shadow-sm' : 'text-brand-muted'
          )}
        >
          Usuarios ({userCount})
        </button>
        <button
          onClick={() => setActiveTab('invites')}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-md transition-colors',
            activeTab === 'invites' ? 'bg-white text-brand-on-surface shadow-sm' : 'text-brand-muted'
          )}
        >
          Convites ({invitations.length})
        </button>
      </div>

      {activeTab === 'users' && (
        <>
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
            <select
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value)}
              className="select-field w-auto"
            >
              <option value="all">Todas as lojas</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <button onClick={fetchData} className="btn-secondary p-2.5" title="Atualizar">
              <RefreshCw size={16} />
            </button>
          </div>

          {/* Users table */}
          <div className="table-container overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="table-header">
                  <th className="px-4 py-3 text-left">Usuario</th>
                  <th className="px-4 py-3 text-left">Cargo</th>
                  <th className="px-4 py-3 text-left">Loja</th>
                  <th className="px-4 py-3 text-left">Nivel</th>
                  <th className="px-4 py-3 text-left">XP</th>
                  <th className="px-4 py-3 text-left">Streak</th>
                  <th className="px-4 py-3 text-left">Ultima Atividade</th>
                  <th className="px-4 py-3 text-left">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="table-row animate-pulse">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="table-cell">
                          <div className="h-4 w-20 bg-gray-200 rounded" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : users.length > 0 ? (
                  users.map((user) => {
                    const RoleIcon = ROLE_ICONS[user.role] ?? User;
                    return (
                      <tr key={user.id} className="table-row hover:bg-gray-50 cursor-pointer" onClick={() => openEditModal(user)}>
                        <td className="table-cell">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                              {user.avatar_url ? (
                                <img src={user.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                              ) : (
                                <span className="text-brand-primary font-bold text-sm">
                                  {user.full_name.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-sm text-brand-on-surface">{user.full_name}</p>
                              <p className="text-xs text-brand-muted">
                                Desde {new Date(user.created_at).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="table-cell">
                          <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium', ROLE_COLORS[user.role] ?? ROLE_COLORS.sdr)}>
                            <RoleIcon size={12} />
                            {ROLE_LABELS[user.role] ?? user.role}
                          </span>
                        </td>
                        <td className="table-cell text-sm text-brand-muted">
                          {user.x3_stores?.name ?? <span className="text-gray-300">Sem loja</span>}
                        </td>
                        <td className="table-cell">
                          <span className="text-sm" title={LEVEL_NAMES[user.current_level] ?? ''}>
                            Nv. {user.current_level}
                          </span>
                        </td>
                        <td className="table-cell">
                          <span className="text-sm font-medium">{user.xp_total.toLocaleString('pt-BR')}</span>
                        </td>
                        <td className="table-cell">
                          {user.streak_days > 0 ? (
                            <span className="text-sm text-brand-primary font-medium">{user.streak_days}d 🔥</span>
                          ) : (
                            <span className="text-sm text-gray-300">—</span>
                          )}
                        </td>
                        <td className="table-cell text-sm text-brand-muted">
                          {user.last_active_date
                            ? new Date(user.last_active_date).toLocaleDateString('pt-BR')
                            : 'Nunca'}
                        </td>
                        <td className="table-cell" onClick={(e) => e.stopPropagation()}>
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
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="table-cell text-center text-brand-muted py-12">
                      <UserPlus size={40} className="mx-auto mb-3 text-gray-300" />
                      <p className="font-medium">Nenhum usuario encontrado.</p>
                      <p className="text-xs mt-1">Convide usuarios para comecar.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Invitations Tab */}
      {activeTab === 'invites' && (
        <div className="table-container overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Cargo</th>
                <th className="px-4 py-3 text-left">Loja</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Enviado em</th>
                <th className="px-4 py-3 text-left">Expira em</th>
                <th className="px-4 py-3 text-left">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {invitations.length > 0 ? (
                invitations.map((inv) => (
                  <tr key={inv.id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-brand-muted" />
                        <span className="text-sm">{inv.email}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', ROLE_COLORS[inv.role] ?? ROLE_COLORS.sdr)}>
                        {ROLE_LABELS[inv.role] ?? inv.role}
                      </span>
                    </td>
                    <td className="table-cell text-sm text-brand-muted">
                      {inv.x3_stores?.name ?? '—'}
                    </td>
                    <td className="table-cell">
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                        inv.status === 'pending' && 'bg-amber-100 text-amber-700',
                        inv.status === 'accepted' && 'bg-green-100 text-green-700',
                        inv.status === 'expired' && 'bg-gray-100 text-gray-500',
                        inv.status === 'revoked' && 'bg-red-100 text-red-600',
                      )}>
                        {inv.status === 'pending' && 'Pendente'}
                        {inv.status === 'accepted' && 'Aceito'}
                        {inv.status === 'expired' && 'Expirado'}
                        {inv.status === 'revoked' && 'Revogado'}
                      </span>
                    </td>
                    <td className="table-cell text-sm text-brand-muted">
                      {new Date(inv.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="table-cell text-sm text-brand-muted">
                      {new Date(inv.expires_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="table-cell">
                      {inv.status === 'pending' && (
                        <button
                          onClick={() => revokeInvitation(inv.id)}
                          className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                        >
                          <Ban size={12} />
                          Revogar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="table-cell text-center text-brand-muted py-12">
                    <Send size={40} className="mx-auto mb-3 text-gray-300" />
                    <p>Nenhum convite enviado ainda.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowInviteModal(false)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl z-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-lg font-bold text-brand-on-surface">
                Convidar Usuario
              </h2>
              <button onClick={() => setShowInviteModal(false)} className="text-brand-muted hover:text-brand-on-surface">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-on-surface mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="sdr@loja.com"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-on-surface mb-1">
                  Cargo
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="select-field"
                >
                  <option value="sdr">SDR</option>
                  <option value="supervisor">Supervisora</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-on-surface mb-1">
                  Loja
                </label>
                <select
                  value={inviteStoreId}
                  onChange={(e) => setInviteStoreId(e.target.value)}
                  className="select-field"
                >
                  <option value="">Selecione uma loja</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {inviteMessage && (
                <div className={cn(
                  'text-sm p-3 rounded-xl',
                  inviteMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                )}>
                  {inviteMessage.text}
                </div>
              )}

              <button
                onClick={handleInvite}
                disabled={inviting || !inviteEmail.trim() || !inviteStoreId}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {inviting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <Send size={16} />
                    Enviar Convite
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowEditModal(false)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl z-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-lg font-bold text-brand-on-surface">
                Editar Usuario
              </h2>
              <button onClick={() => setShowEditModal(false)} className="text-brand-muted hover:text-brand-on-surface">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Avatar + Info */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center">
                  {selectedUser.avatar_url ? (
                    <img src={selectedUser.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <span className="text-brand-primary font-bold text-lg">
                      {selectedUser.full_name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-medium text-brand-on-surface">{selectedUser.full_name}</p>
                  <p className="text-xs text-brand-muted">
                    Nv. {selectedUser.current_level} • {selectedUser.xp_total.toLocaleString('pt-BR')} XP
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-on-surface mb-1">Nome</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-on-surface mb-1">Cargo</label>
                <select value={editRole} onChange={(e) => setEditRole(e.target.value)} className="select-field">
                  <option value="sdr">SDR</option>
                  <option value="supervisor">Supervisora</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-on-surface mb-1">Loja</label>
                <select value={editStoreId} onChange={(e) => setEditStoreId(e.target.value)} className="select-field">
                  <option value="">Sem loja</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={saveUserEdit}
                  disabled={saving}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  Salvar
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Store Modal */}
      {showCreateStoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowCreateStoreModal(false)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl z-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-lg font-bold text-brand-on-surface">
                Nova Loja
              </h2>
              <button onClick={() => setShowCreateStoreModal(false)} className="text-brand-muted hover:text-brand-on-surface">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-on-surface mb-1">
                  Nome da Loja
                </label>
                <input
                  type="text"
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  placeholder="Ex: AutoPrime Veiculos"
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-brand-on-surface mb-1">Cidade</label>
                  <input
                    type="text"
                    value={newStoreCity}
                    onChange={(e) => setNewStoreCity(e.target.value)}
                    placeholder="Sao Paulo"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-on-surface mb-1">Estado</label>
                  <input
                    type="text"
                    value={newStoreState}
                    onChange={(e) => setNewStoreState(e.target.value)}
                    placeholder="SP"
                    maxLength={2}
                    className="input-field"
                  />
                </div>
              </div>

              <button
                onClick={createStore}
                disabled={creatingStore || !newStoreName.trim()}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {creatingStore ? <Loader2 size={16} className="animate-spin" /> : <Store size={16} />}
                Criar Loja
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
