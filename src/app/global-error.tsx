'use client';

import React, { useEffect } from 'react';
import { AlertCircle, RefreshCw, Home, LogIn } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GlobalError] Erro fatal interceptado no nível raiz:', error);
  }, [error]);

  const handleClearCacheAndReload = () => {
    if (typeof window !== 'undefined') {
      try {
        // Limpar possíveis dados corrompidos de cache sem perder a credencial se possível
        sessionStorage.clear();
      } catch {}
      window.location.href = '/login';
    } else {
      reset();
    }
  };

  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 font-sans antialiased">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>

          <div>
            <h1 className="text-xl font-black text-white tracking-tight">
              Ops! Erro ao carregar a página
            </h1>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Ocorreu uma instabilidade no carregamento dos scripts ou na sincronização da sua sessão.
            </p>
            {error?.message && (
              <div className="mt-3 p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 text-left">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Detalhes do erro:
                </span>
                <p className="text-xs font-mono text-rose-300 break-all">
                  {error.message}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.reload();
                } else {
                  reset();
                }
              }}
              className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/30 flex items-center justify-center space-x-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Recarregar</span>
            </button>
            <button
              type="button"
              onClick={handleClearCacheAndReload}
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Ir para Login</span>
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
