'use client';

import React from 'react';
import Link from 'next/link';
import { useMaster } from '@/context/MasterAuthContext';
import {
  Building2,
  Users,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Ban,
  ArrowRight,
  TrendingUp,
  History,
  Activity,
  ExternalLink,
} from 'lucide-react';

export default function MasterDashboardPage() {
  const { companies, auditLogs, enterCompany } = useMaster();

  const totalCompanies = companies.length;
  const activeCompanies = companies.filter((c) => c.status === 'ATIVO').length;
  const inactiveCompanies = companies.filter((c) => c.status === 'INATIVO').length;
  const blockedCompanies = companies.filter((c) => c.status === 'BLOQUEADO').length;

  const recentCompanies = companies.slice(0, 5);
  const recentLogs = auditLogs.slice(0, 6);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Dashboard Geral da Plataforma
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Visão unificada de todos os estabelecimentos, métricas de crescimento e atividades Master.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href="/master/estabelecimentos"
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black transition-all shadow-md shadow-amber-500/20 active:scale-95"
          >
            <Building2 className="w-4 h-4" />
            <span>Gerenciar Estabelecimentos</span>
          </Link>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total de Estabelecimentos
            </span>
            <span className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
              <Building2 className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-white mt-2">{totalCompanies}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Empresas cadastradas no sistema</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Estabelecimentos Ativos
            </span>
            <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-2">{activeCompanies}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Operando normalmente</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Inativos
            </span>
            <span className="p-2 bg-slate-500/10 text-slate-400 rounded-xl">
              <XCircle className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-300 mt-2">{inactiveCompanies}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Acesso suspenso temporariamente</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Bloqueados
            </span>
            <span className="p-2 bg-rose-500/10 text-rose-400 rounded-xl">
              <Ban className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-rose-400 mt-2">{blockedCompanies}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Bloqueio administrativo</span>
        </div>
      </div>

      {/* Grid: Últimos Estabelecimentos e Atividades de Auditoria */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimos Estabelecimentos */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>Últimos Estabelecimentos</span>
            </h2>
            <Link
              href="/master/estabelecimentos"
              className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center space-x-1"
            >
              <span>Ver todos</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-800/80 mt-2 flex-1">
            {recentCompanies.map((c) => (
              <div key={c.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{c.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {c.city ? `${c.city} - ${c.state || ''}` : 'Local não inf.'} • CNPJ: {c.cnpj || 'Não inf.'}
                  </p>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black ${
                      c.status === 'ATIVO'
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                        : c.status === 'BLOQUEADO'
                        ? 'bg-rose-950/80 text-rose-400 border border-rose-800'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {c.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      enterCompany(c);
                      window.location.href = '/dashboard';
                    }}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg text-xs transition-colors cursor-pointer"
                    title="Acessar Estabelecimento (Modo Master)"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Últimas Atividades e Auditoria */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <span>Últimas Ações Master (Auditoria)</span>
            </h2>
            <Link
              href="/master/auditoria"
              className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center space-x-1"
            >
              <span>Ver logs</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-800/80 mt-2 flex-1">
            {recentLogs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                    {log.action}
                  </span>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-1">{log.description}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Por {log.master_email} • {new Date(log.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
