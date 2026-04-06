'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Trash2, GripVertical, CheckSquare, X, Save } from 'lucide-react';

interface ChecklistTemplate {
  id: string;
  title: string;
  is_default: boolean;
  store_id: string | null;
}

interface ChecklistTemplateItem {
  id: string;
  template_id: string;
  label: string;
  xp_reward: number;
  sort_order: number;
}

export default function ChecklistPage() {
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ChecklistTemplate | null>(null);
  const [items, setItems] = useState<ChecklistTemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [newTemplateTitle, setNewTemplateTitle] = useState('');
  const [newItemLabel, setNewItemLabel] = useState('');
  const [newItemXP, setNewItemXP] = useState(10);
  const supabase = createClient();

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('x3_checklist_templates')
      .select('id, title, is_default, store_id')
      .order('created_at');
    const templateList = data ?? [];
    setTemplates(templateList);
    if (templateList.length > 0 && !selectedTemplate) {
      setSelectedTemplate(templateList[0]);
    }
    setLoading(false);
  }, [supabase, selectedTemplate]);

  const fetchItems = useCallback(async () => {
    if (!selectedTemplate) {
      setItems([]);
      return;
    }
    const { data } = await supabase
      .from('x3_checklist_template_items')
      .select('id, template_id, label, xp_reward, sort_order')
      .eq('template_id', selectedTemplate.id)
      .order('sort_order');
    setItems(data ?? []);
  }, [supabase, selectedTemplate]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  async function handleCreateTemplate() {
    if (!newTemplateTitle.trim()) return;
    const { data } = await supabase
      .from('x3_checklist_templates')
      .insert({ title: newTemplateTitle.trim(), is_default: templates.length === 0 })
      .select()
      .single();
    setShowNewTemplate(false);
    setNewTemplateTitle('');
    if (data) {
      setSelectedTemplate(data);
    }
    fetchTemplates();
  }

  async function handleDeleteTemplate(id: string) {
    if (!confirm('Tem certeza? Isso excluira o template e todos os seus itens.')) return;
    await supabase.from('x3_checklist_templates').delete().eq('id', id);
    setSelectedTemplate(null);
    fetchTemplates();
  }

  async function handleSetDefault(id: string) {
    // Remove default from all
    await supabase.from('x3_checklist_templates').update({ is_default: false }).neq('id', '');
    // Set default on selected
    await supabase.from('x3_checklist_templates').update({ is_default: true }).eq('id', id);
    fetchTemplates();
  }

  async function handleAddItem() {
    if (!selectedTemplate || !newItemLabel.trim()) return;
    const maxOrder = items.length > 0 ? Math.max(...items.map((i) => i.sort_order)) + 1 : 0;
    await supabase.from('x3_checklist_template_items').insert({
      template_id: selectedTemplate.id,
      label: newItemLabel.trim(),
      xp_reward: newItemXP,
      sort_order: maxOrder,
    });
    setNewItemLabel('');
    setNewItemXP(10);
    fetchItems();
  }

  async function handleDeleteItem(id: string) {
    await supabase.from('x3_checklist_template_items').delete().eq('id', id);
    fetchItems();
  }

  async function handleUpdateItemXP(id: string, xp: number) {
    await supabase.from('x3_checklist_template_items').update({ xp_reward: xp }).eq('id', id);
    fetchItems();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-brand-on-surface">Checklist</h1>
          <p className="text-brand-muted text-sm mt-1">
            Configure os templates de checklist diario
          </p>
        </div>
        <button
          onClick={() => setShowNewTemplate(true)}
          className="btn-primary flex items-center gap-2 w-fit"
        >
          <Plus size={18} />
          Novo Template
        </button>
      </div>

      {/* New template inline form */}
      {showNewTemplate && (
        <div className="card flex items-center gap-3">
          <input
            type="text"
            value={newTemplateTitle}
            onChange={(e) => setNewTemplateTitle(e.target.value)}
            placeholder="Nome do template..."
            className="input-field flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleCreateTemplate()}
          />
          <button onClick={handleCreateTemplate} className="btn-primary">
            Criar
          </button>
          <button onClick={() => setShowNewTemplate(false)} className="btn-ghost">
            <X size={18} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Templates list */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-brand-muted uppercase tracking-wider mb-3">
            Templates
          </h2>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-4 w-3/4 bg-gray-200 rounded" />
              </div>
            ))
          ) : templates.length > 0 ? (
            templates.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template)}
                className={`w-full text-left card transition-colors ${
                  selectedTemplate?.id === template.id
                    ? 'border-brand-primary bg-brand-primary/5'
                    : 'hover:border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-sm">{template.title}</span>
                    {template.is_default && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-brand-primary/10 text-brand-primary">
                        Padrao
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="text-center text-brand-muted py-8">
              <CheckSquare size={32} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Nenhum template criado.</p>
            </div>
          )}
        </div>

        {/* Template items */}
        <div className="lg:col-span-2">
          {selectedTemplate ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold">{selectedTemplate.title}</h2>
                <div className="flex items-center gap-2">
                  {!selectedTemplate.is_default && (
                    <button
                      onClick={() => handleSetDefault(selectedTemplate.id)}
                      className="btn-ghost text-xs"
                    >
                      Definir como padrao
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteTemplate(selectedTemplate.id)}
                    className="btn-danger flex items-center gap-1"
                  >
                    <Trash2 size={14} />
                    Excluir
                  </button>
                </div>
              </div>

              {/* Items list */}
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div key={item.id} className="card flex items-center gap-3 py-3">
                    <GripVertical size={16} className="text-brand-muted flex-shrink-0" />
                    <span className="text-sm text-brand-muted w-6">{index + 1}.</span>
                    <span className="flex-1 text-sm font-medium">{item.label}</span>
                    <input
                      type="number"
                      value={item.xp_reward}
                      onChange={(e) => handleUpdateItemXP(item.id, parseInt(e.target.value) || 0)}
                      className="input-field w-20 py-1 px-2 text-xs text-center"
                      min={0}
                      title="XP"
                    />
                    <span className="text-xs text-brand-muted">XP</span>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1 rounded hover:bg-red-50 text-brand-muted hover:text-brand-error transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add item */}
              <div className="card flex items-center gap-3 border-dashed">
                <Plus size={16} className="text-brand-muted flex-shrink-0" />
                <input
                  type="text"
                  value={newItemLabel}
                  onChange={(e) => setNewItemLabel(e.target.value)}
                  placeholder="Novo item do checklist..."
                  className="input-field flex-1 border-0 p-0 focus:ring-0"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                />
                <input
                  type="number"
                  value={newItemXP}
                  onChange={(e) => setNewItemXP(parseInt(e.target.value) || 0)}
                  className="input-field w-20 py-1 px-2 text-xs text-center"
                  min={0}
                />
                <span className="text-xs text-brand-muted">XP</span>
                <button onClick={handleAddItem} className="btn-primary py-1.5 px-3 text-xs">
                  Adicionar
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-brand-muted py-16">
              <CheckSquare size={48} className="mx-auto mb-3 text-gray-300" />
              <p>Selecione um template ou crie um novo.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
