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
  Award,
  DollarSign,
  FileText,
  Receipt,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useMaster } from '@/context/MasterAuthContext';
import { useSidebar } from '@/context/SidebarContext';
import InstallPWAButton from '@/components/pwa/InstallPWAButton';

const commercialNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Vendas', href: '/vendas', icon: ShoppingCart },
  { name: 'Clientes', href: '/clientes', icon: Users },
  { name: 'Produtos', href: '/produtos', icon: Package },
  { name: 'Profissionais', href: '/profissionais', icon: Award, managerOrAdmin: true },
  { name: 'Financeiro', href: '/financeiro', icon: DollarSign, adminOnly: true },
  { name: 'Relatórios', href: '/relatorios', icon: BarChart3 },
];

const configNavigation = [
  { name: 'Minha Empresa', href: '/configuracoes/empresa', icon: Building2, adminOnly: true },
  { name: 'Identidade Visual', href: '/configuracoes/identidade-visual', icon: Sparkles, adminOnly: true },
  { name: 'Comprovantes', href: '/configuracoes/comprovantes', icon: FileText, adminOnly: true },
  { name: 'Usuários', href: '/configuracoes/usuarios', icon: UserCheck, adminOnly: true },
  { name: 'Preferências', href: '/configuracoes/preferencias', icon: Sliders, adminOnly: true },
];

export default function Sidebar() {
  const pathname = usePathname() || '';
  const { user, company } = useAuth();
  const { impersonatedCompany } = useMaster();
  const { isCollapsed, toggleSidebar } = useSidebar();

  const isAdmin = Boolean(impersonatedCompany) || user?.role === 'ADMIN';
  const isOwnerOrAdmin = isAdmin || user?.role === 'GERENTE';

  const activeCompanyName = impersonatedCompany?.trade_name || impersonatedCompany?.name || company?.trade_name || company?.name || 'Estabelecimento';

  return (
    <aside
      className={`hidden lg:flex lg:flex-col ${
        isCollapsed ? 'w-20' : 'w-60'
      } bg-[#0c1e3d] text-slate-300 border-r border-[#152e59] shrink-0 select-none transition-all duration-300 ease-in-out relative z-40`}
    >
      {/* Brand Header */}
      <div className={`h-20 ${isCollapsed ? 'px-3 justify-center' : 'px-6 justify-between'} flex items-center border-b border-white/5`}>
        <Link href="/" className="flex items-center space-x-3 group" title={isCollapsed ? 'NegociaPro' : undefined}>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-600/30 group-hover:scale-105 transition-transform shrink-0">
            <TrendingUp className="w-5 h-5 text-white stroke-[2.5]" />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden transition-all duration-200">
              <div className="flex items-center space-x-1">
                <span className="font-black text-xl text-white tracking-tight">Negocia</span>
                <span className="font-black text-xl text-blue-400">Pro</span>
              </div>
              <span className="text-[10px] text-blue-200/60 font-semibold tracking-wider block uppercase whitespace-nowrap">
                SaaS Comercial
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Estabelecimento Ativo */}
      <div className={`${isCollapsed ? 'px-2 py-3' : 'px-4 py-3'} border-b border-white/5 bg-white/[0.02]`}>
        <div
          className={`flex items-center ${
            isCollapsed ? 'justify-center p-2' : 'space-x-2.5 px-3 py-2'
          } rounded-xl bg-white/[0.04] border border-white/5`}
          title={isCollapsed ? `Estabelecimento: ${activeCompanyName}` : undefined}
        >
          <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1 overflow-hidden">
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Estabelecimento</span>
              <span className="text-xs font-bold text-white block truncate" title={activeCompanyName}>
                {activeCompanyName}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <div className={`flex-1 overflow-y-auto ${isCollapsed ? 'px-2' : 'px-3.5'} py-4 space-y-6 dark-scrollbar`}>
        {/* Menu Comercial / Principal */}
        <div>
          {!isCollapsed && (
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400/80 block mb-2">
              Menu
            </span>
          )}
          <nav className="space-y-1">
            {commercialNavigation
              .filter((item) => {
                if (item.adminOnly) return isAdmin;
                if ((item as any).managerOrAdmin) return isOwnerOrAdmin;
                return true;
              })
              .map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    title={isCollapsed ? item.name : undefined}
                    className={`flex items-center ${
                      isCollapsed ? 'justify-center px-2 py-3' : 'space-x-3 px-3.5 py-2.5'
                    } rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    {!isCollapsed && <span className="truncate">{item.name}</span>}
                  </Link>
                );
              })}
          </nav>
        </div>

        {/* Menu Configurações */}
        {isAdmin && (
          <div>
            {!isCollapsed && (
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400/80 block mb-2">
                Configurações
              </span>
            )}
            <nav className="space-y-1">
              {configNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    title={isCollapsed ? item.name : undefined}
                    className={`flex items-center ${
                      isCollapsed ? 'justify-center px-2 py-2.5' : 'space-x-3 px-3.5 py-2'
                    } rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    {!isCollapsed && <span className="truncate">{item.name}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Botão de Instalar App PWA */}
      {!isCollapsed && (
        <div className="px-4 py-2 border-t border-white/5">
          <InstallPWAButton variant="sidebar" />
        </div>
      )}



      {/* Footer Info com Status */}
      {!isCollapsed && (
        <div className="px-4 py-3 border-t border-white/5 bg-black/20 text-[11px] text-slate-400 flex items-center justify-between">
          <span className="font-semibold text-slate-400">NegociaPro</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-[10px]">
            Online
          </span>
        </div>
      )}
    </aside>
  );
}
