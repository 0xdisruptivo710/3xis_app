'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  User, Camera, Star, Flame, Trophy, Video, CheckSquare,
  Bell, BellOff, Moon, Sun, Download, LogOut, Zap,
  ChevronRight, Award,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';
import { cn } from '@/lib/utils';

interface ProfileStats {
  badges_count: number;
  videos_watched: number;
  checklist_completion: number;
}

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const { levelName, progressToNextLevel, xpToNextLevel } = useProfile();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stats, setStats] = useState<ProfileStats>({
    badges_count: 0,
    videos_watched: 0,
    checklist_completion: 0,
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);

  // Listen for PWA install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const fetchStats = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

    const [badgesRes, videosRes, checklistsRes] = await Promise.all([
      supabase
        .from('x3_user_badges')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),
      supabase
        .from('x3_user_video_progress')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('completed', true),
      supabase
        .from('x3_daily_checklists')
        .select('completed')
        .eq('user_id', user.id)
        .gte('checklist_date', startOfMonth.split('T')[0])
        .lte('checklist_date', endOfMonth.split('T')[0]),
    ]);

    const completedDays = (checklistsRes.data || []).filter((c) => c.completed).length;
    const totalDays = checklistsRes.data?.length || 1;

    setStats({
      badges_count: badgesRes.count || 0,
      videos_watched: videosRes.count || 0,
      checklist_completion: Math.round((completedDays / totalDays) * 100),
    });

    // Check notification preferences
    const { data: notifPrefs } = await supabase
      .from('x3_notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (notifPrefs) {
      setNotificationsEnabled(notifPrefs.morning_ritual || notifPrefs.daily_goal_reminder);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!user || !e.target.files || e.target.files.length === 0) return;
    setUploading(true);

    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `avatars/${user.id}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await supabase
        .from('x3_profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);
    }

    setUploading(false);
  }

  async function handleInstallPWA() {
    if (!deferredPrompt) return;
    (deferredPrompt as unknown as { prompt: () => void }).prompt();
    setDeferredPrompt(null);
  }

  async function toggleNotifications() {
    if (!user) return;
    const newState = !notificationsEnabled;
    setNotificationsEnabled(newState);

    await supabase
      .from('x3_notification_preferences')
      .upsert({
        user_id: user.id,
        morning_ritual: newState,
        daily_goal_reminder: newState,
        checklist_reminder: newState,
        streak_warning: newState,
        level_up: newState,
        new_content: newState,
      });
  }

  function toggleDarkMode() {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  }

  const STATS_CARDS = [
    { icon: Zap, label: 'XP Total', value: user?.xpTotal?.toLocaleString() || '0', color: 'text-brand-accent', bg: 'bg-brand-accent/10' },
    { icon: Award, label: 'Badges', value: stats.badges_count.toString(), color: 'text-purple-500', bg: 'bg-purple-50' },
    { icon: Flame, label: 'Streak', value: `${user?.streakDays || 0} dias`, color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
    { icon: Video, label: 'Videos', value: stats.videos_watched.toString(), color: 'text-blue-500', bg: 'bg-blue-50' },
    { icon: CheckSquare, label: 'Checklist', value: `${stats.checklist_completion}%`, color: 'text-brand-success', bg: 'bg-brand-success/10' },
    { icon: Star, label: 'Nivel', value: `${user?.currentLevel || 1}`, color: 'text-brand-accent', bg: 'bg-brand-accent/10' },
  ];

  if (loading) return null;

  return (
    <div className="p-4 space-y-5">
      {/* Profile header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center text-center"
      >
        <div className="relative mb-3">
          <div className="w-24 h-24 rounded-full bg-brand-primary/10 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User size={36} className="text-brand-primary" />
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-0 right-0 w-8 h-8 bg-brand-primary text-white rounded-full flex items-center justify-center shadow-md hover:bg-brand-primary/90 transition-colors"
          >
            <Camera size={14} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
          />
        </div>
        <h1 className="font-display text-xl font-bold text-brand-on-surface">
          {user?.fullName}
        </h1>
        <p className="text-sm text-brand-accent font-medium">{levelName}</p>
      </motion.div>

      {/* XP progress */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-brand-on-surface">
            Nivel {user?.currentLevel}
          </span>
          <span className="text-sm text-brand-muted">
            {xpToNextLevel > 0 ? `${xpToNextLevel} XP restantes` : 'Max!'}
          </span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-brand-primary to-brand-accent rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressToNextLevel}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </motion.div>

      {/* Stats grid */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-3 gap-2"
      >
        {STATS_CARDS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card text-center py-3">
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-1.5', stat.bg)}>
                <Icon size={16} className={stat.color} />
              </div>
              <p className="font-display font-bold text-sm text-brand-on-surface">
                {stat.value}
              </p>
              <p className="text-[10px] text-brand-muted">{stat.label}</p>
            </div>
          );
        })}
      </motion.div>

      {/* Settings */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-1"
      >
        <h2 className="font-display font-bold text-sm text-brand-muted uppercase tracking-wider mb-2">
          Configuracoes
        </h2>

        {/* Notifications toggle */}
        <button
          onClick={toggleNotifications}
          className="card w-full flex items-center gap-3"
        >
          <div className={cn(
            'w-9 h-9 rounded-xl flex items-center justify-center',
            notificationsEnabled ? 'bg-brand-primary/10 text-brand-primary' : 'bg-gray-100 text-brand-muted'
          )}>
            {notificationsEnabled ? <Bell size={18} /> : <BellOff size={18} />}
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-brand-on-surface">Notificacoes</p>
            <p className="text-xs text-brand-muted">
              {notificationsEnabled ? 'Ativadas' : 'Desativadas'}
            </p>
          </div>
          <div className={cn(
            'w-11 h-6 rounded-full transition-colors relative',
            notificationsEnabled ? 'bg-brand-primary' : 'bg-gray-300'
          )}>
            <div className={cn(
              'w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm',
              notificationsEnabled ? 'right-0.5' : 'left-0.5'
            )} />
          </div>
        </button>

        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="card w-full flex items-center gap-3"
        >
          <div className={cn(
            'w-9 h-9 rounded-xl flex items-center justify-center',
            darkMode ? 'bg-brand-secondary text-brand-accent' : 'bg-gray-100 text-brand-muted'
          )}>
            {darkMode ? <Moon size={18} /> : <Sun size={18} />}
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-brand-on-surface">Tema escuro</p>
            <p className="text-xs text-brand-muted">
              {darkMode ? 'Ativado' : 'Desativado'}
            </p>
          </div>
          <div className={cn(
            'w-11 h-6 rounded-full transition-colors relative',
            darkMode ? 'bg-brand-secondary' : 'bg-gray-300'
          )}>
            <div className={cn(
              'w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm',
              darkMode ? 'right-0.5' : 'left-0.5'
            )} />
          </div>
        </button>

        {/* Install PWA */}
        {deferredPrompt && (
          <button
            onClick={handleInstallPWA}
            className="card w-full flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-brand-success/10 text-brand-success">
              <Download size={18} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-brand-on-surface">Instalar App</p>
              <p className="text-xs text-brand-muted">Acesso rapido pela tela inicial</p>
            </div>
            <ChevronRight size={18} className="text-brand-muted" />
          </button>
        )}

        {/* Sign out */}
        <button
          onClick={signOut}
          className="card w-full flex items-center gap-3 mt-4"
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-brand-error/10 text-brand-error">
            <LogOut size={18} />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-brand-error">Sair da conta</p>
          </div>
        </button>
      </motion.div>
    </div>
  );
}
