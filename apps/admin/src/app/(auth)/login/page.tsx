'use client';

import { Suspense, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const unauthorizedError = searchParams.get('error') === 'unauthorized';

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage({ type: 'error', text: 'Email ou senha incorretos.' });
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-primary rounded-2xl mb-4">
          <span className="text-white font-display text-3xl font-bold">3X</span>
        </div>
        <h1 className="text-white font-display text-2xl font-bold">Painel Admin</h1>
        <p className="text-gray-400 text-sm">Acesso restrito a administradores e supervisoras</p>
      </div>

      {unauthorizedError && (
        <div className="bg-brand-error/20 text-red-300 text-sm p-3 rounded-xl text-center">
          Acesso negado. Apenas administradores e supervisoras podem acessar este painel.
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm text-gray-300 mb-1.5">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@3x.com.br"
            required
            className="input-field bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-brand-primary focus:ring-brand-primary/20"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-sm text-gray-300">Senha</label>
            <Link
              href="/forgot-password"
              className="text-xs text-brand-primary hover:underline"
            >
              Esqueci minha senha
            </Link>
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Sua senha"
            required
            className="input-field bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-brand-primary focus:ring-brand-primary/20"
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Aguarde...' : 'Entrar'}
        </button>
      </form>

      {message && (
        <div
          className={`text-center text-sm p-3 rounded-xl ${
            message.type === 'success'
              ? 'bg-brand-success/20 text-green-300'
              : 'bg-brand-error/20 text-red-300'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="text-center text-gray-400">Carregando...</div>
    }>
      <LoginForm />
    </Suspense>
  );
}
