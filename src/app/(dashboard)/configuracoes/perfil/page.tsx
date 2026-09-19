'use client';

import React, { useState, useEffect } from 'react';
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
  ShieldCheck,
  RefreshCw,
  Send,
  Clock,
} from 'lucide-react';

export default function MeuPerfilPage() {
  const { user, company, updateProfile, updateUserPassword, resendConfirmation } = useAuth();

  // Dados do Perfil
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Status de Verificação de E-mail
  const [isEmailVerified, setIsEmailVerified] = useState<boolean | null>(null);
  const [checkingEmailStatus, setCheckingEmailStatus] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [emailStatusMessage, setEmailStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Verificar status real de e-mail verificado no Supabase Auth
  useEffect(() => {
    async function checkStatus() {
      if (!user?.email) return;
      setCheckingEmailStatus(true);
      try {
        const res = await fetch('/api/auth/email-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, userId: user.id }),
        });
        const data = await res.json();
        if (data.success) {
          setIsEmailVerified(Boolean(data.verified));
        } else {
          setIsEmailVerified(false);
        }
      } catch (e) {
        setIsEmailVerified(false);
      } finally {
        setCheckingEmailStatus(false);
      }
    }
    checkStatus();
  }, [user?.email, user?.id]);

  const handleResendVerification = async () => {
    if (!user?.email || resendingEmail) return;
    setResendingEmail(true);
    setEmailStatusMessage(null);

    try {
      const res = await resendConfirmation(user.email);
      if (res.success) {
        setEmailStatusMessage({
          type: 'success',
          text: res.message || 'Link de confirmação enviado com sucesso! Verifique sua caixa de entrada e spam.',
        });
      } else {
        setEmailStatusMessage({
          type: 'error',
          text: res.message || 'Não foi possível reenviar o link no momento.',
        });
      }
    } catch (e: any) {
      setEmailStatusMessage({
        type: 'error',
        text: 'Erro ao enviar e-mail. Tente novamente em instantes.',
      });
    } finally {
      setResendingEmail(false);
    }
  };

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

  // Sincronizar campos com os dados carregados do perfil
  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
    if (user?.phone !== undefined) {
      setPhone(user.phone || '');
    }
  }, [user?.name, user?.phone]);

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
      const res = await updateProfile({ name: name.trim(), phone: phone.trim() || null });
      if (res && res.success === false) {
        setProfileError(res.message || 'Erro ao sincronizar dados no servidor.');
      } else {
        setProfileSuccess('Dados do perfil atualizados com sucesso!');
        setTimeout(() => setProfileSuccess(null), 3500);
      }
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
            <div className="flex items-center space-x-2 mt-1 flex-wrap gap-y-1">
              <p className="text-xs text-slate-500">{user?.email}</p>
              
              {/* Badge de E-mail Verificado ou Pendente */}
              {checkingEmailStatus ? (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Verificando status...</span>
                </span>
              ) : isEmailVerified ? (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>E-mail Verificado</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
                  <Clock className="w-3 h-3 text-amber-600" />
                  <span>E-mail Não Confirmado</span>
                </span>
              )}
            </div>

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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">E-mail (Login)</label>
                {!checkingEmailStatus && (
                  isEmailVerified ? (
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center space-x-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Verificado</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-600 flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>Pendente de Ativação</span>
                    </span>
                  )
                )}
              </div>
              <div className="relative">
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-600 cursor-not-allowed font-medium pr-10"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>

              {/* Mensagem de status de reenvio de e-mail */}
              {emailStatusMessage && (
                <div
                  className={`mt-2 p-2.5 rounded-lg text-xs font-medium flex items-center space-x-2 ${
                    emailStatusMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {emailStatusMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span>{emailStatusMessage.text}</span>
                </div>
              )}

              {/* Bloco explicativo com botão profissional para reenviar confirmação */}
              {!isEmailVerified && !checkingEmailStatus && (
                <div className="mt-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-300/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-start space-x-2">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-amber-900">Seu e-mail ainda não foi confirmado</p>
                      <p className="text-[11px] text-amber-700 leading-tight mt-0.5">
                        Confirme seu endereço para garantir a segurança e recuperação da sua conta corporativa.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendingEmail}
                    className="inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs shrink-0 disabled:opacity-50 cursor-pointer"
                  >
                    {resendingEmail ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Enviar Confirmação</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {isEmailVerified && (
                <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span>Conta oficial autenticada e protegida com e-mail confirmado.</span>
                </p>
              )}
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
