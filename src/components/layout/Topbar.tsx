'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { formatCurrency } from '@/lib/formatters';
import InstallPWAButton from '@/components/pwa/InstallPWAButton';
import {
  Search,
  Plus,
  Bell,
  User,
  LogOut,
  Building2,
  Package,
  Users,
  ShoppingCart,
  Command,
} from 'lucide-react';

export default function Topbar() {
  const router = useRouter();
  const { user, company, logout } = useAuth();
  const {
    customers,
    products,
    sales,
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useData();

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  // Resultados da busca global
  const filteredCustomers = query.trim()
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.document.includes(query) ||
          (c.trade_name && c.trade_name.toLowerCase().includes(query.toLowerCase()))
      ).slice(0, 3)
    : [];

  const filteredProducts = query.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          (p.sku && p.sku.toLowerCase().includes(query.toLowerCase()))
      ).slice(0, 3)
    : [];

  const filteredSales = query.trim()
    ? sales.filter(
        (s) =>
          String(s.sale_number).includes(query) ||
          (s.customer?.name && s.customer.name.toLowerCase().includes(query.toLowerCase()))
      ).slice(0, 3)
    : [];

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        {/* Busca Global (Trigger) */}
        <div className="flex-1 max-w-md">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-2 bg-slate-100/80 hover:bg-slate-200/60 text-slate-500 rounded-xl text-xs border border-slate-200 transition-all cursor-pointer group"
          >
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
              <span>Pesquisar clientes, produtos ou vendas...</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono bg-white border border-slate-300 rounded text-slate-500 shadow-2xs">
              <Command className="w-3 h-3 mr-0.5" /> K
            </kbd>
          </button>
        </div>

        {/* Ações Rápidas do Topo */}
        <div className="flex items-center space-x-3 ml-4">
          <InstallPWAButton variant="topbar" />

          <Link
            href="/vendas/nova"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nova Venda</span>
          </Link>

          {/* Notificações Interativas com Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setNotifDropdownOpen(!notifDropdownOpen);
                setProfileDropdownOpen(false);
              }}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors relative"
              title="Notificações Comerciais"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-blue-600 rounded-full ring-2 ring-white animate-pulse" />
              )}
            </button>

            {/* Dropdown de Notificações */}
            {notifDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-900">Notificações</span>
                    {unreadNotificationsCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black">
                        {unreadNotificationsCount} novas
                      </span>
                    )}
                  </div>
                  {unreadNotificationsCount > 0 && (
                    <button
                      type="button"
                      onClick={() => markAllNotificationsAsRead()}
                      className="text-[10px] font-semibold text-blue-600 hover:text-blue-800"
                    >
                      Marcar todas como lidas
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      Nenhuma notificação no momento.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markNotificationAsRead(n.id);
                          if (n.link) {
                            router.push(n.link);
                            setNotifDropdownOpen(false);
                          }
                        }}
                        className={`p-3 hover:bg-slate-50 cursor-pointer transition-colors flex items-start space-x-3 ${
                          !n.read ? 'bg-blue-50/40' : ''
                        }`}
                      >
                        <div
                          className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                            n.type === 'PRICE_ALERT'
                              ? 'bg-amber-100 text-amber-700'
                              : n.type === 'STOCK_ALERT'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          <Bell className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs ${!n.read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                            {n.title}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                            {n.message}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {n.timestamp}
                          </span>
                        </div>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Separador */}
          <div className="h-6 w-px bg-slate-200" />

          {/* Perfil do Usuário */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center space-x-3 p-1.5 rounded-xl hover:bg-slate-100 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden md:block">
                <span className="text-xs font-bold text-slate-800 block leading-tight">
                  {user?.name || 'Carlos Vendedor'}
                </span>
                <span className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider block">
                  {user?.role || 'ADMIN'}
                </span>
              </div>
            </button>

            {/* Dropdown Menu */}
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">{company?.trade_name || company?.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                </div>
                <div className="py-1">
                  <Link
                    href="/configuracoes/empresa"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center space-x-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-blue-600"
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Dados da Empresa</span>
                  </Link>
                  <Link
                    href="/configuracoes/usuarios"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center space-x-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-blue-600"
                  >
                    <User className="w-4 h-4" />
                    <span>Meu Perfil</span>
                  </Link>
                </div>
                <div className="border-t border-slate-100 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      router.push('/login');
                    }}
                    className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs text-red-600 hover:bg-red-50 text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sair da conta</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Modal de Pesquisa Global Instantânea */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-3 border-b border-slate-200 flex items-center space-x-3 bg-slate-50">
              <Search className="w-5 h-5 text-blue-600" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Digite o nome de um cliente, produto ou número de venda..."
                className="w-full bg-transparent text-sm focus:outline-hidden text-slate-800 placeholder:text-slate-400 font-medium"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="text-xs px-2 py-1 bg-slate-200 text-slate-700 rounded-md font-bold"
              >
                ESC
              </button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4">
              {!query.trim() ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Comece a digitar para encontrar instantaneamente clientes, produtos e vendas.
                </div>
              ) : (
                <>
                  {/* Clientes */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Clientes ({filteredCustomers.length})
                    </span>
                    {filteredCustomers.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Nenhum cliente encontrado.</p>
                    ) : (
                      <div className="space-y-1">
                        {filteredCustomers.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => {
                              router.push(`/clientes/${c.id}`);
                              setSearchOpen(false);
                            }}
                            className="p-2.5 rounded-xl hover:bg-blue-50/60 cursor-pointer flex items-center justify-between border border-transparent hover:border-blue-100 transition-colors"
                          >
                            <div className="flex items-center space-x-2.5">
                              <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                                <Users className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-800">{c.name}</p>
                                <p className="text-[11px] text-slate-500">{c.document} • {c.city}/{c.state}</p>
                              </div>
                            </div>
                            <span className="text-[11px] font-semibold text-blue-600">Abrir</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Produtos */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Produtos ({filteredProducts.length})
                    </span>
                    {filteredProducts.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Nenhum produto encontrado.</p>
                    ) : (
                      <div className="space-y-1">
                        {filteredProducts.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => {
                              router.push(`/produtos`);
                              setSearchOpen(false);
                            }}
                            className="p-2.5 rounded-xl hover:bg-blue-50/60 cursor-pointer flex items-center justify-between border border-transparent hover:border-blue-100 transition-colors"
                          >
                            <div className="flex items-center space-x-2.5">
                              <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                                <Package className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-800">{p.name}</p>
                                <p className="text-[11px] text-slate-500">SKU: {p.sku || '-'} • Estoque: {p.current_stock} {p.unit}</p>
                              </div>
                            </div>
                            <span className="text-xs font-black text-slate-900">{formatCurrency(p.selling_price)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Vendas */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Vendas ({filteredSales.length})
                    </span>
                    {filteredSales.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Nenhuma venda encontrada.</p>
                    ) : (
                      <div className="space-y-1">
                        {filteredSales.map((s) => (
                          <div
                            key={s.id}
                            onClick={() => {
                              router.push(`/vendas`);
                              setSearchOpen(false);
                            }}
                            className="p-2.5 rounded-xl hover:bg-blue-50/60 cursor-pointer flex items-center justify-between border border-transparent hover:border-blue-100 transition-colors"
                          >
                            <div className="flex items-center space-x-2.5">
                              <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                                <ShoppingCart className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-800">Venda #{s.sale_number}</p>
                                <p className="text-[11px] text-slate-500">Cliente: {s.customer?.name}</p>
                              </div>
                            </div>
                            <span className="text-xs font-black text-emerald-700">{formatCurrency(s.total)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
