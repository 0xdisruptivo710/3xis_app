import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Building2, Users, Zap, ShieldCheck, KeyRound, Mail } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  description?: string;
}

function StatCard({ label, value, icon, color, description }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-brand-muted">{label}</span>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
      <span className="text-2xl font-display font-bold text-brand-on-surface">{value}</span>
      {description && <span className="text-xs text-brand-muted">{description}</span>}
    </div>
  );
}

export default async function PlatformOverviewPage() {
  const supabase = await createServerSupabaseClient();

  const [
    { count: totalStores },
    { count: totalUsers },
    { count: totalLicenses },
    { count: pendingInvites },
    { data: stores },
  ] = await Promise.all([
    supabase.from('x3_stores').select('*', { count: 'exact', head: true }),
    supabase.from('x3_profiles').select('*', { count: 'exact', head: true }),
    supabase
      .from('x3_store_licenses')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true),
    supabase
      .from('x3_invitations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('x3_stores')
      .select(
        'id, name, city, state, created_at, x3_store_licenses(plan_type, max_users, is_active, expires_at)'
      )
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-medium text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-full mb-2">
            <ShieldCheck size={12} />
            Super Admin
          </div>
          <h1 className="font-display text-2xl font-bold text-brand-on-surface">
            Plataforma 3X
          </h1>
          <p className="text-brand-muted text-sm mt-1">
            Visao global de todas as lojas, usuarios e licencas.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/platform/access-codes"
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <KeyRound size={16} />
            Codigos de acesso
          </Link>
          <Link
            href="/platform/invitations"
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Mail size={16} />
            Convites
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Lojas Cadastradas"
          value={totalStores ?? 0}
          icon={<Building2 size={20} className="text-blue-600" />}
          color="bg-blue-100"
          description="Total de lojas na plataforma"
        />
        <StatCard
          label="Usuarios Totais"
          value={totalUsers ?? 0}
          icon={<Users size={20} className="text-green-600" />}
          color="bg-green-100"
          description="Em todas as lojas"
        />
        <StatCard
          label="Licencas Ativas"
          value={totalLicenses ?? 0}
          icon={<Zap size={20} className="text-amber-600" />}
          color="bg-amber-100"
          description="Lojas pagantes"
        />
        <StatCard
          label="Convites Pendentes"
          value={pendingInvites ?? 0}
          icon={<Mail size={20} className="text-brand-primary" />}
          color="bg-orange-100"
          description="Aguardando aceite"
        />
      </div>

      <div>
        <h2 className="font-display text-lg font-bold text-brand-on-surface mb-4">
          Lojas
        </h2>
        <div className="table-container">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3">Loja</th>
                <th className="px-4 py-3">Localizacao</th>
                <th className="px-4 py-3">Plano</th>
                <th className="px-4 py-3">Usuarios Max</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {stores && stores.length > 0 ? (
                stores.map((store) => {
                  const license = (store.x3_store_licenses as Array<{
                    plan_type: string;
                    max_users: number;
                    is_active: boolean;
                    expires_at: string | null;
                  }> | null)?.[0];
                  return (
                    <tr key={store.id} className="table-row">
                      <td className="table-cell font-medium">{store.name}</td>
                      <td className="table-cell text-brand-muted">
                        {store.city && store.state
                          ? `${store.city} / ${store.state}`
                          : '—'}
                      </td>
                      <td className="table-cell">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                          {license?.plan_type ?? 'sem licenca'}
                        </span>
                      </td>
                      <td className="table-cell">{license?.max_users ?? '—'}</td>
                      <td className="table-cell">
                        {license?.is_active ? (
                          <span className="text-green-600 text-xs font-medium">
                            Ativa
                          </span>
                        ) : (
                          <span className="text-brand-muted text-xs">Inativa</span>
                        )}
                      </td>
                      <td className="table-cell">
                        <Link
                          href={`/platform/stores/${store.id}`}
                          className="text-brand-primary hover:underline text-sm"
                        >
                          Inspecionar
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="table-cell text-center text-brand-muted py-8"
                  >
                    Nenhuma loja cadastrada ainda.
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
