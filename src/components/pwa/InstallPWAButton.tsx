'use client';

import React, { useEffect, useState } from 'react';
import { Download, CheckCircle2, Sparkles, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function InstallPWAButton({
  variant = 'topbar',
}: {
  variant?: 'topbar' | 'hero' | 'sidebar';
}) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showManualGuide, setShowManualGuide] = useState(false);

  useEffect(() => {
    // Verificar se já está instalado standalone
    if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Checar se o script inline já capturou o prompt
    const checkGlobalPrompt = () => {
      if ((window as any).negociaProInstallPrompt) {
        setDeferredPrompt((window as any).negociaProInstallPrompt);
      }
    };

    checkGlobalPrompt();

    const handlePromptReady = () => {
      checkGlobalPrompt();
    };

    window.addEventListener('pwa-prompt-ready', handlePromptReady);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).negociaProInstallPrompt = e;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      (window as any).negociaProInstallPrompt = null;
    });

    return () => {
      window.removeEventListener('pwa-prompt-ready', handlePromptReady);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    const promptEvent = deferredPrompt || (typeof window !== 'undefined' ? (window as any).negociaProInstallPrompt : null);

    if (promptEvent) {
      // Dispara a caixa de diálogo nativa do navegador
      await promptEvent.prompt();
      const choiceResult = await promptEvent.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
      (window as any).negociaProInstallPrompt = null;
    } else {
      setShowManualGuide(true);
    }
  };

  if (isInstalled) {
    return (
      <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">App Instalado</span>
      </span>
    );
  }

  return (
    <>
      {variant === 'topbar' ? (
        <button
          type="button"
          onClick={handleInstallClick}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-95 animate-in fade-in"
          title="Instalar NegociaPro como Aplicativo no computador ou celular"
        >
          <Download className="w-3.5 h-3.5 animate-bounce" />
          <span>Instalar App</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleInstallClick}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 rounded-xl text-xs font-bold transition-all shadow-xs"
        >
          <Smartphone className="w-4 h-4" />
          <span>Instalar Aplicativo (PWA)</span>
        </button>
      )}

      {/* Modal Guia caso o navegador exija clique no ícone da barra de navegação */}
      {showManualGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-5 border border-slate-200 animate-in fade-in">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
              <Download className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-900">Instalar o NegociaPro</h3>
            </div>
            <p className="text-xs text-slate-600 mt-3 leading-relaxed">
              Para instalar este aplicativo no seu computador ou celular:
            </p>
            <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-900 space-y-1.5">
              <p>• <strong>No Chrome / Edge:</strong> Clique no ícone de instalação (computadorzinho ou seta) localizado no final da barra de endereços (ao lado da estrela de favoritos).</p>
              <p>• <strong>No Celular (Chrome):</strong> Toque no menu de 3 pontinhos e escolha <strong>&quot;Instalar aplicativo&quot;</strong> ou <strong>&quot;Adicionar à tela inicial&quot;</strong>.</p>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowManualGuide(false)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
