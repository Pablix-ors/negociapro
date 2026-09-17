'use client';

import React, { useState, useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { formatCurrency, formatDate } from '@/lib/formatters';
import * as XLSX from 'xlsx';
import {
  BarChart3,
  Download,
  Filter,
  FileSpreadsheet,
  Users,
  Package,
  TrendingUp,
  Award,
  DollarSign,
  Calendar,
  CheckCircle2,
  PieChart as PieChartIcon,
  Table as TableIcon,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

type ReportCategory = 'vendas' | 'produtos' | 'clientes' | 'profissionais' | 'financeiro';
type ViewMode = 'both' | 'charts' | 'table';

const PIE_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function RelatoriosPage() {
  const { sales, customers, products, professionals, commissions } = useData();

  const [category, setCategory] = useState<ReportCategory>('vendas');
  const [viewMode, setViewMode] = useState<ViewMode>('both');
  const [selectedProfId, setSelectedProfId] = useState<string>('ALL');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Vendas filtradas
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const matchProf = selectedProfId === 'ALL' || s.professional_id === selectedProfId;
      const matchCust = selectedCustomerId === 'ALL' || s.customer_id === selectedCustomerId;
      const matchStat = statusFilter === 'ALL' || s.status === statusFilter;
      return matchProf && matchCust && matchStat;
    });
  }, [sales, selectedProfId, selectedCustomerId, statusFilter]);

  // --- DADOS PARA OS GRÁFICOS ---

  // 1. Gráficos de Vendas
  const salesByDateChart = useMemo(() => {
    const map = new Map<string, { date: string; total: number; subtotal: number; count: number }>();
    filteredSales.forEach((s) => {
      const dateKey = s.sold_at ? s.sold_at.split('T')[0] : s.created_at.split('T')[0];
      const current = map.get(dateKey) || { date: dateKey, total: 0, subtotal: 0, count: 0 };
      current.total += s.total;
      current.subtotal += s.subtotal || s.total;
      current.count += 1;
      map.set(dateKey, current);
    });
    return Array.from(map.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((item) => ({
        ...item,
        displayDate: item.date.split('-').slice(1).reverse().join('/'),
      }));
  }, [filteredSales]);

  const salesByStatusChart = useMemo(() => {
    const completed = filteredSales.filter((s) => s.status === 'COMPLETED').length;
    const cancelled = filteredSales.filter((s) => s.status === 'CANCELLED').length;
    const draft = filteredSales.filter((s) => s.status === 'DRAFT').length;
    return [
      { name: 'Concluídas', value: completed, color: '#10b981' },
      { name: 'Canceladas', value: cancelled, color: '#ef4444' },
      { name: 'Rascunho', value: draft, color: '#94a3b8' },
    ].filter((item) => item.value > 0);
  }, [filteredSales]);

  // 2. Gráficos de Produtos (Estoque & Mais Caros / Margens)
  const productStockChart = useMemo(() => {
    return [...products]
      .sort((a, b) => a.current_stock - b.current_stock)
      .slice(0, 6)
      .map((p) => ({
        name: p.name.length > 18 ? p.name.slice(0, 18) + '...' : p.name,
        estoque: p.current_stock,
        minimo: p.min_stock,
      }));
  }, [products]);

  const productPricesChart = useMemo(() => {
    return [...products]
      .sort((a, b) => b.selling_price - a.selling_price)
      .slice(0, 6)
      .map((p) => ({
        name: p.name.length > 16 ? p.name.slice(0, 16) + '...' : p.name,
        venda: p.selling_price,
        custo: p.cost_price,
        minimo: p.min_price,
      }));
  }, [products]);

  // 3. Gráficos de Clientes
  const topCustomersChart = useMemo(() => {
    return [...customers]
      .sort((a, b) => (b.total_purchased || 0) - (a.total_purchased || 0))
      .slice(0, 6)
      .map((c) => ({
        name: c.name.length > 18 ? c.name.slice(0, 18) + '...' : c.name,
        total: c.total_purchased || 0,
        pedidos: c.orders_count || 0,
      }));
  }, [customers]);

  const customersByTypeChart = useMemo(() => {
    const pfCount = customers.filter((c) => c.type === 'PF').length;
    const pjCount = customers.filter((c) => c.type === 'PJ').length;
    return [
      { name: 'Pessoa Física (PF)', value: pfCount, color: '#2563eb' },
      { name: 'Pessoa Jurídica (PJ)', value: pjCount, color: '#8b5cf6' },
    ];
  }, [customers]);

  // 4. Gráficos de Profissionais (Vendas e Comissões)
  const profPerformanceChart = useMemo(() => {
    return professionals.map((p) => ({
      name: p.name.split(' ')[0],
      vendas: p.total_sales || 0,
      comissaoTotal: p.commission_earned || 0,
      comissaoPaga: p.commission_paid || 0,
      comissaoPendente: p.commission_pending || 0,
    }));
  }, [professionals]);

  // 5. Gráficos Financeiros
  const financialMetricsChart = useMemo(() => {
    const completed = sales.filter((s) => s.status === 'COMPLETED');
    const grossRevenue = completed.reduce((acc, s) => acc + (s.subtotal || s.total), 0);
    const totalDiscounts = completed.reduce((acc, s) => acc + (s.discount || 0), 0);
    const netRevenue = completed.reduce((acc, s) => acc + s.total, 0);
    const totalComms = commissions.reduce((acc, c) => acc + c.commission_amount, 0);
    const paidComms = commissions
      .filter((c) => c.status === 'PAGA')
      .reduce((acc, c) => acc + (c.paid_amount || c.commission_amount), 0);
    const netProfit = netRevenue - totalComms;

    return [
      { name: 'Faturamento Bruto', valor: grossRevenue, fill: '#3b82f6' },
      { name: 'Descontos Concedidos', valor: totalDiscounts, fill: '#ef4444' },
      { name: 'Faturamento Líquido', valor: netRevenue, fill: '#10b981' },
      { name: 'Comissões da Equipe', valor: totalComms, fill: '#f59e0b' },
      { name: 'Saldo Pós-Comissões', valor: netProfit, fill: '#059669' },
    ];
  }, [sales, commissions]);

  const commissionsStatusPie = useMemo(() => {
    const pending = commissions
      .filter((c) => c.status === 'PENDENTE')
      .reduce((acc, c) => acc + c.commission_amount, 0);
    const approved = commissions
      .filter((c) => c.status === 'APROVADA')
      .reduce((acc, c) => acc + c.commission_amount, 0);
    const paid = commissions
      .filter((c) => c.status === 'PAGA')
      .reduce((acc, c) => acc + (c.paid_amount || c.commission_amount), 0);

    return [
      { name: 'Quitadas', value: paid, color: '#10b981' },
      { name: 'Aprovadas', value: approved, color: '#3b82f6' },
      { name: 'Pendentes', value: pending, color: '#f59e0b' },
    ].filter((item) => item.value > 0);
  }, [commissions]);

  // Exportação para Excel (.xlsx) e CSV
  const handleExport = (fileType: 'xlsx' | 'csv') => {
    let sheetName = 'Relatório';
    let dataToExport: any[] = [];

    if (category === 'vendas') {
      sheetName = 'Relatório de Vendas';
      dataToExport = filteredSales.map((s) => ({
        'Número da Venda': `#${s.sale_number}`,
        'Data': formatDate(s.sold_at),
        'Cliente': s.customer?.name || '',
        'Documento': s.customer?.document || '',
        'Profissional': s.professional?.name || 'Não vinculado',
        'Subtotal (R$)': (s.subtotal || s.total).toFixed(2),
        'Desconto (R$)': (s.discount || 0).toFixed(2),
        'Total Final (R$)': s.total.toFixed(2),
        'Comissão Total (R$)': (s.commission_total || 0).toFixed(2),
        'Status': s.status,
      }));
    } else if (category === 'produtos') {
      sheetName = 'Relatório de Produtos';
      dataToExport = products.map((p) => ({
        'Nome do Produto': p.name,
        'SKU': p.sku || '',
        'Unidade': p.unit,
        'Marca': p.brand || '',
        'Preço Custo (R$)': p.cost_price.toFixed(2),
        'Preço Venda (R$)': p.selling_price.toFixed(2),
        'Preço Mínimo (R$)': p.min_price.toFixed(2),
        'Estoque Atual': p.current_stock,
        'Estoque Mínimo': p.min_stock,
        'Situação Estoque': p.current_stock <= p.min_stock ? 'CRÍTICO' : 'REGULAR',
        'Comissão':
          p.commission_type === 'PERCENTAGE'
            ? `${p.commission_value}%`
            : p.commission_type === 'FIXED'
            ? `R$ ${p.commission_value}`
            : 'Sem comissão',
        'Status': p.active ? 'ATIVO' : 'INATIVO',
      }));
    } else if (category === 'clientes') {
      sheetName = 'Relatório de Clientes';
      dataToExport = customers.map((c) => ({
        'Nome / Razão Social': c.name,
        'Tipo': c.type,
        'Documento': c.document,
        'Cidade': c.city || '',
        'Estado': c.state || '',
        'Telefone': c.phone || '',
        'E-mail': c.email || '',
        'Total Comprado (R$)': (c.total_purchased || 0).toFixed(2),
        'Quantidade de Compras': c.orders_count || 0,
        'Última Compra': formatDate(c.last_purchase_date),
      }));
    } else if (category === 'profissionais') {
      sheetName = 'Relatório de Profissionais';
      dataToExport = professionals.map((p) => ({
        'Nome': p.name,
        'Cargo / Função': p.role_title,
        'CPF': p.document || '',
        'Telefone': p.phone || '',
        'E-mail': p.email || '',
        'Total Vendido (R$)': (p.total_sales || 0).toFixed(2),
        'Quantidade de Vendas': p.sales_count || 0,
        'Comissão Gerada (R$)': (p.commission_earned || 0).toFixed(2),
        'Comissão Paga (R$)': (p.commission_paid || 0).toFixed(2),
        'Comissão Pendente (R$)': (p.commission_pending || 0).toFixed(2),
        'Status': p.active ? 'ATIVO' : 'INATIVO',
      }));
    } else {
      // Financeiro
      sheetName = 'Relatório Financeiro';
      const completed = sales.filter((s) => s.status === 'COMPLETED');
      const grossRevenue = completed.reduce((acc, s) => acc + (s.subtotal || s.total), 0);
      const totalDiscounts = completed.reduce((acc, s) => acc + (s.discount || 0), 0);
      const netRevenue = completed.reduce((acc, s) => acc + s.total, 0);
      const totalCommissions = commissions.reduce((acc, c) => acc + c.commission_amount, 0);
      const paidCommissions = commissions
        .filter((c) => c.status === 'PAGA')
        .reduce((acc, c) => acc + (c.paid_amount || c.commission_amount), 0);

      dataToExport = [
        { 'Indicador Financeiro': 'Faturamento Bruto', 'Valor (R$)': grossRevenue.toFixed(2) },
        { 'Indicador Financeiro': 'Total de Descontos Concedidos', 'Valor (R$)': totalDiscounts.toFixed(2) },
        { 'Indicador Financeiro': 'Faturamento Líquido das Vendas', 'Valor (R$)': netRevenue.toFixed(2) },
        { 'Indicador Financeiro': 'Total de Comissões Geradas', 'Valor (R$)': totalCommissions.toFixed(2) },
        { 'Indicador Financeiro': 'Total de Comissões Já Pagas', 'Valor (R$)': paidCommissions.toFixed(2) },
        { 'Indicador Financeiro': 'Saldo Real da Operação', 'Valor (R$)': (netRevenue - totalCommissions).toFixed(2) },
      ];
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const filename = `relatorio_${category}_negociapro.${fileType}`;
    XLSX.writeFile(wb, filename);
  };

  const totalSalesRevenue = sales
    .filter((s) => s.status === 'COMPLETED')
    .reduce((acc, s) => acc + s.total, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl shadow-lg shadow-blue-500/20">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                Relatórios & Inteligência
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  Gráficos & Tabelas
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Visualize métricas estratégicas em gráficos interativos e exporte relatórios consolidados em Excel ou CSV.
              </p>
            </div>
          </div>
        </div>

        {/* Controles de Modo de Visualização e Exportação */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Seletor Gráficos / Tabela / Ambos */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => setViewMode('both')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'both' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
              title="Exibir gráficos e tabela"
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Completo</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('charts')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'charts' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
              title="Exibir somente gráficos"
            >
              <PieChartIcon className="w-3.5 h-3.5 text-purple-600" />
              <span>Gráficos</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
              title="Exibir somente tabelas"
            >
              <TableIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tabela</span>
            </button>
          </div>

          {/* Botões de Exportação */}
          <button
            type="button"
            onClick={() => handleExport('xlsx')}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel (.xlsx)</span>
          </button>
          <button
            type="button"
            onClick={() => handleExport('csv')}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Abas de Categorias de Relatório */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <button
          type="button"
          onClick={() => setCategory('vendas')}
          className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
            category === 'vendas'
              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
              : 'bg-white border-slate-200/80 hover:bg-slate-50 text-slate-800'
          }`}
        >
          <TrendingUp className="w-5 h-5 mb-2" />
          <div>
            <span className="text-xs font-bold block">1. Vendas</span>
            <span className={`text-[10px] ${category === 'vendas' ? 'text-blue-100' : 'text-slate-400'}`}>
              Faturamento & Pedidos
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setCategory('produtos')}
          className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
            category === 'produtos'
              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
              : 'bg-white border-slate-200/80 hover:bg-slate-50 text-slate-800'
          }`}
        >
          <Package className="w-5 h-5 mb-2" />
          <div>
            <span className="text-xs font-bold block">2. Produtos</span>
            <span className={`text-[10px] ${category === 'produtos' ? 'text-blue-100' : 'text-slate-400'}`}>
              Estoque & Margens
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setCategory('clientes')}
          className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
            category === 'clientes'
              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
              : 'bg-white border-slate-200/80 hover:bg-slate-50 text-slate-800'
          }`}
        >
          <Users className="w-5 h-5 mb-2" />
          <div>
            <span className="text-xs font-bold block">3. Clientes</span>
            <span className={`text-[10px] ${category === 'clientes' ? 'text-blue-100' : 'text-slate-400'}`}>
              Ranking & Histórico
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setCategory('profissionais')}
          className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
            category === 'profissionais'
              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
              : 'bg-white border-slate-200/80 hover:bg-slate-50 text-slate-800'
          }`}
        >
          <Award className="w-5 h-5 mb-2" />
          <div>
            <span className="text-xs font-bold block">4. Profissionais</span>
            <span className={`text-[10px] ${category === 'profissionais' ? 'text-blue-100' : 'text-slate-400'}`}>
              Comissões & Metas
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setCategory('financeiro')}
          className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between col-span-2 sm:col-span-1 ${
            category === 'financeiro'
              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
              : 'bg-white border-slate-200/80 hover:bg-slate-50 text-slate-800'
          }`}
        >
          <DollarSign className="w-5 h-5 mb-2" />
          <div>
            <span className="text-xs font-bold block">5. Financeiro</span>
            <span className={`text-[10px] ${category === 'financeiro' ? 'text-blue-100' : 'text-slate-400'}`}>
              Líquido & DRE
            </span>
          </div>
        </button>
      </div>

      {/* Barra de Filtros (Quando categoria for Vendas) */}
      {category === 'vendas' && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Profissional</label>
            <select
              value={selectedProfId}
              onChange={(e) => setSelectedProfId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Todos os Profissionais</option>
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Cliente</label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Todos os Clientes</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Status da Venda</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Todas as Vendas</option>
              <option value="COMPLETED">Concluídas</option>
              <option value="CANCELLED">Canceladas</option>
            </select>
          </div>
        </div>
      )}

      {/* SEÇÃO DE GRÁFICOS VISUAIS */}
      {(viewMode === 'both' || viewMode === 'charts') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              Painel de Gráficos Analíticos ({category.toUpperCase()})
            </h2>
            <span className="text-[11px] text-slate-400">Interativo com cursor e detalhamento</span>
          </div>

          {/* Gráficos de VENDAS */}
          {category === 'vendas' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Faturamento por Período</h3>
                    <p className="text-xs text-slate-400">Evolução do valor líquido faturado ao longo das datas</p>
                  </div>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                    {salesByDateChart.length} períodos
                  </span>
                </div>
                <div className="h-64 mt-4 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesByDateChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="displayDate" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                        tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        formatter={(value: any) => [formatCurrency(Number(value)), 'Faturado']}
                        labelFormatter={(label) => `Data: ${label}`}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="total"
                        stroke="#2563eb"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorVendas)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Distribuição por Status</h3>
                  <p className="text-xs text-slate-400">Proporção das vendas filtradas</p>
                </div>
                <div className="h-52 my-auto w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={salesByStatusChart}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                      >
                        {salesByStatusChart.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any, name: any) => [`${val} pedidos`, name]}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="pt-3 border-t border-slate-100 flex justify-around">
                  {salesByStatusChart.map((s, idx) => (
                    <div key={idx} className="text-center">
                      <span className="text-[10px] text-slate-400 block font-semibold">{s.name}</span>
                      <span className="text-sm font-black" style={{ color: s.color }}>
                        {s.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Gráficos de PRODUTOS */}
          {category === 'produtos' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Nível de Estoque (Menores Saldos)</h3>
                    <p className="text-xs text-slate-400">Comparação entre Estoque Atual e Estoque Mínimo</p>
                  </div>
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                    Atenção ao Estoque
                  </span>
                </div>
                <div className="h-64 mt-4 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={productStockChart} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} interval={0} angle={-15} textAnchor="end" />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                      <Legend verticalAlign="top" height={36} />
                      <Bar dataKey="estoque" name="Estoque Atual" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="minimo" name="Estoque Mínimo" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Preços & Margem de Negociação</h3>
                    <p className="text-xs text-slate-400">Preço de Venda Tabela vs Preço Mínimo vs Custo</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                    Top Valores
                  </span>
                </div>
                <div className="h-64 mt-4 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={productPricesChart} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} interval={0} angle={-15} textAnchor="end" />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `R$${v}`} />
                      <Tooltip formatter={(v: any) => formatCurrency(Number(v))} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                      <Legend verticalAlign="top" height={36} />
                      <Bar dataKey="venda" name="Venda (Tabela)" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="minimo" name="Preço Mínimo" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="custo" name="Custo" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Gráficos de CLIENTES */}
          {category === 'clientes' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Top Clientes por Volume Comprado</h3>
                    <p className="text-xs text-slate-400">Maiores compradores e volume total de compras acumulado</p>
                  </div>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                    Ranking Comercial
                  </span>
                </div>
                <div className="h-64 mt-4 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topCustomersChart} layout="vertical" margin={{ top: 10, right: 20, left: 30, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                      <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} width={100} />
                      <Tooltip formatter={(v: any) => [formatCurrency(Number(v)), 'Total Comprado']} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                      <Bar dataKey="total" name="Total Comprado" fill="#2563eb" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Perfil de Carteira (PF vs PJ)</h3>
                  <p className="text-xs text-slate-400">Proporção entre pessoas físicas e jurídicas</p>
                </div>
                <div className="h-52 my-auto w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={customersByTypeChart}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={6}
                      >
                        {customersByTypeChart.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="pt-3 border-t border-slate-100 flex justify-around">
                  {customersByTypeChart.map((item, idx) => (
                    <div key={idx} className="text-center">
                      <span className="text-[10px] text-slate-400 block font-semibold">{item.name}</span>
                      <span className="text-sm font-black" style={{ color: item.color }}>
                        {item.value} clientes
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Gráficos de PROFISSIONAIS */}
          {category === 'profissionais' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Desempenho da Equipe: Vendas vs Comissões</h3>
                  <p className="text-xs text-slate-400">Comparativo do faturamento gerado e comissões apuradas</p>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                  Equipe Ativa
                </span>
              </div>
              <div className="h-72 mt-4 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={profPerformanceChart} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: any) => formatCurrency(Number(v))} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                    <Legend verticalAlign="top" height={36} />
                    <Bar dataKey="vendas" name="Total Vendido" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="comissaoTotal" name="Comissão Gerada" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="comissaoPendente" name="Comissão Pendente" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Gráficos de FINANCEIRO */}
          {category === 'financeiro' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Cascata Financeira Comercial</h3>
                    <p className="text-xs text-slate-400">Do faturamento bruto até o saldo operacional pós-comissões</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                    Visão DRE
                  </span>
                </div>
                <div className="h-64 mt-4 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={financialMetricsChart} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} interval={0} angle={-10} textAnchor="end" />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: any) => formatCurrency(Number(v))} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                      <Bar dataKey="valor" name="Valor (R$)" radius={[6, 6, 0, 0]}>
                        {financialMetricsChart.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Situação das Comissões</h3>
                  <p className="text-xs text-slate-400">Quitadas vs Aprovadas vs Pendentes</p>
                </div>
                <div className="h-52 my-auto w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={commissionsStatusPie}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={5}
                      >
                        {commissionsStatusPie.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => formatCurrency(Number(v))} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="pt-3 border-t border-slate-100 flex justify-around">
                  {commissionsStatusPie.map((item, idx) => (
                    <div key={idx} className="text-center">
                      <span className="text-[10px] text-slate-400 block font-semibold">{item.name}</span>
                      <span className="text-xs font-black" style={{ color: item.color }}>
                        {formatCurrency(item.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SEÇÃO DA TABELA CONSOLIDADA */}
      {(viewMode === 'both' || viewMode === 'table') && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <TableIcon className="w-4 h-4 text-emerald-600" />
              Tabela Analítica ({category.toUpperCase()})
            </h3>
            <span className="text-xs text-slate-400 font-medium">Exportação gerada com colunas limpas e ordenadas</span>
          </div>

          <div className="overflow-x-auto">
            {category === 'vendas' && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200 text-[10px]">
                  <tr>
                    <th className="p-3">Pedido</th>
                    <th className="p-3">Data</th>
                    <th className="p-3">Cliente</th>
                    <th className="p-3">Profissional</th>
                    <th className="p-3 text-right">Comissão</th>
                    <th className="p-3 text-right">Total Final</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSales.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 font-bold text-slate-900">#{s.sale_number}</td>
                      <td className="p-3 text-slate-500">{formatDate(s.sold_at)}</td>
                      <td className="p-3 font-medium text-slate-800">{s.customer?.name}</td>
                      <td className="p-3 text-slate-600">{s.professional?.name || 'Não vinculado'}</td>
                      <td className="p-3 text-right font-bold text-emerald-600">
                        {formatCurrency(s.commission_total || 0)}
                      </td>
                      <td className="p-3 text-right font-black text-slate-900">{formatCurrency(s.total)}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {category === 'produtos' && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200 text-[10px]">
                  <tr>
                    <th className="p-3">Produto</th>
                    <th className="p-3">SKU</th>
                    <th className="p-3">Comissão</th>
                    <th className="p-3 text-right">Preço Venda</th>
                    <th className="p-3 text-right">Preço Mínimo</th>
                    <th className="p-3 text-center">Estoque Atual</th>
                    <th className="p-3 text-center">Situação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 font-bold text-slate-900">{p.name}</td>
                      <td className="p-3 font-mono text-slate-500">{p.sku || '-'}</td>
                      <td className="p-3 font-semibold text-emerald-700">
                        {p.commission_type === 'PERCENTAGE'
                          ? `${p.commission_value}%`
                          : p.commission_type === 'FIXED'
                          ? `${formatCurrency(p.commission_value)} / un`
                          : 'Nenhuma'}
                      </td>
                      <td className="p-3 text-right font-black text-slate-900">{formatCurrency(p.selling_price)}</td>
                      <td className="p-3 text-right font-bold text-amber-700">{formatCurrency(p.min_price)}</td>
                      <td className="p-3 text-center font-bold">{p.current_stock} {p.unit}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.current_stock <= p.min_stock ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                          {p.current_stock <= p.min_stock ? 'Crítico' : 'Regular'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {category === 'clientes' && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200 text-[10px]">
                  <tr>
                    <th className="p-3">Cliente</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Documento</th>
                    <th className="p-3">Cidade/UF</th>
                    <th className="p-3 text-right">Total Acumulado</th>
                    <th className="p-3 text-center">Compras</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 font-bold text-slate-900">{c.name}</td>
                      <td className="p-3 font-semibold text-blue-700">{c.type}</td>
                      <td className="p-3 font-mono text-slate-600">{c.document}</td>
                      <td className="p-3 text-slate-500">{c.city ? `${c.city}/${c.state}` : '-'}</td>
                      <td className="p-3 text-right font-black text-slate-900">{formatCurrency(c.total_purchased)}</td>
                      <td className="p-3 text-center font-bold text-slate-700">{c.orders_count || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {category === 'profissionais' && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200 text-[10px]">
                  <tr>
                    <th className="p-3">Profissional</th>
                    <th className="p-3">Cargo</th>
                    <th className="p-3 text-center">Vendas</th>
                    <th className="p-3 text-right">Volume Vendido</th>
                    <th className="p-3 text-right">Comissão Gerada</th>
                    <th className="p-3 text-right">Comissão Paga</th>
                    <th className="p-3 text-right">Pendente</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {professionals.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 font-bold text-slate-900">{p.name}</td>
                      <td className="p-3 text-blue-700 font-medium">{p.role_title}</td>
                      <td className="p-3 text-center font-bold">{p.sales_count || 0}</td>
                      <td className="p-3 text-right font-medium text-slate-800">{formatCurrency(p.total_sales || 0)}</td>
                      <td className="p-3 text-right font-black text-slate-900">{formatCurrency(p.commission_earned || 0)}</td>
                      <td className="p-3 text-right font-bold text-emerald-600">{formatCurrency(p.commission_paid || 0)}</td>
                      <td className="p-3 text-right font-bold text-amber-600">{formatCurrency(p.commission_pending || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {category === 'financeiro' && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200 text-[10px]">
                  <tr>
                    <th className="p-3">Métrica Financeira</th>
                    <th className="p-3 text-right">Valor Consolidado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-3 font-semibold text-slate-800">Faturamento Bruto de Vendas</td>
                    <td className="p-3 text-right font-bold text-slate-900">
                      {formatCurrency(sales.filter((s) => s.status === 'COMPLETED').reduce((acc, s) => acc + (s.subtotal || s.total), 0))}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-800">Descontos Comerciais Aplicados</td>
                    <td className="p-3 text-right font-bold text-red-600">
                      - {formatCurrency(sales.filter((s) => s.status === 'COMPLETED').reduce((acc, s) => acc + (s.discount || 0), 0))}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-800">Faturamento Líquido Efetivado</td>
                    <td className="p-3 text-right font-black text-blue-700">
                      {formatCurrency(totalSalesRevenue)}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-800">Comissões de Profissionais Geradas</td>
                    <td className="p-3 text-right font-bold text-amber-600">
                      {formatCurrency(commissions.reduce((acc, c) => acc + c.commission_amount, 0))}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-800">Comissões Quitadas</td>
                    <td className="p-3 text-right font-bold text-emerald-600">
                      {formatCurrency(commissions.filter((c) => c.status === 'PAGA').reduce((acc, c) => acc + (c.paid_amount || c.commission_amount), 0))}
                    </td>
                  </tr>
                  <tr className="bg-emerald-50/40">
                    <td className="p-3 font-bold text-emerald-950">Saldo Operacional Líquido Comercial</td>
                    <td className="p-3 text-right font-black text-emerald-800 text-sm">
                      {formatCurrency(totalSalesRevenue - commissions.reduce((acc, c) => acc + c.commission_amount, 0))}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
