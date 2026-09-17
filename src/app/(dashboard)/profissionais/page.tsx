'use client';

import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency, maskCPF, maskPhone } from '@/lib/formatters';
import { Professional, Profile, UserRole } from '@/types/database';
import {
  Award,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  Edit2,
  DollarSign,
  TrendingUp,
  User,
  AlertCircle,
  X,
  Upload,
  Check,
  Key,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Share2,
  MessageCircle,
} from 'lucide-react';

export default function ProfissionaisPage() {
  const { professionals, sales, commissions, addProfessional, updateProfessional, deactivateProfessional } = useData();

  const [filterQuery, setFilterQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modal de Cadastro/Edição
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProf, setEditingProf] = useState<Professional | null>(null);

  // Modal de Credenciais Criadas (WhatsApp / Copiar)
  const [credentialsModal, setCredentialsModal] = useState<{
    name: string;
    email: string;
    role: string;
    tempPass: string;
  } | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  // Campos do formulário
  const [name, setName] = useState('');
  const [document, setDocument] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [roleTitle, setRoleTitle] = useState('Vendedor');
  const [notes, setNotes] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Filtragem
  const filteredProfessionals = professionals.filter((p) => {
    const matchesQuery =
      p.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      p.role_title.toLowerCase().includes(filterQuery.toLowerCase()) ||
      (p.document && p.document.includes(filterQuery)) ||
      (p.email && p.email.toLowerCase().includes(filterQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && p.active) ||
      (statusFilter === 'INACTIVE' && !p.active);

    return matchesQuery && matchesStatus;
  });

  const { user: currentUser } = useAuth();
  const [enableLoginAccess, setEnableLoginAccess] = useState(false);
  const [loginRole, setLoginRole] = useState<UserRole>('VENDEDOR');
  const [tempPassword, setTempPassword] = useState('123456');
  const [showTempPass, setShowTempPass] = useState(false);

  const openCreateModal = () => {
    setEditingProf(null);
    setName('');
    setDocument('');
    setPhone('');
    setEmail('');
    setRoleTitle('Vendedor / Consultor');
    setNotes('');
    setAvatarUrl('');
    setEnableLoginAccess(false);
    setLoginRole('VENDEDOR');
    setTempPassword('123456');
    setShowTempPass(false);
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (prof: Professional) => {
    setEditingProf(prof);
    setName(prof.name);
    setDocument(prof.document || '');
    setPhone(prof.phone || '');
    setEmail(prof.email || '');
    setRoleTitle(prof.role_title || 'Profissional');
    setNotes(prof.notes || '');
    setAvatarUrl(prof.avatar_url || '');
    setEnableLoginAccess(false);
    setLoginRole('VENDEDOR');
    setTempPassword('123456');
    setShowTempPass(false);
    setError(null);
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('O nome do profissional é obrigatório.');
      return;
    }

    if (enableLoginAccess && !email.trim()) {
      setError('Para liberar acesso ao sistema com login, o e-mail é obrigatório.');
      return;
    }

    if (editingProf) {
      updateProfessional(editingProf.id, {
        name,
        document,
        phone,
        email,
        role_title: roleTitle,
        notes,
        avatar_url: avatarUrl || null,
      });
    } else {
      addProfessional({
        name,
        document,
        phone,
        email,
        role_title: roleTitle,
        notes,
        avatar_url: avatarUrl || null,
        active: true,
      });

      // Se marcou para criar acesso de login ao sistema
      if (enableLoginAccess && email.trim()) {
        try {
          const rawUsers = localStorage.getItem('negociapro_users_list');
          const currentUsersList: Profile[] = rawUsers ? JSON.parse(rawUsers) : [];
          const newUserProfile: Profile = {
            id: `usr-${Date.now()}`,
            company_id: currentUser?.company_id || 'demo-company',
            name: name,
            email: email.trim().toLowerCase(),
            role: loginRole,
            phone: phone || undefined,
            active: true,
          };
          // Evitar duplicar e-mail se já existir
          const filtered = currentUsersList.filter(u => u.email.toLowerCase() !== email.trim().toLowerCase());
          filtered.push(newUserProfile);
          localStorage.setItem('negociapro_users_list', JSON.stringify(filtered));

          // Enviar e-mail de boas-vindas com dados de acesso via Resend (se configurado)
          fetch('/api/auth/convite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name,
              email: email.trim(),
              role: loginRole,
              tempPassword,
              companyName: currentUser?.name || 'NegociaPro',
            }),
          }).catch(err => console.error('Erro ao disparar e-mail pelo Resend:', err));

          // Abrir modal de compartilhamento imediato (WhatsApp / Copiar dados)
          setCredentialsModal({
            name,
            email: email.trim(),
            role: loginRole,
            tempPass: tempPassword || '123456',
          });
        } catch (err) {
          console.error('Erro ao registrar usuário para login:', err);
        }
      }
    }

    setModalOpen(false);
  };

  // Upload rápido de avatar com fallback
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setError('A foto deve ter no máximo 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Totais Consolidados
  const totalCommissionEarned = professionals.reduce((acc, p) => acc + (p.commission_earned || 0), 0);
  const totalCommissionPaid = professionals.reduce((acc, p) => acc + (p.commission_paid || 0), 0);
  const totalCommissionPending = professionals.reduce((acc, p) => acc + (p.commission_pending || 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-600/20">
              <Award className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Profissionais & Vendedores
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cadastre consultores, vendedores, barbeiros, técnicos e gerencie comissões individuais por venda.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Profissional</span>
        </button>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Profissionais Ativos
            </span>
            <p className="text-xl font-black text-slate-900 mt-0.5">
              {professionals.filter((p) => p.active).length} de {professionals.length}
            </p>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <User className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Comissões Geradas
            </span>
            <p className="text-xl font-black text-emerald-600 mt-0.5">
              {formatCurrency(totalCommissionEarned)}
            </p>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Pendente de Pagamento
            </span>
            <p className="text-xl font-black text-amber-600 mt-0.5">
              {formatCurrency(totalCommissionPending)}
            </p>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Barra de Filtros & Busca */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Buscar por nome, cargo, CPF ou e-mail..."
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
            Todos ({professionals.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === 'ACTIVE' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'hover:text-slate-900'
            }`}
          >
            Ativos ({professionals.filter((p) => p.active).length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('INACTIVE')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === 'INACTIVE' ? 'bg-white text-slate-700 shadow-xs font-bold' : 'hover:text-slate-900'
            }`}
          >
            Inativos ({professionals.filter((p) => !p.active).length})
          </button>
        </div>
      </div>

      {/* Grid de Cards de Profissionais (Altamente Responsivo Mobile/Desktop) */}
      {filteredProfessionals.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 shadow-xs text-center">
          <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">Nenhum profissional encontrado</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Cadastre sua equipe para associar os responsáveis a cada venda e comissão calculada.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20"
          >
            Cadastrar Profissional
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProfessionals.map((prof) => (
            <div
              key={prof.id}
              className={`bg-white rounded-2xl border p-5 transition-all shadow-xs hover:shadow-md flex flex-col justify-between ${
                prof.active ? 'border-slate-200/80' : 'border-slate-200 opacity-60 bg-slate-50/50'
              }`}
            >
              <div>
                {/* Header do Card */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    {prof.avatar_url ? (
                      <img
                        src={prof.avatar_url}
                        alt={prof.name}
                        className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-2xs"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 font-black text-sm flex items-center justify-center border border-blue-200">
                        {prof.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">{prof.name}</h3>
                      <span className="inline-block text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md mt-0.5">
                        {prof.role_title}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      prof.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {prof.active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                {/* Contatos */}
                <div className="mt-4 space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  {prof.document && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">CPF:</span>
                      <span className="font-mono text-slate-700">{maskCPF(prof.document)}</span>
                    </div>
                  )}
                  {prof.phone && (
                    <div className="flex items-center space-x-2 text-[11px]">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{maskPhone(prof.phone)}</span>
                    </div>
                  )}
                  {prof.email && (
                    <div className="flex items-center space-x-2 text-[11px]">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{prof.email}</span>
                    </div>
                  )}
                  {prof.notes && (
                    <p className="text-[11px] text-slate-500 italic mt-2 line-clamp-2 bg-slate-50 p-2 rounded-lg">
                      "{prof.notes}"
                    </p>
                  )}
                </div>

                {/* Resumo de Comissões e Vendas */}
                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-2 gap-2 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Total Vendas</span>
                    <span className="text-xs font-bold text-slate-800">
                      {formatCurrency(prof.total_sales || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Comissão Total</span>
                    <span className="text-xs font-bold text-emerald-600">
                      {formatCurrency(prof.commission_earned || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => openEditModal(prof)}
                  className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center space-x-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </button>

                {prof.active ? (
                  <button
                    type="button"
                    onClick={() => deactivateProfessional(prof.id)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Desativar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => updateProfessional(prof.id, { active: true })}
                    className="px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  >
                    Reativar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Cadastro / Edição */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-900">
                {editingProf ? 'Editar Profissional' : 'Novo Profissional'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              {/* Foto / Avatar */}
              <div className="flex items-center space-x-4">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Preview"
                    className="w-14 h-14 rounded-full object-cover border-2 border-blue-500 shadow-xs"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center border border-dashed border-slate-300">
                    <User className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Foto do Profissional
                  </label>
                  <label className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Carregar Foto</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl('')}
                      className="ml-2 text-[11px] text-red-600 hover:underline"
                    >
                      Remover
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Carlos Roberto Vendedor ou Juliana Mendes"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cargo / Função *</label>
                  <input
                    type="text"
                    required
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    placeholder="Ex: Vendedor, Barbeiro, Técnico"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">CPF (Opcional)</label>
                  <input
                    type="text"
                    value={document}
                    onChange={(e) => setDocument(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="profissional@empresa.com.br"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Observações Internas</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Informações adicionais sobre o profissional ou especialidades..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Opção Rápida: Liberar Acesso de Login ao Sistema */}
              {!editingProf && (
                <div className="p-3.5 bg-blue-50/60 border border-blue-200/80 rounded-2xl space-y-3">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableLoginAccess}
                      onChange={(e) => setEnableLoginAccess(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-blue-600" />
                        Criar login e senha de acesso ao sistema
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        Permite que este profissional entre no sistema com seu e-mail para registrar vendas e consultar o histórico de clientes.
                      </p>
                    </div>
                  </label>

                  {enableLoginAccess && (
                    <div className="pt-2 border-t border-blue-100/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Nível de Permissão
                        </label>
                        <select
                          value={loginRole}
                          onChange={(e) => setLoginRole(e.target.value as UserRole)}
                          className="w-full bg-white border border-blue-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="VENDEDOR">Vendedor (Padrão)</option>
                          <option value="GERENTE">Gerente Comercial</option>
                          <option value="ADMIN">Administrador</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Senha Inicial Provisória
                        </label>
                        <div className="relative">
                          <input
                            type={showTempPass ? 'text' : 'password'}
                            value={tempPassword}
                            onChange={(e) => setTempPassword(e.target.value)}
                            placeholder="123456"
                            className="w-full bg-white border border-blue-200 rounded-xl pl-8 pr-10 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                          />
                          <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <button
                            type="button"
                            onClick={() => setShowTempPass(!showTempPass)}
                            title={showTempPass ? 'Ocultar senha' : 'Ver senha'}
                            className="p-1 text-slate-400 hover:text-slate-600 absolute right-2 top-1/2 -translate-y-1/2 rounded-lg transition-colors"
                          >
                            {showTempPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center space-x-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Profissional</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Sucesso com Acesso Criado e Envio por WhatsApp / Copiar */}
      {credentialsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Acesso Criado com Sucesso!</h3>
                <p className="text-xs text-slate-500">Envie os dados de acesso para o colaborador</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Nome:</span>
                <strong className="text-slate-900">{credentialsModal.name}</strong>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>E-mail / Login:</span>
                <strong className="text-slate-900 font-mono">{credentialsModal.email}</strong>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Cargo:</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px]">
                  {credentialsModal.role}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600 pt-1 border-t border-slate-200">
                <span>Senha Provisória:</span>
                <strong className="text-blue-600 font-mono text-sm">{credentialsModal.tempPass}</strong>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              💡 Para facilitar a entrada imediata do colaborador, você pode copiar os dados ou enviar direto no WhatsApp dele:
            </p>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const msg = `Olá *${credentialsModal.name}*! 👋\n\nSeu acesso ao *NegociaPro* foi liberado com sucesso.\n\n🔗 *Link de Acesso:* ${typeof window !== 'undefined' ? window.location.origin : ''}/login\n📧 *Login:* ${credentialsModal.email}\n🔑 *Senha Inicial:* ${credentialsModal.tempPass}\n\nRecomendamos alterar sua senha no primeiro acesso!`;
                  navigator.clipboard.writeText(msg);
                  setCopiedText(true);
                  setTimeout(() => setCopiedText(false), 2500);
                }}
                className="py-2.5 px-3 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              >
                {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedText ? 'Copiado!' : 'Copiar Dados'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const msg = encodeURIComponent(`Olá *${credentialsModal.name}*! 👋\n\nSeu acesso ao *NegociaPro* foi liberado com sucesso.\n\n🔗 *Link de Acesso:* ${typeof window !== 'undefined' ? window.location.origin : ''}/login\n📧 *Login:* ${credentialsModal.email}\n🔑 *Senha Inicial:* ${credentialsModal.tempPass}\n\nRecomendamos alterar sua senha no primeiro acesso!`);
                  window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
                }}
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors shadow-sm shadow-emerald-600/30 cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Enviar no WhatsApp</span>
              </button>
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setCredentialsModal(null)}
                className="text-xs text-slate-400 hover:text-slate-600 font-semibold cursor-pointer"
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
