'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  Award,
  DollarSign,
  BarChart3,
  Sliders,
  MoreHorizontal,
  X,
  Building2,
  UserCheck,
} from 'lucide-react';

const primaryMobileNav = [
  { name: 'Início', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Vendas', href: '/vendas', icon: ShoppingCart },
  { name: 'Clientes', href: '/clientes', icon: Users },
  { name: 'Produtos', href: '/produtos', icon: Package },
];

export default function MobileNavigation() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      {/* Menu 'Mais' em Drawer Bottom para Telas Pequenas */}
      {moreOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex flex-col justify-end"
          onClick={() => setMoreOpen(false)}
        >
          <div
            className="bg-white rounded-t-3xl p-5 border-t border-slate-200 shadow-2xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Menu do Aplicativo
              </span>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
                aria-label="Fechar menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 py-4">
              <Link
                href="/profissionais"
                onClick={() => setMoreOpen(false)}
                className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 transition-all text-center group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                  <Award className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800">Profissionais</span>
                <span className="text-[10px] text-slate-400">Equipe & Vendedores</span>
              </Link>

              <Link
                href="/financeiro"
                onClick={() => setMoreOpen(false)}
                className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-slate-50 hover:bg-emerald-50 border border-slate-200/80 transition-all text-center group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                  <DollarSign className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800">Financeiro</span>
                <span className="text-[10px] text-slate-400">Fluxo & Comissões</span>
              </Link>

              <Link
                href="/relatorios"
                onClick={() => setMoreOpen(false)}
                className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-slate-50 hover:bg-purple-50 border border-slate-200/80 transition-all text-center group"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800">Relatórios</span>
                <span className="text-[10px] text-slate-400">Exportar Excel & CSV</span>
              </Link>

              <Link
                href="/configuracoes/empresa"
                onClick={() => setMoreOpen(false)}
                className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-slate-50 hover:bg-amber-50 border border-slate-200/80 transition-all text-center group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                  <Building2 className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800">Empresa</span>
                <span className="text-[10px] text-slate-400">Dados & Logo</span>
              </Link>

              <Link
                href="/configuracoes/usuarios"
                onClick={() => setMoreOpen(false)}
                className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-slate-50 hover:bg-indigo-50 border border-slate-200/80 transition-all text-center group"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                  <UserCheck className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800">Usuários</span>
                <span className="text-[10px] text-slate-400">Acessos & Senhas</span>
              </Link>

              <Link
                href="/configuracoes/preferencias"
                onClick={() => setMoreOpen(false)}
                className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-all text-center group"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                  <Sliders className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800">Preferências</span>
                <span className="text-[10px] text-slate-400">Moeda & Regras</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Barra de Navegação Inferior Touch-friendly */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
        {primaryMobileNav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all min-w-[56px] min-h-[44px] ${
                isActive ? 'text-blue-600 font-bold scale-105' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600 stroke-[2.5]' : 'text-slate-400'}`} />
              <span className="text-[10px] mt-0.5">{item.name}</span>
            </Link>
          );
        })}

        {/* Botão 'Mais' que abre gaveta com Profissionais, Comissões, Relatórios e Configs */}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all min-w-[56px] min-h-[44px] ${
            moreOpen || ['/profissionais', '/comissoes', '/relatorios', '/configuracoes'].some((p) => pathname.startsWith(p))
              ? 'text-blue-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <MoreHorizontal className="w-5 h-5 text-slate-500" />
          <span className="text-[10px] mt-0.5">Mais</span>
        </button>
      </nav>
    </>
  );
}
