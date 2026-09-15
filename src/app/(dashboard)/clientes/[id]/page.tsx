'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
import { formatCurrency, formatDate } from '@/lib/formatters';
import {
  User,
  Building2,
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  ShoppingCart,
  History,
  Package,
  TrendingUp,
  CreditCard,
} from 'lucide-react';

export default function ClienteDetalhesPage() {
  const params = useParams();
  const router = useRouter();
  const { customers, sales } = useData();

  const customerId = params?.id as string;
  const customer = customers.find((c) => c.id === customerId);

  const [activeTab, setActiveTab] = useState<'resumo' | 'compras' | 'produtos' | 'negociacoes'>('resumo');

  if (!customer) {
    return (
      <div className="p-12 text-center">
        <p className="text-sm font-bold text-slate-700">Cliente não encontrado.</p>
        <Link href="/clientes" className="mt-3 inline-block text-xs font-semibold text-blue-600">
          Voltar para lista de clientes
        </Link>
      </div>
    );
  }

  // Vendas deste cliente
  const customerSales = sales.filter((s) => s.customer_id === customer.id);
  const totalPurchased = customerSales.reduce((acc, s) => acc + (s.status === 'COMPLETED' ? s.total : 0), 0);
  const avgTicket = customerSales.length > 0 ? totalPurchased / customerSales.length : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header com Navegação */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link
            href="/clientes"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                {customer.trade_name || customer.name}
              </h1>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-black ${
                  customer.type === 'PJ' ? 'bg-indigo-50 text-indigo-700' : 'bg-blue-50 text-blue-700'
                }`}
              >
                {customer.type}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Documento: {customer.document}
            </p>
          </div>
        </div>

        <Link
          href="/vendas/nova"
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-95"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Iniciar Nova Venda</span>
        </Link>
      </div>

      {/* Card Resumo de Identificação */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Razão Social / Nome</span>
          <span className="font-bold text-slate-900 text-sm mt-0.5 block">{customer.name}</span>
          {customer.contact_person && (
            <span className="text-slate-500 text-[11px] block mt-1">
              Contato: {customer.contact_person}
            </span>
          )}
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Contatos</span>
          <div className="space-y-1 mt-0.5">
            <span className="text-slate-700 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" /> {customer.phone || 'Sem telefone'}
            </span>
            <span className="text-slate-700 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" /> {customer.email || 'Sem e-mail'}
            </span>
          </div>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Endereço</span>
          <span className="text-slate-700 flex items-start gap-1.5 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>
              {customer.street ? `${customer.street}, ${customer.number || 'S/N'}` : 'Não informado'}
              <br />
              {customer.city}/{customer.state}
            </span>
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Status da Carteira</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 mt-1">
            Cliente Ativo
          </span>
          {customer.notes && (
            <p className="text-[11px] text-slate-500 mt-2 italic bg-slate-50 p-1.5 rounded-lg">
              &quot;{customer.notes}&quot;
            </p>
          )}
        </div>
      </div>

      {/* Abas do Perfil 360º */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('resumo')}
            className={`pb-3 border-b-2 transition-all ${
              activeTab === 'resumo' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Resumo Comercial
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('compras')}
            className={`pb-3 border-b-2 transition-all ${
              activeTab === 'compras' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Compras Realizadas ({customerSales.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('negociacoes')}
            className={`pb-3 border-b-2 transition-all ${
              activeTab === 'negociacoes' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Histórico de Negociações
          </button>
        </nav>
      </div>

      {/* Conteúdo da Aba Selecionada */}
      {activeTab === 'resumo' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Comprado</span>
              <span className="text-2xl font-black text-blue-900 mt-1 block">
                {formatCurrency(totalPurchased || customer.total_purchased)}
              </span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Ticket Médio</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {formatCurrency(avgTicket)}
              </span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Última Compra</span>
              <span className="text-xl font-black text-slate-900 mt-1 block">
                {formatDate(customer.last_purchase_date || customerSales[0]?.sold_at)}
              </span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'compras' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {customerSales.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Nenhuma venda registrada para este cliente até o momento.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Pedido</th>
                  <th className="p-3">Data</th>
                  <th className="p-3">Vendedor</th>
                  <th className="p-3 text-right">Total</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customerSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">#{sale.sale_number}</td>
                    <td className="p-3 text-slate-600">{formatDate(sale.sold_at)}</td>
                    <td className="p-3 text-slate-600">{sale.seller?.name || 'Vendedor'}</td>
                    <td className="p-3 text-right font-black text-blue-700">{formatCurrency(sale.total)}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        {sale.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'negociacoes' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center space-x-2 pb-4 border-b border-slate-100">
            <History className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Histórico de Preços Negociados</h3>
          </div>
          <p className="text-xs text-slate-500 my-3">
            O NegociaPro preserva o histórico de negociações de forma perene. Sempre que uma nova venda for iniciada para este cliente, os preços negociados anteriormente serão recuperados automaticamente.
          </p>
          <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-blue-950 block">Deseja simular ou realizar uma negociação agora?</span>
              <span className="text-[11px] text-blue-700">Acesse a tela de vendas com o cliente já selecionado.</span>
            </div>
            <Link
              href="/vendas/nova"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              Ir para Tela de Venda
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
