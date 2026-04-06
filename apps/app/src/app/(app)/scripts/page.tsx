'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, ChevronRight, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

interface ScriptCategory {
  id: string;
  name: string;
  description: string | null;
  color: string;
  sort_order: number;
  script_count: number;
}

const CATEGORY_ICONS: Record<string, string> = {
  'Abordagem Inicial': '👋',
  'Qualificacao': '🎯',
  'Apresentacao': '🚗',
  'Negociacao': '🤝',
  'Fechamento': '✅',
  'Objecoes': '🛡️',
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function ScriptsPage() {
  const { user } = useAuth();
  const supabase = createClient();

  const [categories, setCategories] = useState<ScriptCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: cats } = await supabase
      .from('x3_script_categories')
      .select('*')
      .order('sort_order');

    if (cats) {
      const withCounts = await Promise.all(
        cats.map(async (cat) => {
          const { count } = await supabase
            .from('x3_scripts')
            .select('id', { count: 'exact', head: true })
            .eq('category_id', cat.id)
            .eq('is_active', true);
          return { ...cat, script_count: count || 0 };
        })
      );
      setCategories(withCounts);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const totalScripts = categories.reduce((sum, c) => sum + c.script_count, 0);

  if (loading) return null;

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div>
        <h1 className="font-display text-xl font-bold text-brand-on-surface">
          Scripts
        </h1>
        <p className="text-sm text-brand-muted mt-0.5">
          {totalScripts} scripts em {categories.length} categorias
        </p>
      </div>

      {/* Info card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card bg-brand-primary/5 border-brand-primary/10"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
            <BookOpen size={20} className="text-brand-primary" />
          </div>
          <div>
            <p className="font-medium text-sm text-brand-on-surface">
              Biblioteca de scripts
            </p>
            <p className="text-xs text-brand-muted mt-0.5">
              Use estes scripts como guia para suas conversas com clientes.
              Adapte ao seu estilo e a situacao.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Categories */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-3"
      >
        {categories.map((cat) => (
          <motion.div key={cat.id} variants={item}>
            <Link
              href={`/scripts/${cat.id}`}
              className="card flex items-center gap-4 hover:shadow-md transition-shadow active:scale-[0.98]"
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl"
                style={{ backgroundColor: `${cat.color}15` }}
              >
                {CATEGORY_ICONS[cat.name] || <MessageSquare size={20} style={{ color: cat.color }} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-sm text-brand-on-surface">
                  {cat.name}
                </p>
                {cat.description && (
                  <p className="text-xs text-brand-muted mt-0.5 line-clamp-1">
                    {cat.description}
                  </p>
                )}
                <p className="text-xs text-brand-muted mt-1">
                  {cat.script_count} script{cat.script_count !== 1 ? 's' : ''}
                </p>
              </div>
              <ChevronRight size={18} className="text-brand-muted flex-shrink-0" />
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Empty state */}
      {categories.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <MessageSquare size={24} className="text-brand-muted" />
          </div>
          <p className="text-brand-muted text-sm">
            Nenhuma categoria de script disponivel.
          </p>
        </div>
      )}
    </div>
  );
}
