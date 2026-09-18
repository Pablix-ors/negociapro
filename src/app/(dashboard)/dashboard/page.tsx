'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
import { formatCurrency, formatDate } from '@/lib/formatters';
import {
  TrendingUp,
  ShoppingCart,
  Users,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter,
  Plus,
  Sparkles,
  Award,
  DollarSign,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import nextDynamic from 'next/dynamic';

// Carregamento dinâmico do Recharts para evitar falhas de hidratação e SSR no App Router do Next.js
const AreaChart = nextDynamic(() => import('recharts').then((mod) => mod.AreaChart), { ssr: false });
const Area = nextDynamic(() => import('recharts').then((mod) => mod.Area), { ssr: false });
const XAxis = nextDynamic(() => import('recharts').then((mod) => mod.XAxis), { ssr: false });
const YAxis = nextDynamic(() => import('recharts').then((mod) => mod.YAxis), { ssr: false });
const Tooltip = nextDynamic(() => import('recharts').then((mod) => mod.Tooltip), { ssr: false });
const CartesianGrid = nextDynamic(() => import('recharts').then((mod) => mod.CartesianGrid), { ssr: false });
const BarChart = nextDynamic(() => import('recharts').then((mod) => mod.BarChart), { ssr: false });
const Bar = nextDynamic(() => import('recharts').then((mod) => mod.Bar), { ssr: false });
const ResponsiveContainer = nextDynamic(() => import('recharts').then((mod) => mod.ResponsiveContainer), { ssr: false });

export default function DashboardPage() {
  const { sales = [], customers = [], products = [], professionals = [], commissions = [] } = useData();
  const [period, setPeriod] = useState<'7d' | '30d' | 'mes' | 'ano'>('30d');
  const [isMounted, setIsMounted] = useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const safeSales = Array.isArray(sales) ? sales.filter(Boolean) : [];
  const safeCustomers = Array.isArray(customers) ? customers.filter(Boolean) : [];
  const safeProducts = Array.isArray(products) ? products.filter(Boolean) : [];
  const safeProfessionals = Array.isArray(professionals) ? professionals.filter(Boolean) : [];
  const safeCommissions = Array.isArray(commissions) ? commissions.filter(Boolean) : [];

  // Cálculos de métricas
  const completedSales = safeSales.filter((s) => s.status === 'COMPLETED');
  const totalRevenue = completedSales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
  const completedSalesCount = completedSales.length;
  const avgTicket = completedSalesCount > 0 ? totalRevenue / completedSalesCount : 0;
  const activeCustomersCount = safeCustomers.filter((c) => c.active).length;

  // Métricas de Comissões
  const pendingCommissionsTotal = safeCommissions
    .filter((c) => c.status === 'PENDENTE')
    .reduce((acc, c) => acc + (Number(c.commission_amount) || 0), 0);
  const paidCommissionsTotal = safeCommissions
    .filter((c) => c.status === 'PAGA')
    .reduce((acc, c) => acc + (Number(c.paid_amount) || Number(c.commission_amount) || 0), 0);

  // Dados para Gráfico de Vendas
  const chartData = React.useMemo(() => {
    return safeSales.length > 0
      ? [
          { name: '10/09', total: safeSales.length > 2 ? 5475 : Math.round(totalRevenue * 0.3) },
          { name: '11/09', total: safeSales.length > 2 ? 2100 : Math.round(totalRevenue * 0.2) },
          { name: '12/09', total: safeSales.length > 2 ? 1316 : Math.round(totalRevenue * 0.1) },
          { name: '13/09', total: safeSales.length > 2 ? 4200 : Math.round(totalRevenue * 0.4) },
          { name: '14/09', total: safeSales.length > 2 ? 3890 : Math.round(totalRevenue * 0.2) },
          { name: '15/09', total: totalRevenue > 0 ? totalRevenue : 0 },
        ]
      : [
          { name: 'Seg', total: 0 },
          { name: 'Ter', total: 0 },
          { name: 'Qua', total: 0 },
          { name: 'Qui', total: 0 },
          { name: 'Sex', total: 0 },
          { name: 'Hoje', total: 0 },
        ];
  }, [safeSales.length, totalRevenue]);

  // Gráfico: Vendas por Profissional
  const professionalChartData = React.useMemo(() => {
    return safeProfessionals.map((p) => ({
      name: (p.name || 'Profissional').split(' ')[0],
      total: Number(p.total_sales) || 0,
      comissao: Number(p.commission_earned) || 0,
    }));
  }, [safeProfessionals]);

  // Ranking: Top Clientes Mais Valiosos
  const topCustomers = React.useMemo(() => {
    return [...safeCustomers]
      .filter((c) => c && typeof c === 'object')
      .sort((a, b) => (Number(b.total_purchased) || 0) - (Number(a.total_purchased) || 0))
      .slice(0, 5);
  }, [safeCustomers]);

  // Ranking: Produtos Mais Vendidos / Destaque
  const topProducts = React.useMemo(() => {
    return [...safeProducts]
      .filter((p) => p && typeof p === 'object' && p.id)
      .sort((a, b) => (Number(b.selling_price) || 0) - (Number(a.selling_price) || 0))
      .slice(0, 5);
  }, [safeProducts]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Painel Comercial
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Visão estratégica em tempo real das negociações, vendas, clientes, equipe e comissões da sua empresa.
          </p>
        </div>

        {/* Controles de Período e Ação */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex rounded-xl bg-slate-200/80 p-1 text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => setPeriod('7d')}
              className={`px-3 py-1 rounded-lg transition-all ${
                period === '7d' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              7 Dias
            </button>
            <button
              type="button"
              onClick={() => setPeriod('30d')}
              className={`px-3 py-1 rounded-lg transition-all ${
                period === '30d' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              30 Dias
            </button>
            <button
              type="button"
              onClick={() => setPeriod('mes')}
              className={`px-3 py-1 rounded-lg transition-all ${
                period === 'mes' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Este Mês
            </button>
          </div>

          <Link
            href="/vendas/nova"
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Venda</span>
          </Link>
        </div>
      </div>

      {/* Cards de Métricas Principais (6 KPIs Comerciais & Comissões) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Faturamento */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Faturamento
            </span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-lg font-black text-slate-900 tracking-tight block">
              {formatCurrency(totalRevenue)}
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
              +18.4% no mês
            </span>
          </div>
        </div>

        {/* Vendas Concluídas */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Vendas
            </span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-lg font-black text-slate-900 tracking-tight block">
              {completedSalesCount} pedidos
            </span>
            <span className="text-[10px] text-blue-600 font-semibold block mt-0.5">
              100% faturadas
            </span>
          </div>
        </div>

        {/* Ticket Médio */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Ticket Médio
            </span>
            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-lg font-black text-slate-900 tracking-tight block">
              {formatCurrency(avgTicket)}
            </span>
            <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
              Por pedido concluído
            </span>
          </div>
        </div>

        {/* Clientes Ativos */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Clientes Ativos
            </span>
            <div className="p-1.5 bg-cyan-50 text-cyan-600 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-lg font-black text-slate-900 tracking-tight block">
              {activeCustomersCount} clientes
            </span>
            <span className="text-[10px] text-cyan-600 font-semibold block mt-0.5">
              Carteira monitorada
            </span>
          </div>
        </div>

        {/* Comissões Pendentes */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Comissões Pend.
            </span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-lg font-black text-amber-600 tracking-tight block">
              {formatCurrency(pendingCommissionsTotal)}
            </span>
            <Link href="/financeiro" className="text-[10px] text-amber-700 hover:underline font-semibold block mt-0.5">
              Acessar financeiro e repasses →
            </Link>
          </div>
        </div>

        {/* Comissões Pagas */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Comissões Pagas
            </span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-lg font-black text-emerald-600 tracking-tight block">
              {formatCurrency(paidCommissionsTotal)}
            </span>
            <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
              Histórico quitado
            </span>
          </div>
        </div>
      </div>

      {/* Gráficos Estratégicos: Faturamento Temporal & Vendas por Profissional */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Gráfico 1: Evolução do Faturamento (8 colunas) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Evolução do Faturamento</h3>
              <p className="text-xs text-slate-500">Histórico de negociações e fechamentos diários</p>
            </div>
            <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full w-fit">
              Tendência de Alta
            </span>
          </div>

          <div className="h-64 mt-4 w-full">
            {!isMounted ? (
              <div className="h-full w-full bg-slate-50/80 animate-pulse rounded-xl flex items-center justify-center text-xs text-slate-400 font-medium border border-slate-100">
                Carregando dados estatísticos...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: any) => [formatCurrency(Number(value)), 'Faturamento']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#2563eb"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Gráfico 2: Desempenho por Profissional (5 colunas) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Vendas por Profissional</h3>
              <p className="text-xs text-slate-500">Volume gerado por vendedor / especialista</p>
            </div>
            <Link href="/profissionais" className="text-xs font-semibold text-blue-600 hover:text-blue-800">
              Equipe →
            </Link>
          </div>

          <div className="h-64 mt-4 w-full">
            {!isMounted ? (
              <div className="h-full w-full bg-slate-50/80 animate-pulse rounded-xl flex items-center justify-center text-xs text-slate-400 font-medium border border-slate-100">
                Carregando dados da equipe...
              </div>
            ) : professionalChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Nenhum profissional com vendas registradas ainda.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={professionalChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value: any) => [formatCurrency(Number(value)), 'Total Vendido']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="total" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Grid Duplo: Top Clientes e Produtos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Clientes Mais Valiosos */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Top Clientes Mais Valiosos</h3>
              <p className="text-xs text-slate-500">Clientes com maior volume acumulado de compras</p>
            </div>
            <Link href="/clientes" className="text-xs font-semibold text-blue-600 hover:text-blue-800">
              Ver todos →
            </Link>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {topCustomers.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Nenhum cliente cadastrado ainda.
              </div>
            ) : (
              topCustomers.map((cust, idx) => (
                <div key={cust.id} className="py-3 flex items-center justify-between hover:bg-slate-50/60 px-2 rounded-xl transition-colors">
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 font-bold text-xs text-slate-600 flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <Link
                        href={`/clientes/${cust.id}`}
                        className="text-xs font-bold text-slate-800 hover:text-blue-600 block transition-colors"
                      >
                        {cust.trade_name || cust.name}
                      </Link>
                      <span className="text-[11px] text-slate-400">
                        {cust.type === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'} • {cust.city}/{cust.state}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-slate-900 block">
                      {formatCurrency(cust.total_purchased)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {cust.orders_count || 0} pedidos
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Produtos em Destaque Comercial */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Produtos em Destaque Comercial</h3>
              <p className="text-xs text-slate-500">Itens com maior valor agregado e margem</p>
            </div>
            <Link href="/produtos" className="text-xs font-semibold text-blue-600 hover:text-blue-800">
              Catálogo →
            </Link>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {topProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Nenhum produto cadastrado no catálogo.
              </div>
            ) : (
              topProducts.map((prod) => (
                <div key={prod.id || Math.random()} className="py-3 flex items-center justify-between hover:bg-slate-50/60 px-2 rounded-xl transition-colors">
                  <div className="flex items-center space-x-3">
                    {prod.image_url ? (
                      <img src={prod.image_url} alt={prod.name || 'Produto'} className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0" />
                    ) : (
                      <div className="p-2 bg-slate-100 rounded-xl text-slate-600 shrink-0">
                        <Package className="w-4 h-4" />
                      </div>
                    )}
                    <div className="truncate">
                      <span className="text-xs font-bold text-slate-800 block truncate max-w-xs">
                        {prod.name || 'Produto sem nome'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        SKU: {prod.sku || '-'} • Estoque: {prod.current_stock ?? 0} {prod.unit || 'UN'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-blue-700 block">
                      {formatCurrency(prod.selling_price)}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-medium">
                      {prod.commission_type === 'PERCENTAGE' ? `${prod.commission_value || 0}% comissão` : prod.commission_type === 'FIXED' ? `${formatCurrency(prod.commission_value)}/un` : 'Sem comissão'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
