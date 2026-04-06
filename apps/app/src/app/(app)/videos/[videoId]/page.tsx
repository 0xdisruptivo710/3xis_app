'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, CheckCircle2, Zap, Clock, Send, StickyNote, Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

interface VideoLesson {
  id: string;
  title: string;
  description: string | null;
  youtube_video_id: string;
  duration_seconds: number | null;
  xp_reward: number;
  category: { name: string } | null;
}

interface VideoProgress {
  watch_percentage: number;
  completed: boolean;
  xp_awarded: boolean;
}

interface VideoNote {
  id: string;
  content: string;
  timestamp_s: number | null;
  created_at: string;
}

export default function VideoPlayerPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const { user } = useAuth();
  const supabase = createClient();

  const [video, setVideo] = useState<VideoLesson | null>(null);
  const [progress, setProgress] = useState<VideoProgress | null>(null);
  const [notes, setNotes] = useState<VideoNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [sendingNote, setSendingNote] = useState(false);

  const fetchVideo = useCallback(async () => {
    if (!user || !videoId) return;
    setLoading(true);

    const [videoRes, progressRes, notesRes] = await Promise.all([
      supabase
        .from('x3_video_lessons')
        .select('*, category:x3_video_categories(name)')
        .eq('id', videoId)
        .single(),
      supabase
        .from('x3_user_video_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('video_id', videoId)
        .maybeSingle(),
      supabase
        .from('x3_video_notes')
        .select('*')
        .eq('user_id', user.id)
        .eq('video_id', videoId)
        .order('created_at', { ascending: false }),
    ]);

    if (videoRes.data) {
      setVideo({
        ...videoRes.data,
        category: Array.isArray(videoRes.data.category)
          ? videoRes.data.category[0] || null
          : videoRes.data.category,
      });
    }

    if (progressRes.data) {
      setProgress({
        watch_percentage: progressRes.data.watch_percentage,
        completed: progressRes.data.completed,
        xp_awarded: progressRes.data.xp_awarded,
      });
    }

    setNotes(notesRes.data || []);
    setLoading(false);
  }, [user, videoId]);

  useEffect(() => {
    fetchVideo();
  }, [fetchVideo]);

  async function markAsWatched() {
    if (!user || !videoId || marking) return;
    setMarking(true);

    const { data: existing } = await supabase
      .from('x3_user_video_progress')
      .select('id')
      .eq('user_id', user.id)
      .eq('video_id', videoId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('x3_user_video_progress')
        .update({
          watch_percentage: 100,
          completed: true,
          completed_at: new Date().toISOString(),
          last_watched_at: new Date().toISOString(),
          xp_awarded: true,
        })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('x3_user_video_progress')
        .insert({
          user_id: user.id,
          video_id: videoId,
          watch_percentage: 100,
          completed: true,
          completed_at: new Date().toISOString(),
          xp_awarded: true,
        });
    }

    setProgress({
      watch_percentage: 100,
      completed: true,
      xp_awarded: true,
    });
    setMarking(false);
  }

  async function addNote() {
    if (!user || !videoId || !newNote.trim()) return;
    setSendingNote(true);

    const { data } = await supabase
      .from('x3_video_notes')
      .insert({
        user_id: user.id,
        video_id: videoId,
        content: newNote.trim(),
      })
      .select('*')
      .single();

    if (data) {
      setNotes((prev) => [data, ...prev]);
    }

    setNewNote('');
    setSendingNote(false);
  }

  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  if (loading) return null;
  if (!video) return null;

  return (
    <div className="space-y-4">
      {/* Video player */}
      <div className="relative w-full aspect-video bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${video.youtube_video_id}?rel=0&modestbranding=1`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>

      <div className="p-4 space-y-4">
        {/* Back link + title */}
        <div>
          <Link
            href="/videos"
            className="inline-flex items-center gap-1 text-sm text-brand-primary font-medium mb-2 hover:underline"
          >
            <ArrowLeft size={14} />
            Videoaulas
          </Link>
          <h1 className="font-display text-lg font-bold text-brand-on-surface">
            {video.title}
          </h1>
          <div className="flex items-center gap-3 mt-1.5">
            {video.category && (
              <span className="text-xs text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full font-medium">
                {video.category.name}
              </span>
            )}
            {video.duration_seconds && (
              <span className="text-xs text-brand-muted flex items-center gap-1">
                <Clock size={12} />
                {formatDuration(video.duration_seconds)}
              </span>
            )}
            <span className="text-xs text-brand-accent flex items-center gap-1">
              <Zap size={12} />
              +{video.xp_reward} XP
            </span>
          </div>
        </div>

        {/* Description */}
        {video.description && (
          <p className="text-sm text-brand-on-surface/80 leading-relaxed">
            {video.description}
          </p>
        )}

        {/* Mark as watched / Status */}
        {progress?.completed ? (
          <div className="card bg-brand-success/5 border-brand-success/20 flex items-center gap-3">
            <CheckCircle2 size={20} className="text-brand-success flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-brand-success">Video assistido</p>
              <p className="text-xs text-brand-muted">
                {progress.xp_awarded ? `+${video.xp_reward} XP concedidos` : 'XP sera concedido'}
              </p>
            </div>
          </div>
        ) : (
          <button
            onClick={markAsWatched}
            disabled={marking}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {marking ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <CheckCircle2 size={18} />
                Marcar como assistido
              </>
            )}
          </button>
        )}

        {/* Notes section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <StickyNote size={16} className="text-brand-muted" />
            <h2 className="font-display font-bold text-sm text-brand-on-surface">
              Anotacoes ({notes.length})
            </h2>
          </div>

          {/* Add note */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addNote()}
              placeholder="Adicionar anotacao..."
              className="input-field flex-1"
            />
            <button
              onClick={addNote}
              disabled={sendingNote || !newNote.trim()}
              className="btn-primary px-3"
            >
              {sendingNote ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </button>
          </div>

          {/* Notes list */}
          {notes.length === 0 ? (
            <p className="text-sm text-brand-muted text-center py-4">
              Nenhuma anotacao ainda.
            </p>
          ) : (
            <motion.div
              initial="hidden"
              animate="show"
              variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }}
              className="space-y-2"
            >
              {notes.map((note) => (
                <motion.div
                  key={note.id}
                  variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                  className="card py-3"
                >
                  <p className="text-sm text-brand-on-surface">{note.content}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {note.timestamp_s !== null && (
                      <span className="text-[10px] text-brand-primary font-medium bg-brand-primary/10 px-1.5 py-0.5 rounded">
                        {formatDuration(note.timestamp_s)}
                      </span>
                    )}
                    <span className="text-[10px] text-brand-muted">
                      {new Date(note.created_at).toLocaleDateString('pt-BR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
