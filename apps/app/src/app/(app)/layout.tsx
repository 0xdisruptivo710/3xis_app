'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { BottomNav } from '@/components/bottom-nav';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-brand-surface">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="pb-20 min-h-dvh">
        {children}
      </main>

      <BottomNav onMenuClick={() => setSidebarOpen(true)} />
    </div>
  );
}
