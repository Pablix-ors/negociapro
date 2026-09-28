'use client';

import React, { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatters';
import { Sale } from '@/types/database';
import SaleReceiptModal from '@/components/sales/SaleReceiptModal';
import { formatSaleNumber } from '@/components/sales/SaleReceipt';
import * as XLSX from 'xlsx';
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  Eye,
  XCircle,
  FileText,
  User,
  Award,
  DollarSign,
  X,
  Calendar,
  CreditCard,
  Package,
  Printer,
  Download,
  Receipt,
  FileSpreadsheet,
  ChevronDown,
  RotateCcw,
  Check,
  Trash2,
} from 'lucide-react';

interface AdvancedFilters {
  customerName: string;
  customerDoc: string;
  saleNumber: string;
  dateStart: string;
  dateEnd: string;
  professionalId: string;
  paymentMethod: string;
  minValue: string;
  maxValue: string;
  productName: string;
  productSku: string;
  commissionFilter: 'ALL' | 'WITH_COMMISSION' | 'WITHOUT_COMMISSION';
}

const INITIAL_FILTERS: AdvancedFilters = {
  customerName: '',
  customerDoc: '',
  saleNumber: '',
  dateStart: '',
  dateEnd: '',
  professionalId: 'ALL',
  paymentMethod: 'ALL',
  minValue: '',
  maxValue: '',
  productName: '',
  productSku: '',
  commissionFilter: 'ALL',
};

export default function VendasPage() {
  const { sales, professionals, receivables, cancelSale, deleteSale, updateFinishedSale, saleAuditLogs } = useData();
  const { user } = useAuth();
  const canDeleteOrCancel = user?.role === 'ADMIN' || user?.role === 'GERENTE';
  const canEditFinishedSale = user?.role === 'ADMIN' || user?.role === 'GERENTE';
  const [filterQuery, setFilterQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'QUOTE' | 'CANCELLED'>('ALL');

  // Painel de Filtros Avançados
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<AdvancedFilters>(INITIAL_FILTERS);

  // Modais de Venda
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [receiptSale, setReceiptSale] = useState<Sale | null>(null);

  // Modal de Edição de Venda Finalizada (Restrito a Admin/Gerente)
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [editSaleReason, setEditSaleReason] = useState<string>('');
  const [editSaleItems, setEditSaleItems] = useState<Array<{ product_id: string; quantity: number; unit_price: number; discount: number; total: number }>>([]);

  // Modal de Histórico de Auditoria da Venda
  const [auditSaleId, setAuditSaleId] = useState<string | null>(null);

  // Modal de Confirmação de Exclusão Definitiva (Substitui confirm nativo feio)
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);

  // Modal de Cancelamento de Venda com Justificativa Elegante (Substitui prompt nativo feio)
  const [saleToCancel, setSaleToCancel] = useState<Sale | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [cancelReasonError, setCancelReasonError] = useState<string | null>(null);

  // Exportação dropdown
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  // Fechar dropdown de exportação ao clicar fora
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sincronização de rolagem horizontal dupla (topo e rodapé)
  const topScrollRef = React.useRef<HTMLDivElement>(null);
  const bottomScrollRef = React.useRef<HTMLDivElement>(null);

  const handleTopScroll = () => {
    if (topScrollRef.current && bottomScrollRef.current) {
      bottomScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    }
  };

  const handleBottomScroll = () => {
    if (topScrollRef.current && bottomScrollRef.current) {
      topScrollRef.current.scrollLeft = bottomScrollRef.current.scrollLeft;
    }
  };

  // Quantidade de filtros avançados ativos
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.customerName) count++;
    if (appliedFilters.customerDoc) count++;
    if (appliedFilters.saleNumber) count++;
    if (appliedFilters.dateStart) count++;
    if (appliedFilters.dateEnd) count++;
    if (appliedFilters.professionalId !== 'ALL') count++;
    if (appliedFilters.paymentMethod !== 'ALL') count++;
    if (appliedFilters.minValue) count++;
    if (appliedFilters.maxValue) count++;
    if (appliedFilters.productName) count++;
    if (appliedFilters.productSku) count++;
    if (appliedFilters.commissionFilter !== 'ALL') count++;
    return count;
  }, [appliedFilters]);

  // Lista de formas de pagamento presentes no histórico
  const availablePaymentMethods = useMemo(() => {
    const methods = new Set<string>();
    sales.forEach((s) => {
      if (s.payment_method_name) methods.add(s.payment_method_name);
      else if (s.payment_method?.name) methods.add(s.payment_method.name);
    });
    // Adicionar métodos padrão se conjunto for pequeno
    ['PIX', 'Cartão de Crédito', 'Cartão de Débito', 'Boleto 30 Dias', 'Dinheiro'].forEach((m) =>
      methods.add(m)
    );
    return Array.from(methods).sort();
  }, [sales]);

  // Helper: normaliza acentos para busca tolerante (ex: "Triangulo" encontra "Triângulo")
  const normalizeStr = (str: string) =>
    str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  // Aplicação combinada de todos os filtros
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      // 1. Busca rápida superior
      const q = normalizeStr(filterQuery.trim());
      if (q) {
        const matchesQuery =
          String(s.sale_number).includes(q) ||
          (s.customer?.name && normalizeStr(s.customer.name).includes(q)) ||
          (s.professional?.name && normalizeStr(s.professional.name).includes(q));
        if (!matchesQuery) return false;
      }

      // 2. Status
      if (statusFilter !== 'ALL' && s.status !== statusFilter) {
        return false;
      }

      // 3. Filtros Avançados Combinados
      if (appliedFilters.customerName) {
        const cName = normalizeStr(s.customer?.name || '');
        if (!cName.includes(normalizeStr(appliedFilters.customerName.trim()))) return false;
      }

      if (appliedFilters.customerDoc) {
        const cleanFilterDoc = appliedFilters.customerDoc.replace(/\D/g, '');
        const cleanCustDoc = (s.customer?.document || '').replace(/\D/g, '');
        if (!cleanCustDoc.includes(cleanFilterDoc)) return false;
      }

      if (appliedFilters.saleNumber) {
        const targetNum = appliedFilters.saleNumber.replace(/\D/g, '');
        if (targetNum && !String(s.sale_number).includes(targetNum)) return false;
      }

      if (appliedFilters.dateStart) {
        const saleDate = new Date(s.sold_at);
        const startDate = new Date(`${appliedFilters.dateStart}T00:00:00`);
        if (saleDate < startDate) return false;
      }

      if (appliedFilters.dateEnd) {
        const saleDate = new Date(s.sold_at);
        const endDate = new Date(`${appliedFilters.dateEnd}T23:59:59`);
        if (saleDate > endDate) return false;
      }

      if (appliedFilters.professionalId !== 'ALL') {
        if (s.professional_id !== appliedFilters.professionalId) return false;
      }

      if (appliedFilters.paymentMethod !== 'ALL') {
        const sMethod = s.payment_method_name || s.payment_method?.name || '';
        if (sMethod.toLowerCase() !== appliedFilters.paymentMethod.toLowerCase()) return false;
      }

      if (appliedFilters.minValue) {
        const min = parseFloat(appliedFilters.minValue);
        if (!isNaN(min) && s.total < min) return false;
      }

      if (appliedFilters.maxValue) {
        const max = parseFloat(appliedFilters.maxValue);
        if (!isNaN(max) && s.total > max) return false;
      }

      if (appliedFilters.productName) {
        const pTerm = normalizeStr(appliedFilters.productName.trim());
        const hasProd = (s.items || []).some((item) =>
          normalizeStr(item.product?.name || '').includes(pTerm)
        );
        if (!hasProd) return false;
      }

      if (appliedFilters.productSku) {
        const skuTerm = appliedFilters.productSku.trim().toLowerCase();
        const hasSku = (s.items || []).some(
          (item) =>
            item.product?.sku?.toLowerCase().includes(skuTerm) ||
            item.product?.barcode?.toLowerCase().includes(skuTerm)
        );
        if (!hasSku) return false;
      }

      if (appliedFilters.commissionFilter === 'WITH_COMMISSION') {
        if (!s.commission_total || s.commission_total <= 0) return false;
      } else if (appliedFilters.commissionFilter === 'WITHOUT_COMMISSION') {
        if (s.commission_total && s.commission_total > 0) return false;
      }

      return true;
    });
  }, [sales, filterQuery, statusFilter, appliedFilters]);

  // Aplicar filtros avançados
  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedFilters({ ...advancedFilters });
  };

  // Limpar filtros avançados
  const handleClearFilters = () => {
    setAdvancedFilters(INITIAL_FILTERS);
    setAppliedFilters(INITIAL_FILTERS);
  };

  // Exportação dos dados filtrados
  const handleExport = (format: 'xlsx' | 'csv' | 'pdf') => {
    setIsExportMenuOpen(false);

    if (format === 'pdf') {
      window.print();
      return;
    }

    const dataToExport = filteredSales.map((s) => ({
      'Número da Venda': `#${formatSaleNumber(s.sale_number)}`,
      'Data': formatDateTime(s.sold_at),
      'Cliente': s.customer?.name || 'Não identificado',
      'CPF/CNPJ': s.customer?.document || '',
      'Profissional': s.professional?.name || 'Não vinculado',
      'Qtd. Itens': (s.items || []).reduce((acc, i) => acc + i.quantity, 0),
      'Valor Total (R$)': s.total.toFixed(2),
      'Comissão (R$)': (s.commission_total || 0).toFixed(2),
      'Forma de Pagamento': s.payment_method_name || s.payment_method?.name || 'PIX',
      'Status': s.status === 'COMPLETED' ? 'Concluída' : 'Cancelada',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    XLSX.utils.book_append_sheet(wb, ws, 'Vendas Filtradas');

    const filename = `vendas_negociapro_${new Date().toISOString().split('T')[0]}.${format}`;
    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Histórico de Vendas
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Acompanhe vendas faturadas, emissão de comprovantes não fiscais (A4 e Cupom 80mm) e filtros comerciais avançados.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* Botão Exportar Vendas Filtradas */}
          <div className="relative" ref={exportDropdownRef}>
            <button
              type="button"
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Exportar Vendas</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-30 animate-in fade-in zoom-in-95">
                <button
                  type="button"
                  onClick={() => handleExport('xlsx')}
                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Planilha Excel (.xlsx)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('csv')}
                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Arquivo CSV (.csv)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('pdf')}
                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center space-x-2 border-t border-slate-100"
                >
                  <Printer className="w-4 h-4 text-slate-600" />
                  <span>Imprimir / PDF Relatório</span>
                </button>
              </div>
            )}
          </div>

          <Link
            href="/vendas/nova"
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Venda</span>
          </Link>
        </div>
      </div>

      {/* Barra de Filtros Rápidos & Gatilho de Filtros Avançados */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-2 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Buscar por pedido, cliente ou profissional..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Botão Gatilho "Filtros" com badge */}
          <button
            type="button"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
              isFiltersOpen || activeFiltersCount > 0
                ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-2xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filtros</span>
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold ml-1">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Abas Rápidas de Status */}
        <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
            }`}
          >
            Todas ({sales.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('COMPLETED')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              statusFilter === 'COMPLETED' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'hover:text-slate-900'
            }`}
          >
            Concluídas ({sales.filter((s) => s.status === 'COMPLETED').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('QUOTE')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              statusFilter === 'QUOTE' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'hover:text-slate-900'
            }`}
          >
            Orçamentos ({sales.filter((s) => s.status === 'QUOTE').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('CANCELLED')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              statusFilter === 'CANCELLED' ? 'bg-white text-red-700 shadow-xs font-bold' : 'hover:text-slate-900'
            }`}
          >
            Canceladas ({sales.filter((s) => s.status === 'CANCELLED').length})
          </button>
        </div>
      </div>

      {/* Painel Colapsável de Filtros Avançados */}
      {isFiltersOpen && (
        <form
          onSubmit={handleApplyFilters}
          className="bg-white p-5 rounded-2xl border border-blue-200 shadow-lg space-y-4 animate-in fade-in zoom-in-95"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Filtros Avançados Combinados
              </h3>
            </div>
            {activeFiltersCount > 0 && (
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">
                {activeFiltersCount} filtro(s) ativo(s)
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 text-xs">
            {/* Cliente */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Cliente</label>
              <input
                type="text"
                value={advancedFilters.customerName}
                onChange={(e) =>
                  setAdvancedFilters({ ...advancedFilters, customerName: e.target.value })
                }
                placeholder="Ex: João da Silva"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* CPF / CNPJ */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                CPF / CNPJ do Cliente
              </label>
              <input
                type="text"
                value={advancedFilters.customerDoc}
                onChange={(e) =>
                  setAdvancedFilters({ ...advancedFilters, customerDoc: e.target.value })
                }
                placeholder="Apenas números ou formatado"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Número da Venda */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Número da Venda / Pedido
              </label>
              <input
                type="text"
                value={advancedFilters.saleNumber}
                onChange={(e) =>
                  setAdvancedFilters({ ...advancedFilters, saleNumber: e.target.value })
                }
                placeholder="Ex: 1001 ou 000001"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Profissional / Vendedor */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Profissional / Vendedor
              </label>
              <select
                value={advancedFilters.professionalId}
                onChange={(e) =>
                  setAdvancedFilters({ ...advancedFilters, professionalId: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value="ALL">Todos os Profissionais</option>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Data Inicial */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Data Inicial</label>
              <input
                type="date"
                value={advancedFilters.dateStart}
                onChange={(e) =>
                  setAdvancedFilters({ ...advancedFilters, dateStart: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Data Final */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Data Final</label>
              <input
                type="date"
                value={advancedFilters.dateEnd}
                onChange={(e) =>
                  setAdvancedFilters({ ...advancedFilters, dateEnd: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Forma de Pagamento */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Forma de Pagamento
              </label>
              <select
                value={advancedFilters.paymentMethod}
                onChange={(e) =>
                  setAdvancedFilters({ ...advancedFilters, paymentMethod: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value="ALL">Todas as Formas</option>
                {availablePaymentMethods.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro de Comissão */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Tipo de Comissão
              </label>
              <select
                value={advancedFilters.commissionFilter}
                onChange={(e) =>
                  setAdvancedFilters({
                    ...advancedFilters,
                    commissionFilter: e.target.value as any,
                  })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value="ALL">Todas as Vendas</option>
                <option value="WITH_COMMISSION">Venda com comissão</option>
                <option value="WITHOUT_COMMISSION">Venda sem comissão</option>
              </select>
            </div>

            {/* Valor Mínimo */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Valor Mínimo (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={advancedFilters.minValue}
                onChange={(e) =>
                  setAdvancedFilters({ ...advancedFilters, minValue: e.target.value })
                }
                placeholder="0,00"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Valor Máximo */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Valor Máximo (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={advancedFilters.maxValue}
                onChange={(e) =>
                  setAdvancedFilters({ ...advancedFilters, maxValue: e.target.value })
                }
                placeholder="99999,00"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Produto */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Nome do Produto
              </label>
              <input
                type="text"
                value={advancedFilters.productName}
                onChange={(e) =>
                  setAdvancedFilters({ ...advancedFilters, productName: e.target.value })
                }
                placeholder="Ex: Cimento, Piso..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Código do Produto */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Código do Produto (SKU)
              </label>
              <input
                type="text"
                value={advancedFilters.productSku}
                onChange={(e) =>
                  setAdvancedFilters({ ...advancedFilters, productSku: e.target.value })
                }
                placeholder="Ex: CIM-001"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Botões de Ação dos Filtros */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-[11px] text-slate-500 font-medium">
              Mostrando <strong>{filteredSales.length}</strong> de {sales.length} vendas
            </span>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center space-x-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpar filtros</span>
              </button>

              <button
                type="submit"
                className="inline-flex items-center space-x-1 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-95 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Aplicar filtros</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tabela Responsiva com Modo Card Mobile */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredSales.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingCart className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">Nenhuma venda encontrada</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {filterQuery || activeFiltersCount > 0
                ? 'Nenhum resultado corresponde aos critérios combinados de pesquisa.'
                : 'Você ainda não registrou nenhuma venda. Clique no botão abaixo para começar.'}
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              {(filterQuery || activeFiltersCount > 0) && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterQuery('');
                    handleClearFilters();
                  }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
                >
                  Limpar todos os filtros
                </button>
              )}
              <Link
                href="/vendas/nova"
                className="inline-flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Criar nova venda</span>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Barra de Rolagem Horizontal no Topo */}
            <div
              ref={topScrollRef}
              onScroll={handleTopScroll}
              className="hidden sm:block overflow-x-auto w-full max-w-full scrollbar-visible bg-slate-100/70 border-b border-slate-200 py-1 px-4"
              title="Barra de rolagem horizontal rápida (arraste para navegar)"
            >
              <div className="min-w-[1250px] h-[1px]" />
            </div>

            {/* Tabela com Scroll Horizontal Garantido */}
            <div
              ref={bottomScrollRef}
              onScroll={handleBottomScroll}
              className="hidden sm:block overflow-x-auto w-full max-w-full pb-4 scrollbar-visible"
            >
              <table className="w-full text-left text-xs min-w-[1250px]">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-4">Pedido</th>
                    <th className="p-4">Data</th>
                    <th className="p-4">Cliente</th>
                    <th className="p-4">Profissional</th>
                    <th className="p-4">Itens</th>
                    <th className="p-4 text-right">Comissão Total</th>
                    <th className="p-4 text-right">Valor Total</th>
                    <th className="p-4 text-center">Status Financeiro</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSales.map((sale) => {
                    const saleReceivables = receivables.filter((r) => r.sale_id === sale.id);
                    const isTerm = sale.payment_type && sale.payment_type !== 'A_VISTA';
                    const paidCount = saleReceivables.filter((r) => r.status === 'PAID').length;
                    const totalRec = saleReceivables.length;

                    return (
                    <tr key={sale.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4 font-black text-slate-900 whitespace-nowrap">
                        #{formatSaleNumber(sale.sale_number)}
                      </td>
                      <td className="p-4 text-slate-500 whitespace-nowrap">
                        {formatDate(sale.sold_at)}
                      </td>
                      <td className="p-4 font-bold text-slate-800">
                        <Link
                          href={`/clientes/${sale.customer_id}`}
                          className="hover:text-blue-600 transition-colors"
                        >
                          {sale.customer?.name}
                        </Link>
                        <span className="block text-[11px] text-slate-400 font-normal">
                          {sale.customer?.document}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600">
                        {sale.professional ? (
                          <span className="font-semibold text-slate-800 flex items-center space-x-1">
                            <Award className="w-3.5 h-3.5 text-blue-600" />
                            <span>{sale.professional.name}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Não vinculado</span>
                        )}
                      </td>
                      <td className="p-4 text-slate-600">
                        {sale.items?.length || 1} itens
                      </td>
                      <td className="p-4 text-right font-bold text-emerald-600 whitespace-nowrap">
                        {sale.commission_total > 0 ? formatCurrency(sale.commission_total) : '-'}
                      </td>
                      <td className="p-4 text-right font-black text-slate-900 whitespace-nowrap">
                        {formatCurrency(sale.total)}
                      </td>
                      <td className="p-4 text-center whitespace-nowrap">
                        {sale.status === 'QUOTE' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Orçamento (Em aberto)
                          </span>
                        ) : !isTerm ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            À vista (Caixa)
                          </span>
                        ) : totalRec === 0 ? (
                          <span className="text-slate-400 text-[10px]">A prazo</span>
                        ) : paidCount === totalRec ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {paidCount}/{totalRec} quitadas
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            {paidCount}/{totalRec} pagas ({totalRec - paidCount} em aberto)
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center whitespace-nowrap">
                        {sale.status === 'COMPLETED' ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Concluída
                          </span>
                        ) : sale.status === 'QUOTE' ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Orçamento
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                            Cancelada
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* Visualizar Venda / Orçamento */}
                          <button
                            type="button"
                            onClick={() => setSelectedSale(sale)}
                            title="Ver Detalhes"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Se for Orçamento: Ação rápida para Reabrir no PDV ou Finalizar */}
                          {sale.status === 'QUOTE' && (
                            <Link
                              href={`/vendas/nova?orcamento_id=${sale.id}${sale.customer_id ? `&cliente=${sale.customer_id}` : ''}`}
                              title="Reabrir / Finalizar Venda deste Orçamento no PDV"
                              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold flex items-center space-x-1 cursor-pointer"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              <span>Finalizar Venda</span>
                            </Link>
                          )}

                          {/* Se for Concluída: Ver Financeiro / Contas da Venda */}
                          {sale.status === 'COMPLETED' && saleReceivables.length > 0 && (
                            <Link
                              href={`/financeiro?aba=receber&venda=${sale.sale_number}`}
                              title="Ver Contas a Receber desta Venda"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <DollarSign className="w-4 h-4" />
                            </Link>
                          )}

                          {/* Ação Comprovante */}
                          {sale.status === 'COMPLETED' && (
                            <button
                              type="button"
                              onClick={() => setReceiptSale(sale)}
                              title="Emitir Comprovante Não Fiscal (A4 / Cupom)"
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-bold cursor-pointer"
                            >
                              <Receipt className="w-4 h-4" />
                            </button>
                          )}

                          {/* Repetir Negociação (Iniciar nova venda baseada neste pedido) */}
                          {sale.status === 'COMPLETED' && (
                            <Link
                              href={`/vendas/nova?cliente=${sale.customer_id || ''}&repetir_venda=${sale.id}`}
                              title="Iniciar nova venda repetindo itens deste pedido (não altera esta venda original)"
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <ShoppingCart className="w-4 h-4" />
                            </Link>
                          )}

                          {/* Editar Venda Finalizada (Restrito a Admin/Gerente) */}
                          {canEditFinishedSale && sale.status === 'COMPLETED' && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSale(sale);
                                setEditSaleReason('');
                                setEditSaleItems(sale.items?.map((it) => ({
                                  product_id: it.product_id,
                                  quantity: it.quantity,
                                  unit_price: it.unit_price,
                                  discount: it.discount || 0,
                                  total: it.total,
                                })) || []);
                              }}
                              title="Editar Venda Finalizada (Requer autorização gerencial)"
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}

                          {/* Ver Auditoria de Alterações */}
                          <button
                            type="button"
                            onClick={() => setAuditSaleId(sale.id)}
                            title="Ver Histórico de Auditoria"
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Calendar className="w-4 h-4" />
                          </button>

                          {/* Cancelar Venda / Orçamento (Apenas ADMIN ou GERENTE) */}
                          {canDeleteOrCancel && (sale.status === 'COMPLETED' || sale.status === 'QUOTE') && (
                            <button
                              type="button"
                              onClick={() => {
                                setSaleToCancel(sale);
                                setCancelReason('');
                                setCancelReasonError(null);
                              }}
                              title={sale.status === 'QUOTE' ? 'Cancelar orçamento' : 'Cancelar venda com auditoria'}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}

                          {/* Excluir Definitivamente (Apenas ADMIN ou GERENTE) */}
                          {canDeleteOrCancel && (
                            <button
                              type="button"
                              onClick={() => {
                                if (sale.status === 'QUOTE') {
                                  deleteSale(sale.id);
                                } else {
                                  setSaleToDelete(sale);
                                }
                              }}
                              title={sale.status === 'QUOTE' ? 'Excluir orçamento' : 'Excluir definitivamente (Admin/Gerente)'}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Modo Card Mobile */}
            <div className="sm:hidden divide-y divide-slate-100">
              {filteredSales.map((sale) => (
                <div key={sale.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900 text-sm">
                      #{formatSaleNumber(sale.sale_number)}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        sale.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : sale.status === 'QUOTE'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      {sale.status === 'COMPLETED' ? 'Concluída' : sale.status === 'QUOTE' ? 'Orçamento' : 'Cancelada'}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      {sale.customer?.trade_name || sale.customer?.name || 'Consumidor Final (Sem cliente)'}
                    </span>
                    <span className="text-[11px] text-slate-400">{formatDate(sale.sold_at)}</span>
                  </div>

                  {sale.professional && (
                    <div className="text-xs text-slate-600 flex items-center space-x-1">
                      <Award className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>
                        Profissional: <strong>{sale.professional.name}</strong>
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                    <div>
                      {sale.commission_total > 0 && (
                        <span className="text-[10px] text-emerald-700 block font-semibold">
                          Comissão: {formatCurrency(sale.commission_total)}
                        </span>
                      )}
                      <span className="text-sm font-black text-slate-900">
                        Total: {formatCurrency(sale.total)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      {/* Se for Orçamento: Ação em destaque para Editar / Finalizar Venda no celular */}
                      {sale.status === 'QUOTE' && (
                        <Link
                          href={`/vendas/nova?orcamento_id=${sale.id}${sale.customer_id ? `&cliente=${sale.customer_id}` : ''}`}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-xs cursor-pointer"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Finalizar Venda</span>
                        </Link>
                      )}

                      {/* Se for Concluída: Editar Venda Finalizada (Admin/Gerente) */}
                      {canEditFinishedSale && sale.status === 'COMPLETED' && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSale(sale);
                            setEditSaleReason('');
                            setEditSaleItems(
                              sale.items?.map((it) => ({
                                product_id: it.product_id,
                                quantity: it.quantity,
                                unit_price: it.unit_price,
                                discount: it.discount || 0,
                                total: it.total,
                              })) || []
                            );
                          }}
                          className="px-2.5 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                      )}

                      {/* Se for Concluída: Comprovante */}
                      {sale.status === 'COMPLETED' && (
                        <button
                          type="button"
                          onClick={() => setReceiptSale(sale)}
                          className="px-2.5 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>Comprovante</span>
                        </button>
                      )}

                      {/* Detalhes */}
                      <button
                        type="button"
                        onClick={() => setSelectedSale(sale)}
                        className="px-2.5 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Detalhes</span>
                      </button>

                      {/* Cancelar / Excluir no Mobile (Admin/Gerente) */}
                      {canDeleteOrCancel && (sale.status === 'COMPLETED' || sale.status === 'QUOTE') && (
                        <button
                          type="button"
                          onClick={() => {
                            if (sale.status === 'QUOTE') {
                              cancelSale(sale.id, 'Cancelado pelo usuário');
                            } else {
                              const reason = prompt('Informe o motivo do cancelamento:') || '';
                              cancelSale(sale.id, reason);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-amber-600 rounded-xl transition-colors cursor-pointer"
                          title={sale.status === 'QUOTE' ? 'Cancelar orçamento' : 'Cancelar venda'}
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}

                      {/* Excluir Orçamento direto no Mobile */}
                      {canDeleteOrCancel && sale.status === 'QUOTE' && (
                        <button
                          type="button"
                          onClick={() => deleteSale(sale.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
                          title="Excluir orçamento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal de Detalhes da Venda */}
      {selectedSale && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedSale(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto cursor-pointer"
        >
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl p-6 border border-slate-200 animate-in fade-in zoom-in-95 my-8 cursor-default">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-black text-slate-900">
                    Venda #{formatSaleNumber(selectedSale.sale_number)}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedSale.status === 'COMPLETED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {selectedSale.status === 'COMPLETED' ? 'Concluída' : 'Cancelada'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Realizada em {formatDateTime(selectedSale.sold_at)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSale(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Informações Gerais */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Cliente</span>
                <span className="font-bold text-slate-900 block mt-0.5">
                  {selectedSale.customer?.name}
                </span>
                <span className="text-slate-500 text-[11px]">{selectedSale.customer?.document}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Profissional Responsável
                </span>
                <span className="font-bold text-blue-700 block mt-0.5">
                  {selectedSale.professional?.name || 'Nenhum profissional vinculado'}
                </span>
                <span className="text-slate-500 text-[11px]">
                  {selectedSale.professional?.role_title || ''}
                </span>
              </div>
            </div>

            {/* Itens da Venda */}
            <div className="mt-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Itens e Snapshots de Negociação
              </span>
              <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs">
                {selectedSale.items && selectedSale.items.length > 0 ? (
                  selectedSale.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                    >
                      <div>
                        <span className="font-bold text-slate-900 block">
                          {item.product?.name || 'Produto'}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {item.quantity} {item.product?.unit || 'UN'} × {formatCurrency(item.unit_price)}
                          {item.discount > 0 && ` (Desconto: ${formatCurrency(item.discount)})`}
                        </span>
                      </div>
                      <div className="sm:text-right">
                        <span className="font-black text-slate-900 block">
                          {formatCurrency(item.total)}
                        </span>
                        {item.commission_amount !== undefined && item.commission_amount > 0 && (
                          <span className="text-[11px] text-emerald-700 font-semibold block">
                            Comissão (
                            {item.commission_type_snapshot === 'PERCENTAGE'
                              ? `${item.commission_value_snapshot}%`
                              : `${formatCurrency(item.commission_value_snapshot)}/un`}
                            ): {formatCurrency(item.commission_amount)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-slate-400">
                    Nenhum item discriminado registrado para esta venda.
                  </div>
                )}
              </div>
            </div>

            {/* Totais Consolidados */}
            <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span>{formatCurrency(selectedSale.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Desconto Total:</span>
                <span className="text-red-600 font-medium">
                  - {formatCurrency(selectedSale.discount)}
                </span>
              </div>
              <div className="flex justify-between text-slate-700 font-semibold">
                <span>Comissão Total Gravada:</span>
                <span className="text-emerald-700 font-bold">
                  {formatCurrency(selectedSale.commission_total || 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>Valor Final Pago:</span>
                <span className="text-lg text-blue-700">{formatCurrency(selectedSale.total)}</span>
              </div>
            </div>

            {selectedSale.notes && (
              <div className="mt-3 p-3 rounded-xl bg-slate-100/70 text-[11px] text-slate-600">
                <strong>Observações:</strong> {selectedSale.notes}
              </div>
            )}

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {/* Se for Orçamento: Botão de Finalizar Venda */}
                {selectedSale.status === 'QUOTE' && (
                  <Link
                    href={`/vendas/nova?orcamento_id=${selectedSale.id}${selectedSale.customer_id ? `&cliente=${selectedSale.customer_id}` : ''}`}
                    onClick={() => setSelectedSale(null)}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-95 cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Finalizar / Faturar Orçamento</span>
                  </Link>
                )}

                {/* Se for Concluída: Emitir Comprovante */}
                {selectedSale.status === 'COMPLETED' && (
                  <button
                    type="button"
                    onClick={() => {
                      setReceiptSale(selectedSale);
                      setSelectedSale(null);
                    }}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                  >
                    <Receipt className="w-4 h-4" />
                    <span>Emitir Comprovante</span>
                  </button>
                )}

                {/* Se for Concluída: Repetir Negociação */}
                {selectedSale.status === 'COMPLETED' && (
                  <Link
                    href={`/vendas/nova?cliente=${selectedSale.customer_id || ''}&repetir_venda=${selectedSale.id}`}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-95"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Repetir Negociação</span>
                  </Link>
                )}

                {/* Editar Venda Finalizada */}
                {canEditFinishedSale && selectedSale.status === 'COMPLETED' && (
                  <button
                    type="button"
                    onClick={() => {
                      const s = selectedSale;
                      setSelectedSale(null);
                      setEditingSale(s);
                      setEditSaleReason('');
                      setEditSaleItems(
                        s.items?.map((it) => ({
                          product_id: it.product_id,
                          quantity: it.quantity,
                          unit_price: it.unit_price,
                          discount: it.discount || 0,
                          total: it.total,
                        })) || []
                      );
                    }}
                    className="inline-flex items-center space-x-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Editar Venda</span>
                  </button>
                )}

                {canDeleteOrCancel && (selectedSale.status === 'COMPLETED' || selectedSale.status === 'QUOTE') && (
                  <button
                    type="button"
                    onClick={() => {
                      const s = selectedSale;
                      setSelectedSale(null);
                      setSaleToCancel(s);
                      setCancelReason('');
                      setCancelReasonError(null);
                    }}
                    className="inline-flex items-center space-x-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>{selectedSale.status === 'QUOTE' ? 'Cancelar Orçamento' : 'Cancelar Venda'}</span>
                  </button>
                )}

                {canDeleteOrCancel && (
                  <button
                    type="button"
                    onClick={() => {
                      setSaleToDelete(selectedSale);
                      setSelectedSale(null);
                    }}
                    className="inline-flex items-center space-x-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Excluir Venda</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedSale(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Comprovante Não Fiscal (A4 & Cupom 80mm) */}
      {receiptSale && (
        <SaleReceiptModal
          sale={receiptSale}
          onClose={() => setReceiptSale(null)}
        />
      )}

      {/* Modal de Edição de Venda Finalizada (Restrito a Admin/Gerente) */}
      {editingSale && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Editar Venda Concluída #{formatSaleNumber(editingSale.sale_number)}
                  </h3>
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    Ação Gerencial Restrita • Gera Auditoria
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingSale(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 pr-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Justificativa da Alteração *
                </label>
                <input
                  type="text"
                  required
                  value={editSaleReason}
                  onChange={(e) => setEditSaleReason(e.target.value)}
                  placeholder="Ex: Correção de quantidade acordada com o cliente"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Itens da Venda (Ajuste de Quantidade e Preço)
                </label>
                <div className="space-y-2">
                  {editSaleItems.map((item, idx) => {
                    const prod = editingSale.items?.find((it) => it.product_id === item.product_id)?.product;
                    return (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                        <span className="font-bold text-slate-800 block">
                          {prod?.name || `Produto #${item.product_id}`}
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <span className="text-[10px] text-slate-500 font-bold block mb-0.5">Quantidade</span>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => {
                                const newQty = Math.max(1, Number(e.target.value));
                                const updated = [...editSaleItems];
                                updated[idx] = {
                                  ...updated[idx],
                                  quantity: newQty,
                                  total: Math.max(0, newQty * updated[idx].unit_price - updated[idx].discount),
                                };
                                setEditSaleItems(updated);
                              }}
                              className="w-full bg-white border border-slate-200 rounded-lg p-1.5 font-bold"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 font-bold block mb-0.5">Preço Unit. (R$)</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.unit_price}
                              onChange={(e) => {
                                const newPrice = Math.max(0, Number(e.target.value));
                                const updated = [...editSaleItems];
                                updated[idx] = {
                                  ...updated[idx],
                                  unit_price: newPrice,
                                  total: Math.max(0, updated[idx].quantity * newPrice - updated[idx].discount),
                                };
                                setEditSaleItems(updated);
                              }}
                              className="w-full bg-white border border-slate-200 rounded-lg p-1.5 font-bold"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 font-bold block mb-0.5">Total Item</span>
                            <div className="p-1.5 bg-slate-100 rounded-lg font-black text-slate-900">
                              {formatCurrency(item.total)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs flex justify-between font-black">
                <span className="text-blue-900">Novo Total da Venda:</span>
                <span className="text-blue-700">
                  {formatCurrency(editSaleItems.reduce((acc, it) => acc + it.total, 0))}
                </span>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingSale(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!editSaleReason.trim()) {
                    alert('Por favor, informe a justificativa da alteração para registro em auditoria.');
                    return;
                  }
                  const res = updateFinishedSale({
                    sale_id: editingSale.id,
                    saleData: {
                      items: editSaleItems,
                      notes: editingSale.notes ? `${editingSale.notes} | Editado: ${editSaleReason}` : `Editado: ${editSaleReason}`,
                    },
                    reason: editSaleReason,
                  });

                  if (res && res.success) {
                    alert('Venda atualizada com sucesso! Estoque diferencial, financeiro e comissões foram recalculados.');
                    setEditingSale(null);
                  } else if (res && !res.success) {
                    alert(res.message || 'Erro ao atualizar venda.');
                  }
                }}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
              >
                Salvar e Recalcular Impactos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Histórico de Auditoria */}
      {auditSaleId && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-black text-slate-900">Histórico de Auditoria</h3>
              </div>
              <button
                type="button"
                onClick={() => setAuditSaleId(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-2.5 pr-1">
              {(() => {
                const logs = saleAuditLogs.filter((l) => l.sale_id === auditSaleId);
                if (logs.length === 0) {
                  return (
                    <div className="p-8 text-center text-xs text-slate-400">
                      Nenhum registro de auditoria especial gerado para este pedido ainda.
                    </div>
                  );
                }

                return logs.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-xs">
                    <div className="flex items-center justify-between font-bold">
                      <span className="px-2 py-0.5 rounded-md text-[10px] bg-blue-100 text-blue-800">
                        {log.action}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <div className="text-slate-700">
                      <strong>Responsável:</strong> {log.user_name}
                    </div>
                    {log.reason && (
                      <div className="text-slate-600">
                        <strong>Motivo:</strong> {log.reason}
                      </div>
                    )}
                  </div>
                ));
              })()}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAuditSaleId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Moderno de Confirmação de Exclusão Definitiva (Elimina confirm nativo do browser) */}
      {saleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform animate-in zoom-in-95 duration-200">
            {/* Header com Ícone de Alerta Vermelho */}
            <div className="p-6 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 text-red-600 flex items-center justify-center mx-auto shadow-2xs">
                <Trash2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Excluir Definitivamente?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                Você está prestes a excluir definitivamente o registro da venda{' '}
                <strong className="text-slate-800">#{formatSaleNumber(saleToDelete.sale_number)}</strong>. Esta ação é irreversível.
              </p>
            </div>

            {/* Informações da Venda a Excluir */}
            <div className="px-6 pb-2">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Cliente</span>
                  <span className="font-bold text-slate-800 truncate max-w-[200px]">
                    {saleToDelete.customer?.trade_name || saleToDelete.customer?.name || 'Consumidor Final'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Valor Total</span>
                  <span className="font-black text-slate-900">
                    {formatCurrency(saleToDelete.total)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Status Atual</span>
                  <span className="font-semibold text-slate-700">
                    {saleToDelete.status === 'COMPLETED' ? 'Venda Concluída' : saleToDelete.status === 'CANCELLED' ? 'Cancelada' : 'Orçamento'}
                  </span>
                </div>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="p-6 pt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSaleToDelete(null)}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all text-center cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => {
                  deleteSale(saleToDelete.id);
                  setSaleToDelete(null);
                }}
                className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-600/20 text-center flex items-center justify-center space-x-1.5 cursor-pointer active:scale-98"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cancelamento de Venda com Justificativa Elegante */}
      {saleToCancel && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            {/* Cabeçalho */}
            <div className="p-6 pb-3 text-center space-y-2">
              <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200/60 shadow-inner">
                <XCircle className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                {saleToCancel.status === 'QUOTE' ? 'Cancelar Orçamento?' : 'Cancelar Venda com Auditoria'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                {saleToCancel.status === 'QUOTE'
                  ? `Deseja cancelar o orçamento #${formatSaleNumber(saleToCancel.sale_number)}?`
                  : `Você está cancelando a venda #${formatSaleNumber(saleToCancel.sale_number)}. Esta operação será registrada no histórico de auditoria.`}
              </p>
            </div>

            {/* Informações da Venda */}
            <div className="px-6 pb-3">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Cliente</span>
                  <span className="font-bold text-slate-800 truncate max-w-[200px]">
                    {saleToCancel.customer?.trade_name || saleToCancel.customer?.name || 'Consumidor Final'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Valor Total</span>
                  <span className="font-black text-slate-900">
                    {formatCurrency(saleToCancel.total)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Tipo</span>
                  <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    {saleToCancel.status === 'QUOTE' ? 'Orçamento' : 'Venda Concluída'}
                  </span>
                </div>
              </div>
            </div>

            {/* Campo de Motivo do Cancelamento */}
            <div className="px-6 pb-2 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Motivo do cancelamento <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => {
                  setCancelReason(e.target.value);
                  if (cancelReasonError && e.target.value.trim()) {
                    setCancelReasonError(null);
                  }
                }}
                placeholder="Ex: Desistência do cliente, erro no lançamento do produto, devolução..."
                className={`w-full bg-slate-50 border ${
                  cancelReasonError ? 'border-red-400 focus:border-red-500 ring-1 ring-red-400' : 'border-slate-200 focus:border-amber-500'
                } rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium outline-hidden transition-all placeholder:text-slate-400 resize-none`}
              />
              {cancelReasonError ? (
                <p className="text-[11px] font-semibold text-red-600">
                  {cancelReasonError}
                </p>
              ) : (
                <p className="text-[11px] text-slate-400">
                  A justificativa fica salva no relatório de auditoria e cancelamentos.
                </p>
              )}
            </div>

            {/* Botões de Ação */}
            <div className="p-6 pt-3 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setSaleToCancel(null);
                  setCancelReason('');
                  setCancelReasonError(null);
                }}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all text-center cursor-pointer"
              >
                Voltar
              </button>

              <button
                type="button"
                onClick={() => {
                  const trimmed = cancelReason.trim();
                  if (!trimmed) {
                    setCancelReasonError('Por favor, informe uma justificativa para o cancelamento.');
                    return;
                  }
                  cancelSale(saleToCancel.id, trimmed);
                  setSaleToCancel(null);
                  setCancelReason('');
                  setCancelReasonError(null);
                }}
                className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-600/20 text-center flex items-center justify-center space-x-1.5 cursor-pointer active:scale-98"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Confirmar Cancelamento</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
