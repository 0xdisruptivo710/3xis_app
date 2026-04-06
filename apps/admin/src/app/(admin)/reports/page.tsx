import { createServerSupabaseClient } from '@/lib/supabase/server';
import { BarChart3, TrendingUp, CheckSquare, Trophy } from 'lucide-react';

export default async function ReportsPage() {
  const supabase = await createServerSupabaseClient();

  // Sales summary by store
  const { data: storesData } = await supabase
    .from('x3_stores')
    .select('id, name');
  const stores = storesData ?? [];

  // Get sales per store for this month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const { data: salesData } = await supabase
    .from('x3_sales_activities')
    .select('user_id, calls_made, contacts_reached, appointments_set, test_drives, proposals_sent, sales_closed')
    .gte('activity_date', monthStart);

  const { data: allProfiles } = await supabase
    .from('x3_profiles')
    .select('id, full_name, store_id, xp_total, current_level');

  const profileMap = new Map((allProfiles ?? []).map((p) => [p.id, p]));

  // Aggregate sales by store
  const storeSalesMap = new Map<string, { calls: number; contacts: number; appointments: number; testDrives: number; proposals: number; sales: number }>();
  for (const store of stores) {
    storeSalesMap.set(store.id, { calls: 0, contacts: 0, appointments: 0, testDrives: 0, proposals: 0, sales: 0 });
  }

  for (const activity of (salesData ?? [])) {
    const profile = profileMap.get(activity.user_id);
    if (profile?.store_id && storeSalesMap.has(profile.store_id)) {
      const entry = storeSalesMap.get(profile.store_id)!;
      entry.calls += activity.calls_made;
      entry.contacts += activity.contacts_reached;
      entry.appointments += activity.appointments_set;
      entry.testDrives += activity.test_drives;
      entry.proposals += activity.proposals_sent;
      entry.sales += activity.sales_closed;
    }
  }

  // XP Leaderboard — top 10
  const leaderboard = (allProfiles ?? [])
    .filter((p) => p.xp_total > 0)
    .sort((a, b) => b.xp_total - a.xp_total)
    .slice(0, 10);

  // Checklist completion rates this month
  const { data: checklistData } = await supabase
    .from('x3_daily_checklists')
    .select('user_id, completed')
    .gte('checklist_date', monthStart);

  const totalChecklists = checklistData?.length ?? 0;
  const completedChecklists = checklistData?.filter((c) => c.completed).length ?? 0;
  const completionRate = totalChecklists > 0 ? Math.round((completedChecklists / totalChecklists) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-on-surface">Relatorios</h1>
        <p className="text-brand-muted text-sm mt-1">
          Visao geral de performance — {now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Summary stat */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-brand-primary" />
            <span className="text-sm font-medium text-brand-muted">Vendas no Mes</span>
          </div>
          <span className="text-2xl font-display font-bold">
            {(salesData ?? []).reduce((sum, s) => sum + s.sales_closed, 0)}
          </span>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <CheckSquare size={18} className="text-brand-success" />
            <span className="text-sm font-medium text-brand-muted">Checklist Completo</span>
          </div>
          <span className="text-2xl font-display font-bold">{completionRate}%</span>
          <span className="text-xs text-brand-muted">{completedChecklists}/{totalChecklists} checklists</span>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-brand-accent" />
            <span className="text-sm font-medium text-brand-muted">Usuarios Ativos</span>
          </div>
          <span className="text-2xl font-display font-bold">
            {new Set((salesData ?? []).map((s) => s.user_id)).size}
          </span>
          <span className="text-xs text-brand-muted">com atividade de vendas este mes</span>
        </div>
      </div>

      {/* Sales by store */}
      <div>
        <h2 className="font-display text-lg font-bold text-brand-on-surface mb-4">
          <TrendingUp size={20} className="inline mr-2" />
          Vendas por Loja
        </h2>
        <div className="table-container overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3">Loja</th>
                <th className="px-4 py-3 text-right">Ligacoes</th>
                <th className="px-4 py-3 text-right">Contatos</th>
                <th className="px-4 py-3 text-right">Agendamentos</th>
                <th className="px-4 py-3 text-right">Test Drives</th>
                <th className="px-4 py-3 text-right">Propostas</th>
                <th className="px-4 py-3 text-right">Vendas</th>
              </tr>
            </thead>
            <tbody>
              {stores.length > 0 ? (
                stores.map((store) => {
                  const data = storeSalesMap.get(store.id);
                  return (
                    <tr key={store.id} className="table-row">
                      <td className="table-cell font-medium">{store.name}</td>
                      <td className="table-cell text-right">{data?.calls ?? 0}</td>
                      <td className="table-cell text-right">{data?.contacts ?? 0}</td>
                      <td className="table-cell text-right">{data?.appointments ?? 0}</td>
                      <td className="table-cell text-right">{data?.testDrives ?? 0}</td>
                      <td className="table-cell text-right">{data?.proposals ?? 0}</td>
                      <td className="table-cell text-right font-semibold text-brand-primary">
                        {data?.sales ?? 0}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="table-cell text-center text-brand-muted py-8">
                    Nenhuma loja cadastrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* XP Leaderboard */}
      <div>
        <h2 className="font-display text-lg font-bold text-brand-on-surface mb-4">
          <Trophy size={20} className="inline mr-2" />
          Ranking de XP — Top 10
        </h2>
        <div className="table-container">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 w-12">#</th>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Nivel</th>
                <th className="px-4 py-3 text-right">XP Total</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.length > 0 ? (
                leaderboard.map((user, index) => (
                  <tr key={user.id} className="table-row">
                    <td className="table-cell">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                        index === 0
                          ? 'bg-yellow-100 text-yellow-700'
                          : index === 1
                          ? 'bg-gray-100 text-gray-600'
                          : index === 2
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-gray-50 text-gray-500'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="table-cell font-medium">{user.full_name}</td>
                    <td className="table-cell">{user.current_level}</td>
                    <td className="table-cell text-right font-semibold text-brand-accent">
                      {user.xp_total.toLocaleString('pt-BR')} XP
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="table-cell text-center text-brand-muted py-8">
                    Nenhum usuario com XP ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
