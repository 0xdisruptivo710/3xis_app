'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckSquare, Plus, Zap, Loader2, X, PartyPopper,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

interface ChecklistItem {
  id: string;
  label: string;
  is_completed: boolean;
  completed_at: string | null;
  is_custom: boolean;
  xp_reward: number;
  sort_order: number;
}

interface DailyChecklist {
  id: string;
  checklist_date: string;
  completed: boolean;
  items: ChecklistItem[];
}

export default function ChecklistPage() {
  const { user } = useAuth();
  const supabase = createClient();

  const [checklist, setChecklist] = useState<DailyChecklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [newItemLabel, setNewItemLabel] = useState('');
  const [showAddItem, setShowAddItem] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const fetchChecklist = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Try to get today's checklist
    let { data: existing } = await supabase
      .from('x3_daily_checklists')
      .select('*, items:x3_daily_checklist_items(*)')
      .eq('user_id', user.id)
      .eq('checklist_date', today)
      .maybeSingle();

    if (!existing) {
      // Create from template
      const { data: template } = await supabase
        .from('x3_checklist_templates')
        .select('*, items:x3_checklist_template_items(*)')
        .or(`store_id.eq.${user.storeId},is_default.eq.true`)
        .order('is_default', { ascending: true })
        .limit(1)
        .maybeSingle();

      const { data: newChecklist } = await supabase
        .from('x3_daily_checklists')
        .insert({ user_id: user.id, checklist_date: today })
        .select('id')
        .single();

      if (newChecklist && template?.items) {
        const templateItems = Array.isArray(template.items) ? template.items : [];
        if (templateItems.length > 0) {
          await supabase.from('x3_daily_checklist_items').insert(
            templateItems.map((item: { label: string; xp_reward: number; sort_order: number }) => ({
              checklist_id: newChecklist.id,
              label: item.label,
              xp_reward: item.xp_reward,
              sort_order: item.sort_order,
            }))
          );
        }
      }

      // Re-fetch
      const { data: refetched } = await supabase
        .from('x3_daily_checklists')
        .select('*, items:x3_daily_checklist_items(*)')
        .eq('user_id', user.id)
        .eq('checklist_date', today)
        .maybeSingle();

      existing = refetched;
    }

    if (existing) {
      const items = Array.isArray(existing.items) ? existing.items : [];
      setChecklist({
        id: existing.id,
        checklist_date: existing.checklist_date,
        completed: existing.completed,
        items: items.sort((a: ChecklistItem, b: ChecklistItem) => a.sort_order - b.sort_order),
      });
    }

    setLoading(false);
  }, [user, today]);

  useEffect(() => {
    fetchChecklist();
  }, [fetchChecklist]);

  async function toggleItem(itemId: string) {
    if (!checklist || toggling) return;
    setToggling(itemId);

    const item = checklist.items.find((i) => i.id === itemId);
    if (!item) return;

    const newCompleted = !item.is_completed;

    await supabase
      .from('x3_daily_checklist_items')
      .update({
        is_completed: newCompleted,
        completed_at: newCompleted ? new Date().toISOString() : null,
      })
      .eq('id', itemId);

    const updatedItems = checklist.items.map((i) =>
      i.id === itemId
        ? { ...i, is_completed: newCompleted, completed_at: newCompleted ? new Date().toISOString() : null }
        : i
    );

    const allCompleted = updatedItems.every((i) => i.is_completed);

    if (allCompleted && !checklist.completed) {
      await supabase
        .from('x3_daily_checklists')
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq('id', checklist.id);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }

    setChecklist({
      ...checklist,
      completed: allCompleted,
      items: updatedItems,
    });

    setToggling(null);
  }

  async function addCustomItem() {
    if (!checklist || !newItemLabel.trim()) return;
    setAddingItem(true);

    const { data } = await supabase
      .from('x3_daily_checklist_items')
      .insert({
        checklist_id: checklist.id,
        label: newItemLabel.trim(),
        is_custom: true,
        xp_reward: 5,
        sort_order: checklist.items.length,
      })
      .select('*')
      .single();

    if (data) {
      setChecklist({
        ...checklist,
        items: [...checklist.items, data],
      });
    }

    setNewItemLabel('');
    setShowAddItem(false);
    setAddingItem(false);
  }

  const completedCount = checklist?.items.filter((i) => i.is_completed).length || 0;
  const totalCount = checklist?.items.length || 0;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const totalXP = checklist?.items.reduce((sum, i) => sum + (i.is_completed ? i.xp_reward : 0), 0) || 0;

  if (loading) return null;

  return (
    <div className="p-4 space-y-5">
      {/* Confetti overlay */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 pointer-events-none"
          >
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              className="bg-white rounded-2xl p-8 text-center shadow-2xl"
            >
              <PartyPopper size={48} className="mx-auto text-brand-accent mb-3" />
              <h3 className="font-display font-bold text-xl text-brand-on-surface">
                Checklist completo!
              </h3>
              <p className="text-sm text-brand-muted mt-1">+{totalXP} XP ganhos hoje</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div>
        <h1 className="font-display text-xl font-bold text-brand-on-surface">
          Checklist do Dia
        </h1>
        <p className="text-sm text-brand-muted mt-0.5">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Progress card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-display font-bold text-2xl text-brand-on-surface">
              {progress}%
            </p>
            <p className="text-xs text-brand-muted">
              {completedCount} de {totalCount} tarefas
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-brand-accent">
              <Zap size={16} />
              <span className="font-display font-bold text-lg">{totalXP}</span>
            </div>
            <p className="text-xs text-brand-muted">XP ganhos</p>
          </div>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className={cn(
              'h-full rounded-full',
              progress === 100
                ? 'bg-gradient-to-r from-brand-success to-brand-accent'
                : 'bg-brand-primary'
            )}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </motion.div>

      {/* Checklist items */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }}
        className="space-y-2"
      >
        {checklist?.items.map((item) => (
          <motion.div
            key={item.id}
            variants={{ hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0 } }}
            layout
          >
            <button
              onClick={() => toggleItem(item.id)}
              disabled={toggling === item.id}
              className={cn(
                'card w-full flex items-center gap-3 text-left transition-all',
                item.is_completed && 'bg-brand-success/5 border-brand-success/10'
              )}
            >
              <div
                className={cn(
                  'w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0',
                  item.is_completed
                    ? 'bg-brand-success border-brand-success'
                    : 'border-gray-300'
                )}
              >
                {item.is_completed && (
                  <motion.svg
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.3 }}
                    className="w-3.5 h-3.5 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3}
                    strokeLinecap="round"
                  >
                    <motion.path d="M5 13l4 4L19 7" />
                  </motion.svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'text-sm',
                  item.is_completed
                    ? 'text-brand-muted line-through'
                    : 'text-brand-on-surface font-medium'
                )}>
                  {item.label}
                </p>
                {item.is_custom && (
                  <span className="text-[10px] text-brand-muted">Pessoal</span>
                )}
              </div>
              <span className={cn(
                'text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0',
                item.is_completed
                  ? 'text-brand-success bg-brand-success/10'
                  : 'text-brand-accent bg-brand-accent/10'
              )}>
                +{item.xp_reward}
              </span>
            </button>
          </motion.div>
        ))}
      </motion.div>

      {/* Add custom item */}
      <AnimatePresence>
        {showAddItem ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="card flex items-center gap-2">
              <input
                type="text"
                placeholder="Nova tarefa..."
                value={newItemLabel}
                onChange={(e) => setNewItemLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustomItem()}
                autoFocus
                className="input-field flex-1"
              />
              <button
                onClick={addCustomItem}
                disabled={addingItem || !newItemLabel.trim()}
                className="btn-primary px-4 py-2.5"
              >
                {addingItem ? <Loader2 size={16} className="animate-spin" /> : 'Add'}
              </button>
              <button
                onClick={() => { setShowAddItem(false); setNewItemLabel(''); }}
                className="p-2 text-brand-muted"
              >
                <X size={18} />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setShowAddItem(true)}
            className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-sm text-brand-muted hover:border-brand-primary hover:text-brand-primary transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Adicionar tarefa pessoal
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
