'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  User,
  Mail,
  Shield,
  Lock,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Building2,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';

export default function MeuPerfilPage() {
  const { user, company, updateProfile, updateUserPassword } = useAuth();

  // Dados do Perfil
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Redefinição de Senha
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);
  const [savingPass, setSavingPass] = useState(false);

  // Salvar dados básicos do perfil
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setProfileError('O nome não pode ficar em branco.');
      return;
    }

    setSavingProfile(true);
    setProfileError(null);
    setProfileSuccess(null);

    try {
      updateProfile({ name: name.trim(), phone: phone.trim() || null });
      setProfileSuccess('Dados do perfil atualizados com sucesso!');
      setTimeout(() => setProfileSuccess(null), 3500);
    } catch (err: any) {
      setProfileError(err?.message || 'Erro ao atualizar perfil.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Redefinir senha com segurança
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (newPassword.length < 6) {
      setPassError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError('A confirmação de senha não coincide com a nova senha.');
      return;
    }

    setSavingPass(true);

    try {
      // 1. Tentar atualizar via Supabase Auth client pelo context
      await updateUserPassword(newPassword);

      // 2. Chamar endpoint do backend para garantir atualização administrativa no Supabase Auth
      const res = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          email: user?.email,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok && !data.success) {
        throw new Error(data.message || 'Erro ao salvar nova senha no servidor.');
      }

      // Atualizar no localStorage caso seja um usuário de lista local
      try {
        const tenantKey = company?.id ? `_tenant_${company.id}` : '';
        const rawUsers = localStorage.getItem(`negociapro_users_list${tenantKey}`) || localStorage.getItem('negociapro_users_list');
        if (rawUsers) {
          const list = JSON.parse(rawUsers);
          const idx = list.findIndex((u: any) => u.email?.toLowerCase() === user?.email?.toLowerCase());
          if (idx >= 0) {
            list[idx].tempPassword = newPassword;
            localStorage.setItem(`negociapro_users_list${tenantKey}`, JSON.stringify(list));
            localStorage.setItem('negociapro_users_list', JSON.stringify(list));
          }
        }
      } catch {}

      setPassSuccess('Sua senha foi redefinida com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPassSuccess(null), 5000);
    } catch (err: any) {
      console.error('Erro ao redefinir senha:', err);
      setPassError(err?.message || 'Falha ao redefinir a senha. Tente novamente.');
    } finally {
      setSavingPass(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          Meu Perfil & Segurança
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Gerencie seus dados de acesso pessoal, informações de contato e redefinição de senha.
        </p>
      </div>

      {/* Cartão com Resumo do Usuário */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white font-black text-xl shadow-md shadow-blue-500/20">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900">{user?.name || 'Usuário'}</h2>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  user?.role === 'ADMIN'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : user?.role === 'GERENTE'
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}
              >
                {user?.role || 'VENDEDOR'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
            <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 mt-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>{company?.trade_name || company?.name || 'Estabelecimento NegociaPro'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Formulário 1: Dados Pessoais */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <User className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Informações Pessoais</h3>
          </div>

          {profileSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center space-x-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-bold flex items-center space-x-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">E-mail (Login)</label>
              <div className="relative">
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-500 cursor-not-allowed font-medium"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">O e-mail de login corporativo é gerenciado pela administração.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Telefone / WhatsApp</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(00) 00000-0000"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Cargo / Função</label>
              <div className="relative">
                <input
                  type="text"
                  disabled
                  value={user?.role || 'VENDEDOR'}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-500 cursor-not-allowed font-bold"
                />
                <Shield className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-98 cursor-pointer flex items-center justify-center space-x-1.5"
              >
                {savingProfile ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Atualizar Dados do Perfil</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Formulário 2: Redefinição de Senha */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <KeyRound className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Redefinir Minha Senha</h3>
          </div>

          <p className="text-xs text-slate-500">
            Você pode alterar sua senha de acesso a qualquer momento. Escolha uma senha segura com no mínimo 6 caracteres.
          </p>

          {passSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{passSuccess}</span>
            </div>
          )}

          {passError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-bold flex items-center space-x-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{passError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nova Senha</label>
              <div className="relative">
                <input
                  type={showNewPass ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-10 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  title={showNewPass ? 'Ocultar' : 'Exibir'}
                  className="p-1 text-slate-400 hover:text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors cursor-pointer"
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Confirmar Nova Senha</label>
              <div className="relative">
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-10 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  title={showConfirmPass ? 'Ocultar' : 'Exibir'}
                  className="p-1 text-slate-400 hover:text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors cursor-pointer"
                >
                  {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 text-[11px] text-slate-500 space-y-1">
              <div className="flex items-center space-x-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${newPassword.length >= 6 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <span>Pelo menos 6 caracteres</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${newPassword && newPassword === confirmPassword ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <span>As duas senhas digitadas coincidem</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingPass}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-slate-900/20 active:scale-98 cursor-pointer flex items-center justify-center space-x-1.5"
              >
                {savingPass ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Atualizando Senha...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Redefinir Minha Senha</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
