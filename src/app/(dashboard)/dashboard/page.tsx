'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { getDateRange, isDateInRange, getLocalDateString, getDaysInRange, StandardPeriod } from '@/lib/dateUtils';
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
  const [period, setPeriod] = useState<StandardPeriod>('30d');
  const [isMounted, setIsMounted] = useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const safeSales = Array.isArray(sales) ? sales.filter(Boolean) : [];
  const safeCustomers = Array.isArray(customers) ? customers.filter(Boolean) : [];
  const safeProducts = Array.isArray(products) ? products.filter(Boolean) : [];
  const safeProfessionals = Array.isArray(professionals) ? professionals.filter(Boolean) : [];
  const safeCommissions = Array.isArray(commissions) ? commissions.filter(Boolean) : [];

  // Obter intervalo canônico selecionado
  const dateRange = React.useMemo(() => {
    return getDateRange(period);
  }, [period]);

  // Vendas COMPLETED estritamente válidas dentro do período
  const periodCompletedSales = React.useMemo(() => {
    return safeSales.filter((s) => {
      if (s.status !== 'COMPLETED') return false;
      const saleDate = s.sold_at || s.created_at;
      return isDateInRange(saleDate, dateRange);
    });
  }, [safeSales, dateRange]);

  // Comissões estritamente válidas no período (baseadas na data da venda/comissão)
  const periodCommissions = React.useMemo(() => {
    return safeCommissions.filter((c) => {
      const commDate = c.sale_date || c.created_at;
      return isDateInRange(commDate, dateRange);
    });
  }, [safeCommissions, dateRange]);

  // Cálculos de KPIs Principais
  const totalRevenue = React.useMemo(() => {
    return periodCompletedSales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
  }, [periodCompletedSales]);

  const completedSalesCount = periodCompletedSales.length;
  const avgTicket = completedSalesCount > 0 ? totalRevenue / completedSalesCount : 0;

  // Clientes que compraram no período e clientes ativos da carteira
  const activeCustomersInPeriod = React.useMemo(() => {
    const custIds = new Set<string>();
    periodCompletedSales.forEach((s) => {
      if (s.customer_id) custIds.add(s.customer_id);
      else if (s.customer?.id) custIds.add(s.customer.id);
    });
    return custIds.size;
  }, [periodCompletedSales]);

  const totalRegisteredActiveCustomers = React.useMemo(() => {
    return safeCustomers.filter((c) => c.active).length;
  }, [safeCustomers]);

  // Métricas de Comissões no Período
  const pendingCommissionsTotal = React.useMemo(() => {
    return periodCommissions
      .filter((c) => c.status === 'PENDENTE' || c.status === 'APROVADA')
      .reduce((acc, c) => acc + (Number(c.commission_amount) || 0), 0);
  }, [periodCommissions]);

  const paidCommissionsTotal = React.useMemo(() => {
    return periodCommissions
      .filter((c) => c.status === 'PAGA')
      .reduce((acc, c) => acc + (Number(c.paid_amount) || Number(c.commission_amount) || 0), 0);
  }, [periodCommissions]);

  // 1. Gráfico Real: Evolução do Faturamento Diário no Período Selecionado
  const chartData = React.useMemo(() => {
    const days = getDaysInRange(dateRange);
    const dayMap = new Map<string, number>();
    days.forEach((d) => dayMap.set(d.dateKey, 0));

    periodCompletedSales.forEach((s) => {
      const sDateStr = getLocalDateString(s.sold_at || s.created_at);
      if (dayMap.has(sDateStr)) {
        dayMap.set(sDateStr, (dayMap.get(sDateStr) || 0) + (Number(s.total) || 0));
      }
    });

    return days.map((d) => ({
      name: d.displayDate,
      dateKey: d.dateKey,
      total: Number((dayMap.get(d.dateKey) || 0).toFixed(2)),
    }));
  }, [dateRange, periodCompletedSales]);

  // 2. Gráfico Real: Vendas por Profissional no Período Selecionado
  const professionalChartData = React.useMemo(() => {
    const profMap = new Map<string, { name: string; total: number; comissao: number }>();

    // Inicializar profissionais cadastrados
    safeProfessionals.forEach((p) => {
      profMap.set(p.id, {
        name: (p.name || 'Profissional').split(' ')[0],
        total: 0,
        comissao: 0,
      });
    });

    // Somar vendas do período
    periodCompletedSales.forEach((s) => {
      const pId = s.professional_id || s.professional?.id;
      if (pId) {
        const existing = profMap.get(pId) || {
          name: (s.professional?.name || 'Vendedor').split(' ')[0],
          total: 0,
          comissao: 0,
        };
        existing.total += Number(s.total) || 0;
        existing.comissao += Number(s.commission_total) || 0;
        profMap.set(pId, existing);
      }
    });

    const list = Array.from(profMap.values());
    // Se tiver dados com vendas, ordenar decrescente; caso contrário mostrar equipe
    return list.sort((a, b) => b.total - a.total).slice(0, 10);
  }, [safeProfessionals, periodCompletedSales]);

  // 3. Ranking Real: Top Clientes Mais Valiosos no Período Selecionado
  const topCustomers = React.useMemo(() => {
    const custMap = new Map<
      string,
      {
        id: string;
        name: string;
        trade_name?: string | null;
        type?: string;
        city?: string;
        state?: string;
        total_purchased: number;
        orders_count: number;
      }
    >();

    // Agrupar compras reais das vendas concluídas do período
    periodCompletedSales.forEach((s) => {
      const cId = s.customer_id || s.customer?.id || (s.customer?.document ? `doc-${s.customer.document}` : null);
      if (!cId) return;

      const custObj = s.customer || safeCustomers.find((c) => c.id === cId || (c.document && c.document === s.customer?.document));

      const existing = custMap.get(cId) || {
        id: cId,
        name: custObj?.name || 'Cliente Identificado',
        trade_name: custObj?.trade_name || null,
        type: custObj?.type || 'PF',
        city: custObj?.city || '',
        state: custObj?.state || '',
        total_purchased: 0,
        orders_count: 0,
      };

      existing.total_purchased += Number(s.total) || 0;
      existing.orders_count += 1;
      custMap.set(cId, existing);
    });

    const activeInPeriod = Array.from(custMap.values())
      .filter((c) => c.total_purchased > 0)
      .sort((a, b) => b.total_purchased - a.total_purchased);

    // Se houver clientes com compras no período, exibi-los
    if (activeInPeriod.length > 0) {
      return activeInPeriod.slice(0, 5);
    }

    // Caso a empresa não tenha vendas no período específico, listar clientes cadastrados
    return [...safeCustomers]
      .filter((c) => c && typeof c === 'object')
      .slice(0, 5)
      .map((c) => ({
        id: c.id,
        name: c.name,
        trade_name: c.trade_name,
        type: c.type,
        city: c.city,
        state: c.state,
        total_purchased: 0,
        orders_count: 0,
      }));
  }, [periodCompletedSales, safeCustomers]);

  // 4. Ranking Real: Produtos em Destaque Comercial baseados no faturamento do período
  const topProducts = React.useMemo(() => {
    const prodMap = new Map<
      string,
      {
        id: string;
        name: string;
        sku?: string | null;
        image_url?: string | null;
        unit?: string | null;
        current_stock: number;
        selling_price: number;
        revenueInPeriod: number;
        qtySoldInPeriod: number;
        commission_type?: string | null;
        commission_value?: number;
      }
    >();

    // Inicializar catálogo de produtos
    safeProducts.forEach((p) => {
      prodMap.set(p.id, {
        id: p.id,
        name: p.name,
        sku: p.sku ?? null,
        image_url: p.image_url ?? null,
        unit: p.unit ?? 'UN',
        current_stock: p.current_stock ?? 0,
        selling_price: p.selling_price ?? 0,
        revenueInPeriod: 0,
        qtySoldInPeriod: 0,
        commission_type: p.commission_type ?? 'NONE',
        commission_value: p.commission_value ?? 0,
      });
    });

    // Somar itens das vendas concluídas do período
    periodCompletedSales.forEach((s) => {
      (s.items || []).forEach((it: any) => {
        const pId = it.product_id || it.product?.id;
        if (!pId) return;

        const prodObj = it.product || prodMap.get(pId);
        const existing = prodMap.get(pId) || {
          id: pId,
          name: prodObj?.name || 'Produto',
          sku: prodObj?.sku || '',
          image_url: prodObj?.image_url || null,
          unit: prodObj?.unit || 'UN',
          current_stock: prodObj?.current_stock ?? 0,
          selling_price: Number(it.unit_price) || prodObj?.selling_price || 0,
          revenueInPeriod: 0,
          qtySoldInPeriod: 0,
          commission_type: prodObj?.commission_type || 'NONE',
          commission_value: prodObj?.commission_value || 0,
        };

        existing.revenueInPeriod += Number(it.total) || 0;
        existing.qtySoldInPeriod += Number(it.quantity) || 1;
        prodMap.set(pId, existing);
      });
    });

    const soldProducts = Array.from(prodMap.values()).filter((p) => p.revenueInPeriod > 0);
    if (soldProducts.length > 0) {
      return soldProducts.sort((a, b) => b.revenueInPeriod - a.revenueInPeriod).slice(0, 5);
    }

    // Se nenhum item foi vendido no período, mostrar catálogo mais relevante
    return [...safeProducts]
      .filter((p) => p && typeof p === 'object' && p.id)
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        image_url: p.image_url,
        unit: p.unit,
        current_stock: p.current_stock,
        selling_price: p.selling_price,
        revenueInPeriod: 0,
        qtySoldInPeriod: 0,
        commission_type: p.commission_type,
        commission_value: p.commission_value,
      }));
  }, [safeProducts, periodCompletedSales]);

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
              onClick={() => setPeriod('today')}
              className={`px-3 py-1 rounded-lg transition-all ${
                period === 'today' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={() => setPeriod('7d')}
              className={`px-3 py-1 rounded-lg transition-all ${
                period === '7d' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              7 Dias
            </button>
            <button
              type="button"
              onClick={() => setPeriod('30d')}
              className={`px-3 py-1 rounded-lg transition-all ${
                period === '30d' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              30 Dias
            </button>
            <button
              type="button"
              onClick={() => setPeriod('month')}
              className={`px-3 py-1 rounded-lg transition-all ${
                period === 'month' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Este Mês
            </button>
            <button
              type="button"
              onClick={() => setPeriod('last_month')}
              className={`px-3 py-1 rounded-lg transition-all ${
                period === 'last_month' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Mês Passado
            </button>
            <button
              type="button"
              onClick={() => setPeriod('all')}
              className={`px-3 py-1 rounded-lg transition-all ${
                period === 'all' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Tudo
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
              {dateRange.label}
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
              Faturadas no período
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
              {activeCustomersInPeriod > 0 ? `${activeCustomersInPeriod} compradores` : `${totalRegisteredActiveCustomers} ativos`}
            </span>
            <span className="text-[10px] text-cyan-600 font-semibold block mt-0.5">
              {activeCustomersInPeriod > 0 ? `Compraram (${dateRange.label})` : 'Carteira ativa'}
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
              <p className="text-xs text-slate-500">Volume de compras apurado ({dateRange.label})</p>
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
              <p className="text-xs text-slate-500">Itens com maior faturamento e giro ({dateRange.label})</p>
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
