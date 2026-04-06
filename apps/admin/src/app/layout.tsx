import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '3X Admin — Painel de Gestao',
  description: 'Painel administrativo da plataforma 3X para gestao de SDRs',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1A1A2E',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="font-body antialiased">
        {children}
      </body>
    </html>
  );
}
