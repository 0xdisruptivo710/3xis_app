'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Save, Pin, PinOff, Loader2, Trash2, Share2,
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

interface NoteCategory {
  id: string;
  name: string;
  color: string;
}

export default function NoteEditorPage() {
  const { noteId } = useParams<{ noteId: string }>();
  const { user } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [isPinned, setIsPinned] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [categories, setCategories] = useState<NoteCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const fetchNote = useCallback(async () => {
    if (!user || !noteId) return;
    setLoading(true);

    const [noteRes, catsRes] = await Promise.all([
      supabase
        .from('x3_notes')
        .select('*')
        .eq('id', noteId)
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('x3_note_categories')
        .select('*'),
    ]);

    if (noteRes.data) {
      setTitle(noteRes.data.title);
      setContent(noteRes.data.content);
      setCategoryId(noteRes.data.category_id);
      setIsPinned(noteRes.data.is_pinned);
      setIsShared(noteRes.data.is_shared);
    }

    setCategories(catsRes.data || []);
    setLoading(false);
  }, [user, noteId]);

  useEffect(() => {
    fetchNote();
  }, [fetchNote]);

  async function handleSave() {
    if (!user || !noteId) return;
    setSaving(true);

    await supabase
      .from('x3_notes')
      .update({
        title: title || 'Sem titulo',
        content,
        category_id: categoryId,
        is_pinned: isPinned,
        is_shared: isShared,
      })
      .eq('id', noteId)
      .eq('user_id', user.id);

    setSaving(false);
    setDirty(false);
  }

  async function handleDelete() {
    if (!confirm('Tem certeza que deseja excluir esta nota?')) return;

    await supabase.from('x3_notes').delete().eq('id', noteId);
    router.push('/notes');
  }

  async function togglePin() {
    setIsPinned(!isPinned);
    setDirty(true);
  }

  function markDirty() {
    setDirty(true);
  }

  if (loading) return null;

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/notes" className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft size={20} className="text-brand-on-surface" />
          </Link>
          <span className="text-sm text-brand-muted">
            {dirty ? 'Nao salvo' : 'Salvo'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={togglePin}
            className={cn(
              'p-2 rounded-xl transition-colors',
              isPinned ? 'text-brand-primary bg-brand-primary/10' : 'text-brand-muted hover:bg-gray-100'
            )}
          >
            {isPinned ? <PinOff size={18} /> : <Pin size={18} />}
          </button>
          <button
            onClick={handleDelete}
            className="p-2 rounded-xl text-brand-muted hover:text-brand-error hover:bg-brand-error/10 transition-colors"
          >
            <Trash2 size={18} />
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className={cn(
              'p-2 rounded-xl transition-colors',
              dirty
                ? 'text-brand-primary bg-brand-primary/10'
                : 'text-brand-muted'
            )}
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          </button>
        </div>
      </div>

      {/* Category selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
        <button
          onClick={() => { setCategoryId(null); markDirty(); }}
          className={cn(
            'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
            !categoryId
              ? 'bg-brand-secondary text-white'
              : 'bg-gray-100 text-brand-muted hover:bg-gray-200'
          )}
        >
          Sem categoria
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => { setCategoryId(cat.id); markDirty(); }}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
              categoryId === cat.id
                ? 'text-white'
                : 'bg-gray-100 text-brand-muted hover:bg-gray-200'
            )}
            style={categoryId === cat.id ? { backgroundColor: cat.color } : undefined}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Title */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <input
          type="text"
          value={title}
          onChange={(e) => { setTitle(e.target.value); markDirty(); }}
          placeholder="Titulo da nota"
          className="w-full font-display font-bold text-xl text-brand-on-surface bg-transparent border-none outline-none placeholder:text-brand-muted/50"
        />
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <textarea
          value={content}
          onChange={(e) => { setContent(e.target.value); markDirty(); }}
          placeholder="Comece a escrever..."
          className="w-full min-h-[50vh] text-sm text-brand-on-surface bg-transparent border-none outline-none resize-none placeholder:text-brand-muted/50 leading-relaxed"
        />
      </motion.div>
    </div>
  );
}
