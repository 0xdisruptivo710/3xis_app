'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Camera, Building2, ChevronRight, Loader2, CheckCircle2, Sparkles,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface Store {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
}

type Step = 'name' | 'avatar' | 'store';

export default function OnboardingPage() {
  const supabase = createClient();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('name');
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);

      // Check if profile already completed
      const { data: profile } = await supabase
        .from('x3_profiles')
        .select('full_name, store_id')
        .eq('id', user.id)
        .single();

      if (profile?.store_id) {
        router.push('/dashboard');
        return;
      }

      if (profile?.full_name && profile.full_name !== 'Nova SDR') {
        setFullName(profile.full_name);
      }

      // Fetch stores
      const { data: storeList } = await supabase
        .from('x3_stores')
        .select('*')
        .order('name');

      setStores(storeList || []);
    }

    init();
  }, []);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setAvatarFile(file);
    setAvatarUrl(URL.createObjectURL(file));
  }

  function goToNext() {
    if (step === 'name' && fullName.trim()) {
      setStep('avatar');
    } else if (step === 'avatar') {
      setStep('store');
    }
  }

  function goToPrev() {
    if (step === 'avatar') setStep('name');
    if (step === 'store') setStep('avatar');
  }

  async function handleComplete() {
    if (!userId || !selectedStoreId || !fullName.trim()) return;
    setLoading(true);

    let finalAvatarUrl = avatarUrl;

    // Upload avatar if selected
    if (avatarFile) {
      setUploading(true);
      const fileExt = avatarFile.name.split('.').pop();
      const filePath = `avatars/${userId}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, { upsert: true });

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        finalAvatarUrl = publicUrl;
      }
      setUploading(false);
    }

    // Update profile
    await supabase
      .from('x3_profiles')
      .update({
        full_name: fullName.trim(),
        avatar_url: finalAvatarUrl,
        store_id: selectedStoreId,
      })
      .eq('id', userId);

    // Create notification preferences
    await supabase
      .from('x3_notification_preferences')
      .upsert({ user_id: userId });

    setLoading(false);
    router.push('/dashboard');
  }

  const steps: Step[] = ['name', 'avatar', 'store'];
  const currentStepIndex = steps.indexOf(step);

  return (
    <div className="min-h-dvh bg-brand-surface flex flex-col">
      {/* Progress */}
      <div className="p-4">
        <div className="flex gap-2">
          {steps.map((s, i) => (
            <div
              key={s}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors',
                i <= currentStepIndex ? 'bg-brand-primary' : 'bg-gray-200'
              )}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-6">
        <AnimatePresence mode="wait">
          {step === 'name' && (
            <motion.div
              key="name"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col"
            >
              <div className="mb-8">
                <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-4">
                  <User size={28} className="text-brand-primary" />
                </div>
                <h1 className="font-display text-2xl font-bold text-brand-on-surface mb-2">
                  Como voce se chama?
                </h1>
                <p className="text-brand-muted">
                  Este sera seu nome no app 3X.
                </p>
              </div>

              <input
                type="text"
                placeholder="Seu nome completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoFocus
                className="input-field w-full text-lg"
              />

              <div className="mt-auto pt-6">
                <button
                  onClick={goToNext}
                  disabled={!fullName.trim()}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  Continuar
                  <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 'avatar' && (
            <motion.div
              key="avatar"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col"
            >
              <div className="mb-8">
                <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-4">
                  <Camera size={28} className="text-brand-primary" />
                </div>
                <h1 className="font-display text-2xl font-bold text-brand-on-surface mb-2">
                  Adicione uma foto
                </h1>
                <p className="text-brand-muted">
                  Opcional. Voce pode alterar depois.
                </p>
              </div>

              <div className="flex flex-col items-center">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg hover:shadow-xl transition-shadow"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <Camera size={28} className="mx-auto text-brand-muted mb-1" />
                      <span className="text-xs text-brand-muted">Escolher foto</span>
                    </div>
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {avatarUrl && (
                  <button
                    onClick={() => { setAvatarUrl(null); setAvatarFile(null); }}
                    className="text-sm text-brand-muted hover:text-brand-error mt-3"
                  >
                    Remover foto
                  </button>
                )}
              </div>

              <div className="mt-auto pt-6 space-y-2">
                <button
                  onClick={goToNext}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {avatarUrl ? 'Continuar' : 'Pular'}
                  <ChevronRight size={18} />
                </button>
                <button
                  onClick={goToPrev}
                  className="btn-ghost w-full"
                >
                  Voltar
                </button>
              </div>
            </motion.div>
          )}

          {step === 'store' && (
            <motion.div
              key="store"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col"
            >
              <div className="mb-6">
                <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-4">
                  <Building2 size={28} className="text-brand-primary" />
                </div>
                <h1 className="font-display text-2xl font-bold text-brand-on-surface mb-2">
                  Selecione sua loja
                </h1>
                <p className="text-brand-muted">
                  Em qual loja voce trabalha?
                </p>
              </div>

              <div className="space-y-2 flex-1 overflow-y-auto">
                {stores.map((store) => (
                  <button
                    key={store.id}
                    onClick={() => setSelectedStoreId(store.id)}
                    className={cn(
                      'card w-full flex items-center gap-3 text-left transition-all',
                      selectedStoreId === store.id
                        ? 'border-brand-primary bg-brand-primary/5'
                        : 'hover:bg-gray-50'
                    )}
                  >
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center',
                      selectedStoreId === store.id
                        ? 'bg-brand-primary text-white'
                        : 'bg-gray-100 text-brand-muted'
                    )}>
                      <Building2 size={18} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-brand-on-surface">{store.name}</p>
                      {(store.city || store.state) && (
                        <p className="text-xs text-brand-muted">
                          {[store.city, store.state].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                    {selectedStoreId === store.id && (
                      <CheckCircle2 size={20} className="text-brand-primary" />
                    )}
                  </button>
                ))}

                {stores.length === 0 && (
                  <p className="text-sm text-brand-muted text-center py-8">
                    Nenhuma loja disponivel. Contate o administrador.
                  </p>
                )}
              </div>

              <div className="pt-6 space-y-2">
                <button
                  onClick={handleComplete}
                  disabled={!selectedStoreId || loading}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      {uploading ? 'Enviando foto...' : 'Salvando...'}
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Comecar!
                    </>
                  )}
                </button>
                <button
                  onClick={goToPrev}
                  disabled={loading}
                  className="btn-ghost w-full"
                >
                  Voltar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
