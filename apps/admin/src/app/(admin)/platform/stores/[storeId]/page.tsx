import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ArrowLeft, MapPin, Building2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function StoreDetailPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: store } = await supabase
    .from('x3_stores')
    .select('id, name, city, state, created_at')
    .eq('id', storeId)
    .maybeSingle();

  if (!store) {
    notFound();
  }

  const [{ data: members }, { data: license }] = await Promise.all([
    supabase
      .from('x3_profiles')
      .select('id, full_name, role, xp_total, current_level, last_active_date')
      .eq('store_id', storeId)
      .order('xp_total', { ascending: false }),
    supabase
      .from('x3_store_licenses')
      .select('plan_type, max_users, is_active, starts_at, expires_at')
      .eq('store_id', storeId)
      .order('starts_at', { ascending: false })
      .maybeSingle(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/platform"
          className="inline-flex items-center gap-2 text-sm text-brand-muted hover:text-brand-on-surface mb-4"
        >
          <ArrowLeft size={16} />
          Voltar para plataforma
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center">
            <Building2 size={24} className="text-brand-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-brand-on-surface">
              {store.name}
            </h1>
            {(store.city || store.state) && (
              <p className="text-brand-muted text-sm flex items-center gap-1">
                <MapPin size={12} />
                {[store.city, store.state].filter(Boolean).join(' / ')}
              </p>
            )}
          </div>
        </div>
      </div>

      {license && (
        <div className="stat-card">
          <h2 className="text-sm font-medium text-brand-muted mb-3">Licenca</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-brand-muted text-xs">Plano</p>
              <p className="font-medium capitalize">{license.plan_type}</p>
            </div>
            <div>
              <p className="text-brand-muted text-xs">Usuarios Max</p>
              <p className="font-medium">{license.max_users}</p>
            </div>
            <div>
              <p className="text-brand-muted text-xs">Status</p>
              <p className="font-medium">
                {license.is_active ? (
                  <span className="text-green-600">Ativa</span>
                ) : (
                  <span className="text-brand-muted">Inativa</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-brand-muted text-xs">Expira em</p>
              <p className="font-medium">
                {license.expires_at
                  ? new Date(license.expires_at).toLocaleDateString('pt-BR')
                  : 'Sem expiracao'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="font-display text-lg font-bold text-brand-on-surface mb-4">
          Membros ({members?.length ?? 0})
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
              {members && members.length > 0 ? (
                members.map((m) => (
                  <tr key={m.id} className="table-row">
                    <td className="table-cell font-medium">{m.full_name}</td>
                    <td className="table-cell">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          m.role === 'admin'
                            ? 'bg-purple-100 text-purple-700'
                            : m.role === 'supervisor'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {m.role === 'admin'
                          ? 'Admin'
                          : m.role === 'supervisor'
                          ? 'Supervisora'
                          : 'SDR'}
                      </span>
                    </td>
                    <td className="table-cell">{m.current_level}</td>
                    <td className="table-cell">
                      {m.xp_total.toLocaleString('pt-BR')}
                    </td>
                    <td className="table-cell text-brand-muted">
                      {m.last_active_date ?? 'Nunca'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="table-cell text-center text-brand-muted py-8"
                  >
                    Nenhum membro nesta loja ainda.
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
