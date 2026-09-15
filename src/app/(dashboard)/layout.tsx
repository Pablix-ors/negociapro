'use client';

import React from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { DataProvider } from '@/context/DataContext';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import MobileNavigation from '@/components/layout/MobileNavigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <DataProvider>
        <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
          {/* Sidebar Desktop */}
          <Sidebar />

          {/* Área Principal de Conteúdo */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <Topbar />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
              {children}
            </main>
          </div>

          {/* Navegação Mobile Inferior */}
          <MobileNavigation />
        </div>
      </DataProvider>
    </AuthProvider>
  );
}
