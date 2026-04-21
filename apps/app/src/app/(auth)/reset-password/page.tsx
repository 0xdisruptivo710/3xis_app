'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { KeyRound, Loader2, CheckCircle2 } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let active = true;
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      if (!user) {
        setMessage({
          type: 'error',
          text: 'Link invalido ou expirado. Solicite um novo link de recuperacao.',
        });
      } else {
        setHasSession(true);
      }
      setChecking(false);
    }
    check();
    return () => {
      active = false;
    };
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (password.length < 6) {
      setMessage({ type: 'error', text: 'A senha deve ter no minimo 6 caracteres.' });
      return;
    }
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas nao coincidem.' });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setMessage({ type: 'error', text: 'Erro ao atualizar senha. Tente novamente.' });
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      router.push('/dashboard');
      router.refresh();
    }, 1500);
  }

  if (checking) {
    return (
      <div className="text-center space-y-4">
        <Loader2 size={32} className="animate-spin text-brand-primary mx-auto" />
        <p className="text-gray-400 text-sm">Validando link...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-success/20 rounded-2xl">
          <CheckCircle2 size={40} className="text-green-400" />
        </div>
        <h1 className="text-white font-display text-2xl font-bold">Senha atualizada!</h1>
        <p className="text-gray-400 text-sm">Redirecionando para o dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-primary rounded-2xl mb-4">
          <KeyRound size={32} className="text-white" />
        </div>
        <h1 className="text-white font-display text-2xl font-bold">Nova senha</h1>
        <p className="text-gray-400 text-sm">Defina uma nova senha para sua conta</p>
      </div>

      {hasSession ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm text-gray-300 mb-1.5">
              Nova senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimo 6 caracteres"
              required
              minLength={6}
              className="input-field bg-white/10 border-white/20 text-white placeholder:text-gray-500
                         focus:border-brand-primary focus:ring-brand-primary/20"
            />
          </div>

          <div>
            <label htmlFor="confirm" className="block text-sm text-gray-300 mb-1.5">
              Confirmar senha
            </label>
            <input
              id="confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a senha"
              required
              minLength={6}
              className="input-field bg-white/10 border-white/20 text-white placeholder:text-gray-500
                         focus:border-brand-primary focus:ring-brand-primary/20"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
            {loading ? 'Salvando...' : 'Salvar nova senha'}
          </button>
        </form>
      ) : (
        <div className="text-center">
          <Link href="/forgot-password" className="btn-primary inline-flex items-center gap-2">
            Solicitar novo link
          </Link>
        </div>
      )}

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
