'use client';

import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import { formatCurrency, formatDate } from '@/lib/formatters';
import * as XLSX from 'xlsx';
import {
  BarChart3,
  Download,
  Filter,
  FileSpreadsheet,
  Users,
  Package,
  TrendingUp,
  Award,
  DollarSign,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

type ReportCategory = 'vendas' | 'produtos' | 'clientes' | 'profissionais' | 'financeiro';

export default function RelatoriosPage() {
  const { sales, customers, products, professionals, commissions } = useData();

  const [category, setCategory] = useState<ReportCategory>('vendas');
  const [selectedProfId, setSelectedProfId] = useState<string>('ALL');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Exportação para Excel (.xlsx) e CSV
  const handleExport = (fileType: 'xlsx' | 'csv') => {
    let sheetName = 'Relatório';
    let dataToExport: any[] = [];

    if (category === 'vendas') {
      sheetName = 'Relatório de Vendas';
      dataToExport = sales
        .filter((s) => {
          const matchProf = selectedProfId === 'ALL' || s.professional_id === selectedProfId;
          const matchCust = selectedCustomerId === 'ALL' || s.customer_id === selectedCustomerId;
          const matchStat = statusFilter === 'ALL' || s.status === statusFilter;
          return matchProf && matchCust && matchStat;
        })
        .map((s) => ({
          'Número da Venda': `#${s.sale_number}`,
          'Data': formatDate(s.sold_at),
          'Cliente': s.customer?.name || '',
          'Documento': s.customer?.document || '',
          'Profissional': s.professional?.name || 'Não vinculado',
          'Subtotal (R$)': s.subtotal.toFixed(2),
          'Desconto (R$)': s.discount.toFixed(2),
          'Total Final (R$)': s.total.toFixed(2),
          'Comissão Total (R$)': (s.commission_total || 0).toFixed(2),
          'Status': s.status,
        }));
    } else if (category === 'produtos') {
      sheetName = 'Relatório de Produtos';
      dataToExport = products.map((p) => ({
        'Nome do Produto': p.name,
        'SKU': p.sku || '',
        'Unidade': p.unit,
        'Marca': p.brand || '',
        'Preço Custo (R$)': p.cost_price.toFixed(2),
        'Preço Venda (R$)': p.selling_price.toFixed(2),
        'Preço Mínimo (R$)': p.min_price.toFixed(2),
        'Estoque Atual': p.current_stock,
        'Estoque Mínimo': p.min_stock,
        'Situação Estoque': p.current_stock <= p.min_stock ? 'CRÍTICO' : 'REGULAR',
        'Comissão': p.commission_type === 'PERCENTAGE' ? `${p.commission_value}%` : p.commission_type === 'FIXED' ? `R$ ${p.commission_value}` : 'Sem comissão',
        'Status': p.active ? 'ATIVO' : 'INATIVO',
      }));
    } else if (category === 'clientes') {
      sheetName = 'Relatório de Clientes';
      dataToExport = customers.map((c) => ({
        'Nome / Razão Social': c.name,
        'Tipo': c.type,
        'Documento': c.document,
        'Cidade': c.city || '',
        'Estado': c.state || '',
        'Telefone': c.phone || '',
        'E-mail': c.email || '',
        'Total Comprado (R$)': (c.total_purchased || 0).toFixed(2),
        'Quantidade de Compras': c.orders_count || 0,
        'Última Compra': formatDate(c.last_purchase_date),
      }));
    } else if (category === 'profissionais') {
      sheetName = 'Relatório de Profissionais';
      dataToExport = professionals.map((p) => ({
        'Nome': p.name,
        'Cargo / Função': p.role_title,
        'CPF': p.document || '',
        'Telefone': p.phone || '',
        'E-mail': p.email || '',
        'Total Vendido (R$)': (p.total_sales || 0).toFixed(2),
        'Quantidade de Vendas': p.sales_count || 0,
        'Comissão Gerada (R$)': (p.commission_earned || 0).toFixed(2),
        'Comissão Paga (R$)': (p.commission_paid || 0).toFixed(2),
        'Comissão Pendente (R$)': (p.commission_pending || 0).toFixed(2),
        'Status': p.active ? 'ATIVO' : 'INATIVO',
      }));
    } else {
      // Financeiro
      sheetName = 'Relatório Financeiro';
      const completed = sales.filter((s) => s.status === 'COMPLETED');
      const grossRevenue = completed.reduce((acc, s) => acc + s.subtotal, 0);
      const totalDiscounts = completed.reduce((acc, s) => acc + s.discount, 0);
      const netRevenue = completed.reduce((acc, s) => acc + s.total, 0);
      const totalCommissions = commissions.reduce((acc, c) => acc + c.commission_amount, 0);
      const paidCommissions = commissions.filter((c) => c.status === 'PAGA').reduce((acc, c) => acc + (c.paid_amount || c.commission_amount), 0);

      dataToExport = [
        { 'Indicador Financeiro': 'Faturamento Bruto', 'Valor (R$)': grossRevenue.toFixed(2) },
        { 'Indicador Financeiro': 'Total de Descontos Concedidos', 'Valor (R$)': totalDiscounts.toFixed(2) },
        { 'Indicador Financeiro': 'Faturamento Líquido das Vendas', 'Valor (R$)': netRevenue.toFixed(2) },
        { 'Indicador Financeiro': 'Total de Comissões Geradas', 'Valor (R$)': totalCommissions.toFixed(2) },
        { 'Indicador Financeiro': 'Total de Comissões Já Pagas', 'Valor (R$)': paidCommissions.toFixed(2) },
        { 'Indicador Financeiro': 'Saldo Real da Operação', 'Valor (R$)': (netRevenue - paidCommissions).toFixed(2) },
      ];
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const filename = `relatorio_${category}_negociapro.${fileType}`;
    XLSX.writeFile(wb, filename);
  };

  // Totais do Período Filtrado
  const totalSalesRevenue = sales
    .filter((s) => s.status === 'COMPLETED')
    .reduce((acc, s) => acc + s.total, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-600/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Relatórios Comerciais & Estratégicos
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Extraia métricas consolidadas de vendas, estoque, carteira de clientes, desempenho de profissionais e finanças com exportação em Excel e CSV.
          </p>
        </div>

        {/* Botões de Exportação */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => handleExport('xlsx')}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar Excel (.xlsx)</span>
          </button>
          <button
            type="button"
            onClick={() => handleExport('csv')}
            className="inline-flex items-center space-x-1.5 px-3 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Abas de Categorias de Relatório */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <button
          type="button"
          onClick={() => setCategory('vendas')}
          className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
            category === 'vendas'
              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
              : 'bg-white border-slate-200/80 hover:bg-slate-50 text-slate-800'
          }`}
        >
          <TrendingUp className="w-5 h-5 mb-2" />
          <div>
            <span className="text-xs font-bold block">1. Vendas</span>
            <span className={`text-[10px] ${category === 'vendas' ? 'text-blue-100' : 'text-slate-400'}`}>
              Faturamento & Pedidos
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setCategory('produtos')}
          className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
            category === 'produtos'
              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
              : 'bg-white border-slate-200/80 hover:bg-slate-50 text-slate-800'
          }`}
        >
          <Package className="w-5 h-5 mb-2" />
          <div>
            <span className="text-xs font-bold block">2. Produtos</span>
            <span className={`text-[10px] ${category === 'produtos' ? 'text-blue-100' : 'text-slate-400'}`}>
              Estoque & Margens
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setCategory('clientes')}
          className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
            category === 'clientes'
              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
              : 'bg-white border-slate-200/80 hover:bg-slate-50 text-slate-800'
          }`}
        >
          <Users className="w-5 h-5 mb-2" />
          <div>
            <span className="text-xs font-bold block">3. Clientes</span>
            <span className={`text-[10px] ${category === 'clientes' ? 'text-blue-100' : 'text-slate-400'}`}>
              Ranking & Histórico
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setCategory('profissionais')}
          className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
            category === 'profissionais'
              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
              : 'bg-white border-slate-200/80 hover:bg-slate-50 text-slate-800'
          }`}
        >
          <Award className="w-5 h-5 mb-2" />
          <div>
            <span className="text-xs font-bold block">4. Profissionais</span>
            <span className={`text-[10px] ${category === 'profissionais' ? 'text-blue-100' : 'text-slate-400'}`}>
              Comissões & Desempenho
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setCategory('financeiro')}
          className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between col-span-2 sm:col-span-1 ${
            category === 'financeiro'
              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
              : 'bg-white border-slate-200/80 hover:bg-slate-50 text-slate-800'
          }`}
        >
          <DollarSign className="w-5 h-5 mb-2" />
          <div>
            <span className="text-xs font-bold block">5. Financeiro</span>
            <span className={`text-[10px] ${category === 'financeiro' ? 'text-blue-100' : 'text-slate-400'}`}>
              Líquido & DRE Gerencial
            </span>
          </div>
        </button>
      </div>

      {/* Barra de Filtros Antes da Exportação */}
      {category === 'vendas' && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Profissional</label>
            <select
              value={selectedProfId}
              onChange={(e) => setSelectedProfId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
            >
              <option value="ALL">Todos os Profissionais</option>
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Cliente</label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
            >
              <option value="ALL">Todos os Clientes</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Status da Venda</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
            >
              <option value="ALL">Todas as Vendas</option>
              <option value="COMPLETED">Concluídas</option>
              <option value="CANCELLED">Canceladas</option>
            </select>
          </div>
        </div>
      )}

      {/* Prévia da Tabela Selecionada */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Visualização dos Dados ({category.toUpperCase()})
          </h3>
          <span className="text-xs text-slate-400 font-medium">Exportação gerada com colunas limpas e ordenadas</span>
        </div>

        <div className="overflow-x-auto">
          {category === 'vendas' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200 text-[10px]">
                <tr>
                  <th className="p-3">Pedido</th>
                  <th className="p-3">Data</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Profissional</th>
                  <th className="p-3 text-right">Comissão</th>
                  <th className="p-3 text-right">Total Final</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sales.map((s) => (
                  <tr key={s.id}>
                    <td className="p-3 font-bold text-slate-900">#{s.sale_number}</td>
                    <td className="p-3 text-slate-500">{formatDate(s.sold_at)}</td>
                    <td className="p-3 font-medium text-slate-800">{s.customer?.name}</td>
                    <td className="p-3 text-slate-600">{s.professional?.name || 'Não vinculado'}</td>
                    <td className="p-3 text-right font-bold text-emerald-600">
                      {formatCurrency(s.commission_total || 0)}
                    </td>
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

          {category === 'produtos' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200 text-[10px]">
                <tr>
                  <th className="p-3">Produto</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Comissão</th>
                  <th className="p-3 text-right">Preço Venda</th>
                  <th className="p-3 text-right">Preço Mínimo</th>
                  <th className="p-3 text-center">Estoque Atual</th>
                  <th className="p-3 text-center">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="p-3 font-bold text-slate-900">{p.name}</td>
                    <td className="p-3 font-mono text-slate-500">{p.sku || '-'}</td>
                    <td className="p-3 font-semibold text-emerald-700">
                      {p.commission_type === 'PERCENTAGE'
                        ? `${p.commission_value}%`
                        : p.commission_type === 'FIXED'
                        ? `${formatCurrency(p.commission_value)} / un`
                        : 'Nenhuma'}
                    </td>
                    <td className="p-3 text-right font-black text-slate-900">{formatCurrency(p.selling_price)}</td>
                    <td className="p-3 text-right font-bold text-amber-700">{formatCurrency(p.min_price)}</td>
                    <td className="p-3 text-center font-bold">{p.current_stock} {p.unit}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.current_stock <= p.min_stock ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                        {p.current_stock <= p.min_stock ? 'Crítico' : 'Regular'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {category === 'clientes' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200 text-[10px]">
                <tr>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Documento</th>
                  <th className="p-3">Cidade/UF</th>
                  <th className="p-3 text-right">Total Acumulado</th>
                  <th className="p-3 text-center">Compras</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td className="p-3 font-bold text-slate-900">{c.name}</td>
                    <td className="p-3 font-semibold text-blue-700">{c.type}</td>
                    <td className="p-3 font-mono text-slate-600">{c.document}</td>
                    <td className="p-3 text-slate-500">{c.city ? `${c.city}/${c.state}` : '-'}</td>
                    <td className="p-3 text-right font-black text-slate-900">{formatCurrency(c.total_purchased)}</td>
                    <td className="p-3 text-center font-bold text-slate-700">{c.orders_count || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {category === 'profissionais' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200 text-[10px]">
                <tr>
                  <th className="p-3">Profissional</th>
                  <th className="p-3">Cargo</th>
                  <th className="p-3 text-center">Vendas</th>
                  <th className="p-3 text-right">Volume Vendido</th>
                  <th className="p-3 text-right">Comissão Gerada</th>
                  <th className="p-3 text-right">Comissão Paga</th>
                  <th className="p-3 text-right">Pendente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {professionals.map((p) => (
                  <tr key={p.id}>
                    <td className="p-3 font-bold text-slate-900">{p.name}</td>
                    <td className="p-3 text-blue-700 font-medium">{p.role_title}</td>
                    <td className="p-3 text-center font-bold">{p.sales_count || 0}</td>
                    <td className="p-3 text-right font-medium text-slate-800">{formatCurrency(p.total_sales || 0)}</td>
                    <td className="p-3 text-right font-black text-slate-900">{formatCurrency(p.commission_earned || 0)}</td>
                    <td className="p-3 text-right font-bold text-emerald-600">{formatCurrency(p.commission_paid || 0)}</td>
                    <td className="p-3 text-right font-bold text-amber-600">{formatCurrency(p.commission_pending || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {category === 'financeiro' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200 text-[10px]">
                <tr>
                  <th className="p-3">Métrica Financeira</th>
                  <th className="p-3 text-right">Valor Consolidado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-3 font-semibold text-slate-800">Faturamento Bruto de Vendas</td>
                  <td className="p-3 text-right font-bold text-slate-900">
                    {formatCurrency(sales.filter((s) => s.status === 'COMPLETED').reduce((acc, s) => acc + s.subtotal, 0))}
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-800">Descontos Comerciais Aplicados</td>
                  <td className="p-3 text-right font-bold text-red-600">
                    - {formatCurrency(sales.filter((s) => s.status === 'COMPLETED').reduce((acc, s) => acc + s.discount, 0))}
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-800">Faturamento Líquido Efetivado</td>
                  <td className="p-3 text-right font-black text-blue-700">
                    {formatCurrency(totalSalesRevenue)}
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-800">Comissões de Profissionais Geradas</td>
                  <td className="p-3 text-right font-bold text-amber-600">
                    {formatCurrency(commissions.reduce((acc, c) => acc + c.commission_amount, 0))}
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-800">Comissões Quitadas</td>
                  <td className="p-3 text-right font-bold text-emerald-600">
                    {formatCurrency(commissions.filter((c) => c.status === 'PAGA').reduce((acc, c) => acc + (c.paid_amount || c.commission_amount), 0))}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
