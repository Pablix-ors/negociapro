'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
import { formatCurrency } from '@/lib/formatters';
import { Product } from '@/types/database';
import {
  downloadProductExcelTemplate,
  validateImportedProducts,
  exportProductsToFile,
  ImportErrorItem,
  ImportSummary,
} from '@/lib/excelProducts';
import {
  STANDARD_UNITS,
  COMMISSION_TYPES,
  StandardCommissionType,
} from '@/lib/productConstants';
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
  Download,
  Upload,
  FileSpreadsheet,
  X,
  Check,
  AlertCircle,
  Percent,
  DollarSign,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Edit3,
  SlidersHorizontal,
  CheckSquare,
  Square,
  Minus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export default function ProdutosPage() {
  const {
    products,
    adjustStock,
    updateProduct,
    deleteProduct,
    bulkUpdateProducts,
    bulkDeleteProducts,
    bulkImportProducts,
  } = useData();

  // Estados de busca e filtros básicos
  const [filterQuery, setFilterQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'LOW' | 'NORMAL'>('ALL');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Filtros avançados
  const [brandFilter, setBrandFilter] = useState('');
  const [unitFilter, setUnitFilter] = useState('');
  const [commissionFilter, setCommissionFilter] = useState<'ALL' | 'NONE' | 'PERCENTAGE' | 'FIXED'>('ALL');
  const [minPriceFilter, setMinPriceFilter] = useState('');
  const [maxPriceFilter, setMaxPriceFilter] = useState('');
  const [minStockFilter, setMinStockFilter] = useState('');
  const [maxStockFilter, setMaxStockFilter] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // SELEÇÃO MÚLTIPLA
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // MODAL DE EDIÇÃO EM MASSA
  const [bulkEditModalOpen, setBulkEditModalOpen] = useState(false);
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const [bulkSuccessMessage, setBulkSuccessMessage] = useState<string | null>(null);

  // Campos ativos no modal de edição em massa
  const [bulkFieldEnabled, setBulkFieldEnabled] = useState({
    unit: false,
    commission_type: false,
    commission_value: false,
    brand: false,
    active: false,
    price_adjust: false, // Reajuste percentual no preço de venda
  });

  // Valores a serem aplicados
  const [bulkValues, setBulkValues] = useState({
    unit: 'UN',
    commission_type: 'PERCENTAGE' as StandardCommissionType,
    commission_value: 3,
    brand: '',
    active: true,
    price_adjust_percent: 0,
  });

  // Feedback de salvamento rápido inline por produto
  const [recentlySavedId, setRecentlySavedId] = useState<string | null>(null);

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
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  // Estado do Dropdown de Exportação
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  // Refs para sincronização de rolagem horizontal superior e inferior
  const topScrollRef = useRef<HTMLDivElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);

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

  // Fecha o dropdown de exportação ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setExportDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtragem dos produtos
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
    const matchesUnit = !unitFilter || p.unit.toUpperCase() === unitFilter.toUpperCase();
    const matchesCommission = commissionFilter === 'ALL' || p.commission_type === commissionFilter;
    const matchesMinPrice = !minPriceFilter || p.selling_price >= Number(minPriceFilter);
    const matchesMaxPrice = !maxPriceFilter || p.selling_price <= Number(maxPriceFilter);
    const matchesMinStock = !minStockFilter || p.current_stock >= Number(minStockFilter);
    const matchesMaxStock = !maxStockFilter || p.current_stock <= Number(maxStockFilter);

    return (
      matchesQuery &&
      matchesStock &&
      matchesActive &&
      matchesBrand &&
      matchesUnit &&
      matchesCommission &&
      matchesMinPrice &&
      matchesMaxPrice &&
      matchesMinStock &&
      matchesMaxStock
    );
  });

  // Marcas e unidades únicas para filtros
  const allBrands = Array.from(new Set(products.map((p) => p.brand).filter(Boolean) as string[])).sort();

  // Contagem de filtros avançados ativos
  const advancedFilterCount = [
    brandFilter,
    unitFilter,
    commissionFilter !== 'ALL' ? commissionFilter : '',
    minPriceFilter,
    maxPriceFilter,
    minStockFilter,
    maxStockFilter,
    activeFilter !== 'ALL' ? activeFilter : '',
  ].filter(Boolean).length;

  const resetAllFilters = () => {
    setFilterQuery('');
    setStockFilter('ALL');
    setActiveFilter('ALL');
    setBrandFilter('');
    setUnitFilter('');
    setCommissionFilter('ALL');
    setMinPriceFilter('');
    setMaxPriceFilter('');
    setMinStockFilter('');
    setMaxStockFilter('');
  };

  // Estatísticas rápidas de estoque
  const totalStockItems = products.reduce((acc, p) => acc + p.current_stock, 0);
  const lowStockCount = products.filter((p) => p.current_stock <= p.min_stock).length;

  // Lógica de seleção
  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isAllFilteredSelected =
    filteredProducts.length > 0 && filteredProducts.every((p) => selectedIds.has(p.id));

  const isSomeFilteredSelected =
    filteredProducts.some((p) => selectedIds.has(p.id)) && !isAllFilteredSelected;

  const toggleSelectAllFiltered = () => {
    if (isAllFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredProducts.forEach((p) => next.delete(p.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredProducts.forEach((p) => next.add(p.id));
        return next;
      });
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Atalhos para abrir modal de edição em massa com campo pré-selecionado
  const openBulkEditWithField = (field: 'unit' | 'commission' | 'all') => {
    if (field === 'unit') {
      setBulkFieldEnabled({
        unit: true,
        commission_type: false,
        commission_value: false,
        brand: false,
        active: false,
        price_adjust: false,
      });
    } else if (field === 'commission') {
      setBulkFieldEnabled({
        unit: false,
        commission_type: true,
        commission_value: true,
        brand: false,
        active: false,
        price_adjust: false,
      });
    } else {
      setBulkFieldEnabled({
        unit: true,
        commission_type: true,
        commission_value: true,
        brand: false,
        active: false,
        price_adjust: false,
      });
    }
    setBulkEditModalOpen(true);
  };

  // Executar Edição em Massa
  const handleApplyBulkEdit = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    // Constrói objeto de updates contendo SOMENTE os campos que o usuário marcou
    const updates: Partial<Product> = {};

    if (bulkFieldEnabled.unit) {
      updates.unit = bulkValues.unit;
    }

    if (bulkFieldEnabled.commission_type) {
      updates.commission_type = bulkValues.commission_type;
      if (bulkValues.commission_type === 'NONE') {
        updates.commission_value = 0;
      } else if (bulkFieldEnabled.commission_value) {
        updates.commission_value = Number(bulkValues.commission_value);
      }
    } else if (bulkFieldEnabled.commission_value) {
      updates.commission_value = Number(bulkValues.commission_value);
    }

    if (bulkFieldEnabled.brand) {
      updates.brand = bulkValues.brand;
    }

    if (bulkFieldEnabled.active) {
      updates.active = bulkValues.active;
    }

    // Se nenhum campo foi marcado, avisa o usuário
    if (Object.keys(updates).length === 0 && !bulkFieldEnabled.price_adjust) {
      alert('Marque pelo menos um campo que deseja alterar antes de aplicar.');
      return;
    }

    setIsBulkSaving(true);

    try {
      if (bulkFieldEnabled.price_adjust && bulkValues.price_adjust_percent !== 0) {
        // Se houver reajuste de preço, atualizamos individualmente com o percentual calculado
        const multiplier = 1 + bulkValues.price_adjust_percent / 100;
        for (const id of ids) {
          const prod = products.find((p) => p.id === id);
          if (prod) {
            const newSell = Math.round(prod.selling_price * multiplier * 100) / 100;
            const newMin = Math.round(prod.min_price * multiplier * 100) / 100;
            await updateProduct(id, {
              ...updates,
              selling_price: Math.max(0, newSell),
              min_price: Math.max(0, newMin),
            });
          }
        }
      } else {
        await bulkUpdateProducts(ids, updates);
      }

      setBulkSuccessMessage(`${ids.length} produto(s) atualizado(s) com sucesso!`);
      setTimeout(() => {
        setBulkSuccessMessage(null);
        setBulkEditModalOpen(false);
      }, 1500);
    } catch (err) {
      alert('Erro ao salvar alterações em massa. Tente novamente.');
    } finally {
      setIsBulkSaving(false);
    }
  };

  // Excluir em massa os selecionados
  const handleBulkDelete = async () => {
    const count = selectedIds.size;
    if (count === 0) return;
    if (!window.confirm(`Tem certeza que deseja excluir ${count} produto(s) selecionado(s)? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      await bulkDeleteProducts(Array.from(selectedIds));
      clearSelection();
    } catch (err) {
      alert('Erro ao excluir produtos.');
    }
  };

  // Edição rápida inline com feedback visual instantâneo
  const handleInlineUpdate = (id: string, updates: Partial<Product>) => {
    updateProduct(id, updates);
    setRecentlySavedId(id);
    setTimeout(() => {
      setRecentlySavedId((current) => (current === id ? null : current));
    }, 1800);
  };

  // Ajuste de Estoque
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

        const existingProducts = products.map((p) => ({
          id: p.id,
          sku: p.sku ?? null,
          name: p.name,
          unit: p.unit,
          commission_type: p.commission_type,
          commission_value: p.commission_value,
          selling_price: p.selling_price,
        }));

        const { newProducts, updateProducts, errors, summary } = validateImportedProducts(
          rawJson,
          existingProducts
        );

        setPreviewProducts(newProducts);
        setPreviewUpdates(updateProducts);
        setImportErrors(errors);
        setImportSummary(summary);
      } catch (err) {
        setImportErrors([
          {
            row: 0,
            field: 'Arquivo',
            message: 'Erro ao processar planilha. Verifique se é um arquivo Excel ou CSV válido.',
          },
        ]);
        setImportSummary(null);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Executar Importação dos produtos válidos
  const handleConfirmImport = () => {
    if (previewProducts.length === 0 && previewUpdates.length === 0) return;

    setIsImporting(true);

    const { added, updated } = bulkImportProducts(previewProducts, previewUpdates);

    setIsImporting(false);

    const parts: string[] = [];
    if (added > 0) parts.push(`${added} produto(s) adicionado(s)`);
    if (updated > 0) parts.push(`${updated} produto(s) atualizado(s)`);
    setImportSuccessMessage(parts.join(' e ') + ' com sucesso!');

    setPreviewProducts([]);
    setPreviewUpdates([]);
    setImportSummary(null);
    setImportFile(null);
    setTimeout(() => {
      setImportModalOpen(false);
      setImportSuccessMessage(null);
    }, 2500);
  };

  // Exportar produtos por critério
  const handleExport = (target: 'all' | 'filtered' | 'selected' | 'active' | 'inactive', format: 'xlsx' | 'csv') => {
    let toExport = products;
    if (target === 'filtered') {
      toExport = filteredProducts;
    } else if (target === 'selected') {
      toExport = products.filter((p) => selectedIds.has(p.id));
    } else if (target === 'active') {
      toExport = products.filter((p) => p.active);
    } else if (target === 'inactive') {
      toExport = products.filter((p) => !p.active);
    }

    exportProductsToFile(toExport, format);
    setExportDropdownOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Catálogo & Controle de Produtos
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Edição Rápida Ativa
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Edição em massa com 1 clique, alteração rápida inline na tabela e sincronização completa com Excel.
          </p>
        </div>

        {/* Barra de Ações: Novo Produto, Importar, Exportar, Modelo */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Baixar Modelo de Importação */}
          <button
            type="button"
            onClick={downloadProductExcelTemplate}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all shadow-2xs"
            title="Baixar Planilha Modelo com Dropdowns e Validações Nativas"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Baixar Modelo Excel</span>
            <span className="inline sm:hidden">Modelo</span>
          </button>

          {/* Importar Produtos */}
          <button
            type="button"
            onClick={() => setImportModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Importar Planilha</span>
          </button>

          {/* Exportar Produtos (Dropdown) */}
          <div className="relative" ref={exportDropdownRef}>
            <button
              type="button"
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Exportar</span>
            </button>

            {exportDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Exportar com Validações Nativas
                </div>
                <div className="py-1">
                  {selectedIds.size > 0 && (
                    <button
                      type="button"
                      onClick={() => handleExport('selected', 'xlsx')}
                      className="w-full text-left px-3.5 py-1.5 text-xs text-blue-700 hover:bg-blue-50 font-bold flex items-center justify-between"
                    >
                      <span>Apenas Selecionados (.xlsx)</span>
                      <span className="text-[10px] font-mono">({selectedIds.size})</span>
                    </button>
                  )}
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
                    <span>Exportar em Formato CSV</span>
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

        {/* Linha 2: Filtros avançados expansíveis */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-in fade-in slide-in-from-top-1 duration-150">
            {/* Filtro Marca */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Marca</label>
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas as Marcas</option>
                {allBrands.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Filtro Unidade */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Unidade</label>
              <select
                value={unitFilter}
                onChange={(e) => setUnitFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas as Unidades</option>
                {STANDARD_UNITS.map((u) => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
            </div>

            {/* Filtro Comissão */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tipo Comissão</label>
              <select
                value={commissionFilter}
                onChange={(e) => setCommissionFilter(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Todas as Comissões</option>
                <option value="NONE">Sem Comissão</option>
                <option value="PERCENTAGE">Percentual (%)</option>
                <option value="FIXED">Valor Fixo (R$)</option>
              </select>
            </div>

            {/* Filtro Status */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status Ativo</label>
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Todos os Status</option>
                <option value="ACTIVE">Apenas Ativos</option>
                <option value="INACTIVE">Apenas Inativos</option>
              </select>
            </div>

            {/* Faixa de Preço */}
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
              <div className="sm:col-span-2 lg:col-span-4 flex flex-wrap gap-1.5 pt-1">
                {brandFilter && (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-[11px] font-bold">
                    <span>Marca: {brandFilter}</span>
                    <button onClick={() => setBrandFilter('')}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {unitFilter && (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-full text-[11px] font-bold">
                    <span>Unidade: {unitFilter}</span>
                    <button onClick={() => setUnitFilter('')}><X className="w-3 h-3" /></button>
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

      {/* Tabela de Produtos com Edição Rápida Direto na Lista */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">Nenhum produto encontrado</h3>
            <p className="text-xs text-slate-400 mt-1">Ajuste os filtros de busca para encontrar o item desejado.</p>
          </div>
        ) : (
          <>
            {/* Barra de Rolagem Horizontal no Topo */}
            <div
              ref={topScrollRef}
              onScroll={handleTopScroll}
              className="hidden sm:block overflow-x-auto w-full max-w-full scrollbar-visible bg-slate-100/70 border-b border-slate-200 py-1 px-4"
              title="Barra de rolagem horizontal rápida"
            >
              <div className="min-w-[1300px] h-[1px]" />
            </div>

            {/* Tabela com scroll horizontal */}
            <div
              ref={bottomScrollRef}
              onScroll={handleBottomScroll}
              className="hidden sm:block overflow-x-auto w-full max-w-full pb-4 scrollbar-visible"
            >
              <table className="w-full text-left text-xs min-w-[1300px]">
                <thead className="bg-slate-50/90 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200 sticky top-0 z-10 backdrop-blur-xs">
                  <tr>
                    {/* Checkbox de seleção da página */}
                    <th className="p-4 w-10 text-center">
                      <button
                        type="button"
                        onClick={toggleSelectAllFiltered}
                        className="text-slate-500 hover:text-blue-600 transition-colors p-1"
                        title={isAllFilteredSelected ? 'Desmarcar todos' : 'Selecionar todos os filtrados'}
                      >
                        {isAllFilteredSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : isSomeFilteredSelected ? (
                          <Minus className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="p-4 min-w-[260px]">Produto</th>
                    <th className="p-4 min-w-[130px]">SKU / Cód.</th>
                    <th className="p-4 min-w-[140px]">Unidade (Rápido)</th>
                    <th className="p-4 min-w-[240px]">Comissão (Rápido)</th>
                    <th className="p-4 text-right min-w-[130px]">Preço Venda</th>
                    <th className="p-4 text-right min-w-[120px]">Preço Mínimo</th>
                    <th className="p-4 text-center min-w-[140px]">Estoque Atual</th>
                    <th className="p-4 text-center min-w-[130px]">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((prod) => {
                    const isLow = prod.current_stock <= prod.min_stock;
                    const isSelected = selectedIds.has(prod.id);
                    const isJustSaved = recentlySavedId === prod.id;

                    return (
                      <tr
                        key={prod.id}
                        className={`transition-colors ${
                          isSelected
                            ? 'bg-blue-50/50'
                            : isJustSaved
                            ? 'bg-emerald-50/40'
                            : 'hover:bg-slate-50/60'
                        }`}
                      >
                        {/* Checkbox individual */}
                        <td className="p-4 text-center">
                          <button
                            type="button"
                            onClick={() => toggleSelectOne(prod.id)}
                            className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        {/* Produto Nome + Marca */}
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
                              <div className="flex items-center space-x-2">
                                <Link
                                  href={`/produtos/${prod.id}`}
                                  className="hover:text-blue-600 transition-colors font-bold text-slate-900 leading-snug"
                                >
                                  {prod.name}
                                </Link>
                                {isJustSaved && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 animate-pulse">
                                    Salvo ✓
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-normal mt-0.5">
                                {prod.brand && <span>Marca: <strong className="text-slate-700">{prod.brand}</strong></span>}
                                {prod.brand && <span>•</span>}
                                <span>Cód: <span className="font-mono text-[10px] text-slate-400">{prod.id.slice(0, 8)}</span></span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* SKU */}
                        <td className="p-4 font-mono text-slate-600 whitespace-nowrap">
                          {prod.sku || '-'}
                        </td>

                        {/* EDIÇÃO RÁPIDA: UNIDADE */}
                        <td className="p-4 whitespace-nowrap">
                          <select
                            value={prod.unit}
                            onChange={(e) => handleInlineUpdate(prod.id, { unit: e.target.value })}
                            className="bg-white hover:bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer"
                            title="Alterar Unidade Diretamente"
                          >
                            {STANDARD_UNITS.map((u) => (
                              <option key={u.value} value={u.value}>
                                {u.value} — {u.label.split('—')[1]?.trim()}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* EDIÇÃO RÁPIDA: TIPO E VALOR DE COMISSÃO */}
                        <td className="p-4 whitespace-nowrap">
                          <div className="flex items-center space-x-1.5">
                            <select
                              value={prod.commission_type}
                              onChange={(e) => {
                                const newType = e.target.value as StandardCommissionType;
                                handleInlineUpdate(prod.id, {
                                  commission_type: newType,
                                  commission_value: newType === 'NONE' ? 0 : prod.commission_value || 0,
                                });
                              }}
                              className="bg-white hover:bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer"
                              title="Alterar Tipo de Comissão"
                            >
                              <option value="NONE">Sem comissão</option>
                              <option value="PERCENTAGE">Percentual (%)</option>
                              <option value="FIXED">Fixo (R$)</option>
                            </select>

                            {prod.commission_type !== 'NONE' && (
                              <div className="relative flex items-center">
                                <input
                                  type="number"
                                  min="0"
                                  step={prod.commission_type === 'PERCENTAGE' ? '0.1' : '0.5'}
                                  defaultValue={prod.commission_value}
                                  key={`${prod.id}-${prod.commission_value}-${prod.commission_type}`}
                                  onBlur={(e) => {
                                    const val = Number(e.target.value);
                                    if (val !== prod.commission_value) {
                                      handleInlineUpdate(prod.id, { commission_value: Math.max(0, val) });
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      (e.target as HTMLInputElement).blur();
                                    }
                                  }}
                                  className="w-20 bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-black text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-right pr-6 shadow-2xs"
                                />
                                <span className="absolute right-2 text-[11px] font-bold text-slate-400 pointer-events-none">
                                  {prod.commission_type === 'PERCENTAGE' ? '%' : 'R$'}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Preço de Venda */}
                        <td className="p-4 text-right whitespace-nowrap">
                          <input
                            type="number"
                            min="0"
                            step="0.10"
                            defaultValue={prod.selling_price}
                            key={`${prod.id}-${prod.selling_price}`}
                            onBlur={(e) => {
                              const val = Number(e.target.value);
                              if (val !== prod.selling_price && val >= 0) {
                                handleInlineUpdate(prod.id, { selling_price: val });
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                            }}
                            className="w-24 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-200 focus:border-blue-500 rounded-lg px-1.5 py-1 text-right text-xs font-black text-slate-900 transition-colors"
                            title="Clique para editar o preço de venda"
                          />
                        </td>

                        {/* Preço Mínimo */}
                        <td className="p-4 text-right font-bold text-amber-700 whitespace-nowrap">
                          {formatCurrency(prod.min_price)}
                        </td>

                        {/* Estoque Atual */}
                        <td className="p-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black ${
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

                        {/* Ações */}
                        <td className="p-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProduct(prod);
                                setAdjustmentType('IN');
                                setAdjustQty(10);
                              }}
                              className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white transition-all border border-blue-200 hover:border-blue-600 shadow-2xs"
                              title="Ajustar Saldo de Estoque"
                            >
                              <Boxes className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleInlineUpdate(prod.id, { active: !prod.active })}
                              className={`p-1.5 rounded-lg font-bold transition-all border shadow-2xs ${
                                prod.active
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-red-50 hover:text-red-700'
                                  : 'bg-red-50 text-red-700 border-red-200 hover:bg-emerald-50 hover:text-emerald-700'
                              }`}
                              title={prod.active ? 'Produto ativo (clique para inativar)' : 'Produto inativo (clique para ativar)'}
                            >
                              {prod.active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                            </button>
                            <Link
                              href={`/produtos/${prod.id}`}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all border border-slate-200 shadow-2xs"
                              title="Editar Ficha Completa do Produto"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Tem certeza que deseja excluir "${prod.name}"?`)) {
                                  deleteProduct(prod.id);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all border border-slate-200 hover:border-rose-200 shadow-2xs"
                              title="Excluir Produto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Modo Card Mobile com Seleção e Edição Rápida */}
            <div className="sm:hidden divide-y divide-slate-100">
              {filteredProducts.map((prod) => {
                const isLow = prod.current_stock <= prod.min_stock;
                const isSelected = selectedIds.has(prod.id);

                return (
                  <div
                    key={prod.id}
                    className={`p-4 space-y-3 transition-colors ${
                      isSelected ? 'bg-blue-50/40' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <button
                        type="button"
                        onClick={() => toggleSelectOne(prod.id)}
                        className="pt-1 text-slate-400 hover:text-blue-600"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>

                      {prod.image_url ? (
                        <img
                          src={prod.image_url}
                          alt={prod.name}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                          <Package className="w-5 h-5" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 leading-snug">{prod.name}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          SKU: {prod.sku || '-'} {prod.brand && `• ${prod.brand}`}
                        </p>
                        <div className="mt-1 flex items-center space-x-2">
                          <select
                            value={prod.unit}
                            onChange={(e) => handleInlineUpdate(prod.id, { unit: e.target.value })}
                            className="text-[10px] font-bold border border-slate-200 rounded-lg px-1.5 py-0.5 bg-white"
                          >
                            {STANDARD_UNITS.map((u) => (
                              <option key={u.value} value={u.value}>{u.value}</option>
                            ))}
                          </select>
                          <span className="text-[10px] font-bold text-slate-600">
                            {prod.commission_type === 'PERCENTAGE'
                              ? `${prod.commission_value}% comissão`
                              : prod.commission_type === 'FIXED'
                              ? `R$ ${prod.commission_value} comissão`
                              : 'Sem comissão'}
                          </span>
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
                        className="flex-1 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center hover:bg-slate-200"
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
                        className="flex-1 py-1.5 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center space-x-1"
                      >
                        <Boxes className="w-3.5 h-3.5" />
                        <span>Estoque</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInlineUpdate(prod.id, { active: !prod.active })}
                        className="p-1.5 rounded-xl bg-slate-100 text-slate-700"
                      >
                        {prod.active ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4 text-slate-400" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* BARRA FLUTUANTE DE AÇÕES EM MASSA (quando houver itens selecionados) */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700/60 flex items-center space-x-4 animate-in fade-in slide-in-from-bottom-4 duration-200 max-w-2xl w-[92%] sm:w-auto">
          <div className="flex items-center space-x-2 shrink-0">
            <span className="w-7 h-7 rounded-xl bg-blue-600 flex items-center justify-center font-black text-xs">
              {selectedIds.size}
            </span>
            <span className="text-xs font-bold hidden sm:inline">
              produto(s) selecionado(s)
            </span>
          </div>

          <div className="h-5 w-[1px] bg-slate-700 hidden sm:block" />

          {/* Ações da barra */}
          <div className="flex items-center space-x-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => openBulkEditWithField('all')}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Editar em massa</span>
            </button>

            <button
              type="button"
              onClick={() => openBulkEditWithField('unit')}
              className="hidden md:inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-all border border-slate-700"
            >
              <span>Alterar Unidade</span>
            </button>

            <button
              type="button"
              onClick={() => openBulkEditWithField('commission')}
              className="hidden md:inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-all border border-slate-700"
            >
              <span>Alterar Comissão</span>
            </button>

            <button
              type="button"
              onClick={handleBulkDelete}
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 rounded-xl text-xs font-bold transition-all border border-rose-800/50"
              title="Excluir selecionados"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Excluir</span>
            </button>

            <button
              type="button"
              onClick={clearSelection}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Desmarcar todos"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MODAL INTELIGENTE DE EDIÇÃO EM MASSA */}
      {bulkEditModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !isBulkSaving) setBulkEditModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto"
        >
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl p-6 border border-slate-200 animate-in fade-in zoom-in-95 my-8">
            {/* Cabeçalho do modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Editar {selectedIds.size} Produto(s) em Massa
                  </h3>
                  <p className="text-xs text-slate-500">
                    Marque apenas os campos que deseja alterar. Os outros permanecerão intactos.
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isBulkSaving}
                onClick={() => setBulkEditModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bulkSuccessMessage && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{bulkSuccessMessage}</span>
              </div>
            )}

            <div className="mt-5 space-y-4">
              {/* CAMPO 1: UNIDADE */}
              <div
                className={`p-3.5 rounded-2xl border transition-all ${
                  bulkFieldEnabled.unit
                    ? 'bg-blue-50/50 border-blue-300 ring-2 ring-blue-500/10'
                    : 'bg-slate-50/70 border-slate-200 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <label className="inline-flex items-center space-x-2 cursor-pointer font-bold text-xs text-slate-800">
                    <input
                      type="checkbox"
                      checked={bulkFieldEnabled.unit}
                      onChange={(e) =>
                        setBulkFieldEnabled((prev) => ({ ...prev, unit: e.target.checked }))
                      }
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <span>Alterar Unidade de Medida</span>
                  </label>
                  {bulkFieldEnabled.unit && (
                    <span className="text-[10px] font-bold text-blue-600 uppercase">Ativo</span>
                  )}
                </div>

                {bulkFieldEnabled.unit && (
                  <div className="mt-2.5 pl-6">
                    <select
                      value={bulkValues.unit}
                      onChange={(e) => setBulkValues((v) => ({ ...v, unit: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 shadow-2xs"
                    >
                      {STANDARD_UNITS.map((u) => (
                        <option key={u.value} value={u.value}>
                          {u.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* CAMPO 2: TIPO DE COMISSÃO */}
              <div
                className={`p-3.5 rounded-2xl border transition-all ${
                  bulkFieldEnabled.commission_type
                    ? 'bg-blue-50/50 border-blue-300 ring-2 ring-blue-500/10'
                    : 'bg-slate-50/70 border-slate-200 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <label className="inline-flex items-center space-x-2 cursor-pointer font-bold text-xs text-slate-800">
                    <input
                      type="checkbox"
                      checked={bulkFieldEnabled.commission_type}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setBulkFieldEnabled((prev) => ({
                          ...prev,
                          commission_type: checked,
                          commission_value: checked,
                        }));
                      }}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <span>Alterar Tipo e Valor de Comissão</span>
                  </label>
                  {bulkFieldEnabled.commission_type && (
                    <span className="text-[10px] font-bold text-blue-600 uppercase">Ativo</span>
                  )}
                </div>

                {bulkFieldEnabled.commission_type && (
                  <div className="mt-2.5 pl-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Tipo de Comissão
                      </label>
                      <select
                        value={bulkValues.commission_type}
                        onChange={(e) => {
                          const type = e.target.value as StandardCommissionType;
                          setBulkValues((v) => ({
                            ...v,
                            commission_type: type,
                            commission_value: type === 'NONE' ? 0 : v.commission_value || 3,
                          }));
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 shadow-2xs"
                      >
                        {COMMISSION_TYPES.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {bulkValues.commission_type !== 'NONE' && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          {bulkValues.commission_type === 'PERCENTAGE'
                            ? 'Percentual da Comissão (%)'
                            : 'Valor Fixo da Comissão (R$)'}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step={bulkValues.commission_type === 'PERCENTAGE' ? '0.1' : '0.5'}
                            value={bulkValues.commission_value}
                            onChange={(e) =>
                              setBulkValues((v) => ({
                                ...v,
                                commission_value: Math.max(0, Number(e.target.value)),
                              }))
                            }
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-900 shadow-2xs pr-8"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                            {bulkValues.commission_type === 'PERCENTAGE' ? '%' : 'R$'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* CAMPO 3: MARCA */}
              <div
                className={`p-3.5 rounded-2xl border transition-all ${
                  bulkFieldEnabled.brand
                    ? 'bg-blue-50/50 border-blue-300 ring-2 ring-blue-500/10'
                    : 'bg-slate-50/70 border-slate-200 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <label className="inline-flex items-center space-x-2 cursor-pointer font-bold text-xs text-slate-800">
                    <input
                      type="checkbox"
                      checked={bulkFieldEnabled.brand}
                      onChange={(e) =>
                        setBulkFieldEnabled((prev) => ({ ...prev, brand: e.target.checked }))
                      }
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <span>Definir Marca / Fabricante</span>
                  </label>
                  {bulkFieldEnabled.brand && (
                    <span className="text-[10px] font-bold text-blue-600 uppercase">Ativo</span>
                  )}
                </div>

                {bulkFieldEnabled.brand && (
                  <div className="mt-2.5 pl-6">
                    <input
                      type="text"
                      list="bulk-brand-list"
                      placeholder="Ex: Alta Pets, Vitaminas, Manfrim..."
                      value={bulkValues.brand}
                      onChange={(e) => setBulkValues((v) => ({ ...v, brand: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 shadow-2xs"
                    />
                    <datalist id="bulk-brand-list">
                      {allBrands.map((b) => (
                        <option key={b} value={b} />
                      ))}
                    </datalist>
                  </div>
                )}
              </div>

              {/* CAMPO 4: REAJUSTE PERCENTUAL DE PREÇO */}
              <div
                className={`p-3.5 rounded-2xl border transition-all ${
                  bulkFieldEnabled.price_adjust
                    ? 'bg-blue-50/50 border-blue-300 ring-2 ring-blue-500/10'
                    : 'bg-slate-50/70 border-slate-200 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <label className="inline-flex items-center space-x-2 cursor-pointer font-bold text-xs text-slate-800">
                    <input
                      type="checkbox"
                      checked={bulkFieldEnabled.price_adjust}
                      onChange={(e) =>
                        setBulkFieldEnabled((prev) => ({ ...prev, price_adjust: e.target.checked }))
                      }
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <span>Reajustar Preços em % (+ aumento ou - desconto)</span>
                  </label>
                  {bulkFieldEnabled.price_adjust && (
                    <span className="text-[10px] font-bold text-blue-600 uppercase">Ativo</span>
                  )}
                </div>

                {bulkFieldEnabled.price_adjust && (
                  <div className="mt-2.5 pl-6">
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        step="0.5"
                        placeholder="Ex: 5 (para +5%) ou -10 (para -10%)"
                        value={bulkValues.price_adjust_percent}
                        onChange={(e) =>
                          setBulkValues((v) => ({
                            ...v,
                            price_adjust_percent: Number(e.target.value),
                          }))
                        }
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-900 shadow-2xs"
                      />
                      <span className="text-xs font-bold text-slate-500">%</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      O reajuste recalcula proporcionalmente o preço de venda e mínimo de cada um dos {selectedIds.size} produtos.
                    </p>
                  </div>
                )}
              </div>

              {/* CAMPO 5: STATUS (ATIVAR / INATIVAR) */}
              <div
                className={`p-3.5 rounded-2xl border transition-all ${
                  bulkFieldEnabled.active
                    ? 'bg-blue-50/50 border-blue-300 ring-2 ring-blue-500/10'
                    : 'bg-slate-50/70 border-slate-200 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <label className="inline-flex items-center space-x-2 cursor-pointer font-bold text-xs text-slate-800">
                    <input
                      type="checkbox"
                      checked={bulkFieldEnabled.active}
                      onChange={(e) =>
                        setBulkFieldEnabled((prev) => ({ ...prev, active: e.target.checked }))
                      }
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <span>Alterar Status de Ativação</span>
                  </label>
                  {bulkFieldEnabled.active && (
                    <span className="text-[10px] font-bold text-blue-600 uppercase">Ativo</span>
                  )}
                </div>

                {bulkFieldEnabled.active && (
                  <div className="mt-2.5 pl-6 flex items-center space-x-4">
                    <label className="inline-flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="bulk-active-radio"
                        checked={bulkValues.active === true}
                        onChange={() => setBulkValues((v) => ({ ...v, active: true }))}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Ativar Todos ({selectedIds.size})</span>
                    </label>

                    <label className="inline-flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="bulk-active-radio"
                        checked={bulkValues.active === false}
                        onChange={() => setBulkValues((v) => ({ ...v, active: false }))}
                        className="text-rose-600 focus:ring-rose-500"
                      />
                      <span>Inativar Todos ({selectedIds.size})</span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Ações do modal de edição em massa */}
            <div className="flex items-center justify-between pt-5 mt-5 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-medium">
                {Object.values(bulkFieldEnabled).filter(Boolean).length} campo(s) selecionado(s)
              </span>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  disabled={isBulkSaving}
                  onClick={() => setBulkEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isBulkSaving || Object.values(bulkFieldEnabled).every((v) => !v)}
                  onClick={handleApplyBulkEdit}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 active:scale-95 flex items-center space-x-1.5 transition-all"
                >
                  {isBulkSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Aplicar Alterações ({selectedIds.size})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Importação de Produtos via Excel com Resumo Seguro */}
      {importModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !isImporting) setImportModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto"
        >
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl p-6 border border-slate-200 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Importação Segura de Produtos</h3>
                  <p className="text-xs text-slate-500">
                    Sincronização bidirecional por ID/código único ou SKU com validação automática.
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isImporting}
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
                  A planilha possui listas de validação suspensas nativas para Unidade, Tipo de Comissão e Status.
                </p>
                <label className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md">
                  <span>{importFile ? 'Substituir Arquivo' : 'Escolher Planilha'}</span>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Resumo Seguro da Importação */}
              {importSummary && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-slate-700 tracking-wider">
                      Resumo da Análise
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {importSummary.totalRows} linhas analisadas
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Novos</span>
                      <span className="text-base font-black text-blue-600">{importSummary.newCount}</span>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Atualizações</span>
                      <span className="text-base font-black text-emerald-600">{importSummary.updateCount}</span>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Erros</span>
                      <span className={`text-base font-black ${importSummary.errorCount > 0 ? 'text-red-600' : 'text-slate-500'}`}>
                        {importSummary.errorCount}
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Campos</span>
                      <span className="text-base font-black text-indigo-600">
                        {importSummary.modifiedFieldsList.length}
                      </span>
                    </div>
                  </div>

                  {importSummary.modifiedFieldsList.length > 0 && (
                    <div className="text-[11px] text-slate-600 font-medium">
                      <strong>Campos modificados identificados:</strong>{' '}
                      <span className="text-slate-800">
                        {importSummary.modifiedFieldsList.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              )}

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

              {/* Prévia de Produtos */}
              {(previewProducts.length > 0 || previewUpdates.length > 0) && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800">
                      Prévia dos Registros Válidos ({previewProducts.length + previewUpdates.length} produtos):
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      Pronto para confirmação
                    </span>
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
                    {previewUpdates.map((p, idx) => (
                      <div key={`u-${idx}`} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded text-[9px] font-bold">
                              ATUALIZAR
                            </span>
                            <span className="font-bold text-slate-900">{p.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Unidade: <strong>{p.unit}</strong> • Comissão:{' '}
                            {p.commission_type === 'PERCENTAGE'
                              ? `${p.commission_value}%`
                              : p.commission_type === 'FIXED'
                              ? `R$ ${p.commission_value}`
                              : 'Sem comissão'}
                          </span>
                        </div>
                        <span className="font-black text-slate-900">
                          {formatCurrency(p.selling_price)}
                        </span>
                      </div>
                    ))}

                    {previewProducts.map((p, idx) => (
                      <div key={`n-${idx}`} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded text-[9px] font-bold">
                              NOVO
                            </span>
                            <span className="font-bold text-slate-900">{p.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            SKU: {p.sku || '-'} • Estoque: {p.current_stock} {p.unit}
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
                  <span>Baixar Modelo Válido</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    disabled={isImporting}
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
                    <span>
                      {isImporting
                        ? 'Processando...'
                        : `Confirmar Importação (${previewProducts.length + previewUpdates.length})`}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Ajuste de Estoque (+ Entrada / - Saída) */}
      {selectedProduct && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedProduct(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
        >
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
