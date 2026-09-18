'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMaster } from '@/context/MasterAuthContext';
import {
  LayoutDashboard,
  Building2,
  Users,
  History,
  Settings,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface MasterSidebarProps {
  onCloseMobile?: () => void;
}

export default function MasterSidebar({ onCloseMobile }: MasterSidebarProps) {
  const pathname = usePathname();
  const { masterUser, logoutMaster, isPrimaryMaster } = useMaster();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/master/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Estabelecimentos',
      href: '/master/estabelecimentos',
      icon: Building2,
    },
    {
      name: 'Demonstração',
      href: '/demonstracao',
      icon: Sparkles,
      badge: 'Demo',
    },
    {
      name: 'Usuários Master',
      href: '/master/usuarios',
      icon: Users,
      badge: isPrimaryMaster ? 'Primary' : undefined,
    },
    {
      name: 'Auditoria Global',
      href: '/master/auditoria',
      icon: History,
    },
    {
      name: 'Configurações',
      href: '/master/configuracoes',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full shrink-0">
      {/* Header Logo Master */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <Link href="/master/dashboard" className="flex items-center space-x-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-black text-white text-base tracking-tight">Negocia</span>
              <span className="font-black text-amber-400 text-base tracking-tight">Master</span>
            </div>
            <span className="text-[10px] text-amber-400/80 font-bold tracking-wider uppercase block -mt-1">
              Plataforma Global
            </span>
          </div>
        </Link>
      </div>

      {/* Perfil Rápido do Master */}
      <div className="px-4 py-3 m-3 bg-slate-800/60 border border-slate-700/60 rounded-2xl flex items-center space-x-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xs border border-amber-500/30">
          {masterUser?.name?.substring(0, 2).toUpperCase() || 'MA'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-white truncate">{masterUser?.name || 'Master User'}</p>
          <div className="flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-amber-400 font-bold uppercase truncate">
              {masterUser?.is_primary_master ? 'Primary Master' : 'Master Admin'}
            </span>
          </div>
        </div>
      </div>

      {/* Menu de Navegação */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onCloseMobile}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-xs'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-400 text-slate-950 uppercase">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer com Logout Master */}
      <div className="p-3 border-t border-slate-800 space-y-2">
        <Link
          href="/dashboard"
          className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/40 transition-colors"
        >
          <span>Ir para o NegociaPro</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>

        <button
          type="button"
          onClick={() => {
            logoutMaster();
            window.location.href = '/master/login';
          }}
          className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair da Sessão Master</span>
        </button>
      </div>
    </aside>
  );
}
