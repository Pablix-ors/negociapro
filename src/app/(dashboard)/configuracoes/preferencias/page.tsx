'use client';

import React, { useState } from 'react';
import { Sliders, Check } from 'lucide-react';

export default function PreferenciasConfigPage() {
  const [currency, setCurrency] = useState('BRL (R$)');
  const [decimals, setDecimals] = useState(2);
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [defaultDiscount, setDefaultDiscount] = useState(0);
  const [allowSaleBelowLastPrice, setAllowSaleBelowLastPrice] = useState(true);
  const [showPriceHistoryInSale, setShowPriceHistoryInSale] = useState(true);
  const [historyLimit, setHistoryLimit] = useState(5);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          Preferências Comerciais & Regras de Negociação
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Defina como o motor de negociação se comporta na tela de vendas para sua equipe comercial.
        </p>
      </div>

      {saved && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center space-x-2 text-xs text-emerald-800 font-bold animate-in fade-in">
          <Check className="w-5 h-5 text-emerald-600" />
          <span>Preferências comerciais salvas com sucesso!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            Motor de Inteligência de Negociação
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Exibir Histórico de Preço Automaticamente Durante a Venda
                </span>
                <span className="text-[11px] text-slate-500">
                  Mostra os últimos preços negociados para aquele cliente assim que o produto for escolhido.
                </span>
              </div>
              <input
                type="checkbox"
                checked={showPriceHistoryInSale}
                onChange={(e) => setShowPriceHistoryInSale(e.target.checked)}
                className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Permitir Venda Abaixo do Último Preço Negociado
                </span>
                <span className="text-[11px] text-slate-500">
                  Emite aviso visual de atenção, mas permite prosseguir se o valor não violar o preço mínimo.
                </span>
              </div>
              <input
                type="checkbox"
                checked={allowSaleBelowLastPrice}
                onChange={(e) => setAllowSaleBelowLastPrice(e.target.checked)}
                className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Quantidade Máxima de Preços Históricos no Modal
                </label>
                <input
                  type="number"
                  min="3"
                  max="20"
                  value={historyLimit}
                  onChange={(e) => setHistoryLimit(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Percentual Padrão Máximo de Desconto (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={defaultDiscount}
                  onChange={(e) => setDefaultDiscount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Formatação */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            Formatação Regional
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Moeda</label>
              <input
                type="text"
                disabled
                value={currency}
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Casas Decimais</label>
              <input
                type="number"
                disabled
                value={decimals}
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Formato de Data</label>
              <input
                type="text"
                disabled
                value={dateFormat}
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            type="submit"
            className="inline-flex items-center space-x-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Salvar Preferências</span>
          </button>
        </div>
      </form>
    </div>
  );
}
