'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
import { formatCurrency, formatDate, maskCPF, maskCNPJ } from '@/lib/formatters';
import {
  Users,
  Plus,
  Search,
  Building2,
  User,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';

export default function ClientesPage() {
  const { customers } = useData();
  const [filterQuery, setFilterQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'PF' | 'PJ'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  const filteredCustomers = customers.filter((c) => {
    const matchesQuery =
      c.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      c.document.includes(filterQuery) ||
      (c.trade_name && c.trade_name.toLowerCase().includes(filterQuery.toLowerCase())) ||
      (c.city && c.city.toLowerCase().includes(filterQuery.toLowerCase()));

    const matchesType = typeFilter === 'ALL' || c.type === typeFilter;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && c.active) ||
      (statusFilter === 'INACTIVE' && !c.active);

    return matchesQuery && matchesType && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Clientes da Carteira
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gerencie clientes Pessoa Física e Pessoa Jurídica com visão completa do histórico comercial de cada um.
          </p>
        </div>

        <Link
          href="/clientes/novo"
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Cliente</span>
        </Link>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Buscar por nome, razão social, CPF/CNPJ ou cidade..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tipo */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => setTypeFilter('ALL')}
              className={`px-3 py-1 rounded-lg transition-all ${
                typeFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Todos ({customers.length})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('PF')}
              className={`px-3 py-1 rounded-lg transition-all ${
                typeFilter === 'PF' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              PF ({customers.filter((c) => c.type === 'PF').length})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('PJ')}
              className={`px-3 py-1 rounded-lg transition-all ${
                typeFilter === 'PJ' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              PJ ({customers.filter((c) => c.type === 'PJ').length})
            </button>
          </div>
        </div>
      </div>

      {/* Lista Responsiva: Cards em Mobile e Tabela em Desktop */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">Nenhum cliente encontrado</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {filterQuery ? 'Nenhum resultado corresponde aos filtros aplicados.' : 'Cadastre seu primeiro cliente para iniciar negociações.'}
            </p>
            <div className="mt-4">
              <Link
                href="/clientes/novo"
                className="inline-flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar cliente</span>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Tabela Desktop */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-4">Cliente / Razão Social</th>
                    <th className="p-4">Tipo & Documento</th>
                    <th className="p-4">Contato</th>
                    <th className="p-4">Localização</th>
                    <th className="p-4 text-right">Total Comprado</th>
                    <th className="p-4">Última Compra</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCustomers.map((cust) => (
                    <tr key={cust.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4">
                        <Link
                          href={`/clientes/${cust.id}`}
                          className="font-bold text-slate-900 hover:text-blue-600 block transition-colors"
                        >
                          {cust.name}
                        </Link>
                        {cust.trade_name && (
                          <span className="text-[11px] text-slate-400 font-medium block">
                            Fantasia: {cust.trade_name}
                          </span>
                        )}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black mr-2 ${
                            cust.type === 'PJ' ? 'bg-indigo-50 text-indigo-700' : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {cust.type}
                        </span>
                        <span className="font-mono text-slate-700">{cust.document}</span>
                      </td>
                      <td className="p-4 text-slate-600">
                        <span className="block">{cust.phone || '-'}</span>
                        <span className="text-[11px] text-slate-400">{cust.email || '-'}</span>
                      </td>
                      <td className="p-4 text-slate-600 whitespace-nowrap">
                        {cust.city ? `${cust.city}/${cust.state || 'SP'}` : '-'}
                      </td>
                      <td className="p-4 text-right font-black text-slate-900 whitespace-nowrap">
                        {formatCurrency(cust.total_purchased)}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {cust.orders_count || 0} compras
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 whitespace-nowrap">
                        {formatDate(cust.last_purchase_date)}
                      </td>
                      <td className="p-4 text-center whitespace-nowrap">
                        {cust.active ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500">
                            Inativo
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center whitespace-nowrap">
                        <Link
                          href={`/clientes/${cust.id}`}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] transition-colors"
                        >
                          <span>Painel</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modo Card Mobile */}
            <div className="lg:hidden divide-y divide-slate-100">
              {filteredCustomers.map((cust) => (
                <div key={cust.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">{cust.name}</span>
                      {cust.trade_name && (
                        <span className="text-[11px] text-slate-400 font-medium block">
                          Fantasia: {cust.trade_name}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
                        {cust.document} • <strong className="text-blue-700">{cust.type}</strong>
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        cust.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {cust.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                    {cust.phone && <span>Tel: {cust.phone}</span>}
                    {cust.city && <span>Local: {cust.city}/{cust.state}</span>}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Total Comprado</span>
                      <span className="text-sm font-black text-slate-900">
                        {formatCurrency(cust.total_purchased)}
                      </span>
                    </div>

                    <Link
                      href={`/clientes/${cust.id}`}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold flex items-center space-x-1"
                    >
                      <span>Abrir Ficha</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
