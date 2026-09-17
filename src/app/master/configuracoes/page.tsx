'use client';

import React, { useState } from 'react';
import { useMaster } from '@/context/MasterAuthContext';
import {
  Settings,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Server,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function MasterConfiguracoesPage() {
  const { masterUser, isPrimaryMaster, updateMasterPassword } = useMaster();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setStatus({ type: 'error', message: 'A senha deve ter pelo menos 8 caracteres.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: 'As senhas digitadas não coincidem.' });
      return;
    }

    setLoading(true);
    setStatus(null);

    const result = await updateMasterPassword(newPassword);

    if (result.success) {
      setStatus({ type: 'success', message: 'Senha Master atualizada com segurança!' });
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setStatus({ type: 'error', message: result.message || 'Erro ao atualizar senha.' });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
            <Settings className="w-5 h-5" />
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Configurações da Plataforma & Perfil Master
          </h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Parâmetros operacionais e segurança da conta administrativa Master.
        </p>
      </div>

      {status && (
        <div
          className={`p-4 rounded-xl flex items-center space-x-2 text-xs font-semibold ${
            status.type === 'success'
              ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300'
              : 'bg-rose-950/80 border border-rose-800 text-rose-300'
          }`}
        >
          {status.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{status.message}</span>
        </div>
      )}

      {/* Card: Dados do Operador Master */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span>Informações do Operador Master</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Nome</span>
            <span className="text-white font-bold text-sm mt-0.5 block">{masterUser?.name}</span>
          </div>

          <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">E-mail Cadastrado</span>
            <span className="text-white font-mono text-xs mt-0.5 block truncate">{masterUser?.email}</span>
          </div>

          <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Nível de Acesso</span>
            <span className="text-amber-400 font-bold text-xs mt-0.5 block">
              {isPrimaryMaster ? 'Primary Master (Acesso Total)' : 'Master Delegado'}
            </span>
          </div>
        </div>
      </div>

      {/* Card: Alteração de Senha Master */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center space-x-2">
          <KeyRound className="w-4 h-4 text-amber-400" />
          <span>Alterar Senha de Acesso Master</span>
        </h2>

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Nova Senha (mínimo 8 caracteres)
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                title={showNewPassword ? 'Ocultar senha' : 'Ver senha'}
                className="p-1 text-slate-400 hover:text-slate-200 absolute right-3 top-1/2 -translate-y-1/2 rounded-lg transition-colors"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                title={showConfirmPassword ? 'Ocultar senha' : 'Ver senha'}
                className="p-1 text-slate-400 hover:text-slate-200 absolute right-3 top-1/2 -translate-y-1/2 rounded-lg transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Atualizando...' : 'Salvar Nova Senha'}
          </button>
        </form>
      </div>

      {/* Card: Status da Infraestrutura e Versão */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-white flex items-center space-x-2">
          <Server className="w-4 h-4 text-amber-400" />
          <span>Status do Ambiente</span>
        </h2>
        <div className="text-xs text-slate-400 space-y-1">
          <p>Plataforma: <strong>NegociaPro Multi-Tenant Enterprise</strong></p>
          <p>Motor de Aplicação: <strong>Next.js 16 + React 19</strong></p>
          <p>Banco de Dados: <strong>PostgreSQL (Supabase)</strong></p>
          <p>Serviço de E-mail: <strong>Resend Transacional</strong></p>
        </div>
      </div>
    </div>
  );
}
