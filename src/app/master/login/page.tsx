'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMaster } from '@/context/MasterAuthContext';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, KeyRound, CheckCircle2 } from 'lucide-react';

export default function MasterLoginPage() {
  const router = useRouter();
  const { loginMaster, updateMasterPassword } = useMaster();

  const [email, setEmail] = useState('pablixgamezgg@gmail.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fluxo de primeiro login com troca obrigatória de senha
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError(null);

    const result = await loginMaster(email, password);

    if (result.success) {
      if (result.mustChangePass) {
        setIsChangingPass(true);
      } else {
        router.push('/master/dashboard');
      }
    } else {
      setError(result.message || 'E-mail ou senha incorretos.');
    }
    setLoading(false);
  };

  const handleUpdatePass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError('A nova senha deve ter no mínimo 8 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await updateMasterPassword(newPassword);

    if (result.success) {
      setSuccessMessage('Senha atualizada com sucesso! Redirecionando...');
      setTimeout(() => {
        router.push('/master/dashboard');
      }, 1500);
    } else {
      setError(result.message || 'Erro ao atualizar senha.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Glow de Fundo Master (Dourado/Âmbar e Azul Escuro) */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-10 right-10 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10 px-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-600 to-yellow-400 text-slate-950 shadow-xl shadow-amber-500/20 mb-4">
          <ShieldCheck className="w-8 h-8 stroke-[2.5]" />
        </div>
        <div className="flex items-center justify-center space-x-2">
          <span className="text-2xl font-black tracking-tight text-white">PAINEL</span>
          <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">
            MASTER
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-400 font-medium">
          Administração Global da Plataforma NegociaPro
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 py-8 px-6 shadow-2xl rounded-3xl sm:px-10">
          {error && (
            <div className="p-3.5 bg-rose-950/70 border border-rose-800/80 rounded-xl mb-5 flex items-center space-x-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 bg-emerald-950/70 border border-emerald-800/80 rounded-xl mb-5 flex items-center space-x-2 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {!isChangingPass ? (
            /* Formulário de Login Master */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  E-mail Master Autorizado
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="pablixgamezgg@gmail.com"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Senha Master
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 inline-flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-amber-500/20 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
              >
                <span>{loading ? 'Validando Acesso...' : 'Acessar Painel Master'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-4 mt-2 border-t border-slate-800/80 text-center">
                <Link
                  href="/login"
                  className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
                >
                  ← Voltar para o login do estabelecimento
                </Link>
              </div>
            </form>
          ) : (
            /* Formulário Obrigatório de Troca de Senha no 1º Acesso */
            <form onSubmit={handleUpdatePass} className="space-y-4">
              <div className="text-center mb-4">
                <div className="inline-flex p-2 bg-amber-500/10 text-amber-400 rounded-xl mb-2">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h2 className="text-sm font-black text-white">Primeiro Acesso Detectado</h2>
                <p className="text-[11px] text-slate-400 mt-1">
                  Por motivos de segurança estrita, defina sua nova senha Master definitiva (mínimo 8 caracteres).
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nova Senha Definitiva
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres..."
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Confirmar Nova Senha
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha..."
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 inline-flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-amber-500/20 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
              >
                <span>{loading ? 'Salvando...' : 'Salvar Nova Senha e Continuar'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
