'use client';

import React from 'react';
import { useMaster } from '@/context/MasterAuthContext';
import { AlertTriangle, ArrowLeft, ShieldAlert } from 'lucide-react';

export default function MasterModeBanner() {
  const { impersonatedCompany, exitCompany } = useMaster();

  if (!impersonatedCompany) return null;

  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 text-slate-950 px-4 py-2.5 shadow-md shadow-amber-500/20 border-b border-amber-600">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs font-bold">
        <div className="flex items-center space-x-2">
          <div className="p-1 bg-slate-950 text-amber-400 rounded-lg shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <span className="bg-slate-950 text-amber-400 px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider font-black">
            MODO MASTER ATIVO
          </span>
          <span className="text-slate-900 truncate">
            Você está acessando administrativamente: <strong className="underline decoration-slate-900/40">{impersonatedCompany.name}</strong> {impersonatedCompany.cnpj ? `(CNPJ: ${impersonatedCompany.cnpj})` : ''}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            exitCompany();
            window.location.href = '/master/estabelecimentos';
          }}
          className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-950 hover:bg-slate-900 text-amber-400 rounded-xl text-xs font-black transition-all shadow-md active:scale-95 shrink-0 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>VOLTAR AO PAINEL MASTER</span>
        </button>
      </div>
    </div>
  );
}
