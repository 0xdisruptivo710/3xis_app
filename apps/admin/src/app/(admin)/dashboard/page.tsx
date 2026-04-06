import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Users, Activity, Zap, TrendingUp } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  color: string;
}

function StatCard({ label, value, icon, description, color }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-brand-muted">{label}</span>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
      <span className="text-2xl font-display font-bold text-brand-on-surface">{value}</span>
      {description && (
        <span className="text-xs text-brand-muted">{description}</span>
      )}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const supabase = await createServerSupabaseClient();

  // Fetch total users
  const { count: totalUsers } = await supabase
    .from('x3_profiles')
    .select('*', { count: 'exact', head: true });

  // Fetch active today
  const today = new Date().toISOString().split('T')[0];
  const { count: activeToday } = await supabase
    .from('x3_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('last_active_date', today);

  // Fetch average XP
  const { data: xpData } = await supabase
    .from('x3_profiles')
    .select('xp_total');
  const avgXP = xpData && xpData.length > 0
    ? Math.round(xpData.reduce((sum, p) => sum + p.xp_total, 0) / xpData.length)
    : 0;

  // Fetch sales activities this week
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().split('T')[0];
  const { data: salesData } = await supabase
    .from('x3_sales_activities')
    .select('sales_closed')
    .gte('activity_date', weekAgoStr);
  const totalSales = salesData
    ? salesData.reduce((sum, s) => sum + s.sales_closed, 0)
    : 0;

  // Recent users
  const { data: recentUsers } = await supabase
    .from('x3_profiles')
    .select('id, full_name, role, xp_total, current_level, last_active_date')
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-on-surface">Dashboard</h1>
        <p className="text-brand-muted text-sm mt-1">Visao geral da plataforma 3X</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total de Usuarios"
          value={totalUsers ?? 0}
          icon={<Users size={20} className="text-blue-600" />}
          color="bg-blue-100"
          description="SDRs, supervisoras e admins"
        />
        <StatCard
          label="Ativos Hoje"
          value={activeToday ?? 0}
          icon={<Activity size={20} className="text-green-600" />}
          color="bg-green-100"
          description="Usuarios com atividade hoje"
        />
        <StatCard
          label="XP Medio"
          value={avgXP.toLocaleString('pt-BR')}
          icon={<Zap size={20} className="text-amber-600" />}
          color="bg-amber-100"
          description="Media de XP por usuario"
        />
        <StatCard
          label="Vendas da Semana"
          value={totalSales}
          icon={<TrendingUp size={20} className="text-brand-primary" />}
          color="bg-orange-100"
          description="Fechamentos nos ultimos 7 dias"
        />
      </div>

      {/* Recent users table */}
      <div>
        <h2 className="font-display text-lg font-bold text-brand-on-surface mb-4">
          Usuarios Recentes
        </h2>
        <div className="table-container">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Cargo</th>
                <th className="px-4 py-3">Nivel</th>
                <th className="px-4 py-3">XP</th>
                <th className="px-4 py-3">Ultima Atividade</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers && recentUsers.length > 0 ? (
                recentUsers.map((user) => (
                  <tr key={user.id} className="table-row">
                    <td className="table-cell font-medium">{user.full_name}</td>
                    <td className="table-cell">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-700'
                          : user.role === 'supervisor'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {user.role === 'admin' ? 'Admin' : user.role === 'supervisor' ? 'Supervisora' : 'SDR'}
                      </span>
                    </td>
                    <td className="table-cell">{user.current_level}</td>
                    <td className="table-cell">{user.xp_total.toLocaleString('pt-BR')}</td>
                    <td className="table-cell text-brand-muted">
                      {user.last_active_date ?? 'Nunca'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="table-cell text-center text-brand-muted py-8">
                    Nenhum usuario cadastrado ainda.
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
