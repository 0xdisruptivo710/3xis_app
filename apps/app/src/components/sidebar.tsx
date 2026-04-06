'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, StickyNote, CalendarDays, CheckSquare, Sunrise,
  Video, Trophy, User, LogOut, ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const sidebarLinks = [
  { href: '/notes', label: 'Notas', icon: StickyNote },
  { href: '/calendar', label: 'Calendario', icon: CalendarDays },
  { href: '/checklist', label: 'Checklist', icon: CheckSquare },
  { href: '/rituals', label: 'Rituais', icon: Sunrise },
  { href: '/videos', label: 'Videoaulas', icon: Video },
  { href: '/leaderboard', label: 'Ranking', icon: Trophy },
  { href: '/profile', label: 'Perfil', icon: User },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { levelName } = useProfile();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* Sidebar panel */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 w-[280px] bg-brand-secondary z-50 flex flex-col safe-bottom"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center">
                  <span className="text-white font-display font-bold text-sm">
                    {user?.fullName?.charAt(0) ?? '?'}
                  </span>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm truncate max-w-[160px]">
                    {user?.fullName ?? 'SDR'}
                  </p>
                  <p className="text-brand-accent text-xs">{levelName}</p>
                </div>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
                <X size={20} />
              </button>
            </div>

            {/* Links */}
            <nav className="flex-1 overflow-y-auto py-2">
              {sidebarLinks.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-colors',
                      isActive
                        ? 'bg-brand-primary/20 text-brand-primary'
                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    <Icon size={20} />
                    <span className="text-sm font-medium">{link.label}</span>
                    <ChevronRight size={16} className="ml-auto opacity-50" />
                  </Link>
                );
              })}
            </nav>

            {/* Sign out */}
            <div className="p-4 border-t border-white/10">
              <button
                onClick={() => { signOut(); onClose(); }}
                className="flex items-center gap-3 text-gray-400 hover:text-red-400 transition-colors w-full px-2 py-2"
              >
                <LogOut size={20} />
                <span className="text-sm">Sair da conta</span>
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
