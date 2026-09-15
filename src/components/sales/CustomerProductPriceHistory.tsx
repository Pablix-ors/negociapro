'use client';

import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import { Product } from '@/types/database';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { History, TrendingDown, TrendingUp, AlertTriangle, ShieldAlert, CheckCircle2, ChevronRight, User, Calendar, Package } from 'lucide-react';

interface CustomerProductPriceHistoryProps {
  customerId: string;
  productId: string;
  currentProduct: Product;
  proposedPrice?: number;
  onApplyPrice?: (price: number) => void;
}

export default function CustomerProductPriceHistory({
  customerId,
  productId,
  currentProduct,
  proposedPrice,
  onApplyPrice,
}: CustomerProductPriceHistoryProps) {
  const { getPriceHistory } = useData();
  const [showFullHistoryModal, setShowFullHistoryModal] = useState(false);

  if (!customerId || !productId) return null;

  const historyData = getPriceHistory(customerId, productId);
  const hasHistory = historyData.history && historyData.history.length > 0;

  // Análise comparativa se houver preço proposto
  let priceAlert: {
    type: 'normal' | 'below_last' | 'below_min' | 'good_deal';
    message: string;
    diffPct?: number;
  } | null = null;

  if (proposedPrice && proposedPrice > 0) {
    if (proposedPrice < currentProduct.min_price) {
      priceAlert = {
        type: 'below_min',
        message: `Atenção: O preço de ${formatCurrency(proposedPrice)} está abaixo do Preço Mínimo permitido (${formatCurrency(currentProduct.min_price)})! Exige aprovação de Gerente ou Administrador.`,
      };
    } else if (hasHistory && historyData.last_price && proposedPrice < historyData.last_price) {
      const diff = ((proposedPrice - historyData.last_price) / historyData.last_price) * 100;
      priceAlert = {
        type: 'below_last',
        diffPct: Number(diff.toFixed(1)),
        message: `Atenção: O preço informado está abaixo do último preço negociado para este cliente (${diff.toFixed(1)}%).`,
      };
    } else if (hasHistory && historyData.last_price && proposedPrice >= historyData.last_price) {
      priceAlert = {
        type: 'good_deal',
        message: `Margem positiva em relação ao último preço negociado.`,
      };
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-white p-4 shadow-sm transition-all duration-200">
      {/* Cabeçalho do Card */}
      <div className="flex items-center justify-between pb-2 border-b border-blue-100/80">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-sm">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">
              Inteligência de Negociação
            </h4>
            <p className="text-[11px] text-blue-700/80">
              Histórico do produto para este cliente
            </p>
          </div>
        </div>

        {hasHistory && (
          <button
            type="button"
            onClick={() => setShowFullHistoryModal(true)}
            className="inline-flex items-center text-xs font-semibold text-blue-700 hover:text-blue-900 bg-white hover:bg-blue-100/60 px-2.5 py-1 rounded-md border border-blue-200 transition-colors shadow-xs"
          >
            Ver histórico completo ({historyData.history.length})
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </button>
        )}
      </div>

      {/* Conteúdo Principal */}
      {!hasHistory ? (
        <div className="py-3 px-1 text-center">
          <p className="text-xs text-slate-500 italic">
            Nenhuma negociação anterior registrada para este cliente com este produto.
          </p>
          <div className="mt-2 inline-flex items-center space-x-3 text-xs text-slate-600">
            <span>Preço Padrão: <strong>{formatCurrency(currentProduct.selling_price)}</strong></span>
            <span>•</span>
            <span>Preço Mínimo: <strong>{formatCurrency(currentProduct.min_price)}</strong></span>
          </div>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {/* Card Destaque: Último Preço */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-lg border border-blue-100 shadow-xs">
            <div>
              <span className="text-[11px] font-medium text-slate-500 block">
                ÚLTIMA NEGOCIAÇÃO
              </span>
              <div className="flex items-baseline space-x-2 mt-0.5">
                <span className="text-xl font-black text-slate-900">
                  {formatCurrency(historyData.last_price)}
                </span>
                <span className="text-xs text-slate-500">
                  em {formatDate(historyData.last_negotiation_date)}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 flex items-center space-x-2">
                <span>Qtd: <strong>{historyData.last_quantity} un</strong></span>
                <span>•</span>
                <span>Vendedor: <strong>{historyData.last_seller_name || 'Vendedor'}</strong></span>
              </div>
            </div>

            {onApplyPrice && historyData.last_price && (
              <button
                type="button"
                onClick={() => onApplyPrice(historyData.last_price!)}
                className="text-xs font-semibold px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 hover:border-blue-600 rounded-lg transition-all shadow-xs"
              >
                Aplicar {formatCurrency(historyData.last_price)}
              </button>
            )}
          </div>

          {/* Grid de Estatísticas Rápidas */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="bg-white/80 p-2 rounded-lg border border-slate-100">
              <span className="text-[10px] text-slate-500 block font-medium">Preço Tabela</span>
              <span className="font-bold text-slate-700">{formatCurrency(currentProduct.selling_price)}</span>
            </div>
            <div className="bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
              <span className="text-[10px] text-emerald-700 block font-medium">Menor Preço</span>
              <span className="font-bold text-emerald-800">{formatCurrency(historyData.min_price)}</span>
            </div>
            <div className="bg-blue-50/60 p-2 rounded-lg border border-blue-100">
              <span className="text-[10px] text-blue-700 block font-medium">Preço Médio</span>
              <span className="font-bold text-blue-800">{formatCurrency(historyData.avg_price)}</span>
            </div>
            <div className="bg-amber-50/60 p-2 rounded-lg border border-amber-100">
              <span className="text-[10px] text-amber-700 block font-medium">Maior Preço</span>
              <span className="font-bold text-amber-800">{formatCurrency(historyData.max_price)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Alerta Inteligente de Negociação Dinâmico */}
      {priceAlert && (
        <div
          className={`mt-3 p-3 rounded-lg flex items-start space-x-2.5 text-xs transition-all ${
            priceAlert.type === 'below_min'
              ? 'bg-red-50 border border-red-200 text-red-800'
              : priceAlert.type === 'below_last'
              ? 'bg-amber-50 border border-amber-200 text-amber-800'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
          }`}
        >
          {priceAlert.type === 'below_min' ? (
            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          ) : priceAlert.type === 'below_last' ? (
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          )}
          <div>
            <span className="font-bold block">
              {priceAlert.type === 'below_min'
                ? '🚨 PREÇO ABAIXO DO MÍNIMO'
                : priceAlert.type === 'below_last'
                ? '⚠️ Atenção na Negociação'
                : '✓ Condição Aprovada'}
            </span>
            <p className="mt-0.5">{priceAlert.message}</p>
            {priceAlert.type === 'below_last' && historyData.last_price && (
              <div className="mt-1 text-[11px] font-medium text-amber-900 flex space-x-3">
                <span>Último: {formatCurrency(historyData.last_price)}</span>
                <span>Proposto: {formatCurrency(proposedPrice)}</span>
                <span>Diferença: {priceAlert.diffPct}%</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Histórico Completo de Negociações */}
      {showFullHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] shadow-2xl flex flex-col overflow-hidden border border-slate-100">
            {/* Modal Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <History className="w-5 h-5 text-blue-600" />
                  Histórico de Negociações
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {currentProduct.name} ({currentProduct.sku})
                </p>
              </div>
              <button
                onClick={() => setShowFullHistoryModal(false)}
                className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-700 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Tabela Histórica */}
            <div className="p-4 overflow-y-auto flex-1">
              <div className="mb-4 grid grid-cols-3 gap-3">
                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-center">
                  <span className="text-xs text-blue-600 font-semibold block">Último Preço</span>
                  <span className="text-lg font-black text-blue-900">{formatCurrency(historyData.last_price)}</span>
                </div>
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-center">
                  <span className="text-xs text-emerald-600 font-semibold block">Menor Preço</span>
                  <span className="text-lg font-black text-emerald-900">{formatCurrency(historyData.min_price)}</span>
                </div>
                <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 text-center">
                  <span className="text-xs text-slate-600 font-semibold block">Preço Médio</span>
                  <span className="text-lg font-black text-slate-900">{formatCurrency(historyData.avg_price)}</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Data</th>
                      <th className="p-2.5">Qtd</th>
                      <th className="p-2.5">Preço Unit.</th>
                      <th className="p-2.5">Desconto</th>
                      <th className="p-2.5 font-bold text-slate-900">Preço Final</th>
                      <th className="p-2.5">Vendedor</th>
                      <th className="p-2.5">Obs.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historyData.history.map((record) => (
                      <tr key={record.id} className="hover:bg-blue-50/40 transition-colors">
                        <td className="p-2.5 font-medium text-slate-700 whitespace-nowrap">
                          {formatDate(record.negotiation_date)}
                        </td>
                        <td className="p-2.5 text-slate-600 font-semibold">{record.quantity} un</td>
                        <td className="p-2.5 text-slate-500">{formatCurrency(record.unit_price)}</td>
                        <td className="p-2.5 text-rose-600 font-medium">{formatCurrency(record.discount)}</td>
                        <td className="p-2.5 font-black text-blue-700">{formatCurrency(record.final_unit_price)}</td>
                        <td className="p-2.5 text-slate-600">{record.seller_name || 'Vendedor'}</td>
                        <td className="p-2.5 text-slate-400 italic">{record.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowFullHistoryModal(false)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-900 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
