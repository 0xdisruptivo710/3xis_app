'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Pencil, Trash2, Sunrise, X, ToggleLeft, ToggleRight } from 'lucide-react';

interface Ritual {
  id: string;
  title: string;
  description: string;
  ritual_type: string;
  duration_min: number;
  benefit: string | null;
  icon: string;
  xp_reward: number;
  is_active: boolean;
  sort_order: number;
}

const RITUAL_TYPE_LABELS: Record<string, string> = {
  mental: 'Mental',
  physical: 'Fisico',
  professional: 'Profissional',
};

const RITUAL_TYPE_COLORS: Record<string, string> = {
  mental: 'bg-purple-100 text-purple-700',
  physical: 'bg-green-100 text-green-700',
  professional: 'bg-blue-100 text-blue-700',
};

export default function RitualsPage() {
  const [rituals, setRituals] = useState<Ritual[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRitual, setEditingRitual] = useState<Ritual | null>(null);
  const supabase = createClient();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ritual_type: 'mental',
    duration_min: 5,
    benefit: '',
    icon: '',
    xp_reward: 20,
    sort_order: 0,
    is_active: true,
  });

  const fetchRituals = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('x3_rituals')
      .select('*')
      .order('sort_order');
    setRituals(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchRituals();
  }, [fetchRituals]);

  function openNewForm() {
    setEditingRitual(null);
    setFormData({
      title: '',
      description: '',
      ritual_type: 'mental',
      duration_min: 5,
      benefit: '',
      icon: '',
      xp_reward: 20,
      sort_order: 0,
      is_active: true,
    });
    setShowForm(true);
  }

  function openEditForm(ritual: Ritual) {
    setEditingRitual(ritual);
    setFormData({
      title: ritual.title,
      description: ritual.description,
      ritual_type: ritual.ritual_type,
      duration_min: ritual.duration_min,
      benefit: ritual.benefit ?? '',
      icon: ritual.icon,
      xp_reward: ritual.xp_reward,
      sort_order: ritual.sort_order,
      is_active: ritual.is_active,
    });
    setShowForm(true);
  }

  async function handleSave() {
    const payload = {
      title: formData.title,
      description: formData.description,
      ritual_type: formData.ritual_type,
      duration_min: formData.duration_min,
      benefit: formData.benefit || null,
      icon: formData.icon || null,
      xp_reward: formData.xp_reward,
      sort_order: formData.sort_order,
      is_active: formData.is_active,
    };

    if (editingRitual) {
      await supabase.from('x3_rituals').update(payload).eq('id', editingRitual.id);
    } else {
      await supabase.from('x3_rituals').insert(payload);
    }

    setShowForm(false);
    fetchRituals();
  }

  async function handleToggleActive(ritual: Ritual) {
    await supabase
      .from('x3_rituals')
      .update({ is_active: !ritual.is_active })
      .eq('id', ritual.id);
    fetchRituals();
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este ritual?')) return;
    await supabase.from('x3_rituals').delete().eq('id', id);
    fetchRituals();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-brand-on-surface">Rituais Matinais</h1>
          <p className="text-brand-muted text-sm mt-1">
            Gerencie os rituais matinais disponiveis para as SDRs
          </p>
        </div>
        <button onClick={openNewForm} className="btn-primary flex items-center gap-2 w-fit">
          <Plus size={18} />
          Novo Ritual
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">
                {editingRitual ? 'Editar Ritual' : 'Novo Ritual'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-brand-muted hover:text-brand-on-surface">
                <X size={20} />
              </button>
            </div>

            <div>
              <label className="label">Titulo</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input-field"
                placeholder="Nome do ritual"
              />
            </div>

            <div>
              <label className="label">Descricao</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field min-h-[80px] resize-y"
                placeholder="Descreva o ritual..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Tipo</label>
                <select
                  value={formData.ritual_type}
                  onChange={(e) => setFormData({ ...formData, ritual_type: e.target.value })}
                  className="select-field"
                >
                  <option value="mental">Mental</option>
                  <option value="physical">Fisico</option>
                  <option value="professional">Profissional</option>
                </select>
              </div>
              <div>
                <label className="label">Duracao (min)</label>
                <input
                  type="number"
                  value={formData.duration_min}
                  onChange={(e) => setFormData({ ...formData, duration_min: parseInt(e.target.value) || 0 })}
                  className="input-field"
                  min={1}
                />
              </div>
            </div>

            <div>
              <label className="label">Beneficio (opcional)</label>
              <input
                type="text"
                value={formData.benefit}
                onChange={(e) => setFormData({ ...formData, benefit: e.target.value })}
                className="input-field"
                placeholder="Ex: Clareza mental e foco"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Icone (emoji)</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="input-field"
                  placeholder="Ex: &meditar;"
                />
              </div>
              <div>
                <label className="label">XP</label>
                <input
                  type="number"
                  value={formData.xp_reward}
                  onChange={(e) => setFormData({ ...formData, xp_reward: parseInt(e.target.value) || 0 })}
                  className="input-field"
                  min={0}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ritual_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
              />
              <label htmlFor="ritual_active" className="text-sm text-gray-700">Ativo</label>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="btn-ghost flex-1">
                Cancelar
              </button>
              <button onClick={handleSave} className="btn-primary flex-1">
                {editingRitual ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rituals grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card animate-pulse space-y-3">
              <div className="h-10 w-10 bg-gray-200 rounded-lg" />
              <div className="h-4 w-3/4 bg-gray-200 rounded" />
              <div className="h-3 w-full bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : rituals.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rituals.map((ritual) => (
            <div key={ritual.id} className={`card space-y-3 ${!ritual.is_active ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{ritual.icon}</span>
                  <div>
                    <h3 className="font-medium text-sm">{ritual.title}</h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${RITUAL_TYPE_COLORS[ritual.ritual_type] ?? 'bg-gray-100 text-gray-700'}`}>
                      {RITUAL_TYPE_LABELS[ritual.ritual_type] ?? ritual.ritual_type}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleActive(ritual)}
                  className="text-brand-muted hover:text-brand-on-surface"
                  title={ritual.is_active ? 'Desativar' : 'Ativar'}
                >
                  {ritual.is_active ? (
                    <ToggleRight size={24} className="text-brand-success" />
                  ) : (
                    <ToggleLeft size={24} />
                  )}
                </button>
              </div>

              <p className="text-xs text-brand-muted">{ritual.description}</p>

              <div className="flex items-center justify-between text-xs text-brand-muted">
                <span>{ritual.duration_min} min | {ritual.xp_reward} XP</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditForm(ritual)}
                    className="p-1 rounded hover:bg-gray-100 transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(ritual.id)}
                    className="p-1 rounded hover:bg-red-50 hover:text-brand-error transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-brand-muted py-16">
          <Sunrise size={48} className="mx-auto mb-3 text-gray-300" />
          <p>Nenhum ritual cadastrado.</p>
          <button onClick={openNewForm} className="btn-primary mt-4">
            Adicionar primeiro ritual
          </button>
        </div>
      )}
    </div>
  );
}
