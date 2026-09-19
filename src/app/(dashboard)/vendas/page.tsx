'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatters';
import { Sale } from '@/types/database';
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
} from 'lucide-react';

export default function VendasPage() {
  const { sales, cancelSale } = useData();
  const [filterQuery, setFilterQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'CANCELLED'>('ALL');

  // Modal de Detalhes da Venda
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const filteredSales = sales.filter((s) => {
    const matchesQuery =
      String(s.sale_number).includes(filterQuery) ||
      (s.customer?.name && s.customer.name.toLowerCase().includes(filterQuery.toLowerCase())) ||
      (s.professional?.name && s.professional.name.toLowerCase().includes(filterQuery.toLowerCase()));

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
            Acompanhe vendas faturadas, profissionais vinculados e histórico imutável de comissões e preços.
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
            placeholder="Buscar por pedido, cliente ou profissional..."
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

      {/* Tabela Responsiva com Modo Card Mobile */}
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
          <>
            {/* Tabela Desktop com Scroll Horizontal Garantido */}
            <div className="hidden lg:block overflow-x-auto pb-2">
              <table className="w-full text-left text-xs min-w-[960px]">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-4">Pedido</th>
                    <th className="p-4">Data</th>
                    <th className="p-4">Cliente</th>
                    <th className="p-4">Profissional</th>
                    <th className="p-4">Itens</th>
                    <th className="p-4 text-right">Comissão Total</th>
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
                        {sale.professional?.name ? (
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
                          <button
                            type="button"
                            onClick={() => setSelectedSale(sale)}
                            title="Ver Detalhes da Venda"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <Link
                            href={`/vendas/nova?cliente=${sale.customer_id}&repetir_venda=${sale.id}`}
                            title="Iniciar nova venda repetindo itens deste pedido"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <ShoppingCart className="w-4 h-4" />
                          </Link>
                          {sale.status === 'COMPLETED' && (
                            <button
                              type="button"
                              onClick={() => cancelSale(sale.id)}
                              title="Cancelar venda com segurança"
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

            {/* Modo Card Mobile */}
            <div className="lg:hidden divide-y divide-slate-100">
              {filteredSales.map((sale) => (
                <div key={sale.id} className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900 text-sm">#{sale.sale_number}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        sale.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {sale.status === 'COMPLETED' ? 'Concluída' : 'Cancelada'}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-800 block">{sale.customer?.name}</span>
                    <span className="text-[11px] text-slate-400">{formatDate(sale.sold_at)}</span>
                  </div>

                  {sale.professional && (
                    <div className="text-xs text-slate-600 flex items-center space-x-1">
                      <Award className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Profissional: <strong>{sale.professional.name}</strong></span>
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

                    <button
                      type="button"
                      onClick={() => setSelectedSale(sale)}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold flex items-center space-x-1 active:bg-blue-100"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Detalhes</span>
                    </button>
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
                    Venda #{selectedSale.sale_number}
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
                <span className="font-bold text-slate-900 block mt-0.5">{selectedSale.customer?.name}</span>
                <span className="text-slate-500 text-[11px]">{selectedSale.customer?.document}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Profissional Responsável</span>
                <span className="font-bold text-blue-700 block mt-0.5">
                  {selectedSale.professional?.name || 'Nenhum profissional vinculado'}
                </span>
                <span className="text-slate-500 text-[11px]">{selectedSale.professional?.role_title || ''}</span>
              </div>
            </div>

            {/* Itens da Venda com Snapshots de Preço e Comissão */}
            <div className="mt-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Itens e Snapshots de Negociação
              </span>
              <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs">
                {selectedSale.items?.map((item, idx) => (
                  <div key={idx} className="p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-900 block">{item.product?.name || 'Produto'}</span>
                      <span className="text-[11px] text-slate-500">
                        {item.quantity} {item.product?.unit || 'UN'} × {formatCurrency(item.unit_price)}
                        {item.discount > 0 && ` (Desconto: ${formatCurrency(item.discount)})`}
                      </span>
                    </div>
                    <div className="sm:text-right">
                      <span className="font-black text-slate-900 block">{formatCurrency(item.total)}</span>
                      {item.commission_amount !== undefined && item.commission_amount > 0 && (
                        <span className="text-[11px] text-emerald-700 font-semibold block">
                          Comissão ({item.commission_type_snapshot === 'PERCENTAGE' ? `${item.commission_value_snapshot}%` : `${formatCurrency(item.commission_value_snapshot)}/un`}): {formatCurrency(item.commission_amount)}
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
                <span className="text-red-600 font-medium">- {formatCurrency(selectedSale.discount)}</span>
              </div>
              <div className="flex justify-between text-slate-700 font-semibold">
                <span>Comissão Total Gravada:</span>
                <span className="text-emerald-700 font-bold">{formatCurrency(selectedSale.commission_total || 0)}</span>
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

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <Link
                href={`/vendas/nova?cliente=${selectedSale.customer_id}&repetir_venda=${selectedSale.id}`}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-95"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Repetir Este Pedido</span>
              </Link>
              <button
                type="button"
                onClick={() => setSelectedSale(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
