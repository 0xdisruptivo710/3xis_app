'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Pencil, Trash2, Search, FileText, X } from 'lucide-react';

interface ScriptCategory {
  id: string;
  name: string;
}

interface Script {
  id: string;
  category_id: string;
  title: string;
  content: string;
  objection: string | null;
  response: string | null;
  tags: string[] | null;
  is_active: boolean;
  x3_script_categories?: { name: string } | null;
}

export default function ScriptsPage() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [categories, setCategories] = useState<ScriptCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingScript, setEditingScript] = useState<Script | null>(null);
  const supabase = createClient();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category_id: '',
    objection: '',
    response: '',
    tags: '',
    is_active: true,
  });

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase
      .from('x3_script_categories')
      .select('id, name')
      .order('sort_order');
    setCategories(data ?? []);
  }, [supabase]);

  const fetchScripts = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('x3_scripts')
      .select('id, category_id, title, content, objection, response, tags, is_active, x3_script_categories(name)')
      .order('created_at', { ascending: false });

    if (categoryFilter !== 'all') {
      query = query.eq('category_id', categoryFilter);
    }

    if (search.trim()) {
      query = query.ilike('title', `%${search.trim()}%`);
    }

    const { data } = await query;
    setScripts((data as unknown as Script[]) ?? []);
    setLoading(false);
  }, [supabase, categoryFilter, search]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchScripts();
  }, [fetchScripts]);

  function openNewForm() {
    setEditingScript(null);
    setFormData({
      title: '',
      content: '',
      category_id: categories[0]?.id ?? '',
      objection: '',
      response: '',
      tags: '',
      is_active: true,
    });
    setShowForm(true);
  }

  function openEditForm(script: Script) {
    setEditingScript(script);
    setFormData({
      title: script.title,
      content: script.content,
      category_id: script.category_id,
      objection: script.objection ?? '',
      response: script.response ?? '',
      tags: script.tags?.join(', ') ?? '',
      is_active: script.is_active,
    });
    setShowForm(true);
  }

  async function handleSave() {
    const payload = {
      title: formData.title,
      content: formData.content,
      category_id: formData.category_id,
      objection: formData.objection || null,
      response: formData.response || null,
      tags: formData.tags
        ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : null,
      is_active: formData.is_active,
    };

    if (editingScript) {
      await supabase.from('x3_scripts').update(payload).eq('id', editingScript.id);
    } else {
      await supabase.from('x3_scripts').insert(payload);
    }

    setShowForm(false);
    fetchScripts();
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este script?')) return;
    await supabase.from('x3_scripts').delete().eq('id', id);
    fetchScripts();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-brand-on-surface">Scripts</h1>
          <p className="text-brand-muted text-sm mt-1">
            Gerencie scripts e respostas a objecoes
          </p>
        </div>
        <button onClick={openNewForm} className="btn-primary flex items-center gap-2 w-fit">
          <Plus size={18} />
          Novo Script
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input
            type="text"
            placeholder="Buscar por titulo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="select-field w-auto"
        >
          <option value="all">Todas as categorias</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">
                {editingScript ? 'Editar Script' : 'Novo Script'}
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
                placeholder="Titulo do script"
              />
            </div>

            <div>
              <label className="label">Categoria</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="select-field"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Conteudo</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="input-field min-h-[100px] resize-y"
                placeholder="Conteudo do script..."
              />
            </div>

            <div>
              <label className="label">Objecao (opcional)</label>
              <input
                type="text"
                value={formData.objection}
                onChange={(e) => setFormData({ ...formData, objection: e.target.value })}
                className="input-field"
                placeholder="Ex: Esta muito caro"
              />
            </div>

            <div>
              <label className="label">Resposta (opcional)</label>
              <textarea
                value={formData.response}
                onChange={(e) => setFormData({ ...formData, response: e.target.value })}
                className="input-field min-h-[80px] resize-y"
                placeholder="Resposta sugerida para a objecao..."
              />
            </div>

            <div>
              <label className="label">Tags (separadas por virgula)</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="input-field"
                placeholder="preco, negociacao, objecao"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
              />
              <label htmlFor="is_active" className="text-sm text-gray-700">Ativo</label>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="btn-ghost flex-1">
                Cancelar
              </button>
              <button onClick={handleSave} className="btn-primary flex-1">
                {editingScript ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="table-container overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="table-header">
              <th className="px-4 py-3">Titulo</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Objecao</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="table-row animate-pulse">
                  <td className="table-cell"><div className="h-4 w-40 bg-gray-200 rounded" /></td>
                  <td className="table-cell"><div className="h-4 w-24 bg-gray-200 rounded" /></td>
                  <td className="table-cell"><div className="h-4 w-32 bg-gray-200 rounded" /></td>
                  <td className="table-cell"><div className="h-4 w-16 bg-gray-200 rounded" /></td>
                  <td className="table-cell"><div className="h-4 w-20 bg-gray-200 rounded" /></td>
                </tr>
              ))
            ) : scripts.length > 0 ? (
              scripts.map((script) => (
                <tr key={script.id} className="table-row">
                  <td className="table-cell font-medium max-w-[200px] truncate">
                    {script.title}
                  </td>
                  <td className="table-cell text-brand-muted">
                    {script.x3_script_categories?.name ?? '—'}
                  </td>
                  <td className="table-cell text-brand-muted max-w-[200px] truncate">
                    {script.objection ?? '—'}
                  </td>
                  <td className="table-cell">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      script.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {script.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditForm(script)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-brand-muted hover:text-brand-on-surface transition-colors"
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(script.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-brand-muted hover:text-brand-error transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="table-cell text-center text-brand-muted py-12">
                  <FileText size={40} className="mx-auto mb-3 text-gray-300" />
                  <p>Nenhum script encontrado.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
