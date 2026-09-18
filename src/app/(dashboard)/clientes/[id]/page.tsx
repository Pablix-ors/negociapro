'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
import { formatCurrency, formatDate, maskCPF, maskCNPJ, maskPhone, maskCEP } from '@/lib/formatters';
import { validateCNPJ, validateCPF, validateEmail } from '@/lib/validators';
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
  Edit2,
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Check,
} from 'lucide-react';

export default function ClienteDetalhesPage() {
  const params = useParams();
  const router = useRouter();
  const { customers, sales, updateCustomer } = useData();

  const customerId = params?.id as string;
  const customer = customers.find((c) => c.id === customerId);

  const [activeTab, setActiveTab] = useState<'resumo' | 'compras' | 'produtos' | 'negociacoes'>('resumo');

  // Estados do Modal de Edição
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConsultingEditCnpj, setIsConsultingEditCnpj] = useState(false);
  const [editCnpjFeedback, setEditCnpjFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    trade_name: '',
    type: 'PF' as 'PF' | 'PJ',
    document: '',
    email: '',
    phone: '',
    whatsapp: '',
    zip_code: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    registration_status: '',
    cnae: '',
  });

  const openEditModal = () => {
    if (!customer) return;
    setEditFormData({
      name: customer.name || '',
      trade_name: customer.trade_name || '',
      type: customer.type,
      document: customer.document || '',
      email: customer.email || '',
      phone: customer.phone || '',
      whatsapp: customer.whatsapp || '',
      zip_code: customer.zip_code || '',
      street: customer.street || '',
      number: customer.number || '',
      complement: customer.complement || '',
      neighborhood: customer.neighborhood || '',
      city: customer.city || '',
      state: customer.state || '',
      registration_status: customer.registration_status || '',
      cnae: customer.cnae || '',
    });
    setEditCnpjFeedback(null);
    setModalError(null);
    setIsEditModalOpen(true);
  };

  const handleEditConsultarCNPJ = async () => {
    const clean = editFormData.document.replace(/\D/g, '');
    setEditCnpjFeedback(null);
    setModalError(null);

    if (!clean || clean.length !== 14 || !validateCNPJ(clean)) {
      setEditCnpjFeedback({
        type: 'error',
        message: 'CNPJ inválido. Verifique o número informado.',
      });
      return;
    }

    setIsConsultingEditCnpj(true);

    try {
      const res = await fetch(`/api/cnpj?cnpj=${encodeURIComponent(clean)}`);
      const result = await res.json();

      if (!res.ok || !result.success) {
        setEditCnpjFeedback({
          type: 'error',
          message: result.message || 'Não foi possível consultar o CNPJ no momento. Tente novamente.',
        });
        setIsConsultingEditCnpj(false);
        return;
      }

      const info = result.data;

      setEditFormData((prev) => ({
        ...prev,
        name: info.name || prev.name,
        trade_name: info.tradeName || prev.trade_name,
        zip_code: info.zipCode || prev.zip_code,
        street: info.street || prev.street,
        number: info.number || prev.number,
        complement: info.complement || prev.complement,
        neighborhood: info.neighborhood || prev.neighborhood,
        city: info.city || prev.city,
        state: info.state || prev.state,
        phone: info.phone || prev.phone,
        email: info.email || prev.email,
        registration_status: info.registrationStatus || prev.registration_status,
        cnae: info.cnae || prev.cnae,
      }));

      setEditCnpjFeedback({
        type: 'success',
        message: 'CNPJ consultado com sucesso. Dados preenchidos automaticamente.',
      });
    } catch (err: any) {
      console.error('Erro na consulta CNPJ:', err);
      setEditCnpjFeedback({
        type: 'error',
        message: 'Não foi possível consultar o CNPJ no momento. Tente novamente.',
      });
    } finally {
      setIsConsultingEditCnpj(false);
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (editFormData.type === 'PJ' && !validateCNPJ(editFormData.document)) {
      setModalError('CNPJ inválido. Verifique os dígitos informados.');
      return;
    }
    if (editFormData.type === 'PF' && !validateCPF(editFormData.document)) {
      setModalError('CPF inválido. Verifique os dígitos informados.');
      return;
    }
    if (editFormData.email && !validateEmail(editFormData.email)) {
      setModalError('Formato de e-mail inválido.');
      return;
    }

    updateCustomer(customer!.id, {
      name: editFormData.name,
      trade_name: editFormData.type === 'PJ' ? editFormData.trade_name : undefined,
      document: editFormData.document,
      email: editFormData.email,
      phone: editFormData.phone,
      whatsapp: editFormData.whatsapp,
      zip_code: editFormData.zip_code,
      street: editFormData.street,
      number: editFormData.number,
      complement: editFormData.complement,
      neighborhood: editFormData.neighborhood,
      city: editFormData.city,
      state: editFormData.state,
      registration_status: editFormData.type === 'PJ' ? editFormData.registration_status : undefined,
      cnae: editFormData.type === 'PJ' ? editFormData.cnae : undefined,
    });

    setIsEditModalOpen(false);
  };

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

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={openEditModal}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs"
          >
            <Edit2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Editar Cliente</span>
          </button>

          <Link
            href={`/vendas/nova?cliente=${customer.id}`}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-95"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Iniciar Nova Venda</span>
          </Link>
        </div>
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
                  <th className="p-3 text-center">Ações</th>
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
                    <td className="p-3 text-center">
                      <Link
                        href={`/vendas/nova?cliente=${customer.id}&repetir_venda=${sale.id}`}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-bold transition-all shadow-2xs"
                        title="Iniciar nova venda carregando os mesmos produtos deste pedido"
                      >
                        <ShoppingCart className="w-3 h-3" />
                        <span>Repetir Pedido</span>
                      </Link>
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
              <span className="text-[11px] text-blue-700">Acesse a tela de vendas com este cliente e os produtos já pré-selecionados.</span>
            </div>
            <Link
              href={`/vendas/nova?cliente=${customer.id}`}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              Ir para Tela de Venda
            </Link>
          </div>
        </div>
      )}

      {/* Modal de Edição de Cliente com suporte a CNPJAPI para PJ */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Editar Cliente ({editFormData.type === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'})
                </h3>
                <p className="text-[11px] text-slate-500">
                  {editFormData.type === 'PJ'
                    ? 'Atualize os dados manualmente ou consulte a Receita Federal via CNPJAPI.'
                    : 'Atualize os dados cadastrais do cliente.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 overflow-y-auto space-y-5 text-xs">
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Seção CNPJ / Documento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {editFormData.type === 'PF' ? 'Nome Completo *' : 'Razão Social *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {editFormData.type === 'PJ' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nome Fantasia</label>
                    <input
                      type="text"
                      value={editFormData.trade_name}
                      onChange={(e) => setEditFormData({ ...editFormData, trade_name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                <div className={editFormData.type === 'PJ' ? 'md:col-span-2' : ''}>
                  <label className="block font-bold text-slate-700 mb-1">
                    {editFormData.type === 'PF' ? 'CPF' : 'CNPJ'}
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      required
                      value={editFormData.document}
                      onChange={(e) => {
                        setEditCnpjFeedback(null);
                        const val = e.target.value;
                        setEditFormData({
                          ...editFormData,
                          document: editFormData.type === 'PF' ? maskCPF(val) : maskCNPJ(val),
                        });
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />

                    {editFormData.type === 'PJ' && (
                      <button
                        type="button"
                        onClick={handleEditConsultarCNPJ}
                        disabled={isConsultingEditCnpj || editFormData.document.replace(/\D/g, '').length < 14}
                        className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
                      >
                        {isConsultingEditCnpj ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Consultando CNPJ...</span>
                          </>
                        ) : (
                          <>
                            <Search className="w-3.5 h-3.5" />
                            <span>Consultar CNPJ</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {editCnpjFeedback && (
                    <div
                      className={`mt-2 p-2.5 rounded-xl text-xs font-medium flex items-center space-x-2 ${
                        editCnpjFeedback.type === 'success'
                          ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                          : 'bg-rose-50 border border-rose-200 text-rose-800'
                      }`}
                    >
                      {editCnpjFeedback.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span>{editCnpjFeedback.message}</span>
                    </div>
                  )}

                  {editFormData.type === 'PJ' && (editFormData.registration_status || editFormData.cnae) && (
                    <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center gap-2 text-xs">
                      {editFormData.registration_status && (
                        <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-bold text-slate-700">
                          Situação: <strong className="text-emerald-600">{editFormData.registration_status}</strong>
                        </span>
                      )}
                      {editFormData.cnae && (
                        <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-medium text-slate-700 truncate max-w-md" title={editFormData.cnae}>
                          CNAE: {editFormData.cnae}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Contatos */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-2">Contatos</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">E-mail</label>
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Telefone</label>
                    <input
                      type="text"
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: maskPhone(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">WhatsApp</label>
                    <input
                      type="text"
                      value={editFormData.whatsapp}
                      onChange={(e) => setEditFormData({ ...editFormData, whatsapp: maskPhone(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-2">Endereço</span>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">CEP</label>
                    <input
                      type="text"
                      value={editFormData.zip_code}
                      onChange={(e) => setEditFormData({ ...editFormData, zip_code: maskCEP(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-slate-600 mb-1">Logradouro / Rua</label>
                    <input
                      type="text"
                      value={editFormData.street}
                      onChange={(e) => setEditFormData({ ...editFormData, street: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Número</label>
                    <input
                      type="text"
                      value={editFormData.number}
                      onChange={(e) => setEditFormData({ ...editFormData, number: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Complemento</label>
                    <input
                      type="text"
                      value={editFormData.complement}
                      onChange={(e) => setEditFormData({ ...editFormData, complement: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Bairro</label>
                    <input
                      type="text"
                      value={editFormData.neighborhood}
                      onChange={(e) => setEditFormData({ ...editFormData, neighborhood: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Cidade</label>
                    <input
                      type="text"
                      value={editFormData.city}
                      onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">UF</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={editFormData.state}
                      onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value.toUpperCase() })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Botões do Modal */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center space-x-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
