'use client';

import React from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { DataProvider } from '@/context/DataContext';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import MobileNavigation from '@/components/layout/MobileNavigation';
import MasterModeBanner from '@/components/master/MasterModeBanner';

import { useAuth } from '@/context/AuthContext';
import { Ban, ShieldAlert, LogOut, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { company, user, isLoading, logout } = useAuth();
  const isMasterSession = typeof window !== 'undefined' && !!localStorage.getItem('negociapro_master_impersonated');
  const isBlocked = (company?.status === 'BLOQUEADO' || company?.status === 'INATIVO');

  // Redirecionar para tela de login se não estiver logado
  React.useEffect(() => {
    if (!isLoading && !user && !isMasterSession) {
      router.replace('/login');
    }
  }, [isLoading, user, isMasterSession, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen bg-slate-950 text-white items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Carregando sistema comercial...</p>
        </div>
      </div>
    );
  }

  if (!user && !isMasterSession) {
    return null;
  }

  // Se a empresa estiver BLOQUEADA e NÃO for uma auditoria direta do Master pelo MasterModeBanner
  if (isBlocked && !isMasterSession) {
    return (
      <div className="flex h-screen bg-slate-950 text-white flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-slate-900 border border-rose-900/60 p-8 rounded-3xl shadow-2xl space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
            <Ban className="w-8 h-8" />
          </div>

          <div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-950 text-rose-400 border border-rose-800">
              Acesso Suspenso
            </span>
            <h2 className="text-xl font-black text-white mt-3 tracking-tight">
              Estabelecimento Bloqueado
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              O acesso ao sistema para a empresa <strong>{company?.name}</strong> foi bloqueado temporariamente pela administração.
            </p>
          </div>

          {company?.blocked_reason && (
            <div className="p-3.5 bg-slate-800/80 rounded-xl text-left border border-slate-700/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Motivo informado:
              </span>
              <p className="text-xs text-slate-200 font-medium">
                {company.blocked_reason}
              </p>
            </div>
          )}

          <div className="pt-2 space-y-2">
            <button
              type="button"
              onClick={() => {
                logout();
                window.location.href = '/login';
              }}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair da Conta</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans flex-col">
      {/* Banner de Modo Master Permanente se estiver acessando o estabelecimento */}
      <MasterModeBanner />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar Desktop */}
        <Sidebar />

        {/* Área Principal de Conteúdo */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 pb-24 lg:pb-8 w-full max-w-full overflow-x-hidden">
            {children}
          </main>
        </div>

        {/* Navegação Mobile Inferior */}
        <MobileNavigation />
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <DataProvider>
        <DashboardContent>{children}</DashboardContent>
      </DataProvider>
    </AuthProvider>
  );
}
