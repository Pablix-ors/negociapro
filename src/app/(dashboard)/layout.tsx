'use client';

import React from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { DataProvider } from '@/context/DataContext';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import MobileNavigation from '@/components/layout/MobileNavigation';
import MasterModeBanner from '@/components/master/MasterModeBanner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <DataProvider>
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
      </DataProvider>
    </AuthProvider>
  );
}
