'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { maskCNPJ, maskPhone, maskCEP } from '@/lib/formatters';
import { Building2, Check, AlertCircle, Sparkles, Copy, Database, Key, ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EmpresaConfigPage() {
  const router = useRouter();
  const { user, company, updateCompany, isLoading } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [copiedId, setCopiedId] = useState(false);

  const [formData, setFormData] = useState({
    name: company?.name || '',
    trade_name: company?.trade_name || '',
    cnpj: company?.cnpj || '',
    state_registration: company?.state_registration || '',
    municipal_registration: company?.municipal_registration || '',
    email: company?.email || '',
    phone: company?.phone || '',
    whatsapp: company?.whatsapp || '',
    website: company?.website || '',
    zip_code: company?.zip_code || '',
    street: company?.street || '',
    number: company?.number || '',
    complement: company?.complement || '',
    neighborhood: company?.neighborhood || '',
    city: company?.city || '',
    state: company?.state || 'SP',
  });

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sincronizar dados do formulário quando os dados da empresa carregarem
  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        trade_name: company.trade_name || '',
        cnpj: company.cnpj || '',
        state_registration: company.state_registration || '',
        municipal_registration: company.municipal_registration || '',
        email: company.email || '',
        phone: company.phone || '',
        whatsapp: company.whatsapp || '',
        website: company.website || '',
        zip_code: company.zip_code || '',
        street: company.street || '',
        number: company.number || '',
        complement: company.complement || '',
        neighborhood: company.neighborhood || '',
        city: company.city || '',
        state: company.state || 'SP',
      });
    }
  }, [company]);

  // Redirecionar colaboradores não-admin para o dashboard
  useEffect(() => {
    if (!isLoading && user && !isAdmin) {
      const timer = setTimeout(() => {
        router.replace('/dashboard');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, user, isAdmin, router]);

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-4 animate-in fade-in">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">
          Acesso Restrito a Administradores
        </h2>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          Você está conectado com o perfil <strong className="text-blue-600 font-bold">{user?.role || 'VENDEDOR'}</strong>. Apenas o administrador do estabelecimento possui permissão para visualizar e alterar os dados cadastrais da empresa.
        </p>
        <div className="pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setSaving(true);
    try {
      await updateCompany(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          Minha Empresa (Dados Cadastrais)
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configuração da pessoa jurídica titular da conta para relatórios, cabeçalhos comerciais e documentos.
        </p>
      </div>

      {!isAdmin && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center space-x-3 text-xs text-amber-900 font-semibold">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>
            Modo Somente Leitura: Apenas administradores do estabelecimento podem editar ou salvar as informações cadastrais da empresa.
          </span>
        </div>
      )}

      {saved && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center space-x-2 text-xs text-emerald-800 font-bold animate-in fade-in">
          <Check className="w-5 h-5 text-emerald-600" />
          <span>Dados da empresa atualizados com sucesso!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
        <fieldset disabled={!isAdmin} className="space-y-6 disabled:opacity-85">
        {/* ID do Estabelecimento no Banco de Dados (Pronto para Cópia Rápida) */}
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  ID do Estabelecimento no Banco
                </span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-[10px] font-black">
                  UUID
                </span>
              </div>
              <div className="font-mono text-xs font-bold text-slate-800 break-all select-all mt-0.5">
                {company?.id || 'demo-company'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (company?.id) {
                navigator.clipboard.writeText(company.id);
                setCopiedId(true);
                setTimeout(() => setCopiedId(false), 2500);
              }
            }}
            className={`inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-xs active:scale-95 ${
              copiedId
                ? 'bg-emerald-600 text-white'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            {copiedId ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>ID Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500" />
                <span>Copiar ID</span>
              </>
            )}
          </button>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            Identificação Corporativa
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Razão Social *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nome Fantasia</label>
              <input
                type="text"
                value={formData.trade_name}
                onChange={(e) => setFormData({ ...formData, trade_name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">CNPJ *</label>
              <input
                type="text"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: maskCNPJ(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Inscrição Estadual</label>
              <input
                type="text"
                value={formData.state_registration}
                onChange={(e) => setFormData({ ...formData, state_registration: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Contato */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            Canais de Comunicação
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">E-mail Comercial</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Telefone Fixo</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: maskPhone(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp Comercial</label>
              <input
                type="text"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: maskPhone(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Endereço */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            Endereço da Sede
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">CEP</label>
              <input
                type="text"
                value={formData.zip_code}
                onChange={(e) => setFormData({ ...formData, zip_code: maskCEP(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Logradouro / Rua</label>
              <input
                type="text"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Número</label>
              <input
                type="text"
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bairro</label>
              <input
                type="text"
                value={formData.neighborhood}
                onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Cidade</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Estado</label>
              <input
                type="text"
                maxLength={2}
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 uppercase focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        </fieldset>

        {/* Salvar */}
        {isAdmin && (
          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center space-x-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-95 cursor-pointer"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Salvando no Servidor...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Salvar Alterações da Empresa</span>
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
