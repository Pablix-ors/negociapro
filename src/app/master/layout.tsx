'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useMaster } from '@/context/MasterAuthContext';
import MasterSidebar from '@/components/master/MasterSidebar';
import { ShieldCheck, Menu, X, LogOut } from 'lucide-react';

export default function MasterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { masterUser, isAuthenticated, isLoading, logoutMaster } = useMaster();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Proteger todas as rotas internas de /master exceto /master/login
  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname !== '/master/login') {
      router.push('/master/login');
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  if (pathname === '/master/login') {
    return <>{children}</>;
  }

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-amber-400">Validando credenciais Master...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar Desktop */}
      <div className="hidden lg:block h-full">
        <MasterSidebar />
      </div>

      {/* Sidebar Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-64 h-full">
            <MasterSidebar onCloseMobile={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar Master */}
        <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2">
              <span className="hidden sm:inline-block px-2.5 py-1 rounded-lg text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wider">
                Área Restrita Global
              </span>
              <span className="text-xs text-slate-400 font-medium truncate">
                NegociaPro Multi-Tenant Administration
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-white truncate">{masterUser?.name}</p>
              <p className="text-[10px] text-amber-400 font-medium truncate">{masterUser?.email}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                logoutMaster();
                router.push('/master/login');
              }}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
              title="Sair da Sessão Master"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Viewport Principal com proteção contra overflow horizontal */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 w-full max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
