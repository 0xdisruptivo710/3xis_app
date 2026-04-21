'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Mail, Loader2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/api/v1/auth/callback?next=/reset-password`,
    });

    if (error) {
      setMessage({ type: 'error', text: 'Nao foi possivel enviar o email. Tente novamente.' });
    } else {
      setMessage({
        type: 'success',
        text: 'Se este email estiver cadastrado, voce recebera um link para redefinir sua senha.',
      });
    }
    setLoading(false);
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-primary rounded-2xl mb-4">
          <Mail size={32} className="text-white" />
        </div>
        <h1 className="text-white font-display text-2xl font-bold">Esqueceu a senha?</h1>
        <p className="text-gray-400 text-sm">
          Digite seu email e enviaremos um link para criar uma nova senha
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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

        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
          {loading ? 'Enviando...' : 'Enviar link de recuperacao'}
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

      <div className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-brand-primary hover:underline"
        >
          <ArrowLeft size={14} />
          Voltar para o login
        </Link>
      </div>
    </div>
  );
}
