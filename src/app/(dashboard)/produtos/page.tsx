'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
import { formatCurrency } from '@/lib/formatters';
import { Product } from '@/types/database';
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
} from 'lucide-react';

export default function ProdutosPage() {
  const { products, adjustStock } = useData();
  const [filterQuery, setFilterQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'LOW' | 'NORMAL'>('ALL');

  // Estado do Modal de Ajuste de Estoque
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'IN' | 'OUT'>('IN');
  const [adjustQty, setAdjustQty] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState<string>('Reposição de fornecedor');

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

    return matchesQuery && matchesStock;
  });

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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Catálogo & Controle de Estoque
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Controle níveis de estoque em tempo real, saldo mínimo de alerta, baixas automáticas em vendas e entradas de mercadorias.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <Link
            href="/produtos/novo"
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-95"
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

      {/* Barra de Filtros e Legenda de Unidades */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
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

        <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
          <button
            type="button"
            onClick={() => setStockFilter('ALL')}
            className={`px-3 py-1 rounded-lg transition-all ${
              stockFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
            }`}
          >
            Todos ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setStockFilter('LOW')}
            className={`px-3 py-1 rounded-lg transition-all ${
              stockFilter === 'LOW' ? 'bg-white text-red-700 shadow-xs font-bold' : 'hover:text-slate-900'
            }`}
          >
            Estoque Crítico ({lowStockCount})
          </button>
          <button
            type="button"
            onClick={() => setStockFilter('NORMAL')}
            className={`px-3 py-1 rounded-lg transition-all ${
              stockFilter === 'NORMAL' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'hover:text-slate-900'
            }`}
          >
            Estoque Regular ({products.length - lowStockCount})
          </button>
        </div>
      </div>

      {/* Glossário Rápido de Unidades */}
      <div className="px-4 py-2.5 bg-blue-50/60 border border-blue-100 rounded-xl text-[11px] text-blue-900 flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="font-bold text-blue-950 flex items-center gap-1">
          <Package className="w-3.5 h-3.5 text-blue-600" />
          Legenda de Unidades:
        </span>
        <span><strong>SC</strong>: Saco</span>
        <span><strong>UN</strong>: Unidade</span>
        <span><strong>CX</strong>: Caixa</span>
        <span><strong>MIL</strong>: Milheiro (1.000 un)</span>
        <span><strong>M³</strong>: Metro Cúbico</span>
        <span><strong>M²</strong>: Metro Quadrado</span>
        <span><strong>RL</strong>: Rolo</span>
        <span><strong>KG</strong>: Quilograma</span>
        <span><strong>LATA</strong>: Lata</span>
        <span><strong>BR</strong>: Barra</span>
      </div>

      {/* Tabela de Produtos */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">Nenhum produto encontrado</h3>
            <p className="text-xs text-slate-400 mt-1">Ajuste os filtros de busca para encontrar o item desejado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Produto</th>
                  <th className="p-4">SKU / Cód.</th>
                  <th className="p-4 text-right">Preço Venda</th>
                  <th className="p-4 text-right">Preço Mínimo</th>
                  <th className="p-4 text-center">Estoque Atual</th>
                  <th className="p-4 text-center">Estoque Mín.</th>
                  <th className="p-4 text-center">Ações de Estoque</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((prod) => {
                  const isLow = prod.current_stock <= prod.min_stock;
                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4 font-bold text-slate-900">
                        <span>{prod.name}</span>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-normal mt-0.5">
                          {prod.brand && <span>Marca: <strong>{prod.brand}</strong></span>}
                          {prod.brand && <span>•</span>}
                          <span>
                            Unidade:{' '}
                            <strong className="text-slate-800">
                              {prod.unit === 'SC'
                                ? 'SC (Saco)'
                                : prod.unit === 'MIL'
                                ? 'MIL (Milheiro)'
                                : prod.unit === 'UN'
                                ? 'UN (Unidade)'
                                : prod.unit === 'CX'
                                ? 'CX (Caixa)'
                                : prod.unit === 'M³'
                                ? 'M³ (Metro Cúbico)'
                                : prod.unit === 'M²'
                                ? 'M² (Metro Quadrado)'
                                : prod.unit === 'M'
                                ? 'M (Metro)'
                                : prod.unit === 'KG'
                                ? 'KG (Quilograma)'
                                : prod.unit === 'RL'
                                ? 'RL (Rolo)'
                                : prod.unit === 'LATA'
                                ? 'LATA (Lata)'
                                : prod.unit === 'BR'
                                ? 'BR (Barra)'
                                : prod.unit}
                            </strong>
                          </span>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-slate-600 whitespace-nowrap">
                        {prod.sku || '-'}
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
                              ? 'bg-red-50 text-red-700 border border-red-200 animate-pulse'
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
                      <td className="p-4 text-center text-slate-500 font-medium whitespace-nowrap">
                        {prod.min_stock} {prod.unit}
                      </td>
                      <td className="p-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProduct(prod);
                            setAdjustmentType('IN');
                            setAdjustQty(10);
                          }}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-bold text-[11px] transition-all border border-blue-200 hover:border-blue-600 shadow-2xs"
                        >
                          <Boxes className="w-3.5 h-3.5" />
                          <span>Ajustar Saldo</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
              {/* Tipo de Movimentação */}
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

              {/* Quantidade */}
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

              {/* Motivo */}
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

              {/* Ações */}
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

