'use client';

import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
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
  FileSpreadsheet,
  X,
  CreditCard,
} from 'lucide-react';

export default function ComissoesPage() {
  const { commissions, professionals, markCommissionAsPaid } = useData();

  const [filterQuery, setFilterQuery] = useState('');
  const [selectedProfId, setSelectedProfId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | CommissionStatus>('ALL');

  // Modal de Marcar como Paga
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [targetCommissionId, setTargetCommissionId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payNotes, setPayNotes] = useState<string>('');

  const filteredCommissions = commissions.filter((c) => {
    const matchesQuery =
      c.professional_name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      String(c.sale_number).includes(filterQuery) ||
      (c.customer_name && c.customer_name.toLowerCase().includes(filterQuery.toLowerCase()));

    const matchesProf = selectedProfId === 'ALL' || c.professional_id === selectedProfId;
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;

    return matchesQuery && matchesProf && matchesStatus;
  });

  // Totais Consolidados
  const totalCommissions = commissions.reduce((acc, c) => acc + c.commission_amount, 0);
  const pendingTotal = commissions
    .filter((c) => c.status === 'PENDENTE')
    .reduce((acc, c) => acc + c.commission_amount, 0);
  const approvedTotal = commissions
    .filter((c) => c.status === 'APROVADA')
    .reduce((acc, c) => acc + c.commission_amount, 0);
  const paidTotal = commissions
    .filter((c) => c.status === 'PAGA')
    .reduce((acc, c) => acc + (c.paid_amount || c.commission_amount), 0);

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
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-md shadow-emerald-600/20">
              <DollarSign className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Gestão & Histórico de Comissões
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Controle apurações de comissões por venda, status de aprovação e quitação com histórico indelével.
          </p>
        </div>
      </div>

      {/* Cards de Totais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Comissões Pendentes
          </span>
          <p className="text-xl font-black text-amber-600 mt-1">
            {formatCurrency(pendingTotal)}
          </p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            {commissions.filter((c) => c.status === 'PENDENTE').length} aguardando liberação
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Comissões Aprovadas
          </span>
          <p className="text-xl font-black text-blue-600 mt-1">
            {formatCurrency(approvedTotal)}
          </p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            {commissions.filter((c) => c.status === 'APROVADA').length} prontas para pagamento
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Comissões Pagas
          </span>
          <p className="text-xl font-black text-emerald-600 mt-1">
            {formatCurrency(paidTotal)}
          </p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            {commissions.filter((c) => c.status === 'PAGA').length} quitadas com sucesso
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Total no Período
          </span>
          <p className="text-xl font-black text-slate-900 mt-1">
            {formatCurrency(totalCommissions)}
          </p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            {commissions.length} registros no total
          </span>
        </div>
      </div>

      {/* Filtros Avançados */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filtrar por profissional, venda ou cliente..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Seletor de Profissional */}
          <select
            value={selectedProfId}
            onChange={(e) => setSelectedProfId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
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
                      <td className="py-3.5 px-4 font-black text-emerald-600 text-sm">
                        {formatCurrency(c.commission_amount)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.status === 'PAGA'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : c.status === 'APROVADA'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : c.status === 'CANCELADA'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {c.status}
                        </span>
                        {c.paid_at && (
                          <span className="block text-[10px] text-slate-400 mt-0.5">
                            Pago em {formatDate(c.paid_at)}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {c.status !== 'PAGA' && c.status !== 'CANCELADA' ? (
                          <button
                            type="button"
                            onClick={() => openPayModal(c.id, c.commission_amount)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs active:scale-95"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Marcar Paga</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Liquidada</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modo Card Mobile */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredCommissions.map((c) => (
                <div key={c.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{c.professional_name}</span>
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
                Esta ação registrará a data de pagamento, o usuário responsável e manterá o histórico auditável de forma indelével.
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
