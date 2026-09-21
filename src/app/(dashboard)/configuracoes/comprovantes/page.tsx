'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { ReceiptSettings, DEFAULT_RECEIPT_SETTINGS } from '@/types/database';
import {
  FileText,
  Receipt,
  Check,
  ShieldAlert,
  ArrowLeft,
  Settings,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

export default function ComprovantesConfigPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { receiptSettings, updateReceiptSettings } = useData();
  const isAdmin = user?.role === 'ADMIN';

  const [settings, setSettings] = useState<ReceiptSettings>(
    receiptSettings || DEFAULT_RECEIPT_SETTINGS
  );
  const [saved, setSaved] = useState(false);

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-4 animate-in fade-in">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">
          Acesso Restrito a Administradores
        </h2>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          Apenas o administrador do estabelecimento pode configurar os modelos e informações dos comprovantes não fiscais.
        </p>
        <div className="pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateReceiptSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleCheckboxChange = (field: keyof ReceiptSettings) => {
    setSettings((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          Configuração de Comprovantes Não Fiscais
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Defina o modelo de impressão padrão, campos visíveis e a mensagem personalizada do rodapé.
        </p>
      </div>

      {saved && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center space-x-2 text-xs text-emerald-800 font-bold animate-in fade-in">
          <Check className="w-5 h-5 text-emerald-600" />
          <span>Configurações de comprovante salvas com sucesso!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: Modelo Padrão e Logotipo */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            1. Formato & Marca Padrão
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Opção A4 */}
            <div
              onClick={() => setSettings({ ...settings, template_default: 'A4' })}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start space-x-3.5 ${
                settings.template_default === 'A4'
                  ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div
                className={`p-2 rounded-xl ${
                  settings.template_default === 'A4'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-xs text-slate-900 block">
                  Folha A4 (Padrão Corporativo)
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Recomendado para impressoras jato de tinta / laser convencionais. Layout executivo completo.
                </span>
              </div>
            </div>

            {/* Opção Cupom 80mm */}
            <div
              onClick={() => setSettings({ ...settings, template_default: 'THERMAL_80' })}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start space-x-3.5 ${
                settings.template_default === 'THERMAL_80'
                  ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div
                className={`p-2 rounded-xl ${
                  settings.template_default === 'THERMAL_80'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-xs text-slate-900 block">
                  Cupom Térmico 80mm
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Otimizado para impressoras térmicas de cupom de 80mm (compatível futuramente com 58mm).
                </span>
              </div>
            </div>
          </div>

          {/* Opção de Logotipo */}
          <div className="pt-4 border-t border-slate-100">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.use_custom_logo}
                onChange={() => handleCheckboxChange('use_custom_logo')}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Utilizar logotipo personalizado se estiver cadastrado
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Se desativado ou não configurado, utilizará automaticamente a marca oficial NegociaPro.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Card 2: Informações Exibidas no Comprovante */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            2. Informações Exibidas no Documento
          </h3>
          <p className="text-[11px] text-slate-500">
            Marque os blocos de dados que deverão constar nos comprovantes gerados para seus clientes.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
            {[
              { key: 'show_company_name', label: 'Nome do estabelecimento' },
              { key: 'show_cnpj_cpf', label: 'CNPJ/CPF do estabelecimento' },
              { key: 'show_address', label: 'Endereço da sede' },
              { key: 'show_phone', label: 'Telefone de contato' },
              { key: 'show_email', label: 'E-mail comercial' },
              { key: 'show_customer', label: 'Nome do cliente' },
              { key: 'show_customer_document', label: 'CPF/CNPJ do cliente' },
              { key: 'show_seller', label: 'Vendedor / profissional' },
              { key: 'show_product_code', label: 'Código dos produtos (SKU)' },
              { key: 'show_notes', label: 'Observações da venda' },
              { key: 'show_payment_method', label: 'Forma de pagamento' },
            ].map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center space-x-2.5 p-3 rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200/70 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={Boolean(settings[key as keyof ReceiptSettings])}
                  onChange={() => handleCheckboxChange(key as keyof ReceiptSettings)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <span className="text-xs font-medium text-slate-800">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Card 3: Mensagem do Rodapé */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            3. Mensagem do Rodapé
          </h3>
          <p className="text-[11px] text-slate-500">
            Texto de agradecimento ou instrução comercial impresso ao final do comprovante.
          </p>

          <input
            type="text"
            value={settings.footer_message}
            onChange={(e) => setSettings({ ...settings, footer_message: e.target.value })}
            placeholder="Ex: Obrigado pela preferência! Volte sempre."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Botão de Salvar */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center space-x-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-95 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Salvar Configurações do Comprovante</span>
          </button>
        </div>
      </form>
    </div>
  );
}
