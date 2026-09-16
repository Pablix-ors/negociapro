'use client';

import React, { useState } from 'react';
import { useMaster } from '@/context/MasterAuthContext';
import { MasterAction } from '@/types/master';
import {
  History,
  Search,
  Filter,
  Calendar,
  Building2,
  ShieldCheck,
  Download,
  FileSpreadsheet,
} from 'lucide-react';

export default function MasterAuditoriaPage() {
  const { auditLogs } = useMaster();

  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  const filteredLogs = auditLogs.filter((log) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      log.description.toLowerCase().includes(q) ||
      log.master_email.toLowerCase().includes(q) ||
      (log.company_name && log.company_name.toLowerCase().includes(q)) ||
      log.action.toLowerCase().includes(q);

    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const exportAuditCSV = () => {
    const headers = ['Data/Hora', 'Master', 'Acao', 'Estabelecimento', 'Descricao', 'IP'];
    const rows = filteredLogs.map((l) => [
      `"${new Date(l.created_at).toLocaleString('pt-BR')}"`,
      `"${l.master_email}"`,
      `"${l.action}"`,
      `"${l.company_name || 'N/A'}"`,
      `"${l.description.replace(/"/g, '""')}"`,
      `"${l.ip_address || '127.0.0.1'}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria_master_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <History className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Trilha de Auditoria Global
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Registro imutável de todas as ações administrativas, acessos a estabelecimentos e alterações.
          </p>
        </div>

        <button
          type="button"
          onClick={exportAuditCSV}
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Exportar Relatório CSV</span>
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por descrição, Master, empresa ou ação..."
            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="w-full sm:w-auto">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500 cursor-pointer"
          >
            <option value="ALL">Todas as Ações</option>
            <option value="LOGIN_MASTER">LOGIN_MASTER</option>
            <option value="ACCESS_ESTABLISHMENT">ACCESS_ESTABLISHMENT</option>
            <option value="EXIT_ESTABLISHMENT">EXIT_ESTABLISHMENT</option>
            <option value="CREATE_ESTABLISHMENT">CREATE_ESTABLISHMENT</option>
            <option value="UPDATE_ESTABLISHMENT">UPDATE_ESTABLISHMENT</option>
            <option value="BLOCK_ESTABLISHMENT">BLOCK_ESTABLISHMENT</option>
            <option value="CREATE_MASTER">CREATE_MASTER</option>
            <option value="CHANGE_PASSWORD_MASTER">CHANGE_PASSWORD_MASTER</option>
          </select>
        </div>
      </div>

      {/* Tabela de Auditoria */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/60 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-4">Data / Hora</th>
                <th className="p-4">Usuário Master</th>
                <th className="p-4">Ação</th>
                <th className="p-4">Estabelecimento</th>
                <th className="p-4">Descrição do Evento</th>
                <th className="p-4 text-center">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-mono text-slate-400 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('pt-BR')}
                  </td>
                  <td className="p-4 font-bold text-white whitespace-nowrap">
                    {log.master_email}
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        log.action.includes('ACCESS')
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : log.action.includes('BLOCK') || log.action.includes('DELETE')
                          ? 'bg-rose-950/80 text-rose-400 border border-rose-800'
                          : log.action.includes('CREATE')
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                          : 'bg-blue-950/80 text-blue-400 border border-blue-800'
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4 text-slate-300 font-medium">
                    {log.company_name || '—'}
                  </td>
                  <td className="p-4 text-slate-300 max-w-md break-words">
                    {log.description}
                  </td>
                  <td className="p-4 text-center font-mono text-slate-500 text-[11px]">
                    {log.ip_address || '127.0.0.1'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
