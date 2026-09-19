'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
import { formatCurrency } from '@/lib/formatters';
import { Product } from '@/types/database';
import {
  downloadProductExcelTemplate,
  validateImportedProducts,
  exportProductsToFile,
  ImportErrorItem,
} from '@/lib/excelProducts';
import * as XLSX from 'xlsx';
import {
  Package,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
  Boxes,
  PlusCircle,
  MinusCircle,
  TrendingDown,
  Download,
  Upload,
  FileSpreadsheet,
  X,
  Check,
  AlertCircle,
  Image as ImageIcon,
  DollarSign,
  Percent,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

export default function ProdutosPage() {
  const { products, adjustStock, addProduct, updateProduct, bulkImportProducts } = useData();
  const [filterQuery, setFilterQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'LOW' | 'NORMAL'>('ALL');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Filtros avançados
  const [brandFilter, setBrandFilter] = useState('');
  const [commissionFilter, setCommissionFilter] = useState<'ALL' | 'NONE' | 'PERCENTAGE' | 'FIXED'>('ALL');
  const [minPriceFilter, setMinPriceFilter] = useState('');
  const [maxPriceFilter, setMaxPriceFilter] = useState('');
  const [minStockFilter, setMinStockFilter] = useState('');
  const [maxStockFilter, setMaxStockFilter] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Estado do Modal de Ajuste de Estoque
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'IN' | 'OUT'>('IN');
  const [adjustQty, setAdjustQty] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState<string>('Reposição de fornecedor');

  // Estado do Modal de Importação Excel
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [previewProducts, setPreviewProducts] = useState<any[]>([]);
  const [previewUpdates, setPreviewUpdates] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<ImportErrorItem[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  // Estado do Dropdown de Exportação
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  const filteredProducts = products.filter((p) => {
    const matchesQuery =
      p.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(filterQuery.toLowerCase())) ||
      (p.brand && p.brand.toLowerCase().includes(filterQuery.toLowerCase()));

    const isLow = p.current_stock <= p.min_stock;
    const matchesStock =
      stockFilter === 'ALL' ||
      (stockFilter === 'LOW' && isLow) ||
      (stockFilter === 'NORMAL' && !isLow);

    const matchesActive =
      activeFilter === 'ALL' ||
      (activeFilter === 'ACTIVE' && p.active) ||
      (activeFilter === 'INACTIVE' && !p.active);

    // Filtros avançados
    const matchesBrand = !brandFilter || (p.brand || '').toLowerCase().includes(brandFilter.toLowerCase());
    const matchesCommission = commissionFilter === 'ALL' || p.commission_type === commissionFilter;
    const matchesMinPrice = !minPriceFilter || p.selling_price >= Number(minPriceFilter);
    const matchesMaxPrice = !maxPriceFilter || p.selling_price <= Number(maxPriceFilter);
    const matchesMinStock = !minStockFilter || p.current_stock >= Number(minStockFilter);
    const matchesMaxStock = !maxStockFilter || p.current_stock <= Number(maxStockFilter);

    return matchesQuery && matchesStock && matchesActive &&
      matchesBrand && matchesCommission &&
      matchesMinPrice && matchesMaxPrice &&
      matchesMinStock && matchesMaxStock;
  });

  // Marcas únicas para o dropdown de filtro
  const allBrands = Array.from(new Set(products.map((p) => p.brand).filter(Boolean) as string[])).sort();

  // Contagem de filtros avançados ativos
  const advancedFilterCount = [
    brandFilter, commissionFilter !== 'ALL' ? commissionFilter : '',
    minPriceFilter, maxPriceFilter, minStockFilter, maxStockFilter,
    activeFilter !== 'ALL' ? activeFilter : '',
  ].filter(Boolean).length;

  const resetAllFilters = () => {
    setFilterQuery('');
    setStockFilter('ALL');
    setActiveFilter('ALL');
    setBrandFilter('');
    setCommissionFilter('ALL');
    setMinPriceFilter('');
    setMaxPriceFilter('');
    setMinStockFilter('');
    setMaxStockFilter('');
  };

  // Estatísticas rápidas de estoque
  const totalStockItems = products.reduce((acc, p) => acc + p.current_stock, 0);
  const lowStockCount = products.filter((p) => p.current_stock <= p.min_stock).length;

  const handleApplyAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || adjustQty <= 0) return;

    const change = adjustmentType === 'IN' ? adjustQty : -adjustQty;
    adjustStock(selectedProduct.id, change, adjustReason);
    setSelectedProduct(null);
    setAdjustQty(10);
  };

  // Leitura do arquivo Excel para Importação
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportSuccessMessage(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawJson = XLSX.utils.sheet_to_json(sheet);

        const existingProducts = products.map((p) => ({ id: p.id, sku: p.sku ?? null }));
        const { newProducts, updateProducts, errors } = validateImportedProducts(rawJson, existingProducts);

        setPreviewProducts(newProducts);
        setPreviewUpdates(updateProducts);
        setImportErrors(errors);
      } catch (err) {
        setImportErrors([{ row: 0, field: 'Arquivo', message: 'Erro ao processar planilha. Verifique se é um arquivo Excel ou CSV válido.' }]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Executar Importação dos produtos válidos
  const handleConfirmImport = () => {
    if (previewProducts.length === 0 && previewUpdates.length === 0) return;

    setIsImporting(true);

    // Uma única operação atômica — evita condição de corrida com estado stale do React
    const { added, updated } = bulkImportProducts(previewProducts, previewUpdates);

    setIsImporting(false);

    const parts: string[] = [];
    if (added > 0) parts.push(`${added} produto(s) adicionado(s)`);
    if (updated > 0) parts.push(`${updated} produto(s) atualizado(s)`);
    setImportSuccessMessage(parts.join(' e ') + ' com sucesso!');

    setPreviewProducts([]);
    setPreviewUpdates([]);
    setImportFile(null);
    setTimeout(() => {
      setImportModalOpen(false);
      setImportSuccessMessage(null);
    }, 2500);
  };

  // Exportar produtos por critério
  const handleExport = (target: 'all' | 'filtered' | 'active' | 'inactive', format: 'xlsx' | 'csv') => {
    let toExport = products;
    if (target === 'filtered') {
      toExport = filteredProducts;
    } else if (target === 'active') {
      toExport = products.filter((p) => p.active);
    } else if (target === 'inactive') {
      toExport = products.filter((p) => !p.active);
    }

    exportProductsToFile(toExport, format);
    setExportDropdownOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Catálogo & Controle de Estoque
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Controle níveis de estoque em tempo real, fotos, comissões de venda e importação/exportação em massa.
          </p>
        </div>

        {/* Barra de Ações: Novo Produto, Importar, Exportar, Modelo */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Baixar Modelo de Importação */}
          <button
            type="button"
            onClick={downloadProductExcelTemplate}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
            title="Baixar Planilha Exemplo com Instruções"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Baixar Modelo Excel</span>
            <span className="inline sm:hidden">Modelo</span>
          </button>

          {/* Importar Produtos */}
          <button
            type="button"
            onClick={() => setImportModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Importar Excel</span>
          </button>

          {/* Exportar Produtos (Dropdown) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Exportar</span>
            </button>

            {exportDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Opções de Exportação
                </div>
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => handleExport('all', 'xlsx')}
                    className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span>Todos os Produtos (.xlsx)</span>
                    <span className="text-[10px] font-mono text-slate-400">({products.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExport('filtered', 'xlsx')}
                    className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span>Produtos Filtrados (.xlsx)</span>
                    <span className="text-[10px] font-mono text-slate-400">({filteredProducts.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExport('active', 'xlsx')}
                    className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    <span>Apenas Ativos (.xlsx)</span>
                  </button>
                  <div className="border-t border-slate-100 my-1" />
                  <button
                    type="button"
                    onClick={() => handleExport('all', 'csv')}
                    className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    <span>Exportar Todos em CSV</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <Link
            href="/produtos/novo"
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Produto</span>
          </Link>
        </div>
      </div>

      {/* Cards de Métricas de Estoque */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400">Total de Produtos</span>
            <p className="text-xl font-black text-slate-900 mt-0.5">{products.length} cadastrados</p>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400">Saldo Físico Total</span>
            <p className="text-xl font-black text-slate-900 mt-0.5">{totalStockItems.toLocaleString('pt-BR')} unidades</p>
          </div>
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400">Estoque Crítico (Abaixo do Mínimo)</span>
            <p className="text-xl font-black text-red-600 mt-0.5">{lowStockCount} produtos</p>
          </div>
          <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3 p-4">
        {/* Linha 1: Busca + botões de ação */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Buscar por nome do produto, SKU ou marca..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Botão Filtros Avançados */}
            <button
              type="button"
              onClick={() => setShowAdvancedFilters((v) => !v)}
              className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                showAdvancedFilters || advancedFilterCount > 0
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Filtros</span>
              {advancedFilterCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-white text-blue-700 rounded-full text-[10px] font-black">
                  {advancedFilterCount}
                </span>
              )}
            </button>

            {/* Filtro rápido estoque */}
            <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
              <button
                type="button"
                onClick={() => setStockFilter('ALL')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  stockFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setStockFilter('LOW')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  stockFilter === 'LOW' ? 'bg-white text-red-700 shadow-xs font-bold' : 'hover:text-slate-900'
                }`}
              >
                Crítico ({lowStockCount})
              </button>
              <button
                type="button"
                onClick={() => setStockFilter('NORMAL')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  stockFilter === 'NORMAL' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'hover:text-slate-900'
                }`}
              >
                Regular
              </button>
            </div>

            {/* Resultado + limpar */}
            <span className="text-xs text-slate-500 font-semibold">
              {filteredProducts.length} de {products.length}
            </span>
            {(filterQuery || stockFilter !== 'ALL' || advancedFilterCount > 0) && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 text-xs font-bold hover:bg-red-100 transition-all"
                title="Limpar todos os filtros"
              >
                <X className="w-3 h-3" />
                <span>Limpar</span>
              </button>
            )}
          </div>
        </div>

        {/* Painel de Filtros Avançados */}
        {showAdvancedFilters && (
          <div className="border-t border-slate-100 pt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {/* Marca / Fabricante */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Marca / Fabricante</label>
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas as marcas</option>
                {allBrands.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Tipo de Comissão */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Comissão</label>
              <select
                value={commissionFilter}
                onChange={(e) => setCommissionFilter(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Qualquer</option>
                <option value="NONE">Sem comissão</option>
                <option value="PERCENTAGE">Percentual (%)</option>
                <option value="FIXED">Valor fixo (R$)</option>
              </select>
            </div>

            {/* Status Ativo/Inativo */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status</label>
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Todos</option>
                <option value="ACTIVE">Apenas Ativos</option>
                <option value="INACTIVE">Apenas Inativos</option>
              </select>
            </div>

            {/* Faixa de Preço de Venda */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Preço de Venda (R$)</label>
              <div className="flex items-center space-x-1.5">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={minPriceFilter}
                  onChange={(e) => setMinPriceFilter(e.target.value)}
                  placeholder="Mín"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-slate-400 text-xs font-bold shrink-0">até</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={maxPriceFilter}
                  onChange={(e) => setMaxPriceFilter(e.target.value)}
                  placeholder="Máx"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Faixa de Estoque */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Estoque Atual (Qtd)</label>
              <div className="flex items-center space-x-1.5">
                <input
                  type="number"
                  min="0"
                  value={minStockFilter}
                  onChange={(e) => setMinStockFilter(e.target.value)}
                  placeholder="Mín"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-slate-400 text-xs font-bold shrink-0">até</span>
                <input
                  type="number"
                  min="0"
                  value={maxStockFilter}
                  onChange={(e) => setMaxStockFilter(e.target.value)}
                  placeholder="Máx"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Chips dos filtros ativos */}
            {advancedFilterCount > 0 && (
              <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4 flex flex-wrap gap-1.5 pt-1">
                {brandFilter && (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-[11px] font-bold">
                    <span>Marca: {brandFilter}</span>
                    <button onClick={() => setBrandFilter('')}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {commissionFilter !== 'ALL' && (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[11px] font-bold">
                    <span>Comissão: {commissionFilter === 'NONE' ? 'Sem' : commissionFilter === 'PERCENTAGE' ? '%' : 'Fixo'}</span>
                    <button onClick={() => setCommissionFilter('ALL')}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {activeFilter !== 'ALL' && (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-purple-100 text-purple-800 rounded-full text-[11px] font-bold">
                    <span>Status: {activeFilter === 'ACTIVE' ? 'Ativos' : 'Inativos'}</span>
                    <button onClick={() => setActiveFilter('ALL')}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {(minPriceFilter || maxPriceFilter) && (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-[11px] font-bold">
                    <span>Preço: R$ {minPriceFilter || '0'} – {maxPriceFilter || '∞'}</span>
                    <button onClick={() => { setMinPriceFilter(''); setMaxPriceFilter(''); }}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {(minStockFilter || maxStockFilter) && (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-rose-100 text-rose-800 rounded-full text-[11px] font-bold">
                    <span>Estoque: {minStockFilter || '0'} – {maxStockFilter || '∞'}</span>
                    <button onClick={() => { setMinStockFilter(''); setMaxStockFilter(''); }}><X className="w-3 h-3" /></button>
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lista Responsiva: Cards em Mobile e Tabela em Desktop */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">Nenhum produto encontrado</h3>
            <p className="text-xs text-slate-400 mt-1">Ajuste os filtros de busca para encontrar o item desejado.</p>
          </div>
        ) : (
          <>
            {/* Tabela Desktop */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-4">Produto</th>
                    <th className="p-4">SKU / Cód.</th>
                    <th className="p-4">Comissão</th>
                    <th className="p-4 text-right">Preço Venda</th>
                    <th className="p-4 text-right">Preço Mínimo</th>
                    <th className="p-4 text-center">Estoque Atual</th>
                    <th className="p-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((prod) => {
                    const isLow = prod.current_stock <= prod.min_stock;
                    return (
                      <tr key={prod.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-4 font-bold text-slate-900">
                          <div className="flex items-center space-x-3">
                            {prod.image_url ? (
                              <img
                                src={prod.image_url}
                                alt={prod.name}
                                className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                                <Package className="w-5 h-5" />
                              </div>
                            )}
                            <div>
                              <Link
                                href={`/produtos/${prod.id}`}
                                className="hover:text-blue-600 transition-colors block"
                              >
                                {prod.name}
                              </Link>
                              <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-normal mt-0.5">
                                {prod.brand && <span>Marca: <strong>{prod.brand}</strong></span>}
                                {prod.brand && <span>•</span>}
                                <span>Unidade: <strong className="text-slate-800">{prod.unit}</strong></span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-slate-600 whitespace-nowrap">
                          {prod.sku || '-'}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          {prod.commission_type === 'PERCENTAGE' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              {prod.commission_value}% por venda
                            </span>
                          ) : prod.commission_type === 'FIXED' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {formatCurrency(prod.commission_value)} / un
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">Sem comissão</span>
                          )}
                        </td>
                        <td className="p-4 text-right font-black text-slate-900 whitespace-nowrap">
                          {formatCurrency(prod.selling_price)}
                        </td>
                        <td className="p-4 text-right font-bold text-amber-700 whitespace-nowrap">
                          {formatCurrency(prod.min_price)}
                        </td>
                        <td className="p-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black ${
                              isLow
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {prod.current_stock} {prod.unit}
                          </span>
                          {isLow && (
                            <span className="block text-[10px] text-red-600 font-bold mt-0.5">
                              Repor urgente!
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center space-x-2">
                            <Link
                              href={`/produtos/${prod.id}`}
                              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 font-bold text-[11px] transition-all border border-slate-200 shadow-2xs"
                              title="Editar Dados e Foto do Produto"
                            >
                              <span>Editar</span>
                            </Link>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProduct(prod);
                                setAdjustmentType('IN');
                                setAdjustQty(10);
                              }}
                              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-bold text-[11px] transition-all border border-blue-200 hover:border-blue-600 shadow-2xs"
                              title="Ajustar Saldo de Estoque"
                            >
                              <Boxes className="w-3.5 h-3.5" />
                              <span>Estoque</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => updateProduct(prod.id, { active: !prod.active })}
                              className={`inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-all border shadow-2xs ${
                                prod.active
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200'
                                  : 'bg-red-50 text-red-700 border-red-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
                              }`}
                              title={prod.active ? 'Inativar produto' : 'Ativar produto'}
                            >
                              {prod.active ? (
                                <ToggleRight className="w-3.5 h-3.5" />
                              ) : (
                                <ToggleLeft className="w-3.5 h-3.5" />
                              )}
                              <span>{prod.active ? 'Ativo' : 'Inativo'}</span>
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
            <div className="lg:hidden divide-y divide-slate-100">
              {filteredProducts.map((prod) => {
                const isLow = prod.current_stock <= prod.min_stock;
                return (
                  <div key={prod.id} className="p-4 space-y-3">
                    <div className="flex items-start space-x-3">
                      {prod.image_url ? (
                        <img
                          src={prod.image_url}
                          alt={prod.name}
                          className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                          <Package className="w-6 h-6" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">{prod.name}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          SKU: {prod.sku || '-'} • Marca: {prod.brand || '-'}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {prod.commission_type === 'PERCENTAGE' && (
                            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold">
                              {prod.commission_value}% comissão
                            </span>
                          )}
                          {prod.commission_type === 'FIXED' && (
                            <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold">
                              {formatCurrency(prod.commission_value)} comissão
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-50 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Preço de Venda</span>
                        <span className="font-black text-slate-900 text-sm">
                          {formatCurrency(prod.selling_price)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Estoque</span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full text-xs ${
                            isLow ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800'
                          }`}
                        >
                          {prod.current_stock} {prod.unit}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center space-x-2">
                      <Link
                        href={`/produtos/${prod.id}`}
                        className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center space-x-1 hover:bg-slate-200"
                      >
                        <span>Editar</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProduct(prod);
                          setAdjustmentType('IN');
                          setAdjustQty(10);
                        }}
                        className="flex-1 py-2 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center space-x-1.5 active:bg-blue-100"
                      >
                        <Boxes className="w-4 h-4" />
                        <span>Ajustar Saldo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => updateProduct(prod.id, { active: !prod.active })}
                        className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1 transition-all ${
                          prod.active
                            ? 'bg-emerald-50 text-emerald-700 active:bg-red-50'
                            : 'bg-red-50 text-red-700 active:bg-emerald-50'
                        }`}
                        title={prod.active ? 'Inativar' : 'Ativar'}
                      >
                        {prod.active ? (
                          <ToggleRight className="w-4 h-4" />
                        ) : (
                          <ToggleLeft className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Modal de Importação de Produtos via Excel */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl p-6 border border-slate-200 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Importar Produtos via Planilha</h3>
                  <p className="text-xs text-slate-500">Envie arquivos .xlsx ou .csv para importação em lote com validação.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setImportModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {importSuccessMessage && (
              <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{importSuccessMessage}</span>
              </div>
            )}

            {/* Passo 1: Selecionar Arquivo */}
            <div className="mt-4 space-y-4">
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-blue-500 transition-colors bg-slate-50/50">
                <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-800 mb-1">
                  {importFile ? importFile.name : 'Selecione uma planilha (.xlsx ou .csv)'}
                </p>
                <p className="text-[11px] text-slate-400 mb-3">
                  Utilize o modelo oficial para garantir que todas as colunas correspondam.
                </p>
                <label className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md">
                  <span>{importFile ? 'Substituir Arquivo' : 'Escolher Arquivo'}</span>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Erros Detectados na Validação */}
              {importErrors.length > 0 && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 space-y-1.5">
                  <div className="flex items-center space-x-2 text-xs font-bold text-red-800 mb-1">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>Inconsistências encontradas na planilha ({importErrors.length}):</span>
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1 text-[11px] text-red-700">
                    {importErrors.map((err, idx) => (
                      <div key={idx} className="flex items-start space-x-2">
                        <span className="font-mono font-bold shrink-0">Linha {err.row}:</span>
                        <span>{err.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Prévia de Produtos Válidos para Importação */}
              {previewProducts.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800">
                      Prévia dos Produtos Válidos ({previewProducts.length} prontos):
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      Pronto para confirmação
                    </span>
                  </div>
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
                    {previewProducts.map((p, idx) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                        <div>
                          <span className="font-bold text-slate-900 block">{p.name}</span>
                          <span className="text-[10px] text-slate-400">
                            SKU: {p.sku || '-'} • Estoque: {p.current_stock} {p.unit} • Comissão: {p.commission_type === 'PERCENTAGE' ? `${p.commission_value}%` : p.commission_type === 'FIXED' ? `R$ ${p.commission_value}` : 'Nenhuma'}
                          </span>
                        </div>
                        <span className="font-black text-blue-600">
                          {formatCurrency(p.selling_price)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ações */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={downloadProductExcelTemplate}
                  className="text-xs text-blue-600 hover:underline flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Planilha Modelo</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setImportModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={(previewProducts.length === 0 && previewUpdates.length === 0) || isImporting}
                    onClick={handleConfirmImport}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md active:scale-95 flex items-center space-x-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isImporting ? 'Importando...' : `Confirmar Importação (${previewProducts.length + previewUpdates.length})`}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Ajuste de Estoque (+ Entrada / - Saída) */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Ajuste de Estoque: {selectedProduct.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Saldo atual: <strong>{selectedProduct.current_stock} {selectedProduct.unit}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplyAdjustment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Tipo de Movimentação
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('IN')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                      adjustmentType === 'IN'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <PlusCircle className="w-4 h-4 text-emerald-600" />
                    <span>Entrada (+)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdjustmentType('OUT')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                      adjustmentType === 'OUT'
                        ? 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <MinusCircle className="w-4 h-4 text-rose-600" />
                    <span>Saída (-)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Quantidade a {adjustmentType === 'IN' ? 'Adicionar' : 'Subtrair'} ({selectedProduct.unit})
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Novo saldo resultante:{' '}
                  <strong>
                    {adjustmentType === 'IN'
                      ? selectedProduct.current_stock + adjustQty
                      : Math.max(0, selectedProduct.current_stock - adjustQty)}{' '}
                    {selectedProduct.unit}
                  </strong>
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Motivo / Observação
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800"
                >
                  <option value="Reposição de fornecedor">Reposição / Compra de Fornecedor</option>
                  <option value="Ajuste de inventário físico">Ajuste de Inventário Físico</option>
                  <option value="Perda / Avaria / Devolução">Perda / Avaria / Devolução</option>
                  <option value="Uso interno">Uso Interno / Demonstração</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="px-4 py-2 text-xs rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md active:scale-95"
                >
                  Confirmar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
