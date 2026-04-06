'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Video, ChevronRight, Play, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

interface VideoCategory {
  id: string;
  name: string;
  description: string | null;
  color: string;
  sort_order: number;
  total_videos: number;
  completed_videos: number;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function VideosPage() {
  const { user } = useAuth();
  const supabase = createClient();

  const [categories, setCategories] = useState<VideoCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: cats } = await supabase
      .from('x3_video_categories')
      .select('*')
      .order('sort_order');

    if (cats) {
      const withCounts = await Promise.all(
        cats.map(async (cat) => {
          const [totalRes, completedRes] = await Promise.all([
            supabase
              .from('x3_video_lessons')
              .select('id', { count: 'exact', head: true })
              .eq('category_id', cat.id)
              .eq('is_published', true),
            supabase
              .from('x3_user_video_progress')
              .select('video_id', { count: 'exact', head: true })
              .eq('user_id', user.id)
              .eq('completed', true)
              .in(
                'video_id',
                (await supabase
                  .from('x3_video_lessons')
                  .select('id')
                  .eq('category_id', cat.id)
                  .eq('is_published', true)
                ).data?.map((v) => v.id) || []
              ),
          ]);

          return {
            ...cat,
            total_videos: totalRes.count || 0,
            completed_videos: completedRes.count || 0,
          };
        })
      );

      setCategories(withCounts);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Flatten all videos for the "recent" section
  const [recentVideos, setRecentVideos] = useState<{
    id: string;
    title: string;
    thumbnail_url: string | null;
    category_name: string;
    completed: boolean;
  }[]>([]);

  useEffect(() => {
    async function fetchRecent() {
      if (!user) return;

      const { data: videos } = await supabase
        .from('x3_video_lessons')
        .select('id, title, thumbnail_url, category:x3_video_categories(name)')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(5);

      if (videos) {
        const { data: progress } = await supabase
          .from('x3_user_video_progress')
          .select('video_id, completed')
          .eq('user_id', user.id);

        const progressMap = new Map((progress || []).map((p) => [p.video_id, p.completed]));

        setRecentVideos(
          videos.map((v) => ({
            id: v.id,
            title: v.title,
            thumbnail_url: v.thumbnail_url,
            category_name: Array.isArray(v.category) ? v.category[0]?.name || '' : (v.category as { name: string })?.name || '',
            completed: progressMap.get(v.id) || false,
          }))
        );
      }
    }

    fetchRecent();
  }, [user]);

  const totalVideos = categories.reduce((sum, c) => sum + c.total_videos, 0);
  const totalCompleted = categories.reduce((sum, c) => sum + c.completed_videos, 0);

  if (loading) return null;

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div>
        <h1 className="font-display text-xl font-bold text-brand-on-surface">
          Videoaulas
        </h1>
        <p className="text-sm text-brand-muted mt-0.5">
          {totalCompleted} de {totalVideos} assistidos
        </p>
      </div>

      {/* Overall progress */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-brand-on-surface">Progresso geral</span>
          <span className="text-sm font-display font-bold text-brand-primary">
            {totalVideos > 0 ? Math.round((totalCompleted / totalVideos) * 100) : 0}%
          </span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-brand-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${totalVideos > 0 ? (totalCompleted / totalVideos) * 100 : 0}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </motion.div>

      {/* Recent videos */}
      {recentVideos.length > 0 && (
        <div>
          <h2 className="font-display font-bold text-sm text-brand-on-surface mb-3">
            Adicionados recentemente
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
            {recentVideos.map((video) => (
              <Link
                key={video.id}
                href={`/videos/${video.id}`}
                className="flex-shrink-0 w-44"
              >
                <div className="relative rounded-xl overflow-hidden bg-gray-100 aspect-video mb-2">
                  {video.thumbnail_url ? (
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play size={24} className="text-brand-muted" />
                    </div>
                  )}
                  {video.completed && (
                    <div className="absolute top-1.5 right-1.5 bg-brand-success text-white rounded-full p-0.5">
                      <CheckCircle2 size={14} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Play size={28} className="text-white" />
                  </div>
                </div>
                <p className="text-xs font-medium text-brand-on-surface line-clamp-2">
                  {video.title}
                </p>
                <p className="text-[10px] text-brand-muted">{video.category_name}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      <div>
        <h2 className="font-display font-bold text-sm text-brand-on-surface mb-3">
          Categorias
        </h2>
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-3"
        >
          {categories.map((cat) => {
            const progress = cat.total_videos > 0
              ? Math.round((cat.completed_videos / cat.total_videos) * 100)
              : 0;

            return (
              <motion.div key={cat.id} variants={item}>
                <Link
                  href={`/videos?category=${cat.id}`}
                  className="card block hover:shadow-md transition-shadow active:scale-[0.98] h-full"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                    style={{ backgroundColor: `${cat.color}15` }}
                  >
                    <Video size={20} style={{ color: cat.color }} />
                  </div>
                  <p className="font-display font-bold text-sm text-brand-on-surface">
                    {cat.name}
                  </p>
                  <p className="text-xs text-brand-muted mt-0.5">
                    {cat.total_videos} video{cat.total_videos !== 1 ? 's' : ''}
                  </p>
                  <div className="mt-3">
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${progress}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-brand-muted mt-1">
                      {cat.completed_videos}/{cat.total_videos} completos
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Empty state */}
      {categories.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Video size={24} className="text-brand-muted" />
          </div>
          <p className="text-brand-muted text-sm">
            Nenhuma videoaula disponivel ainda.
          </p>
        </div>
      )}
    </div>
  );
}
