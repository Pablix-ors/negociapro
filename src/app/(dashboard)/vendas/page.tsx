'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
import { formatCurrency, formatDate } from '@/lib/formatters';
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  Eye,
  XCircle,
  FileText,
  User,
} from 'lucide-react';

export default function VendasPage() {
  const { sales, cancelSale } = useData();
  const [filterQuery, setFilterQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'CANCELLED'>('ALL');

  const filteredSales = sales.filter((s) => {
    const matchesQuery =
      String(s.sale_number).includes(filterQuery) ||
      (s.customer?.name && s.customer.name.toLowerCase().includes(filterQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Histórico de Vendas
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Acompanhe todas as vendas, pedidos faturados e seus respectivos históricos de preços.
          </p>
        </div>

        <Link
          href="/vendas/nova"
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Venda</span>
        </Link>
      </div>

      {/* Barra de Filtros & Busca */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Buscar por número do pedido ou nome do cliente..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

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

      {/* Tabela de Vendas */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredSales.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingCart className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">Nenhuma venda encontrada</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {filterQuery
                ? 'Nenhum resultado corresponde à sua pesquisa.'
                : 'Você ainda não registrou nenhuma venda. Clique no botão abaixo para começar.'}
            </p>
            <div className="mt-4">
              <Link
                href="/vendas/nova"
                className="inline-flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Criar primeira venda</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Pedido</th>
                  <th className="p-4">Data</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Vendedor</th>
                  <th className="p-4">Itens</th>
                  <th className="p-4 text-right">Valor Total</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-4 font-black text-slate-900 whitespace-nowrap">
                      #{sale.sale_number}
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
                      {sale.seller?.name || 'Carlos Vendedor'}
                    </td>
                    <td className="p-4 text-slate-600">
                      {sale.items?.length || 1} itens
                    </td>
                    <td className="p-4 text-right font-black text-slate-900 whitespace-nowrap">
                      {formatCurrency(sale.total)}
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
                      <div className="flex items-center justify-center space-x-2">
                        {sale.status === 'COMPLETED' && (
                          <button
                            type="button"
                            onClick={() => cancelSale(sale.id)}
                            title="Cancelar venda com segurança (preserva histórico)"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
