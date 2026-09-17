'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useMaster } from '@/context/MasterAuthContext';
import { Company } from '@/types/database';
import { CompanyStatus } from '@/types/master';
import { maskCNPJ, maskPhone } from '@/lib/formatters';
import {
  Building2,
  Plus,
  Search,
  CheckCircle2,
  Ban,
  Trash2,
  ExternalLink,
  Edit2,
  Eye,
  AlertCircle,
  AlertTriangle,
  X,
  Check,
  Building,
  MapPin,
  Mail,
  Phone,
  ArrowLeft,
  Calendar,
  ShieldAlert,
} from 'lucide-react';

export default function MasterEstabelecimentosPage() {
  const {
    companies,
    enterCompany,
    createEstablishment,
    updateEstablishment,
    setEstablishmentStatus,
    deleteEstablishment,
  } = useMaster();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ATIVO' | 'BLOQUEADO'>('ALL');

  // Modais de Criação / Edição
  const [modalOpen, setModalOpen] = useState(false);
  const [editingComp, setEditingComp] = useState<Company | null>(null);

  // Modal de Ação de Bloqueio / Desbloqueio
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedCompForStatus, setSelectedCompForStatus] = useState<Company | null>(null);
  const [targetStatus, setTargetStatus] = useState<CompanyStatus>('ATIVO');
  const [statusReason, setStatusReason] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Modal de Exclusão Definitiva (Deletar tudo)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCompForDelete, setSelectedCompForDelete] = useState<Company | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Formulário de Cadastro/Edição
  const [name, setName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [stateRegistration, setStateRegistration] = useState('');
  const [municipalRegistration, setMunicipalRegistration] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [website, setWebsite] = useState('');
  const [error, setError] = useState<string | null>(null);

  const filteredCompanies = companies.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      c.name.toLowerCase().includes(q) ||
      (c.trade_name && c.trade_name.toLowerCase().includes(q)) ||
      (c.cnpj && c.cnpj.includes(q)) ||
      (c.city && c.city.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q));

    const matchesStatus =
      statusFilter === 'ALL' ||
      c.status === statusFilter ||
      (statusFilter === 'BLOQUEADO' && c.status === 'INATIVO');
    return matchesSearch && matchesStatus;
  });

  const openCreateModal = () => {
    setEditingComp(null);
    setName('');
    setTradeName('');
    setCnpj('');
    setStateRegistration('');
    setMunicipalRegistration('');
    setEmail('');
    setPhone('');
    setWhatsapp('');
    setZipCode('');
    setStreet('');
    setNumber('');
    setComplement('');
    setNeighborhood('');
    setCity('');
    setState('');
    setWebsite('');
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (comp: Company) => {
    setEditingComp(comp);
    setName(comp.name);
    setTradeName(comp.trade_name || '');
    setCnpj(comp.cnpj || '');
    setStateRegistration(comp.state_registration || '');
    setMunicipalRegistration(comp.municipal_registration || '');
    setEmail(comp.email || '');
    setPhone(comp.phone || '');
    setWhatsapp(comp.whatsapp || '');
    setZipCode(comp.zip_code || '');
    setStreet(comp.street || '');
    setNumber(comp.number || '');
    setComplement(comp.complement || '');
    setNeighborhood(comp.neighborhood || '');
    setCity(comp.city || '');
    setState(comp.state || '');
    setWebsite(comp.website || '');
    setError(null);
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('A Razão Social / Nome do Estabelecimento é obrigatório.');
      return;
    }

    if (editingComp) {
      updateEstablishment(editingComp.id, {
        name,
        trade_name: tradeName || name,
        cnpj,
        state_registration: stateRegistration,
        municipal_registration: municipalRegistration,
        email,
        phone,
        whatsapp,
        zip_code: zipCode,
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        website,
      });
    } else {
      createEstablishment({
        name,
        trade_name: tradeName || name,
        cnpj,
        state_registration: stateRegistration,
        municipal_registration: municipalRegistration,
        email,
        phone,
        whatsapp,
        zip_code: zipCode,
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        website,
        status: 'ATIVO',
      });
    }

    setModalOpen(false);
  };

  const handleOpenStatusModal = (comp: Company, newStatus: CompanyStatus) => {
    setSelectedCompForStatus(comp);
    setTargetStatus(newStatus);
    setStatusReason(comp.blocked_reason || '');
    setStatusModalOpen(true);
  };

  const handleConfirmStatus = async () => {
    if (!selectedCompForStatus) return;
    setIsUpdatingStatus(true);
    await setEstablishmentStatus(selectedCompForStatus.id, targetStatus, statusReason);
    setIsUpdatingStatus(false);
    setStatusModalOpen(false);
  };

  const handleOpenDeleteModal = (comp: Company) => {
    setSelectedCompForDelete(comp);
    setDeleteConfirmText('');
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedCompForDelete) return;
    setIsDeleting(true);
    await deleteEstablishment(selectedCompForDelete.id);
    setIsDeleting(false);
    setDeleteModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Building2 className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Estabelecimentos da Plataforma
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Cadastre, edite, ative/desative, bloqueie e acesse qualquer empresa diretamente em modo Master.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black transition-all shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Estabelecimento</span>
        </button>
      </div>

      {/* Barra de Pesquisa e Filtros */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por razão social, nome fantasia, CNPJ, cidade ou e-mail..."
            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              { key: 'ALL', label: 'Todos' },
              { key: 'ATIVO', label: 'Ativos' },
              { key: 'BLOQUEADO', label: 'Bloqueados' },
            ] as const
          ).map((st) => (
            <button
              key={st.key}
              type="button"
              onClick={() => setStatusFilter(st.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === st.key
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela Responsiva Desktop & Cards Mobile */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        {/* Visualização Desktop (Tabela) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/60 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-4">Estabelecimento / Razão Social</th>
                <th className="p-4">CNPJ</th>
                <th className="p-4">Cidade / UF</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Último Acesso</th>
                <th className="p-4 text-right">Ações Master</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="p-3 bg-slate-800/80 rounded-2xl text-amber-400 border border-slate-700/60">
                        <Building2 className="w-8 h-8" />
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">Nenhum estabelecimento cadastrado no banco</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          O banco de dados real do Supabase está conectado e pronto para receber os estabelecimentos.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={openCreateModal}
                        className="mt-2 inline-flex items-center space-x-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Cadastrar Primeiro Estabelecimento</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((comp) => (
                  <tr key={comp.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-white text-sm">{comp.name}</div>
                      <div className="text-[11px] text-slate-400">{comp.trade_name || '—'}</div>
                    </td>
                    <td className="p-4 font-mono text-slate-300">{comp.cnpj ? maskCNPJ(comp.cnpj) : '—'}</td>
                    <td className="p-4 text-slate-300">
                      {comp.city ? `${comp.city} - ${comp.state || ''}` : '—'}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          comp.status === 'ATIVO'
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                            : comp.status === 'BLOQUEADO'
                            ? 'bg-rose-950/80 text-rose-400 border border-rose-800'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {comp.status}
                      </span>
                    </td>
                    <td className="p-4 text-center text-slate-400 text-[11px]">
                      {comp.last_accessed_at ? new Date(comp.last_accessed_at).toLocaleDateString('pt-BR') : 'Nunca'}
                    </td>
                    <td className="p-4 text-right">
                      <div className="inline-flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            enterCompany(comp);
                            window.location.href = '/dashboard';
                          }}
                          className="px-2.5 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold flex items-center space-x-1 transition-all cursor-pointer"
                          title="Acessar painel do estabelecimento"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Acessar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditModal(comp)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                          title="Editar estabelecimento"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {comp.status === 'ATIVO' ? (
                          <button
                            type="button"
                            onClick={() => handleOpenStatusModal(comp, 'BLOQUEADO')}
                            className="p-1.5 bg-slate-800 hover:bg-amber-950/40 text-amber-400 hover:text-amber-300 rounded-lg transition-colors cursor-pointer"
                            title="Bloquear / Desativar estabelecimento"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenStatusModal(comp, 'ATIVO')}
                            className="px-2.5 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1"
                            title="Desbloquear / Ativar estabelecimento"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Ativar</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenDeleteModal(comp)}
                          className="p-1.5 bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                          title="Excluir estabelecimento e todos os dados vinculados"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Visualização Mobile (Cards) */}
        <div className="md:hidden divide-y divide-slate-800">
          {filteredCompanies.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-3">
              <Building2 className="w-8 h-8 text-amber-400 mx-auto" />
              <p className="font-bold text-white text-xs">Nenhum estabelecimento cadastrado no banco</p>
              <button
                type="button"
                onClick={openCreateModal}
                className="px-4 py-2 bg-amber-500 text-slate-950 font-black rounded-xl text-xs"
              >
                Cadastrar Estabelecimento
              </button>
            </div>
          ) : (
            filteredCompanies.map((comp) => (
              <div key={comp.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-white text-sm">{comp.name}</h3>
                    <p className="text-xs text-slate-400">{comp.trade_name || '—'}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      comp.status === 'ATIVO'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}
                  >
                    {comp.status}
                  </span>
                </div>

                <div className="text-xs text-slate-400 space-y-1">
                  <p>CNPJ: {comp.cnpj ? maskCNPJ(comp.cnpj) : 'Não inf.'}</p>
                  <p>Cidade: {comp.city ? `${comp.city} - ${comp.state || ''}` : 'Não inf.'}</p>
                </div>

                <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-800/60">
                  <button
                    type="button"
                    onClick={() => {
                      enterCompany(comp);
                      window.location.href = '/dashboard';
                    }}
                    className="flex-1 py-2 bg-amber-500 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center space-x-1 shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Acessar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditModal(comp)}
                    className="p-2 bg-slate-800 text-slate-300 rounded-xl"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {comp.status === 'ATIVO' ? (
                    <button
                      type="button"
                      onClick={() => handleOpenStatusModal(comp, 'BLOQUEADO')}
                      className="p-2 bg-amber-950/40 text-amber-400 border border-amber-800/60 rounded-xl"
                      title="Bloquear"
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenStatusModal(comp, 'ATIVO')}
                      className="px-3 py-2 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-xl font-bold text-xs"
                      title="Ativar"
                    >
                      Ativar
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleOpenDeleteModal(comp)}
                    className="p-2 bg-rose-950/40 text-rose-400 border border-rose-800/60 rounded-xl"
                    title="Excluir estabelecimento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de Cadastro / Edição de Estabelecimento (SEM criar usuários automáticos) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 w-full max-w-2xl rounded-3xl p-6 shadow-2xl border border-slate-800 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-base font-black text-white flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                <span>{editingComp ? 'Editar Estabelecimento' : 'Novo Estabelecimento'}</span>
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-rose-950/70 border border-rose-800 rounded-xl flex items-center space-x-2 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Razão Social *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Comercial Distribuidora Silva LTDA"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Nome Fantasia</label>
                  <input
                    type="text"
                    value={tradeName}
                    onChange={(e) => setTradeName(e.target.value)}
                    placeholder="Ex: Distribuidora Silva"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">CNPJ</label>
                  <input
                    type="text"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    placeholder="00.000.000/0000-00"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Inscrição Estadual</label>
                  <input
                    type="text"
                    value={stateRegistration}
                    onChange={(e) => setStateRegistration(e.target.value)}
                    placeholder="ISENTO ou número"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Inscrição Municipal</label>
                  <input
                    type="text"
                    value={municipalRegistration}
                    onChange={(e) => setMunicipalRegistration(e.target.value)}
                    placeholder="Número"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contato@empresa.com.br"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 3333-4444"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">WhatsApp</label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="(11) 99999-8888"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Cidade</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="São Paulo"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Estado (UF)</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value.toUpperCase())}
                    placeholder="SP"
                    maxLength={2}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white uppercase focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Site</label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://empresa.com.br"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Aviso de que não cria usuário automático conforme regra */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300/90 leading-relaxed">
                ℹ️ <strong>Regra Master:</strong> O cadastro de um estabelecimento pelo Painel Master não cria automaticamente nenhum usuário (admin/gerente/vendedor). O estabelecimento é criado de forma isolada e seus acessos são cadastrados conforme a demanda da própria empresa.
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center space-x-1.5 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Estabelecimento</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Alteração de Status (Bloquear / Ativar) */}
      {statusModalOpen && selectedCompForStatus && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 max-w-md w-full rounded-2xl p-6 border border-slate-800 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2 flex items-center space-x-2">
              <AlertCircle className={`w-5 h-5 ${targetStatus === 'BLOQUEADO' ? 'text-amber-400' : 'text-emerald-400'}`} />
              <span>{targetStatus === 'BLOQUEADO' ? 'Bloquear Estabelecimento' : 'Ativar Estabelecimento'}</span>
            </h3>

            <p className="text-xs text-slate-300 mb-4">
              Você está prestes a alterar o status do estabelecimento <strong>{selectedCompForStatus.name}</strong> para{' '}
              <strong className={`uppercase ${targetStatus === 'BLOQUEADO' ? 'text-amber-400' : 'text-emerald-400'}`}>
                {targetStatus === 'BLOQUEADO' ? 'BLOQUEADO / DESATIVADO' : 'ATIVO'}
              </strong>.
            </p>

            {targetStatus === 'BLOQUEADO' && (
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Motivo do Bloqueio *
                </label>
                <textarea
                  required
                  rows={3}
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="Ex: Inadimplência, suspensão temporária, violação de termos..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>
            )}

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStatusModalOpen(false)}
                disabled={isUpdatingStatus}
                className="px-4 py-2 text-xs font-semibold text-slate-300 border border-slate-700 rounded-xl hover:bg-slate-800 cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmStatus}
                disabled={isUpdatingStatus}
                className={`px-4 py-2 text-xs font-black rounded-xl shadow-md cursor-pointer disabled:opacity-50 flex items-center space-x-1.5 ${
                  targetStatus === 'BLOQUEADO'
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950'
                }`}
              >
                {isUpdatingStatus ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <span>{targetStatus === 'BLOQUEADO' ? 'Confirmar Bloqueio' : 'Confirmar Ativação'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Exclusão Definitiva (Deletar tudo com Cascade) */}
      {deleteModalOpen && selectedCompForDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 max-w-md w-full rounded-2xl p-6 border border-rose-900/60 shadow-2xl">
            <div className="flex items-center space-x-2.5 text-rose-400 mb-3">
              <div className="p-2 bg-rose-500/10 rounded-xl border border-rose-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-white">
                Excluir Estabelecimento Definitivamente
              </h3>
            </div>

            <div className="p-3.5 bg-rose-950/30 border border-rose-900/50 rounded-xl mb-4 space-y-1.5">
              <p className="text-xs font-bold text-rose-300 flex items-center space-x-1">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>ATENÇÃO: Ação irreversível!</span>
              </p>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Ao confirmar, o estabelecimento <strong>{selectedCompForDelete.name}</strong> e <strong>TODOS</strong> os seus dados vinculados (clientes, produtos, vendas, histórico de preços, comissões, configurações e usuários) serão apagados permanentemente do banco de dados.
              </p>
            </div>

            <p className="text-xs text-slate-400 mb-2">
              Para confirmar, digite <span className="font-mono font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded">EXCLUIR</span> no campo abaixo:
            </p>

            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Digite EXCLUIR"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white uppercase focus:outline-hidden focus:ring-2 focus:ring-rose-500 mb-4 font-mono font-bold"
            />

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-slate-300 border border-slate-700 rounded-xl hover:bg-slate-800 cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteConfirmText.trim().toUpperCase() !== 'EXCLUIR' || isDeleting}
                className="px-4 py-2 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1.5"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deletando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Deletar Tudo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
