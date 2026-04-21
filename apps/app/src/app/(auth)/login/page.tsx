'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Send, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'password' | 'magic_link'>('password');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleResendAccess() {
    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Digite seu email primeiro para reenviar o acesso.' });
      return;
    }
    setResending(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/api/v1/auth/callback`,
      },
    });

    if (error) {
      setMessage({
        type: 'error',
        text: 'Nao foi possivel reenviar o acesso. Confira o email digitado.',
      });
    } else {
      setMessage({
        type: 'success',
        text: 'Se este email tiver acesso, voce recebera um link para entrar.',
      });
    }
    setResending(false);
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage({ type: 'error', text: 'Email ou senha incorretos.' });
    } else {
      router.push('/dashboard');
      router.refresh();
    }
    setLoading(false);
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/v1/auth/callback`,
      },
    });

    if (error) {
      setMessage({ type: 'error', text: 'Erro ao enviar link. Tente novamente.' });
    } else {
      setMessage({ type: 'success', text: 'Link enviado! Verifique seu email.' });
    }
    setLoading(false);
  }

  return (
    <div className="space-y-8">
      {/* Logo */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-primary rounded-2xl mb-4">
          <span className="text-white font-display text-3xl font-bold">3X</span>
        </div>
        <h1 className="text-white font-display text-2xl font-bold">Bem-vinda de volta</h1>
        <p className="text-gray-400 text-sm">Entre na sua conta para continuar</p>
      </div>

      {/* Form */}
      <form
        onSubmit={mode === 'password' ? handlePasswordLogin : handleMagicLink}
        className="space-y-4"
      >
        <div>
          <label htmlFor="email" className="block text-sm text-gray-300 mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
            className="input-field bg-white/10 border-white/20 text-white placeholder:text-gray-500
                       focus:border-brand-primary focus:ring-brand-primary/20"
          />
        </div>

        {mode === 'password' && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="block text-sm text-gray-300">
                Senha
              </label>
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
              className="input-field bg-white/10 border-white/20 text-white placeholder:text-gray-500
                         focus:border-brand-primary focus:ring-brand-primary/20"
            />
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading
            ? 'Aguarde...'
            : mode === 'password'
            ? 'Entrar'
            : 'Enviar link mágico'}
        </button>
      </form>

      {/* Toggle mode */}
      <div className="text-center space-y-3">
        <button
          type="button"
          onClick={() => {
            setMode(mode === 'password' ? 'magic_link' : 'password');
            setMessage(null);
          }}
          className="text-sm text-brand-primary hover:underline block w-full"
        >
          {mode === 'password'
            ? 'Entrar com link mágico (sem senha)'
            : 'Entrar com email e senha'}
        </button>

        <button
          type="button"
          onClick={handleResendAccess}
          disabled={resending}
          className="inline-flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-white transition-colors"
        >
          {resending ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Send size={12} />
          )}
          {resending ? 'Reenviando...' : 'Reenviar acesso por email'}
        </button>
      </div>

      {/* Messages */}
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

      {/* Register link */}
      <div className="text-center pt-4 border-t border-white/10">
        <p className="text-gray-500 text-xs mb-2">Ainda nao tem conta?</p>
        <a href="/register" className="text-sm text-brand-primary hover:underline font-medium">
          Criar conta com codigo de acesso
        </a>
      </div>
    </div>
  );
}
