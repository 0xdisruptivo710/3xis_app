'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  FileText,
  Video,
  CheckSquare,
  Sunrise,
  Target,
  BarChart3,
  ChevronDown,
  ChevronRight,
  LogOut,
  Menu,
  X,
  ShieldCheck,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  children?: { label: string; href: string; icon: React.ReactNode }[];
}

const navigation: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard size={20} />,
  },
  {
    label: 'Usuarios',
    href: '/users',
    icon: <Users size={20} />,
  },
  {
    label: 'Conteudo',
    href: '/content',
    icon: <FileText size={20} />,
    children: [
      { label: 'Scripts', href: '/content/scripts', icon: <FileText size={18} /> },
      { label: 'Videos', href: '/content/videos', icon: <Video size={18} /> },
      { label: 'Checklist', href: '/content/checklist', icon: <CheckSquare size={18} /> },
      { label: 'Rituais', href: '/content/rituals', icon: <Sunrise size={18} /> },
    ],
  },
  {
    label: 'Metas',
    href: '/goals',
    icon: <Target size={20} />,
  },
  {
    label: 'Relatorios',
    href: '/reports',
    icon: <BarChart3 size={20} />,
  },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [expandedItems, setExpandedItems] = useState<string[]>(['/content']);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from('x3_profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (active && profile?.role === 'super_admin') {
        setIsSuperAdmin(true);
      }
    }
    loadRole();
    return () => {
      active = false;
    };
  }, [supabase]);

  function toggleExpanded(href: string) {
    setExpandedItems((prev) =>
      prev.includes(href)
        ? prev.filter((h) => h !== href)
        : [...prev, href]
    );
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/');
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-display text-lg font-bold">3X</span>
          </div>
          <div>
            <h1 className="text-white font-display text-lg font-bold">3X Admin</h1>
            <p className="text-gray-400 text-xs">Painel de Gestao</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {isSuperAdmin && (
          <Link
            href="/platform"
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors mb-2',
              isActive('/platform')
                ? 'bg-brand-primary text-white'
                : 'bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20'
            )}
          >
            <ShieldCheck size={20} />
            Plataforma
          </Link>
        )}
        {navigation.map((item) => {
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedItems.includes(item.href);
          const active = isActive(item.href);

          return (
            <div key={item.href}>
              {hasChildren ? (
                <button
                  onClick={() => toggleExpanded(item.href)}
                  className={cn(
                    'w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                    active
                      ? 'bg-brand-primary/10 text-brand-primary'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <span className="flex items-center gap-3">
                    {item.icon}
                    {item.label}
                  </span>
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
              ) : (
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                    active
                      ? 'bg-brand-primary/10 text-brand-primary'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  )}
                >
                  {item.icon}
                  {item.label}
                </Link>
              )}

              {/* Children */}
              {hasChildren && isExpanded && (
                <div className="ml-4 mt-1 space-y-1">
                  {item.children!.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={onNavigate}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                        isActive(child.href)
                          ? 'bg-brand-primary/10 text-brand-primary'
                          : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      )}
                    >
                      {child.icon}
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400
                     hover:bg-white/5 hover:text-white transition-colors w-full"
        >
          <LogOut size={20} />
          Sair
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-brand-surface flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-brand-secondary">
        <SidebarContent />
      </aside>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-64 bg-brand-secondary z-50">
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <SidebarContent onNavigate={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:pl-64">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="text-brand-on-surface"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-display text-sm font-bold">3X</span>
            </div>
            <span className="font-display font-bold text-brand-on-surface">Admin</span>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
