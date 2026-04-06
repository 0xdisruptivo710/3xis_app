'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Pencil, Trash2, Video, Eye, EyeOff, X } from 'lucide-react';

interface VideoCategory {
  id: string;
  name: string;
}

interface VideoLesson {
  id: string;
  category_id: string;
  youtube_video_id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  xp_reward: number;
  is_published: boolean;
  sort_order: number;
  x3_video_categories?: { name: string } | null;
}

export default function VideosPage() {
  const [videos, setVideos] = useState<VideoLesson[]>([]);
  const [categories, setCategories] = useState<VideoCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoLesson | null>(null);
  const supabase = createClient();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    youtube_video_id: '',
    category_id: '',
    xp_reward: 30,
    sort_order: 0,
    is_published: true,
  });

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase
      .from('x3_video_categories')
      .select('id, name')
      .order('sort_order');
    setCategories(data ?? []);
  }, [supabase]);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('x3_video_lessons')
      .select('id, category_id, youtube_video_id, title, description, thumbnail_url, duration_seconds, xp_reward, is_published, sort_order, x3_video_categories(name)')
      .order('sort_order');
    setVideos((data as unknown as VideoLesson[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchCategories();
    fetchVideos();
  }, [fetchCategories, fetchVideos]);

  function openNewForm() {
    setEditingVideo(null);
    setFormData({
      title: '',
      description: '',
      youtube_video_id: '',
      category_id: categories[0]?.id ?? '',
      xp_reward: 30,
      sort_order: 0,
      is_published: true,
    });
    setShowForm(true);
  }

  function openEditForm(video: VideoLesson) {
    setEditingVideo(video);
    setFormData({
      title: video.title,
      description: video.description ?? '',
      youtube_video_id: video.youtube_video_id,
      category_id: video.category_id,
      xp_reward: video.xp_reward,
      sort_order: video.sort_order,
      is_published: video.is_published,
    });
    setShowForm(true);
  }

  async function handleSave() {
    const thumbnailUrl = `https://img.youtube.com/vi/${formData.youtube_video_id}/mqdefault.jpg`;
    const payload = {
      title: formData.title,
      description: formData.description || null,
      youtube_video_id: formData.youtube_video_id,
      category_id: formData.category_id,
      thumbnail_url: thumbnailUrl,
      xp_reward: formData.xp_reward,
      sort_order: formData.sort_order,
      is_published: formData.is_published,
    };

    if (editingVideo) {
      await supabase.from('x3_video_lessons').update(payload).eq('id', editingVideo.id);
    } else {
      await supabase.from('x3_video_lessons').insert(payload);
    }

    setShowForm(false);
    fetchVideos();
  }

  async function handleTogglePublish(video: VideoLesson) {
    await supabase
      .from('x3_video_lessons')
      .update({ is_published: !video.is_published })
      .eq('id', video.id);
    fetchVideos();
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este video?')) return;
    await supabase.from('x3_video_lessons').delete().eq('id', id);
    fetchVideos();
  }

  function formatDuration(seconds: number | null) {
    if (!seconds) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-brand-on-surface">Videoaulas</h1>
          <p className="text-brand-muted text-sm mt-1">
            Gerencie as videoaulas do YouTube
          </p>
        </div>
        <button onClick={openNewForm} className="btn-primary flex items-center gap-2 w-fit">
          <Plus size={18} />
          Novo Video
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">
                {editingVideo ? 'Editar Video' : 'Novo Video'}
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
                placeholder="Titulo do video"
              />
            </div>

            <div>
              <label className="label">YouTube Video ID</label>
              <input
                type="text"
                value={formData.youtube_video_id}
                onChange={(e) => setFormData({ ...formData, youtube_video_id: e.target.value })}
                className="input-field"
                placeholder="Ex: dQw4w9WgXcQ"
              />
              <p className="text-xs text-brand-muted mt-1">
                O ID que aparece na URL: youtube.com/watch?v=<strong>ID_AQUI</strong>
              </p>
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
              <label className="label">Descricao (opcional)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field min-h-[80px] resize-y"
                placeholder="Descricao do video..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">XP por conclusao</label>
                <input
                  type="number"
                  value={formData.xp_reward}
                  onChange={(e) => setFormData({ ...formData, xp_reward: parseInt(e.target.value) || 0 })}
                  className="input-field"
                  min={0}
                />
              </div>
              <div>
                <label className="label">Ordem</label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  className="input-field"
                  min={0}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_published"
                checked={formData.is_published}
                onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
              />
              <label htmlFor="is_published" className="text-sm text-gray-700">Publicado</label>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="btn-ghost flex-1">
                Cancelar
              </button>
              <button onClick={handleSave} className="btn-primary flex-1">
                {editingVideo ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card animate-pulse space-y-3">
              <div className="w-full h-36 bg-gray-200 rounded-lg" />
              <div className="h-4 w-3/4 bg-gray-200 rounded" />
              <div className="h-3 w-1/2 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : videos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video) => (
            <div key={video.id} className={`card space-y-3 ${!video.is_published ? 'opacity-60' : ''}`}>
              {/* Thumbnail */}
              <div className="relative">
                <img
                  src={video.thumbnail_url ?? `https://img.youtube.com/vi/${video.youtube_video_id}/mqdefault.jpg`}
                  alt={video.title}
                  className="w-full h-36 object-cover rounded-lg"
                />
                {!video.is_published && (
                  <span className="absolute top-2 right-2 bg-gray-800/80 text-white text-xs px-2 py-0.5 rounded">
                    Rascunho
                  </span>
                )}
              </div>

              {/* Info */}
              <div>
                <h3 className="font-medium text-sm text-brand-on-surface truncate">{video.title}</h3>
                <p className="text-xs text-brand-muted mt-0.5">
                  {video.x3_video_categories?.name ?? '—'} | {formData.xp_reward} XP | {formatDuration(video.duration_seconds)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => handleTogglePublish(video)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-brand-muted hover:text-brand-on-surface transition-colors"
                  title={video.is_published ? 'Despublicar' : 'Publicar'}
                >
                  {video.is_published ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button
                  onClick={() => openEditForm(video)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-brand-muted hover:text-brand-on-surface transition-colors"
                  title="Editar"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => handleDelete(video.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-brand-muted hover:text-brand-error transition-colors"
                  title="Excluir"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-brand-muted py-16">
          <Video size={48} className="mx-auto mb-3 text-gray-300" />
          <p>Nenhum video cadastrado.</p>
          <button onClick={openNewForm} className="btn-primary mt-4">
            Adicionar primeiro video
          </button>
        </div>
      )}
    </div>
  );
}
