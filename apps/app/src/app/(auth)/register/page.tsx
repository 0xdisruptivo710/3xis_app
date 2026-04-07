'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { Loader2, UserPlus, KeyRound, Store } from 'lucide-react';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const inviteToken = searchParams.get('token');
  const accessCode = searchParams.get('code');

  const [mode, setMode] = useState<'invite' | 'code'>(inviteToken ? 'invite' : 'code');
  const [loading, setLoading] = useState(false);
  const [checkingInvite, setCheckingInvite] = useState(!!inviteToken);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [codeInput, setCodeInput] = useState(accessCode ?? '');

  // Invite data
  const [inviteData, setInviteData] = useState<{
    email: string;
    role: string;
    store_id: string;
    store_name: string;
  } | null>(null);

  // Check invite token on load
  useEffect(() => {
    if (!inviteToken) return;

    async function checkInvite() {
      setCheckingInvite(true);

      const { data } = await supabase
        .from('x3_invitations')
        .select('id, email, role, store_id, status, expires_at, x3_stores(name)')
        .eq('token', inviteToken!)
        .maybeSingle();

      if (!data) {
        setMessage({ type: 'error', text: 'Convite nao encontrado.' });
      } else if (data.status !== 'pending') {
        setMessage({ type: 'error', text: 'Este convite ja foi utilizado ou revogado.' });
      } else if (new Date(data.expires_at) < new Date()) {
        setMessage({ type: 'error', text: 'Este convite expirou. Solicite um novo ao seu gestor.' });
      } else {
        setInviteData({
          email: data.email,
          role: data.role,
          store_id: data.store_id,
          store_name: (data.x3_stores as unknown as { name: string })?.name ?? 'Loja',
        });
        setEmail(data.email);
        setMode('invite');
      }

      setCheckingInvite(false);
    }

    checkInvite();
  }, [inviteToken, supabase]);

  async function handleRegisterWithInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteData || !fullName.trim() || !password) return;
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas nao coincidem.' });
      return;
    }
    if (password.length < 6) {
      setMessage({ type: 'error', text: 'A senha deve ter no minimo 6 caracteres.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: inviteData.email,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
        },
      },
    });

    if (authError || !authData.user) {
      setMessage({ type: 'error', text: authError?.message ?? 'Erro ao criar conta.' });
      setLoading(false);
      return;
    }

    // 2. Update profile with store and role
    await supabase.from('x3_profiles').update({
      full_name: fullName.trim(),
      role: inviteData.role,
      store_id: inviteData.store_id,
    }).eq('id', authData.user.id);

    // 3. Mark invitation as accepted
    await supabase.from('x3_invitations').update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
    }).eq('token', inviteToken!);

    setMessage({ type: 'success', text: 'Conta criada! Redirecionando...' });
    setTimeout(() => {
      router.push('/onboarding');
      router.refresh();
    }, 1000);
  }

  async function handleRegisterWithCode(e: React.FormEvent) {
    e.preventDefault();
    if (!codeInput.trim() || !fullName.trim() || !email.trim() || !password) return;
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas nao coincidem.' });
      return;
    }
    if (password.length < 6) {
      setMessage({ type: 'error', text: 'A senha deve ter no minimo 6 caracteres.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    // 1. Validate access code
    const { data: codeData } = await supabase
      .from('x3_access_codes')
      .select('id, store_id, plan_type, max_uses, used_count, is_active, expires_at')
      .eq('code', codeInput.trim().toUpperCase())
      .maybeSingle();

    if (!codeData) {
      setMessage({ type: 'error', text: 'Codigo de acesso invalido.' });
      setLoading(false);
      return;
    }

    if (!codeData.is_active) {
      setMessage({ type: 'error', text: 'Este codigo foi desativado.' });
      setLoading(false);
      return;
    }

    if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
      setMessage({ type: 'error', text: 'Este codigo expirou.' });
      setLoading(false);
      return;
    }

    if (codeData.used_count >= codeData.max_uses) {
      setMessage({ type: 'error', text: 'Este codigo ja atingiu o limite de usos.' });
      setLoading(false);
      return;
    }

    // 2. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
        },
      },
    });

    if (authError || !authData.user) {
      setMessage({ type: 'error', text: authError?.message ?? 'Erro ao criar conta.' });
      setLoading(false);
      return;
    }

    // 3. Update profile with store and admin role
    await supabase.from('x3_profiles').update({
      full_name: fullName.trim(),
      role: 'admin',
      store_id: codeData.store_id,
    }).eq('id', authData.user.id);

    // 4. Increment code usage
    await supabase.from('x3_access_codes').update({
      used_count: codeData.used_count + 1,
    }).eq('id', codeData.id);

    // 5. Create/update store license
    if (codeData.store_id) {
      await supabase.from('x3_store_licenses').insert({
        store_id: codeData.store_id,
        plan_type: codeData.plan_type,
        max_users: codeData.plan_type === 'enterprise' ? 9999 : codeData.plan_type === 'pro' ? 30 : 10,
      });
    }

    setMessage({ type: 'success', text: 'Conta criada! Redirecionando...' });
    setTimeout(() => {
      router.push('/onboarding');
      router.refresh();
    }, 1000);
  }

  if (checkingInvite) {
    return (
      <div className="text-center space-y-4">
        <Loader2 size={32} className="animate-spin text-brand-primary mx-auto" />
        <p className="text-gray-400 text-sm">Verificando convite...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Logo */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-primary rounded-2xl mb-4">
          <span className="text-white font-display text-3xl font-bold">3X</span>
        </div>
        <h1 className="text-white font-display text-2xl font-bold">Criar sua conta</h1>
        <p className="text-gray-400 text-sm">
          {mode === 'invite' && inviteData
            ? `Voce foi convidado para a ${inviteData.store_name}`
            : 'Insira seu codigo de acesso para comecar'}
        </p>
      </div>

      {/* Mode toggle (only if no invite token) */}
      {!inviteToken && (
        <div className="flex gap-1 bg-white/10 rounded-lg p-1">
          <button
            onClick={() => setMode('code')}
            className={`flex-1 py-2 text-sm rounded-md transition-colors flex items-center justify-center gap-2 ${
              mode === 'code' ? 'bg-brand-primary text-white' : 'text-gray-400'
            }`}
          >
            <KeyRound size={14} />
            Codigo de Acesso
          </button>
          <button
            onClick={() => setMode('invite')}
            className={`flex-1 py-2 text-sm rounded-md transition-colors flex items-center justify-center gap-2 ${
              mode === 'invite' ? 'bg-brand-primary text-white' : 'text-gray-400'
            }`}
          >
            <UserPlus size={14} />
            Convite
          </button>
        </div>
      )}

      {/* Invite info card */}
      {mode === 'invite' && inviteData && (
        <div className="bg-white/10 rounded-xl p-4 space-y-1">
          <div className="flex items-center gap-2 text-brand-primary">
            <Store size={16} />
            <span className="font-medium text-sm">{inviteData.store_name}</span>
          </div>
          <p className="text-xs text-gray-400">
            Cargo: {inviteData.role === 'sdr' ? 'SDR' : inviteData.role === 'supervisor' ? 'Supervisora' : 'Admin'}
          </p>
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={mode === 'invite' && inviteData ? handleRegisterWithInvite : handleRegisterWithCode}
        className="space-y-4"
      >
        {/* Access code (only for code mode) */}
        {mode === 'code' && (
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Codigo de Acesso</label>
            <input
              type="text"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
              placeholder="Ex: 3X-ABCD-1234"
              required
              className="input-field bg-white/10 border-white/20 text-white placeholder:text-gray-500
                         focus:border-brand-primary focus:ring-brand-primary/20 font-mono text-center tracking-widest"
            />
          </div>
        )}

        <div>
          <label className="block text-sm text-gray-300 mb-1.5">Nome completo</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Seu nome completo"
            required
            className="input-field bg-white/10 border-white/20 text-white placeholder:text-gray-500
                       focus:border-brand-primary focus:ring-brand-primary/20"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
            disabled={mode === 'invite' && !!inviteData}
            className="input-field bg-white/10 border-white/20 text-white placeholder:text-gray-500
                       focus:border-brand-primary focus:ring-brand-primary/20
                       disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1.5">Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimo 6 caracteres"
            required
            className="input-field bg-white/10 border-white/20 text-white placeholder:text-gray-500
                       focus:border-brand-primary focus:ring-brand-primary/20"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1.5">Confirmar senha</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repita a senha"
            required
            className="input-field bg-white/10 border-white/20 text-white placeholder:text-gray-500
                       focus:border-brand-primary focus:ring-brand-primary/20"
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <UserPlus size={16} />
          )}
          {loading ? 'Criando conta...' : 'Criar minha conta'}
        </button>
      </form>

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

      {/* Login link */}
      <div className="text-center">
        <Link href="/login" className="text-sm text-brand-primary hover:underline">
          Ja tem uma conta? Entrar
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="text-center">
        <Loader2 size={32} className="animate-spin text-brand-primary mx-auto" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
