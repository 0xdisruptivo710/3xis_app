'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  StickyNote, Search, Plus, Pin, X, Trash2, Tag,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

interface Note {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
  category: {
    id: string;
    name: string;
    color: string;
  } | null;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function NotesPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const [notes, setNotes] = useState<Note[]>([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string; color: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [notesRes, catsRes] = await Promise.all([
      supabase
        .from('x3_notes')
        .select('*, category:x3_note_categories(id, name, color)')
        .eq('user_id', user.id)
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false }),
      supabase
        .from('x3_note_categories')
        .select('id, name, color'),
    ]);

    setNotes(
      (notesRes.data || []).map((n) => ({
        ...n,
        category: Array.isArray(n.category) ? n.category[0] || null : n.category,
      }))
    );
    setCategories(catsRes.data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  async function createNote() {
    if (!user) return;

    const { data } = await supabase
      .from('x3_notes')
      .insert({ user_id: user.id, title: 'Sem titulo', content: '' })
      .select('id')
      .single();

    if (data) {
      router.push(`/notes/${data.id}`);
    }
  }

  async function deleteNote(noteId: string) {
    await supabase.from('x3_notes').delete().eq('id', noteId);
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  }

  const filtered = notes.filter((n) => {
    const matchSearch = !search ||
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !filterCategory || n.category?.id === filterCategory;
    return matchSearch && matchCategory;
  });

  if (loading) return null;

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div>
        <h1 className="font-display text-xl font-bold text-brand-on-surface">
          Notas
        </h1>
        <p className="text-sm text-brand-muted mt-0.5">
          {notes.length} nota{notes.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
        <input
          type="text"
          placeholder="Buscar notas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field w-full pl-10 pr-10"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-on-surface"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
        <button
          onClick={() => setFilterCategory(null)}
          className={cn(
            'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
            !filterCategory
              ? 'bg-brand-primary text-white'
              : 'bg-gray-100 text-brand-muted hover:bg-gray-200'
          )}
        >
          Todas
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilterCategory(filterCategory === cat.id ? null : cat.id)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
              filterCategory === cat.id
                ? 'text-white'
                : 'bg-gray-100 text-brand-muted hover:bg-gray-200'
            )}
            style={filterCategory === cat.id ? { backgroundColor: cat.color } : undefined}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Notes list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <StickyNote size={24} className="text-brand-muted" />
          </div>
          <p className="text-brand-muted text-sm">
            {search || filterCategory ? 'Nenhuma nota encontrada.' : 'Voce ainda nao tem notas.'}
          </p>
          {!search && !filterCategory && (
            <button onClick={createNote} className="btn-primary mt-4">
              Criar primeira nota
            </button>
          )}
        </div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
          {filtered.map((note) => (
            <motion.div key={note.id} variants={item}>
              <Link
                href={`/notes/${note.id}`}
                className="card block hover:shadow-md transition-shadow active:scale-[0.98]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {note.is_pinned && (
                        <Pin size={12} className="text-brand-primary flex-shrink-0" />
                      )}
                      <h3 className="font-display font-bold text-sm text-brand-on-surface truncate">
                        {note.title || 'Sem titulo'}
                      </h3>
                    </div>
                    {note.content && (
                      <p className="text-xs text-brand-muted line-clamp-2 mb-2">
                        {note.content.replace(/<[^>]*>/g, '')}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      {note.category && (
                        <span
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: note.category.color }}
                        >
                          {note.category.name}
                        </span>
                      )}
                      <span className="text-[10px] text-brand-muted">
                        {new Date(note.updated_at).toLocaleDateString('pt-BR', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (confirm('Excluir esta nota?')) deleteNote(note.id);
                    }}
                    className="p-1.5 rounded-lg text-brand-muted hover:text-brand-error hover:bg-brand-error/10 transition-colors flex-shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* FAB */}
      <motion.button
        onClick={createNote}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: 'spring' }}
        className="fixed right-4 bottom-24 w-14 h-14 bg-brand-primary text-white rounded-2xl shadow-lg shadow-brand-primary/30 flex items-center justify-center hover:bg-brand-primary/90 active:scale-95 transition-transform z-20"
      >
        <Plus size={24} />
      </motion.button>
    </div>
  );
}
