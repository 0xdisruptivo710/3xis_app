'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart3, Trophy, MessageSquare, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  onMenuClick: () => void;
}

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/sales', label: 'Vendas', icon: BarChart3 },
  { href: '/game', label: 'Game', icon: Trophy },
  { href: '/scripts', label: 'Scripts', icon: MessageSquare },
];

export function BottomNav({ onMenuClick }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-30 safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] px-3 py-1 rounded-xl transition-colors',
                isActive
                  ? 'text-brand-primary'
                  : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className={cn('text-[10px]', isActive ? 'font-semibold' : 'font-medium')}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* More menu button */}
        <button
          onClick={onMenuClick}
          className="flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] px-3 py-1 rounded-xl text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Menu size={22} />
          <span className="text-[10px] font-medium">Mais</span>
        </button>
      </div>
    </nav>
  );
}
