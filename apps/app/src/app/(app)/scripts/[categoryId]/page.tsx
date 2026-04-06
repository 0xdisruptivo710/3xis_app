'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Search, Heart, MessageCircle, Shield, X,
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

interface Script {
  id: string;
  title: string;
  content: string;
  objection: string | null;
  response: string | null;
  tags: string[] | null;
  is_favorited: boolean;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  color: string;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function ScriptCategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { user } = useAuth();
  const supabase = createClient();

  const [category, setCategory] = useState<Category | null>(null);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [togglingFav, setTogglingFav] = useState<string | null>(null);

  const fetchScripts = useCallback(async () => {
    if (!user || !categoryId) return;
    setLoading(true);

    const [catRes, scriptsRes, favsRes] = await Promise.all([
      supabase
        .from('x3_script_categories')
        .select('*')
        .eq('id', categoryId)
        .single(),
      supabase
        .from('x3_scripts')
        .select('*')
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('created_at'),
      supabase
        .from('x3_user_favorite_scripts')
        .select('script_id')
        .eq('user_id', user.id),
    ]);

    if (catRes.data) setCategory(catRes.data);

    const favSet = new Set((favsRes.data || []).map((f) => f.script_id));
    const mapped: Script[] = (scriptsRes.data || []).map((s) => ({
      ...s,
      is_favorited: favSet.has(s.id),
    }));

    setScripts(mapped);
    setLoading(false);
  }, [user, categoryId]);

  useEffect(() => {
    fetchScripts();
  }, [fetchScripts]);

  async function toggleFavorite(scriptId: string) {
    if (!user || togglingFav) return;
    setTogglingFav(scriptId);

    const script = scripts.find((s) => s.id === scriptId);
    if (!script) return;

    if (script.is_favorited) {
      await supabase
        .from('x3_user_favorite_scripts')
        .delete()
        .eq('user_id', user.id)
        .eq('script_id', scriptId);
    } else {
      await supabase
        .from('x3_user_favorite_scripts')
        .insert({ user_id: user.id, script_id: scriptId });
    }

    setScripts((prev) =>
      prev.map((s) =>
        s.id === scriptId ? { ...s, is_favorited: !s.is_favorited } : s
      )
    );
    setTogglingFav(null);
  }

  const filtered = scripts.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.content.toLowerCase().includes(q) ||
      s.objection?.toLowerCase().includes(q) ||
      s.response?.toLowerCase().includes(q) ||
      s.tags?.some((t) => t.toLowerCase().includes(q))
    );
  });

  if (loading) return null;

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/scripts" className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-brand-on-surface" />
        </Link>
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold text-brand-on-surface truncate">
            {category?.name || 'Scripts'}
          </h1>
          {category?.description && (
            <p className="text-sm text-brand-muted mt-0.5 truncate">{category.description}</p>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
        <input
          type="text"
          placeholder="Buscar scripts..."
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

      {/* Scripts list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <MessageCircle size={24} className="text-brand-muted" />
          </div>
          <p className="text-brand-muted text-sm">
            {search ? 'Nenhum script encontrado para essa busca.' : 'Nenhum script nesta categoria.'}
          </p>
        </div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
          {filtered.map((script) => (
            <motion.div key={script.id} variants={item} className="card">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-display font-bold text-sm text-brand-on-surface">
                  {script.title}
                </h3>
                <button
                  onClick={() => toggleFavorite(script.id)}
                  disabled={togglingFav === script.id}
                  className={cn(
                    'p-1.5 rounded-lg transition-colors flex-shrink-0',
                    script.is_favorited
                      ? 'text-red-500 bg-red-50'
                      : 'text-brand-muted hover:bg-gray-100'
                  )}
                >
                  <Heart
                    size={16}
                    fill={script.is_favorited ? 'currentColor' : 'none'}
                  />
                </button>
              </div>

              <p className="text-sm text-brand-on-surface/80 whitespace-pre-line">
                {script.content}
              </p>

              {script.objection && script.response && (
                <div className="mt-3 space-y-2">
                  <div className="p-3 rounded-xl bg-brand-error/5 border border-brand-error/10">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Shield size={12} className="text-brand-error" />
                      <span className="text-xs font-medium text-brand-error">Objecao</span>
                    </div>
                    <p className="text-sm text-brand-on-surface/80">{script.objection}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-brand-success/5 border border-brand-success/10">
                    <div className="flex items-center gap-1.5 mb-1">
                      <MessageCircle size={12} className="text-brand-success" />
                      <span className="text-xs font-medium text-brand-success">Resposta</span>
                    </div>
                    <p className="text-sm text-brand-on-surface/80">{script.response}</p>
                  </div>
                </div>
              )}

              {script.tags && script.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {script.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-brand-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
