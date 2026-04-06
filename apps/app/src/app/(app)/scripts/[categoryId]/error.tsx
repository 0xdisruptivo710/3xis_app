'use client';

export default function ScriptCategoryError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
      <div className="w-16 h-16 bg-brand-error/10 rounded-full flex items-center justify-center mb-4">
        <span className="text-brand-error text-2xl">!</span>
      </div>
      <h2 className="font-display text-lg font-bold text-brand-on-surface mb-2">
        Algo deu errado
      </h2>
      <p className="text-brand-muted text-sm mb-6">
        Nao foi possivel carregar os scripts desta categoria.
      </p>
      <button onClick={reset} className="btn-primary">
        Tentar novamente
      </button>
    </div>
  );
}
