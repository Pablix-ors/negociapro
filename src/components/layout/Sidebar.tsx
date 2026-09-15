'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  BarChart3,
  Building2,
  UserCheck,
  Sliders,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import InstallPWAButton from '@/components/pwa/InstallPWAButton';

const mainNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Vendas', href: '/vendas', icon: ShoppingCart },
  { name: 'Clientes', href: '/clientes', icon: Users },
  { name: 'Produtos', href: '/produtos', icon: Package },
  { name: 'Relatórios', href: '/relatorios', icon: BarChart3 },
];

const configNavigation = [
  { name: 'Minha Empresa', href: '/configuracoes/empresa', icon: Building2 },
  { name: 'Usuários', href: '/configuracoes/usuarios', icon: UserCheck },
  { name: 'Preferências', href: '/configuracoes/preferencias', icon: Sliders },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 bg-slate-900 text-slate-200 border-r border-slate-800 shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2.5 group" title="Voltar à Página Inicial">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <TrendingUp className="w-5 h-5 text-white stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-black tracking-tight text-white text-lg">Negocia</span>
              <span className="text-blue-400 font-black text-lg">Pro</span>
            </div>
            <span className="text-[10px] text-slate-400 tracking-wider block font-medium">
              SaaS Comercial
            </span>
          </div>
        </Link>
      </div>

      {/* Slogan Banner */}
      <div className="mx-4 my-3 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center space-x-2">
        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <p className="text-[11px] text-slate-300 italic font-medium leading-tight">
          Venda com histórico. Negocie com inteligência.
        </p>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
        <div>
          <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Comercial
          </span>
          <nav className="mt-2 space-y-1">
            {mainNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Configurações
          </span>
          <nav className="mt-2 space-y-1">
            {configNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Botão de Instalar App PWA */}
      <div className="px-4 py-2">
        <InstallPWAButton variant="sidebar" />
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-400 flex items-center justify-between">
        <span>NegociaPro v1.0</span>
        <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-semibold text-[10px]">
          Online
        </span>
      </div>
    </aside>
  );
}
