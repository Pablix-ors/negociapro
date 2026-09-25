'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { CommissionStatus, AccountReceivable, CashMovement, CashRegisterSession, ReceivableStatus } from '@/types/database';
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
  Coins,
  RefreshCw,
  Plus,
  Minus,
  Lock,
  Unlock,
  AlertTriangle,
  FileText,
  Printer,
  ChevronRight,
  Eye,
} from 'lucide-react';

type FinancialTab = 'overview' | 'receivables' | 'cash' | 'commissions' | 'sales_cashflow';
type PeriodFilter = 'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH' | 'LAST_MONTH' | 'LAST_30_DAYS' | 'ALL';

function FinanceiroContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialAba = searchParams.get('aba');
  const initialVenda = searchParams.get('venda') || '';

  const {
    sales,
    commissions,
    professionals,
    customers,
    markCommissionAsPaid,
    receivables,
    paymentReceipts,
    cashSession,
    cashSessionsHistory,
    cashMovements,
    receivePayment,
    renegotiateReceivable,
    cancelReceivable,
    openCashRegister,
    addCashMovement,
    closeCashRegister,
  } = useData();
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
  const [activeTab, setActiveTab] = useState<FinancialTab>(() => {
    if (initialAba === 'receber') return 'receivables';
    if (initialAba === 'caixa') return 'cash';
    if (initialAba === 'comissoes') return 'commissions';
    return 'overview';
  });

  // Filtro de Período Global
  const [globalPeriod, setGlobalPeriod] = useState<PeriodFilter>('ALL');

  // Filtros de Contas a Receber
  const [recSearch, setRecSearch] = useState(initialVenda);
  const [recStatusFilter, setRecStatusFilter] = useState<'ALL' | ReceivableStatus>('ALL');
  const [recCustomerFilter, setRecCustomerFilter] = useState<string>('ALL');
  const [isRecFiltersOpen, setIsRecFiltersOpen] = useState(false);
  const [recDateStart, setRecDateStart] = useState('');
  const [recDateEnd, setRecDateEnd] = useState('');
  const [recMinValue, setRecMinValue] = useState('');
  const [recMaxValue, setRecMaxValue] = useState('');

  // Modais de Contas a Receber
  const [selectedReceivable, setSelectedReceivable] = useState<AccountReceivable | null>(null);
  const [payReceivableModalOpen, setPayReceivableModalOpen] = useState(false);
  const [targetReceivable, setTargetReceivable] = useState<AccountReceivable | null>(null);
  const [payRecAmount, setPayRecAmount] = useState<number>(0);
  const [payRecMethod, setPayRecMethod] = useState<string>('Dinheiro');
  const [payRecDate, setPayRecDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [payRecNotes, setPayRecNotes] = useState<string>('');

  // Modal de Cancelamento de Conta
  const [cancelRecModalOpen, setCancelRecModalOpen] = useState(false);
  const [cancelRecReason, setCancelRecReason] = useState('');

  // Modal de Renegociação de Conta
  const [renegotiateModalOpen, setRenegotiateModalOpen] = useState(false);
  const [renegotiateParts, setRenegotiateParts] = useState(2);
  const [renegotiateReason, setRenegotiateReason] = useState('');

  // Modais do Caixa
  const [openCashModalOpen, setOpenCashModalOpen] = useState(false);
  const [openCashInitialBalance, setOpenCashInitialBalance] = useState<number>(200);
  const [openCashNotes, setOpenCashNotes] = useState<string>('');

  const [closeCashModalOpen, setCloseCashModalOpen] = useState(false);
  const [closeCashCounted, setCloseCashCounted] = useState<number>(0);
  const [closeCashNotes, setCloseCashNotes] = useState<string>('');
  const [closeCashDate, setCloseCashDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [movType, setMovType] = useState<'ENTRADA' | 'SAÍDA'>('SAÍDA');
  const [movCategory, setMovCategory] = useState<'SANGRIA' | 'SUPRIMENTO' | 'DESPESA' | 'AJUSTE_POSITIVO' | 'AJUSTE_NEGATIVO'>('SANGRIA');
  const [movAmount, setMovAmount] = useState<number>(50);
  const [movMethod, setMovMethod] = useState<string>('Dinheiro');
  const [movDescription, setMovDescription] = useState<string>('Sangria para depósito bancário');
  const [movNotes, setMovNotes] = useState<string>('');

  // Filtros do Extrato de Caixa
  const [cashPeriodFilter, setCashPeriodFilter] = useState<'ALL' | 'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH'>('ALL');
  const [cashTypeFilter, setCashTypeFilter] = useState<'ALL' | 'ENTRADA' | 'SAÍDA'>('ALL');
  const [cashCategoryFilter, setCashCategoryFilter] = useState<string>('ALL');
  const [cashPaymentMethodFilter, setCashPaymentMethodFilter] = useState<string>('ALL');
  const [selectedHistoricalSession, setSelectedHistoricalSession] = useState<CashRegisterSession | null>(null);

  // Filtros de Comissões
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedProfId, setSelectedProfId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | CommissionStatus>('ALL');

  // Filtros de Vendas / Faturamento
  const [salesSearch, setSalesSearch] = useState('');
  const [salesStatusFilter, setSalesStatusFilter] = useState<'ALL' | 'COMPLETED' | 'QUOTE' | 'CANCELLED'>('ALL');

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

  // Saldo Operacional em Caixa em tempo real (baseado nas movimentações diárias)
  const currentCashBalance = useMemo(() => {
    if (cashSession?.expected_balance !== undefined) {
      return cashSession.expected_balance;
    }
    const inflows = cashMovements.filter((m) => m.type === 'ENTRADA').reduce((acc, m) => acc + m.amount, 0);
    const outflows = cashMovements.filter((m) => m.type === 'SAÍDA').reduce((acc, m) => acc + m.amount, 0);
    return Number((inflows - outflows).toFixed(2));
  }, [cashSession, cashMovements]);

  // Filtro de Vendas / Faturamento
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      if (salesStatusFilter !== 'ALL' && s.status !== salesStatusFilter) {
        return false;
      }
      const customerName = s.customer?.name || '';
      const profName = s.professional?.name || '';
      const term = salesSearch.toLowerCase();
      return (
        String(s.sale_number).includes(term) ||
        customerName.toLowerCase().includes(term) ||
        profName.toLowerCase().includes(term)
      );
    });
  }, [sales, salesStatusFilter, salesSearch]);

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

      {/* Barra de Filtro de Período Global */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-700">Período de Análise:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
          {[
            { id: 'ALL', label: 'Todo Período' },
            { id: 'TODAY', label: 'Hoje' },
            { id: 'YESTERDAY', label: 'Ontem' },
            { id: 'WEEK', label: 'Esta Semana' },
            { id: 'MONTH', label: 'Este Mês' },
            { id: 'LAST_MONTH', label: 'Mês Anterior' },
            { id: 'LAST_30_DAYS', label: 'Últimos 30 Dias' },
          ].map((period) => (
            <button
              key={period.id}
              type="button"
              onClick={() => setGlobalPeriod(period.id as PeriodFilter)}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                globalPeriod === period.id
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards de Métricas Principais (Executive KPI Bar) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {/* Faturamento Líquido */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Faturamento Vendas
            </span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-lg font-black text-slate-900 mt-1">
            {formatCurrency(totalRevenue)}
          </p>
          <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">
            {completedSales.length} pedidos
          </span>
        </div>

        {/* Total a Receber */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Contas a Receber
            </span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Coins className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-lg font-black text-blue-700 mt-1">
            {formatCurrency(receivables.filter(r => r.status !== 'CANCELLED' && r.status !== 'PAID').reduce((acc, r) => acc + r.balance, 0))}
          </p>
          <span className="text-[10px] text-blue-600 font-semibold mt-0.5 block">
            {receivables.filter(r => r.status !== 'CANCELLED' && r.status !== 'PAID').length} parcelas em aberto
          </span>
        </div>

        {/* Vencido */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-rose-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Contas Vencidas
            </span>
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-lg font-black text-rose-600 mt-1">
            {formatCurrency(receivables.filter(r => r.status === 'OVERDUE').reduce((acc, r) => acc + r.balance, 0))}
          </p>
          <span className="text-[10px] text-rose-600 font-semibold mt-0.5 block">
            {receivables.filter(r => r.status === 'OVERDUE').length} parcelas vencidas
          </span>
        </div>

        {/* Vencendo Hoje ou a Vencer */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              A Vencer (Próximos)
            </span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-lg font-black text-amber-700 mt-1">
            {formatCurrency(receivables.filter(r => r.status === 'OPEN' || r.status === 'DUE_TODAY').reduce((acc, r) => acc + r.balance, 0))}
          </p>
          <span className="text-[10px] text-amber-700 font-semibold mt-0.5 block">
            {receivables.filter(r => r.status === 'OPEN' || r.status === 'DUE_TODAY').length} parcelas futuras
          </span>
        </div>

        {/* Saldo em Caixa */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Saldo em Caixa
            </span>
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-lg font-black text-indigo-700 mt-1">
            {formatCurrency(currentCashBalance)}
          </p>
          <span className="text-[10px] font-semibold mt-0.5 block text-slate-500">
            {cashMovements.length} movimentações registradas
          </span>
        </div>

        {/* Comissões Pendentes */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Comissões a Pagar
            </span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-lg font-black text-amber-600 mt-1">
            {formatCurrency(pendingCommissionsTotal + approvedCommissionsTotal)}
          </p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            {commissions.filter((c) => c.status !== 'PAGA' && c.status !== 'CANCELADA').length} repasses
          </span>
        </div>
      </div>

      {/* Navegação entre Abas do Financeiro */}
      <div className="flex border-b border-slate-200 bg-white px-2 pt-2 rounded-t-2xl shadow-xs overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'overview'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Visão Geral & DRE</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('receivables')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'receivables'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>Contas a Receber</span>
          {receivables.filter(r => r.status === 'OVERDUE').length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
              {receivables.filter(r => r.status === 'OVERDUE').length} vencidas
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cash')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'cash'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Gestão de Caixa</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
            Diário
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('commissions')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'commissions'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Comissões</span>
          {pendingCommissionsTotal > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">
              {commissions.filter((c) => c.status === 'PENDENTE').length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sales_cashflow')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'sales_cashflow'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Faturamento de Vendas</span>
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

      {/* CONTEÚDO DA ABA: CONTAS A RECEBER */}
      {activeTab === 'receivables' && (() => {
        // Filtros combinados de contas a receber
        const filteredReceivables = receivables.filter((r) => {
          const q = recSearch.trim().toLowerCase();
          if (q) {
            const matches =
              r.customer_name.toLowerCase().includes(q) ||
              String(r.sale_number).includes(q) ||
              (r.customer_document && r.customer_document.includes(q)) ||
              `${r.installment_number}/${r.total_installments}`.includes(q);
            if (!matches) return false;
          }

          if (recStatusFilter !== 'ALL' && r.status !== recStatusFilter) return false;
          if (recCustomerFilter !== 'ALL' && r.customer_id !== recCustomerFilter) return false;
          if (recDateStart && r.due_date < recDateStart) return false;
          if (recDateEnd && r.due_date > recDateEnd) return false;
          if (recMinValue && r.balance < parseFloat(recMinValue)) return false;
          if (recMaxValue && r.balance > parseFloat(recMaxValue)) return false;

          return true;
        });

        // Totais e Indicadores dos Cards
        const totalReceivable = receivables.filter(r => r.status !== 'CANCELLED').reduce((acc, r) => acc + r.original_amount, 0);
        const totalDueUpcoming = receivables.filter(r => r.status === 'OPEN' || r.status === 'DUE_TODAY').reduce((acc, r) => acc + r.balance, 0);
        const totalOverdue = receivables.filter(r => r.status === 'OVERDUE').reduce((acc, r) => acc + r.balance, 0);
        const totalPaidPeriod = receivables.reduce((acc, r) => acc + (r.paid_amount || 0), 0);
        const openCount = receivables.filter(r => r.status !== 'CANCELLED' && r.status !== 'PAID').length;

        const openReceiveModal = (rec: AccountReceivable) => {
          setTargetReceivable(rec);
          setPayRecAmount(rec.balance);
          setPayRecMethod(rec.payment_method_predicted || 'Dinheiro');
          setPayRecDate(new Date().toISOString().split('T')[0]);
          setPayRecNotes('');
          setPayReceivableModalOpen(true);
        };

        const handleConfirmReceipt = (e: React.FormEvent) => {
          e.preventDefault();
          if (!targetReceivable) return;

          const res = receivePayment({
            receivable_id: targetReceivable.id,
            amount: payRecAmount,
            payment_method: payRecMethod,
            payment_date: payRecDate ? new Date(`${payRecDate}T12:00:00`).toISOString() : undefined,
            notes: payRecNotes,
          });

          if (!res.success) {
            alert(res.message || 'Erro ao registrar recebimento.');
            return;
          }

          setPayReceivableModalOpen(false);
          setTargetReceivable(null);
        };

        const handleConfirmCancelReceivable = () => {
          if (!selectedReceivable) return;
          if (!cancelRecReason.trim()) {
            alert('Por favor, informe a justificativa do cancelamento.');
            return;
          }
          cancelReceivable(selectedReceivable.id, cancelRecReason);
          setCancelRecModalOpen(false);
          setSelectedReceivable(null);
          setCancelRecReason('');
        };

        const handleConfirmRenegotiate = () => {
          if (!selectedReceivable) return;
          if (!renegotiateReason.trim()) {
            alert('Por favor, informe o motivo do novo acordo.');
            return;
          }

          const bal = selectedReceivable.balance;
          const count = Math.max(2, renegotiateParts);
          const base = Number((bal / count).toFixed(2));
          const rem = Number((bal - base * count).toFixed(2));

          const newInsts = [];
          for (let i = 0; i < count; i++) {
            const d = new Date();
            d.setDate(d.getDate() + (i + 1) * 30);
            newInsts.push({
              due_date: d.toISOString().split('T')[0],
              amount: i === 0 ? Number((base + rem).toFixed(2)) : base,
            });
          }

          renegotiateReceivable({
            receivable_id: selectedReceivable.id,
            new_installments: newInsts,
            reason: renegotiateReason,
          });

          setRenegotiateModalOpen(false);
          setSelectedReceivable(null);
          setRenegotiateReason('');
        };

        return (
          <div className="space-y-6 animate-in fade-in">
            {/* Top Cards de Contas a Receber */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total a Receber</span>
                <p className="text-xl font-black text-slate-900 mt-1">{formatCurrency(totalReceivable)}</p>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Títulos gerados</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">A Vencer</span>
                <p className="text-xl font-black text-blue-700 mt-1">{formatCurrency(totalDueUpcoming)}</p>
                <span className="text-[10px] text-blue-600 font-semibold mt-0.5 block">No prazo regular</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Vencido</span>
                <p className="text-xl font-black text-rose-600 mt-1">{formatCurrency(totalOverdue)}</p>
                <span className="text-[10px] text-rose-600 font-semibold mt-0.5 block">Atraso registrado</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Recebido no Período</span>
                <p className="text-xl font-black text-emerald-600 mt-1">{formatCurrency(totalPaidPeriod)}</p>
                <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">Baixas efetuadas</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs col-span-2 md:col-span-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Parcelas em Aberto</span>
                <p className="text-xl font-black text-amber-600 mt-1">{openCount}</p>
                <span className="text-[10px] text-amber-700 font-semibold mt-0.5 block">Aguardando quitação</span>
              </div>
            </div>

            {/* Barra de Filtros e Busca */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={recSearch}
                    onChange={(e) => setRecSearch(e.target.value)}
                    placeholder="Pesquisar cliente, venda ou parcela..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRecFiltersOpen(!isRecFiltersOpen)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                      isRecFiltersOpen ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Filter className="w-3.5 h-3.5" />
                    <span>Filtros Avançados</span>
                  </button>

                  <select
                    value={recStatusFilter}
                    onChange={(e) => setRecStatusFilter(e.target.value as any)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                  >
                    <option value="ALL">Todos os Status</option>
                    <option value="OPEN">Em Aberto</option>
                    <option value="DUE_TODAY">Vencendo Hoje</option>
                    <option value="OVERDUE">Vencida</option>
                    <option value="PARTIALLY_PAID">Parcialmente Paga</option>
                    <option value="PAID">Paga</option>
                    <option value="CANCELLED">Cancelada</option>
                  </select>
                </div>
              </div>

              {/* Filtros Avançados Expansíveis */}
              {isRecFiltersOpen && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-4 gap-3 animate-in fade-in">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Cliente</label>
                    <select
                      value={recCustomerFilter}
                      onChange={(e) => setRecCustomerFilter(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                    >
                      <option value="ALL">Todos os Clientes</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Vencimento De</label>
                    <input
                      type="date"
                      value={recDateStart}
                      onChange={(e) => setRecDateStart(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Vencimento Até</label>
                    <input
                      type="date"
                      value={recDateEnd}
                      onChange={(e) => setRecDateEnd(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                    />
                  </div>
                  <div className="flex items-end space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRecSearch('');
                        setRecStatusFilter('ALL');
                        setRecCustomerFilter('ALL');
                        setRecDateStart('');
                        setRecDateEnd('');
                        setRecMinValue('');
                        setRecMaxValue('');
                      }}
                      className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-all text-center"
                    >
                      Limpar Filtros
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Tabela de Contas a Receber */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              {filteredReceivables.length === 0 ? (
                <div className="p-12 text-center">
                  <Coins className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-800">Nenhuma conta a receber encontrada</h3>
                  <p className="text-xs text-slate-500 mt-1">Vendas a prazo e parceladas criam títulos automaticamente nesta listagem.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[1000px]">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="p-3.5">Vencimento</th>
                        <th className="p-3.5">Cliente</th>
                        <th className="p-3.5">Venda</th>
                        <th className="p-3.5 text-center">Parcela</th>
                        <th className="p-3.5 text-right">Valor Original</th>
                        <th className="p-3.5 text-right">Valor Pago</th>
                        <th className="p-3.5 text-right">Saldo Atual</th>
                        <th className="p-3.5 text-center">Status</th>
                        <th className="p-3.5 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredReceivables.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3.5 font-bold text-slate-900 whitespace-nowrap">
                            {new Date(`${r.due_date}T12:00:00`).toLocaleDateString('pt-BR')}
                            {r.status === 'OVERDUE' && (
                              <span className="text-[10px] text-rose-600 block font-normal">Atrasado</span>
                            )}
                          </td>
                          <td className="p-3.5 font-bold text-slate-800">
                            <span>{r.customer_name}</span>
                            {r.customer_document && (
                              <span className="text-[11px] text-slate-400 block font-normal">{r.customer_document}</span>
                            )}
                          </td>
                          <td className="p-3.5 font-mono font-bold text-blue-600">#{r.sale_number}</td>
                          <td className="p-3.5 text-center font-semibold text-slate-700">{r.installment_number}/{r.total_installments}</td>
                          <td className="p-3.5 text-right text-slate-600 font-medium">{formatCurrency(r.original_amount)}</td>
                          <td className="p-3.5 text-right text-emerald-600 font-bold">{formatCurrency(r.paid_amount)}</td>
                          <td className="p-3.5 text-right font-black text-slate-900">{formatCurrency(r.balance)}</td>
                          <td className="p-3.5 text-center whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              r.status === 'PAID'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : r.status === 'OVERDUE'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : r.status === 'DUE_TODAY'
                                ? 'bg-amber-50 text-amber-800 border border-amber-300 animate-pulse'
                                : r.status === 'PARTIALLY_PAID'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : r.status === 'CANCELLED'
                                ? 'bg-slate-100 text-slate-600 border border-slate-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}>
                              {r.status === 'PAID'
                                ? 'Paga'
                                : r.status === 'OVERDUE'
                                ? 'Vencida'
                                : r.status === 'DUE_TODAY'
                                ? 'Vence Hoje'
                                : r.status === 'PARTIALLY_PAID'
                                ? 'Parcialmente Paga'
                                : r.status === 'CANCELLED'
                                ? 'Cancelada'
                                : 'Em Aberto'}
                            </span>
                          </td>
                          <td className="p-3.5 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center space-x-1.5">
                              {r.status !== 'PAID' && r.status !== 'CANCELLED' && (
                                <button
                                  type="button"
                                  onClick={() => openReceiveModal(r)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                                >
                                  Receber
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setSelectedReceivable(r)}
                                title="Ver Detalhes do Título"
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal de Detalhes da Conta a Receber */}
            {selectedReceivable && (
              <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                        <Coins className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-slate-900">Detalhes da Conta a Receber</h3>
                        <p className="text-[11px] text-slate-400">Venda #{selectedReceivable.sale_number} • Parcela {selectedReceivable.installment_number}/{selectedReceivable.total_installments}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedReceivable(null)}
                      className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Cliente</span>
                      <span className="font-bold text-slate-800 text-sm mt-0.5 block">{selectedReceivable.customer_name}</span>
                      <span className="text-[11px] text-slate-500">{selectedReceivable.customer_document || 'Sem documento'}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Vencimento</span>
                      <span className="font-bold text-blue-800 text-sm mt-0.5 block">
                        {new Date(`${selectedReceivable.due_date}T12:00:00`).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="text-[11px] text-slate-500">Status: {selectedReceivable.status}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Valor Original</span>
                      <span className="font-bold text-slate-800 text-sm mt-0.5 block">{formatCurrency(selectedReceivable.original_amount)}</span>
                      <span className="text-[10px] text-emerald-600 font-semibold">Pago: {formatCurrency(selectedReceivable.paid_amount)}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Saldo Devedor</span>
                      <span className="font-black text-rose-600 text-base mt-0.5 block">{formatCurrency(selectedReceivable.balance)}</span>
                    </div>
                  </div>

                  {selectedReceivable.notes && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-xs text-amber-900">
                      <strong>Observações:</strong> {selectedReceivable.notes}
                    </div>
                  )}

                  {/* Ações Gerenciais: Renegociar / Cancelar */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {selectedReceivable.status !== 'PAID' && selectedReceivable.status !== 'CANCELLED' && (
                        <>
                          <button
                            type="button"
                            onClick={() => setRenegotiateModalOpen(true)}
                            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-all"
                          >
                            Renegociar
                          </button>
                          <button
                            type="button"
                            onClick={() => setCancelRecModalOpen(true)}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all"
                          >
                            Cancelar Conta
                          </button>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedReceivable.status !== 'PAID' && selectedReceivable.status !== 'CANCELLED' && (
                        <button
                          type="button"
                          onClick={() => {
                            openReceiveModal(selectedReceivable);
                            setSelectedReceivable(null);
                          }}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20"
                        >
                          Receber Agora
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal de Registro de Recebimento (Total ou Parcial) */}
            {payReceivableModalOpen && targetReceivable && (
              <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-base font-black text-slate-900">Registrar Recebimento</h3>
                      <p className="text-xs text-slate-500">
                        {targetReceivable.customer_name} • Venda #{targetReceivable.sale_number} (Parc. {targetReceivable.installment_number}/{targetReceivable.total_installments})
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPayReceivableModalOpen(false)}
                      className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleConfirmReceipt} className="space-y-4">
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex justify-between items-center text-xs">
                      <span className="font-bold text-blue-950">Saldo em Aberto:</span>
                      <span className="font-black text-blue-800 text-sm">{formatCurrency(targetReceivable.balance)}</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Valor do Recebimento (R$) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={targetReceivable.balance}
                        required
                        value={payRecAmount}
                        onChange={(e) => setPayRecAmount(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-black text-emerald-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      />
                      {payRecAmount < targetReceivable.balance && (
                        <p className="text-[11px] text-amber-700 mt-1 font-semibold">
                          ⚠️ Pagamento Parcial: Restará R$ {(targetReceivable.balance - payRecAmount).toFixed(2)} em aberto.
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Data do Recebimento</label>
                        <input
                          type="date"
                          required
                          value={payRecDate}
                          onChange={(e) => setPayRecDate(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Forma de Pagamento</label>
                        <select
                          value={payRecMethod}
                          onChange={(e) => setPayRecMethod(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-800 font-semibold"
                        >
                          <option value="Dinheiro">Dinheiro</option>
                          <option value="PIX">PIX</option>
                          <option value="Cartão de Débito">Cartão de Débito</option>
                          <option value="Cartão de Crédito">Cartão de Crédito</option>
                          <option value="Boleto">Boleto Bancário</option>
                          <option value="Transferência">Transferência / TED</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Conta / Caixa de Destino</label>
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between text-slate-700 font-semibold">
                        <span>{cashSession?.name || 'Caixa Principal'}</span>
                        <span className="text-[10px] text-emerald-600 font-bold">
                          {cashSession ? 'Entrada Direta no Caixa Ativo' : 'Lançamento Contábil'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Observações (Opcional)</label>
                      <input
                        type="text"
                        value={payRecNotes}
                        onChange={(e) => setPayRecNotes(e.target.value)}
                        placeholder="Ex: Recebido no balcão com recibo manual nº 41"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                      />
                    </div>

                    <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setPayReceivableModalOpen(false)}
                        className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 flex items-center space-x-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Confirmar Recebimento</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal de Cancelamento de Conta a Receber */}
            {cancelRecModalOpen && selectedReceivable && (
              <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
                  <div className="flex items-center space-x-2 text-rose-600">
                    <AlertTriangle className="w-5 h-5" />
                    <h3 className="text-base font-black text-slate-900">Cancelar Conta a Receber</h3>
                  </div>
                  <p className="text-xs text-slate-600">
                    O cancelamento não apaga o registro do banco de dados, preservando a auditoria e o histórico fiscal/comercial.
                  </p>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Motivo do Cancelamento *</label>
                    <textarea
                      rows={3}
                      required
                      value={cancelRecReason}
                      onChange={(e) => setCancelRecReason(e.target.value)}
                      placeholder="Ex: Acordo desfeito amigavelmente / Devolução de mercadoria..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setCancelRecModalOpen(false)}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                    >
                      Voltar
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmCancelReceivable}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
                    >
                      Confirmar Cancelamento
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal de Renegociação */}
            {renegotiateModalOpen && selectedReceivable && (
              <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
                  <div className="flex items-center space-x-2 text-amber-600">
                    <RefreshCw className="w-5 h-5" />
                    <h3 className="text-base font-black text-slate-900">Renegociar Dívida</h3>
                  </div>
                  <p className="text-xs text-slate-600">
                    O saldo devedor atual de <strong>{formatCurrency(selectedReceivable.balance)}</strong> será desdobrado em um novo acordo de parcelamento, mantendo o histórico original intacto.
                  </p>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Número de Novas Parcelas</label>
                    <div className="flex gap-2">
                      {[2, 3, 4, 6].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setRenegotiateParts(num)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                            renegotiateParts === num ? 'bg-amber-600 text-white border-amber-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          {num}x de ~{formatCurrency(selectedReceivable.balance / num)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Motivo do Novo Acordo *</label>
                    <input
                      type="text"
                      required
                      value={renegotiateReason}
                      onChange={(e) => setRenegotiateReason(e.target.value)}
                      placeholder="Ex: Renegociação concedida com prazo estendido"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setRenegotiateModalOpen(false)}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmRenegotiate}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold"
                    >
                      Gerar Novo Acordo
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* CONTEÚDO DA ABA: GESTÃO DE CAIXA & MOVIMENTAÇÕES */}
      {activeTab === 'cash' && (() => {
        const handleOpenCashSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          openCashRegister({
            name: 'Caixa Principal',
            initial_balance: openCashInitialBalance,
            notes: openCashNotes,
          });
          setOpenCashModalOpen(false);
          setOpenCashNotes('');
        };

        const handleCloseCashSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          closeCashRegister({
            counted_balance: closeCashCounted,
            notes: closeCashNotes,
          });
          setCloseCashModalOpen(false);
          setCloseCashNotes('');
        };

        const handleManualMovementSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          addCashMovement({
            type: movType,
            category: movCategory,
            description: movDescription,
            amount: movAmount,
            payment_method: movMethod,
            notes: movNotes,
          });
          setMovementModalOpen(false);
          setMovNotes('');
        };

        const expectedBal = cashSession?.expected_balance || 0;
        const diffClose = Number((closeCashCounted - expectedBal).toFixed(2));

        const todayStr = new Date().toISOString().split('T')[0];
        const todayMovements = cashMovements.filter((m) => m.timestamp.split('T')[0] === todayStr);
        const todayInflows = todayMovements.filter((m) => m.type === 'ENTRADA').reduce((acc, m) => acc + m.amount, 0);
        const todayOutflows = todayMovements.filter((m) => m.type === 'SAÍDA').reduce((acc, m) => acc + m.amount, 0);

        return (
          <div className="space-y-6 animate-in fade-in">
            {/* Painel do Caixa Operacional Diário */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-700">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black text-slate-900">Caixa Operacional Diário</h2>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                        Ativo & Contínuo
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Movimentação diária automática integrada com vendas à vista, recebimentos de crediário, suprimentos e retiradas
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setMovType('ENTRADA');
                      setMovCategory('SUPRIMENTO');
                      setMovDescription('Suprimento de Caixa (Troco Inicial / Reforço)');
                      setMovAmount(100);
                      setMovementModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Suprimento</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMovType('SAÍDA');
                      setMovCategory('SANGRIA');
                      setMovDescription('Sangria de Caixa (Retirada para Cofre / Banco)');
                      setMovAmount(100);
                      setMovementModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 active:scale-95 cursor-pointer transition-all"
                  >
                    <Minus className="w-4 h-4" />
                    <span>- Sangria</span>
                  </button>
                </div>
              </div>

              {/* Detalhes do Saldo e Movimentações */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Movimentações Hoje</span>
                  <p className="text-lg font-black text-slate-900 mt-1">{todayMovements.length} lançamentos</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">Entradas de Hoje</span>
                  <p className="text-lg font-black text-emerald-600 mt-1">+{formatCurrency(todayInflows)}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block">Saídas / Sangrias Hoje</span>
                  <p className="text-lg font-black text-rose-600 mt-1">-{formatCurrency(todayOutflows)}</p>
                </div>
                <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 block">Saldo Atual em Caixa</span>
                  <p className="text-xl font-black text-blue-700 mt-1">{formatCurrency(currentCashBalance)}</p>
                </div>
              </div>
            </div>

            {/* Tabela de Movimentações da Sessão com Filtros Completos */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Extrato de Movimentações do Caixa</h3>
                  <p className="text-xs text-slate-400">Entradas à vista, recebimentos de contas, suprimentos e sangrias</p>
                </div>
                {/* Filtros de Caixa */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center rounded-xl bg-slate-100 p-0.5 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setCashPeriodFilter('ALL')}
                      className={`px-2.5 py-1 rounded-lg transition-all ${cashPeriodFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      Todos
                    </button>
                    <button
                      type="button"
                      onClick={() => setCashPeriodFilter('TODAY')}
                      className={`px-2.5 py-1 rounded-lg transition-all ${cashPeriodFilter === 'TODAY' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      Hoje
                    </button>
                    <button
                      type="button"
                      onClick={() => setCashPeriodFilter('YESTERDAY')}
                      className={`px-2.5 py-1 rounded-lg transition-all ${cashPeriodFilter === 'YESTERDAY' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      Ontem
                    </button>
                  </div>

                  <select
                    value={cashTypeFilter}
                    onChange={(e) => setCashTypeFilter(e.target.value as any)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-700 font-semibold focus:outline-hidden"
                  >
                    <option value="ALL">Tipos (Todos)</option>
                    <option value="ENTRADA">Entradas</option>
                    <option value="SAÍDA">Saídas</option>
                  </select>

                  <select
                    value={cashCategoryFilter}
                    onChange={(e) => setCashCategoryFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-700 font-semibold focus:outline-hidden"
                  >
                    <option value="ALL">Categorias (Todas)</option>
                    <option value="VENDA_A_VISTA">Vendas à Vista</option>
                    <option value="RECEBIMENTO_CONTA">Recebimentos</option>
                    <option value="SUPRIMENTO">Suprimentos</option>
                    <option value="SANGRIA">Sangrias</option>
                    <option value="DESPESA">Despesas</option>
                  </select>

                  <select
                    value={cashPaymentMethodFilter}
                    onChange={(e) => setCashPaymentMethodFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-700 font-semibold focus:outline-hidden"
                  >
                    <option value="ALL">Forma (Todas)</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="PIX">PIX</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                  </select>
                </div>
              </div>

              {(() => {
                const now = new Date();
                const todayStr = now.toISOString().split('T')[0];
                const yesterdayStr = new Date(now.getTime() - 86400000).toISOString().split('T')[0];

                const filteredMovements = cashMovements.filter((mov) => {
                  const movDateStr = mov.timestamp.split('T')[0];
                  if (cashPeriodFilter === 'TODAY' && movDateStr !== todayStr) return false;
                  if (cashPeriodFilter === 'YESTERDAY' && movDateStr !== yesterdayStr) return false;
                  if (cashTypeFilter !== 'ALL' && mov.type !== cashTypeFilter) return false;
                  if (cashCategoryFilter !== 'ALL' && mov.category !== cashCategoryFilter) return false;
                  if (cashPaymentMethodFilter !== 'ALL' && !mov.payment_method?.toLowerCase().includes(cashPaymentMethodFilter.toLowerCase())) return false;
                  return true;
                });

                if (filteredMovements.length === 0) {
                  return (
                    <div className="p-10 text-center text-xs text-slate-400">
                      Nenhuma movimentação financeira corresponde aos filtros selecionados.
                    </div>
                  );
                }

                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="p-3.5">Horário / Data</th>
                          <th className="p-3.5 text-center">Tipo</th>
                          <th className="p-3.5">Descrição</th>
                          <th className="p-3.5">Forma</th>
                          <th className="p-3.5">Usuário Responsável</th>
                          <th className="p-3.5 text-right">Valor</th>
                          <th className="p-3.5 text-right">Saldo do Caixa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredMovements.map((mov) => (
                          <tr key={mov.id} className="hover:bg-slate-50">
                            <td className="p-3.5 text-slate-600 whitespace-nowrap">
                              {new Date(mov.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              <span className="block text-[10px] text-slate-400">{new Date(mov.timestamp).toLocaleDateString('pt-BR')}</span>
                            </td>
                            <td className="p-3.5 text-center whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                mov.type === 'ENTRADA' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}>
                                {mov.type}
                              </span>
                            </td>
                            <td className="p-3.5 font-medium text-slate-800">
                              <span>{mov.description}</span>
                              {mov.notes && <span className="block text-[10px] text-slate-400 mt-0.5">{mov.notes}</span>}
                            </td>
                            <td className="p-3.5 text-slate-600 font-semibold">{mov.payment_method}</td>
                            <td className="p-3.5 text-slate-600">{mov.user_name || 'Operador'}</td>
                            <td className={`p-3.5 text-right font-black ${mov.type === 'ENTRADA' ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {mov.type === 'ENTRADA' ? '+' : '-'}{formatCurrency(mov.amount)}
                            </td>
                            <td className="p-3.5 text-right font-black text-slate-900">{formatCurrency(mov.current_balance_after)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>

            {/* Histórico de Fechamentos Anteriores (Auditável) */}
            {cashSessionsHistory.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Histórico de Fechamentos de Caixa</h3>
                    <p className="text-xs text-slate-400">Conferência física, saldo esperado vs contado, quebras/sobras e auditoria</p>
                  </div>
                  <span className="text-xs font-bold text-slate-500">{cashSessionsHistory.length} caixas fechados</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                      <tr>
                        <th className="p-3">Data / Horário</th>
                        <th className="p-3">Resp. Abertura</th>
                        <th className="p-3">Resp. Fechamento</th>
                        <th className="p-3 text-right">Saldo Inicial</th>
                        <th className="p-3 text-right">Entradas</th>
                        <th className="p-3 text-right">Saídas</th>
                        <th className="p-3 text-right">Esperado</th>
                        <th className="p-3 text-right">Contado</th>
                        <th className="p-3 text-center">Diferença</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-center">Relatório</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cashSessionsHistory.map((sess) => (
                        <tr key={sess.id} className="hover:bg-slate-50">
                          <td className="p-3 text-slate-700 whitespace-nowrap">
                            <span className="font-bold block">{sess.closed_at ? new Date(sess.closed_at).toLocaleDateString('pt-BR') : '-'}</span>
                            <span className="text-[10px] text-slate-400">{sess.closed_at ? new Date(sess.closed_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                          </td>
                          <td className="p-3 text-slate-700">{sess.opened_by_name || 'Operador'}</td>
                          <td className="p-3 text-slate-700">{sess.closed_by_name || 'Operador'}</td>
                          <td className="p-3 text-right font-medium text-slate-600">{formatCurrency(sess.initial_balance)}</td>
                          <td className="p-3 text-right font-medium text-emerald-600">+{formatCurrency(sess.total_inflows)}</td>
                          <td className="p-3 text-right font-medium text-rose-600">-{formatCurrency(sess.total_outflows)}</td>
                          <td className="p-3 text-right font-black text-blue-900">{formatCurrency(sess.expected_balance)}</td>
                          <td className="p-3 text-right font-black text-slate-900">{sess.counted_balance !== undefined ? formatCurrency(sess.counted_balance) : '-'}</td>
                          <td className="p-3 text-center">
                            {!sess.difference || sess.difference === 0 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">Sem diferença</span>
                            ) : (sess.difference ?? 0) < 0 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700">Falta: {formatCurrency(Math.abs(sess.difference))}</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">Sobra: +{formatCurrency(sess.difference)}</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700">FECHADO</span>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => setSelectedHistoricalSession(sess)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-600" />
                              <span>Ver</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Modal de Abertura de Caixa */}
            {openCashModalOpen && (
              <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
                  <div className="flex items-center space-x-2 text-emerald-600">
                    <Unlock className="w-5 h-5" />
                    <h3 className="text-base font-black text-slate-900">Abertura de Caixa</h3>
                  </div>
                  <form onSubmit={handleOpenCashSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Saldo Inicial (Troco) (R$) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={openCashInitialBalance}
                        onChange={(e) => setOpenCashInitialBalance(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-black text-emerald-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Observações de Abertura</label>
                      <input
                        type="text"
                        value={openCashNotes}
                        onChange={(e) => setOpenCashNotes(e.target.value)}
                        placeholder="Ex: Turno da manhã aberto com notas e moedas"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                      />
                    </div>
                    <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setOpenCashModalOpen(false)}
                        className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                      >
                        Confirmar Abertura
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal de Fechamento de Caixa com Conferência Física */}
            {closeCashModalOpen && (
              <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <div className="flex items-center space-x-2 text-slate-900">
                      <Lock className="w-5 h-5 text-slate-700" />
                      <h3 className="text-base font-black">Conferência e Fechamento de Caixa</h3>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                      {new Date().toLocaleDateString('pt-BR')} (Hoje)
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Saldo Inicial:</span>
                      <span className="font-bold">{formatCurrency(cashSession?.initial_balance || 0)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600">
                      <span>(+) Entradas no Caixa:</span>
                      <span className="font-bold">+{formatCurrency(cashSession?.total_inflows || 0)}</span>
                    </div>
                    <div className="flex justify-between text-rose-600">
                      <span>(-) Saídas do Caixa:</span>
                      <span className="font-bold">-{formatCurrency(cashSession?.total_outflows || 0)}</span>
                    </div>
                    <div className="flex justify-between text-blue-900 font-black text-sm pt-2 border-t border-slate-200">
                      <span>Saldo Esperado:</span>
                      <span>{formatCurrency(expectedBal)}</span>
                    </div>
                  </div>

                  <form onSubmit={handleCloseCashSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Informe o Valor Contado no Caixa (R$) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={closeCashCounted}
                        onChange={(e) => setCloseCashCounted(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-base font-black text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Resultado da Conferência Física */}
                    <div className={`p-3 rounded-xl border text-xs font-bold ${
                      Math.abs(diffClose) < 0.01
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : diffClose < 0
                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                        : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                    }`}>
                      {Math.abs(diffClose) < 0.01 ? (
                        <span>✓ Caixa conferido corretamente (Sem divergência).</span>
                      ) : diffClose < 0 ? (
                        <span>⚠️ Quebra de Caixa: Faltando {formatCurrency(Math.abs(diffClose))}</span>
                      ) : (
                        <span>ℹ️ Sobra de Caixa: Excedente de +{formatCurrency(diffClose)}</span>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Justificativa / Observação {Math.abs(diffClose) >= 0.01 ? '*' : ''}
                      </label>
                      <textarea
                        rows={2}
                        required={Math.abs(diffClose) >= 0.01}
                        value={closeCashNotes}
                        onChange={(e) => setCloseCashNotes(e.target.value)}
                        placeholder="Ex: Diferença justificada por sangria de troco não computada"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800"
                      />
                    </div>

                    <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setCloseCashModalOpen(false)}
                        className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md"
                      >
                        Confirmar Fechamento
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal de Relatório Completo de Caixa Fechado (Histórico) */}
            {selectedHistoricalSession && (
              <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-xl rounded-3xl p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4 max-h-[90vh] flex flex-col">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center space-x-2 text-slate-900">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <div>
                        <h3 className="text-base font-black">Relatório de Fechamento de Caixa</h3>
                        <p className="text-xs text-slate-400">
                          {selectedHistoricalSession.closed_at ? new Date(selectedHistoricalSession.closed_at).toLocaleDateString('pt-BR') : '-'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedHistoricalSession(null)}
                      className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="overflow-y-auto space-y-4 pr-1">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Abertura</span>
                        <span className="font-bold text-slate-800 block">
                          {new Date(selectedHistoricalSession.opened_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-slate-500">Por: {selectedHistoricalSession.opened_by_name || 'Operador'}</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Fechamento</span>
                        <span className="font-bold text-slate-800 block">
                          {selectedHistoricalSession.closed_at ? new Date(selectedHistoricalSession.closed_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </span>
                        <span className="text-slate-500">Por: {selectedHistoricalSession.closed_by_name || 'Operador'}</span>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Saldo Inicial (Abertura):</span>
                        <span className="font-bold">{formatCurrency(selectedHistoricalSession.initial_balance)}</span>
                      </div>
                      <div className="flex justify-between text-emerald-600">
                        <span>(+) Total de Entradas:</span>
                        <span className="font-bold">+{formatCurrency(selectedHistoricalSession.total_inflows)}</span>
                      </div>
                      <div className="flex justify-between text-rose-600">
                        <span>(-) Total de Saídas (Sangrias):</span>
                        <span className="font-bold">-{formatCurrency(selectedHistoricalSession.total_outflows)}</span>
                      </div>
                      <div className="flex justify-between text-slate-800 font-bold pt-2 border-t border-slate-200">
                        <span>Saldo Esperado pelo Sistema:</span>
                        <span>{formatCurrency(selectedHistoricalSession.expected_balance)}</span>
                      </div>
                      <div className="flex justify-between text-slate-900 font-black text-sm">
                        <span>Valor Físico Contado:</span>
                        <span>{selectedHistoricalSession.counted_balance !== undefined ? formatCurrency(selectedHistoricalSession.counted_balance) : '-'}</span>
                      </div>
                      <div className="flex justify-between font-black text-sm pt-2 border-t border-slate-200">
                        <span>Divergência / Quebra:</span>
                        <span className={
                          !selectedHistoricalSession.difference || selectedHistoricalSession.difference === 0
                            ? 'text-emerald-600'
                            : selectedHistoricalSession.difference < 0
                            ? 'text-rose-600'
                            : 'text-indigo-600'
                        }>
                          {!selectedHistoricalSession.difference || selectedHistoricalSession.difference === 0
                            ? 'Exato (Sem diferença)'
                            : `${selectedHistoricalSession.difference > 0 ? '+' : ''}${formatCurrency(selectedHistoricalSession.difference)}`}
                        </span>
                      </div>
                    </div>

                    {selectedHistoricalSession.notes && (
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/60 text-xs">
                        <span className="font-bold text-amber-900 block mb-0.5">Justificativa / Observações:</span>
                        <p className="text-amber-800">{selectedHistoricalSession.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setSelectedHistoricalSession(null)}
                      className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
                    >
                      Fechar Relatório
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal de Movimentação Manual (Suprimento ou Sangria) */}
            {movementModalOpen && (
              <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="text-base font-black text-slate-900">
                      Nova Movimentação de Caixa ({movCategory})
                    </h3>
                    <button
                      type="button"
                      onClick={() => setMovementModalOpen(false)}
                      className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleManualMovementSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Movimento</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setMovType('ENTRADA');
                            setMovCategory('SUPRIMENTO');
                          }}
                          className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                            movType === 'ENTRADA' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          Entrada (Suprimento)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMovType('SAÍDA');
                            setMovCategory('SANGRIA');
                          }}
                          className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                            movType === 'SAÍDA' ? 'bg-rose-600 text-white border-rose-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          Saída (Sangria)
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Valor (R$) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={movAmount}
                        onChange={(e) => setMovAmount(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-base font-black text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Descrição / Motivo *</label>
                      <input
                        type="text"
                        required
                        value={movDescription}
                        onChange={(e) => setMovDescription(e.target.value)}
                        placeholder="Ex: Retirada de sangria para depósito bancário"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Forma</label>
                      <select
                        value={movMethod}
                        onChange={(e) => setMovMethod(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold"
                      >
                        <option value="Dinheiro">Dinheiro</option>
                        <option value="PIX">PIX</option>
                        <option value="Transferência">Transferência</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Observações Adicionais</label>
                      <input
                        type="text"
                        value={movNotes}
                        onChange={(e) => setMovNotes(e.target.value)}
                        placeholder="Ex: Autorizado pelo Gerente"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                      />
                    </div>

                    <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setMovementModalOpen(false)}
                        className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md"
                      >
                        Confirmar Lançamento
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* CONTEÚDO DA ABA: GESTÃO DE COMISSÕES */}
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
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative flex-1 min-w-[240px] max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={salesSearch}
                  onChange={(e) => setSalesSearch(e.target.value)}
                  placeholder="Buscar por número da venda, cliente ou vendedor..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <select
                value={salesStatusFilter}
                onChange={(e) => setSalesStatusFilter(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-hidden"
              >
                <option value="ALL">Status (Todos os Lançamentos)</option>
                <option value="COMPLETED">Apenas Concluídas / Recebidas</option>
                <option value="QUOTE">Apenas Orçamentos</option>
                <option value="CANCELLED">Apenas Canceladas</option>
              </select>
            </div>

            <span className="text-xs text-slate-400 font-semibold">
              Mostrando {filteredSales.length} de {sales.length} vendas registradas
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {filteredSales.length === 0 ? (
              <div className="p-12 text-center">
                <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800">Nenhum faturamento de venda encontrado</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Nenhuma venda cadastrada no sistema corresponde aos filtros de busca aplicados.
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
                        <td className={`py-3.5 px-4 font-bold ${s.status === 'CANCELLED' ? 'text-slate-400 line-through' : 'text-emerald-700'}`}>
                          {formatCurrency(s.total)}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-amber-600 font-semibold">
                          {s.status === 'CANCELLED' ? 'Cancelada' : s.commission_total > 0 ? formatCurrency(s.commission_total) : 'R$ 0,00'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {s.status === 'COMPLETED' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Recebida
                            </span>
                          )}
                          {s.status === 'QUOTE' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                              Orçamento
                            </span>
                          )}
                          {s.status === 'CANCELLED' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60">
                              Cancelada
                            </span>
                          )}
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

export default function FinanceiroPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Carregando módulo financeiro...</div>}>
      <FinanceiroContent />
    </React.Suspense>
  );
}
