'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { CommissionStatus } from '@/types/database';
import {
  DollarSign,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Check,
  XCircle,
  AlertCircle,
  Calendar,
  User,
  X,
  CreditCard,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Wallet,
  Building2,
  PieChart,
  ShoppingBag,
  Percent,
  Download,
  FileSpreadsheet,
  CheckCircle,
  ShieldAlert,
  ArrowLeft,
} from 'lucide-react';

type FinancialTab = 'overview' | 'commissions' | 'sales_cashflow';

export default function FinanceiroPage() {
  const router = useRouter();
  const { sales, commissions, professionals, customers, markCommissionAsPaid } = useData();
  const { user, isLoading } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // Redirecionamento se não for ADMIN
  useEffect(() => {
    if (!isLoading && user && !isAdmin) {
      const timer = setTimeout(() => {
        router.replace('/dashboard');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, user, isAdmin, router]);

  // Abas do Financeiro
  const [activeTab, setActiveTab] = useState<FinancialTab>('overview');

  // Filtros de Comissões
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedProfId, setSelectedProfId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | CommissionStatus>('ALL');

  // Filtros de Vendas / Faturamento
  const [salesSearch, setSalesSearch] = useState('');

  // Modal de Marcar Comissão como Paga
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [targetCommissionId, setTargetCommissionId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payNotes, setPayNotes] = useState<string>('');

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-4 animate-in fade-in">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">
          Acesso Restrito a Administradores
        </h2>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          Você está conectado com o perfil <strong className="text-blue-600 font-bold">{user?.role || 'VENDEDOR'}</strong>. O módulo Financeiro, fluxo de caixa e gestão de pagamentos de comissão são de acesso exclusivo do administrador titular.
        </p>
        <div className="pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  // --- CÁLCULOS FINANCEIROS CONSOLIDADOS ---
  const completedSales = useMemo(() => {
    return sales.filter((s) => s.status === 'COMPLETED');
  }, [sales]);

  // Faturamento bruto (soma dos totais das vendas finalizadas)
  const totalRevenue = useMemo(() => {
    return completedSales.reduce((acc, s) => acc + s.total, 0);
  }, [completedSales]);

  // Total de descontos concedidos
  const totalDiscounts = useMemo(() => {
    return completedSales.reduce((acc, s) => acc + (s.discount || 0), 0);
  }, [completedSales]);

  // Subtotal bruto antes dos descontos
  const totalGrossBeforeDiscounts = useMemo(() => {
    return completedSales.reduce((acc, s) => acc + (s.subtotal || s.total), 0);
  }, [completedSales]);

  // Comissões
  const totalCommissions = useMemo(() => {
    return commissions.reduce((acc, c) => acc + c.commission_amount, 0);
  }, [commissions]);

  const pendingCommissionsTotal = useMemo(() => {
    return commissions
      .filter((c) => c.status === 'PENDENTE')
      .reduce((acc, c) => acc + c.commission_amount, 0);
  }, [commissions]);

  const approvedCommissionsTotal = useMemo(() => {
    return commissions
      .filter((c) => c.status === 'APROVADA')
      .reduce((acc, c) => acc + c.commission_amount, 0);
  }, [commissions]);

  const paidCommissionsTotal = useMemo(() => {
    return commissions
      .filter((c) => c.status === 'PAGA')
      .reduce((acc, c) => acc + (c.paid_amount || c.commission_amount), 0);
  }, [commissions]);

  // Margem Líquida Comercial após Comissões
  const netRevenueAfterCommissions = totalRevenue - totalCommissions;

  // Ticket Médio
  const averageTicket = completedSales.length > 0 ? totalRevenue / completedSales.length : 0;

  // Distribuição por Profissional
  const profCommissionsSummary = useMemo(() => {
    const map = new Map<string, { name: string; totalComms: number; paidComms: number; pendingComms: number; count: number }>();
    commissions.forEach((c) => {
      const existing = map.get(c.professional_id) || {
        name: c.professional_name,
        totalComms: 0,
        paidComms: 0,
        pendingComms: 0,
        count: 0,
      };
      existing.totalComms += c.commission_amount;
      if (c.status === 'PAGA') {
        existing.paidComms += c.paid_amount || c.commission_amount;
      } else {
        existing.pendingComms += c.commission_amount;
      }
      existing.count += 1;
      map.set(c.professional_id, existing);
    });
    return Array.from(map.values());
  }, [commissions]);

  // Filtro de Comissões
  const filteredCommissions = useMemo(() => {
    return commissions.filter((c) => {
      const matchesQuery =
        c.professional_name.toLowerCase().includes(filterQuery.toLowerCase()) ||
        String(c.sale_number).includes(filterQuery) ||
        (c.customer_name && c.customer_name.toLowerCase().includes(filterQuery.toLowerCase()));

      const matchesProf = selectedProfId === 'ALL' || c.professional_id === selectedProfId;
      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;

      return matchesQuery && matchesProf && matchesStatus;
    });
  }, [commissions, filterQuery, selectedProfId, statusFilter]);

  // Filtro de Vendas / Faturamento
  const filteredSales = useMemo(() => {
    return completedSales.filter((s) => {
      const customerName = s.customer?.name || '';
      const profName = s.professional?.name || '';
      const term = salesSearch.toLowerCase();
      return (
        String(s.sale_number).includes(term) ||
        customerName.toLowerCase().includes(term) ||
        profName.toLowerCase().includes(term)
      );
    });
  }, [completedSales, salesSearch]);

  const openPayModal = (id: string, amount: number) => {
    setTargetCommissionId(id);
    setPayAmount(amount);
    setPayNotes('Pagamento efetuado via PIX / Transferência');
    setPayModalOpen(true);
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCommissionId) return;

    markCommissionAsPaid(targetCommissionId, payAmount, payNotes);
    setPayModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 bg-gradient-to-tr from-emerald-600 to-teal-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Painel Financeiro
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Unificado
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Fluxo de faturamento comercial, DRE simplificada e gestão completa de repasses de comissões.
              </p>
            </div>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="flex items-center gap-2">
          <Link
            href="/vendas/nova"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Nova Venda</span>
          </Link>
          <Link
            href="/relatorios"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 rounded-xl text-xs font-bold shadow-xs transition-all"
          >
            <PieChart className="w-4 h-4 text-slate-400" />
            <span>Relatórios</span>
          </Link>
        </div>
      </div>

      {/* Cards de Métricas Principais (Executive KPI Bar) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Faturamento Líquido */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-200 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Faturamento Concluído
            </span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 mt-1">
            {formatCurrency(totalRevenue)}
          </p>
          <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold mt-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{completedSales.length} vendas registradas</span>
          </div>
        </div>

        {/* Saldo Líquido Pós-Comissões */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-200 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Receita Pós-Comissões
            </span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-blue-700 mt-1">
            {formatCurrency(netRevenueAfterCommissions)}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Faturamento (-) Comissões Totais
          </span>
        </div>

        {/* Comissões Pendentes */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-200 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Comissões a Pagar
            </span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-amber-600 mt-1">
            {formatCurrency(pendingCommissionsTotal + approvedCommissionsTotal)}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {commissions.filter((c) => c.status !== 'PAGA' && c.status !== 'CANCELADA').length} repasses pendentes
          </span>
        </div>

        {/* Comissões Já Pagas */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-200 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Comissões Quitadas
            </span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-emerald-600 mt-1">
            {formatCurrency(paidCommissionsTotal)}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {commissions.filter((c) => c.status === 'PAGA').length} repasses liquidados
          </span>
        </div>
      </div>

      {/* Navegação entre Abas do Financeiro */}
      <div className="flex border-b border-slate-200 bg-white px-2 pt-2 rounded-t-2xl shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'overview'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Visão Geral & Indicadores</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('commissions')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'commissions'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Gestão de Comissões</span>
          {pendingCommissionsTotal > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">
              {commissions.filter((c) => c.status === 'PENDENTE').length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sales_cashflow')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'sales_cashflow'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Faturamento de Vendas</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
            {completedSales.length}
          </span>
        </button>
      </div>

      {/* CONTEÚDO DA ABA 1: VISÃO GERAL & INDICADORES */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Gride de Detalhamento DRE Comercial & Métricas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Demonstrativo Comercial (DRE Resumida) */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Demonstrativo Financeiro Comercial</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Visão sintética das receitas, concessão de descontos e comissões</p>
                </div>
                <div className="p-2 bg-slate-50 text-slate-600 rounded-xl border border-slate-100">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-4 divide-y divide-slate-100">
                <div className="py-3 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600">Receita Bruta Total (Antes de Descontos)</span>
                  <span className="font-mono font-bold text-slate-900">{formatCurrency(totalGrossBeforeDiscounts)}</span>
                </div>

                <div className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <ArrowDownRight className="w-4 h-4 text-rose-500" />
                    <span className="font-semibold text-slate-600">Descontos Comerciais Aplicados</span>
                  </div>
                  <span className="font-mono font-bold text-rose-600">- {formatCurrency(totalDiscounts)}</span>
                </div>

                <div className="py-3 flex items-center justify-between text-xs bg-slate-50/70 px-3 rounded-xl">
                  <span className="font-bold text-slate-800">(=) Receita Líquida Faturada</span>
                  <span className="font-mono font-black text-emerald-700 text-sm">{formatCurrency(totalRevenue)}</span>
                </div>

                <div className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <ArrowDownRight className="w-4 h-4 text-amber-500" />
                    <span className="font-semibold text-slate-600">Comissões da Equipe / Profissionais</span>
                  </div>
                  <span className="font-mono font-bold text-amber-600">- {formatCurrency(totalCommissions)}</span>
                </div>

                <div className="pt-4 flex items-center justify-between text-sm bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100/60">
                  <div>
                    <span className="font-black text-emerald-950 block">Resultado Operacional Comercial</span>
                    <span className="text-[11px] text-emerald-700">Margem que fica na empresa após repasses</span>
                  </div>
                  <span className="font-mono font-black text-emerald-800 text-lg">
                    {formatCurrency(netRevenueAfterCommissions)}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Ticket Médio</span>
                  <span className="text-sm font-black text-slate-800 mt-0.5 block">{formatCurrency(averageTicket)}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Total de Vendas</span>
                  <span className="text-sm font-black text-slate-800 mt-0.5 block">{completedSales.length} ped.</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Taxa de Desconto</span>
                  <span className="text-sm font-black text-slate-800 mt-0.5 block">
                    {totalGrossBeforeDiscounts > 0 ? ((totalDiscounts / totalGrossBeforeDiscounts) * 100).toFixed(1) : '0'}%
                  </span>
                </div>
              </div>
            </div>

            {/* Repasses por Profissional */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Repasses por Vendedor</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Valores apurados pela equipe</p>
                  </div>
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <User className="w-4 h-4" />
                  </div>
                </div>

                <div className="mt-3 space-y-3">
                  {profCommissionsSummary.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">Nenhum repasse apurado.</p>
                  ) : (
                    profCommissionsSummary.map((prof, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">{prof.name}</span>
                          <span className="font-mono font-bold text-slate-900">{formatCurrency(prof.totalComms)}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="text-emerald-600 font-semibold">Pago: {formatCurrency(prof.paidComms)}</span>
                          <span className="text-amber-600 font-semibold">Pendente: {formatCurrency(prof.pendingComms)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveTab('commissions')}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all text-center"
                >
                  Ver Gestão Completa de Repasses →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA 2: GESTÃO DE COMISSÕES */}
      {activeTab === 'commissions' && (
        <div className="space-y-4">
          {/* Filtros da Tabela de Comissões */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filtrar por profissional, venda ou cliente..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Seletor de Profissional */}
              <select
                value={selectedProfId}
                onChange={(e) => setSelectedProfId(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">Todos os Profissionais</option>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              {/* Filtro de Status */}
              <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
                  }`}
                >
                  Todas
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('PENDENTE')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    statusFilter === 'PENDENTE' ? 'bg-white text-amber-700 shadow-xs font-bold' : 'hover:text-slate-900'
                  }`}
                >
                  Pendentes
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('PAGA')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    statusFilter === 'PAGA' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'hover:text-slate-900'
                  }`}
                >
                  Pagas
                </button>
              </div>
            </div>
          </div>

          {/* Lista Responsiva: Cards em Mobile e Tabela em Desktop */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {filteredCommissions.length === 0 ? (
              <div className="p-12 text-center">
                <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800">Nenhum registro de comissão encontrado</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  As comissões são geradas automaticamente ao finalizar vendas com profissionais vinculados.
                </p>
              </div>
            ) : (
              <>
                {/* Modo Tabela Desktop */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                      <tr>
                        <th className="py-3 px-4">Profissional</th>
                        <th className="py-3 px-4">Venda</th>
                        <th className="py-3 px-4">Cliente</th>
                        <th className="py-3 px-4">Data</th>
                        <th className="py-3 px-4">Valor da Venda</th>
                        <th className="py-3 px-4">Comissão</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredCommissions.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            {c.professional_name}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                            #{c.sale_number}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-700">
                            {c.customer_name || '-'}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500">
                            {formatDate(c.sale_date)}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-800">
                            {formatCurrency(c.sale_total)}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-emerald-600">
                            {formatCurrency(c.commission_amount)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                c.status === 'PAGA'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                                  : c.status === 'APROVADA'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                              }`}
                            >
                              {c.status === 'PAGA' ? (
                                <Check className="w-3 h-3 mr-1 text-emerald-600" />
                              ) : (
                                <Clock className="w-3 h-3 mr-1 text-amber-600" />
                              )}
                              {c.status}
                            </span>
                            {c.status === 'PAGA' && c.paid_at && (
                              <span className="block text-[9px] text-slate-400 mt-0.5">
                                Em {formatDate(c.paid_at)}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {c.status !== 'PAGA' && c.status !== 'CANCELADA' && (
                              <button
                                type="button"
                                onClick={() => openPayModal(c.id, c.commission_amount)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold active:scale-95 shadow-xs transition-all"
                              >
                                Pagar
                              </button>
                            )}
                            {c.status === 'PAGA' && (
                              <span className="text-[11px] text-slate-400 font-semibold">Quitada</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Modo Cards Mobile */}
                <div className="md:hidden divide-y divide-slate-100">
                  {filteredCommissions.map((c) => (
                    <div key={c.id} className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs">{c.professional_name}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.status === 'PAGA'
                              ? 'bg-emerald-50 text-emerald-700'
                              : c.status === 'APROVADA'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <span>Venda #{c.sale_number} ({c.customer_name})</span>
                        <span className="text-slate-400">{formatDate(c.sale_date)}</span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Venda: {formatCurrency(c.sale_total)}</span>
                          <span className="text-sm font-black text-emerald-600">
                            {formatCurrency(c.commission_amount)}
                          </span>
                        </div>

                        {c.status !== 'PAGA' && c.status !== 'CANCELADA' && (
                          <button
                            type="button"
                            onClick={() => openPayModal(c.id, c.commission_amount)}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold active:scale-95 shadow-xs"
                          >
                            Pagar Comissão
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA 3: FATURAMENTO DE VENDAS */}
      {activeTab === 'sales_cashflow' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={salesSearch}
                onChange={(e) => setSalesSearch(e.target.value)}
                placeholder="Buscar por número da venda, cliente ou vendedor..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <span className="text-xs text-slate-400 font-semibold hidden sm:inline">
              Mostrando {filteredSales.length} de {completedSales.length} faturamentos
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {filteredSales.length === 0 ? (
              <div className="p-12 text-center">
                <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800">Nenhum faturamento de venda encontrado</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Vendas concluídas geram faturamento registrado aqui com valor bruto, desconto e valor líquido.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">Venda</th>
                      <th className="py-3 px-4">Cliente</th>
                      <th className="py-3 px-4">Data</th>
                      <th className="py-3 px-4">Vendedor / Profissional</th>
                      <th className="py-3 px-4">Subtotal</th>
                      <th className="py-3 px-4">Desconto</th>
                      <th className="py-3 px-4">Total Líquido</th>
                      <th className="py-3 px-4">Comissão Gerada</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSales.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                          #{s.sale_number}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-800">
                          {s.customer?.name || 'Cliente Geral'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {formatDate(s.sold_at || s.created_at)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          {s.professional?.name || s.seller?.name || 'Não atribuído'}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-600">
                          {formatCurrency(s.subtotal || s.total)}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-rose-600">
                          {s.discount && s.discount > 0 ? `- ${formatCurrency(s.discount)}` : '-'}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-emerald-700">
                          {formatCurrency(s.total)}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-amber-600 font-semibold">
                          {s.commission_total > 0 ? formatCurrency(s.commission_total) : 'R$ 0,00'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Recebida
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Pagamento de Comissão */}
      {payModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-slate-900">Confirmar Pagamento de Comissão</h3>
              </div>
              <button
                type="button"
                onClick={() => setPayModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Valor Pago (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-emerald-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Observações do Pagamento</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="Ex: Comprovante PIX lote 9821"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500">
                Esta ação registrará a data de quitação, o usuário responsável e atualizará o saldo das comissões em tempo real.
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirmar Pagamento</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
