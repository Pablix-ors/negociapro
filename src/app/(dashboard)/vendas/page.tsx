'use client';

import React, { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
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
  const { sales, professionals, receivables, cancelSale, deleteSale } = useData();
  const [filterQuery, setFilterQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'CANCELLED'>('ALL');

  // Painel de Filtros Avançados
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<AdvancedFilters>(INITIAL_FILTERS);

  // Modais de Venda
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [receiptSale, setReceiptSale] = useState<Sale | null>(null);

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

  // Aplicação combinada de todos os filtros
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      // 1. Busca rápida superior
      const q = filterQuery.trim().toLowerCase();
      if (q) {
        const matchesQuery =
          String(s.sale_number).includes(q) ||
          (s.customer?.name && s.customer.name.toLowerCase().includes(q)) ||
          (s.professional?.name && s.professional.name.toLowerCase().includes(q));
        if (!matchesQuery) return false;
      }

      // 2. Status
      if (statusFilter !== 'ALL' && s.status !== statusFilter) {
        return false;
      }

      // 3. Filtros Avançados Combinados
      if (appliedFilters.customerName) {
        const cName = s.customer?.name?.toLowerCase() || '';
        if (!cName.includes(appliedFilters.customerName.trim().toLowerCase())) return false;
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
        const pTerm = appliedFilters.productName.trim().toLowerCase();
        const hasProd = (s.items || []).some((item) =>
          item.product?.name?.toLowerCase().includes(pTerm)
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
            className={`px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
            }`}
          >
            Todas ({sales.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('COMPLETED')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === 'COMPLETED' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'hover:text-slate-900'
            }`}
          >
            Concluídas ({sales.filter((s) => s.status === 'COMPLETED').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('CANCELLED')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
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
                        {!isTerm ? (
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
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                            Cancelada
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* Visualizar Venda */}
                          <button
                            type="button"
                            onClick={() => setSelectedSale(sale)}
                            title="Ver Detalhes da Venda"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Ver Financeiro / Contas da Venda */}
                          {saleReceivables.length > 0 && (
                            <Link
                              href={`/financeiro?aba=receber&venda=${sale.sale_number}`}
                              title="Ver Contas a Receber desta Venda"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <DollarSign className="w-4 h-4" />
                            </Link>
                          )}

                          {/* Ação Comprovante */}
                          <button
                            type="button"
                            onClick={() => setReceiptSale(sale)}
                            title="Emitir Comprovante Não Fiscal (A4 / Cupom)"
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-bold cursor-pointer"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>

                          {/* Repetir Venda */}
                          <Link
                            href={`/vendas/nova?cliente=${sale.customer_id}&repetir_venda=${sale.id}`}
                            title="Iniciar nova venda repetindo itens deste pedido"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <ShoppingCart className="w-4 h-4" />
                          </Link>

                          {/* Cancelar Venda */}
                          {sale.status === 'COMPLETED' && (
                            <button
                              type="button"
                              onClick={() => cancelSale(sale.id)}
                              title="Cancelar venda com segurança"
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}

                          {/* Excluir Venda Definitivamente */}
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Tem certeza que deseja excluir definitivamente a venda #${formatSaleNumber(sale.sale_number)}? Esta ação é irreversível.`)) {
                                deleteSale(sale.id);
                              }
                            }}
                            title="Excluir venda definitivamente"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
                <div key={sale.id} className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900 text-sm">
                      #{formatSaleNumber(sale.sale_number)}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        sale.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {sale.status === 'COMPLETED' ? 'Concluída' : 'Cancelada'}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      {sale.customer?.name}
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

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setReceiptSale(sale)}
                        className="px-2.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center space-x-1"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Comprovante</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedSale(sale)}
                        className="px-2.5 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold flex items-center space-x-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Detalhes</span>
                      </button>
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
                {selectedSale.items?.map((item, idx) => (
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
                ))}
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
              <div className="flex items-center space-x-2">
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

                <Link
                  href={`/vendas/nova?cliente=${selectedSale.customer_id}&repetir_venda=${selectedSale.id}`}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-95"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Repetir Pedido</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Tem certeza que deseja excluir definitivamente a venda #${formatSaleNumber(selectedSale.sale_number)}? Esta ação é irreversível.`)) {
                      deleteSale(selectedSale.id);
                      setSelectedSale(null);
                    }
                  }}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Excluir Venda</span>
                </button>
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
    </div>
  );
}
