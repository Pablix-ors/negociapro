'use client';

import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import { formatCurrency, formatDate } from '@/lib/formatters';
import {
  BarChart3,
  Download,
  Filter,
  FileSpreadsheet,
  FileText,
  Calendar,
  Users,
  Package,
  TrendingUp,
} from 'lucide-react';

export default function RelatoriosPage() {
  const { sales, customers, products } = useData();
  const [reportType, setReportType] = useState<'vendas' | 'clientes' | 'produtos'>('vendas');

  // Exportar relatório em CSV real
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];

    if (reportType === 'vendas') {
      headers = ['Pedido', 'Data', 'Cliente', 'Documento', 'Status', 'Total (R$)'];
      rows = sales.map((s) => [
        `#${s.sale_number}`,
        formatDate(s.sold_at),
        `"${s.customer?.name || ''}"`,
        `"${s.customer?.document || ''}"`,
        s.status,
        s.total.toFixed(2),
      ]);
    } else if (reportType === 'clientes') {
      headers = ['Nome', 'Tipo', 'Documento', 'Cidade', 'UF', 'Total Comprado (R$)', 'Pedidos'];
      rows = customers.map((c) => [
        `"${c.name}"`,
        c.type,
        `"${c.document}"`,
        `"${c.city || ''}"`,
        c.state || '',
        (c.total_purchased || 0).toFixed(2),
        String(c.orders_count || 0),
      ]);
    } else {
      headers = ['Produto', 'SKU', 'Unidade', 'Preço Custo (R$)', 'Preço Venda (R$)', 'Preço Mínimo (R$)', 'Estoque'];
      rows = products.map((p) => [
        `"${p.name}"`,
        `"${p.sku || ''}"`,
        p.unit,
        p.cost_price.toFixed(2),
        p.selling_price.toFixed(2),
        p.min_price.toFixed(2),
        String(p.current_stock),
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_${reportType}_negociapro.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Relatórios Comerciais
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Extraia métricas consolidadas, histórico de negociações e exporte dados para planilhas.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>Exportar Relatório em CSV</span>
        </button>
      </div>

      {/* Seleção do Relatório */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => setReportType('vendas')}
          className={`p-4 rounded-2xl border text-left transition-all flex items-center space-x-3 ${
            reportType === 'vendas'
              ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className={`p-2.5 rounded-xl ${reportType === 'vendas' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Relatório de Vendas</h4>
            <p className="text-[11px] text-slate-500">Pedidos faturados e faturamento</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setReportType('clientes')}
          className={`p-4 rounded-2xl border text-left transition-all flex items-center space-x-3 ${
            reportType === 'clientes'
              ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className={`p-2.5 rounded-xl ${reportType === 'clientes' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Relatório de Clientes</h4>
            <p className="text-[11px] text-slate-500">Volume acumulado e frequência</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setReportType('produtos')}
          className={`p-4 rounded-2xl border text-left transition-all flex items-center space-x-3 ${
            reportType === 'produtos'
              ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className={`p-2.5 rounded-xl ${reportType === 'produtos' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Relatório de Produtos</h4>
            <p className="text-[11px] text-slate-500">Preços tabelados e níveis de estoque</p>
          </div>
        </button>
      </div>

      {/* Tabela Prévia */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Prévia dos Dados para Exportação ({reportType.toUpperCase()})
          </h3>
          <span className="text-xs text-slate-400 font-medium">Formato universal delimitado por ponto e vírgula</span>
        </div>

        <div className="overflow-x-auto">
          {reportType === 'vendas' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Pedido</th>
                  <th className="p-3">Data</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3 text-right">Valor Final</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sales.map((s) => (
                  <tr key={s.id}>
                    <td className="p-3 font-bold text-slate-900">#{s.sale_number}</td>
                    <td className="p-3 text-slate-500">{formatDate(s.sold_at)}</td>
                    <td className="p-3 text-slate-800">{s.customer?.name}</td>
                    <td className="p-3 text-right font-black text-slate-900">{formatCurrency(s.total)}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'clientes' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Documento</th>
                  <th className="p-3 text-right">Total Comprado</th>
                  <th className="p-3 text-center">Compras</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td className="p-3 font-bold text-slate-900">{c.name}</td>
                    <td className="p-3 font-semibold text-blue-700">{c.type}</td>
                    <td className="p-3 font-mono text-slate-600">{c.document}</td>
                    <td className="p-3 text-right font-black text-slate-900">{formatCurrency(c.total_purchased)}</td>
                    <td className="p-3 text-center text-slate-700">{c.orders_count || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'produtos' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Produto</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3 text-right">Preço Venda</th>
                  <th className="p-3 text-right">Preço Mínimo</th>
                  <th className="p-3 text-center">Estoque</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="p-3 font-bold text-slate-900">{p.name}</td>
                    <td className="p-3 font-mono text-slate-500">{p.sku || '-'}</td>
                    <td className="p-3 text-right font-black text-blue-700">{formatCurrency(p.selling_price)}</td>
                    <td className="p-3 text-right font-bold text-amber-700">{formatCurrency(p.min_price)}</td>
                    <td className="p-3 text-center">{p.current_stock} {p.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
