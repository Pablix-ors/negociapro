'use client';

import React, { useState } from 'react';
import { Sale, ReceiptTemplateType } from '@/types/database';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import SaleReceipt, { formatSaleNumber } from './SaleReceipt';
import {
  X,
  Printer,
  FileDown,
  Eye,
  FileText,
  Receipt,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface SaleReceiptModalProps {
  sale: Sale;
  onClose: () => void;
  isInitialSuccess?: boolean; // Se for logo após finalizar venda
}

export default function SaleReceiptModal({
  sale,
  onClose,
  isInitialSuccess = false,
}: SaleReceiptModalProps) {
  const { company } = useAuth();
  const { receiptSettings } = useData();

  const [activeTemplate, setActiveTemplate] = useState<ReceiptTemplateType>(
    receiptSettings.template_default || 'A4'
  );

  // Manipulador de Impressão
  const handlePrint = (template: ReceiptTemplateType) => {
    // Adicionar classe ao body para selecionar tamanho de página (@page)
    const className = template === 'THERMAL_80' ? 'print-mode-cupom' : 'print-mode-a4';
    document.body.classList.add(className);

    // Pequeno atraso para garantir renderização do CSS antes de disparar window.print()
    setTimeout(() => {
      window.print();
      document.body.classList.remove('print-mode-cupom', 'print-mode-a4');
    }, 100);
  };

  // Exportar PDF acionando a caixa de diálogo nativa com título sugestivo
  const handleExportPDF = (template: ReceiptTemplateType) => {
    const originalTitle = document.title;
    const templateLabel = template === 'THERMAL_80' ? 'Cupom_80mm' : 'A4';
    document.title = `Comprovante_Venda_${formatSaleNumber(sale.sale_number)}_${templateLabel}`;

    handlePrint(template);

    // Restaurar título da página após diálogo
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-slate-100 rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-300 flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 cursor-default">
        {/* Cabeçalho do Modal */}
        <div className="p-4 sm:px-6 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0 no-print">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                <Receipt className="w-5 h-5" />
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Comprovante da Venda #{formatSaleNumber(sale.sale_number)}
              </h2>
              {sale.status === 'COMPLETED' ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Concluída
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                  Cancelada
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Documento Não Fiscal de Venda • NegociaPro
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {/* Seletor de Modelo [ A4 ] [ CUPOM ] */}
            <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-bold text-slate-600 border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTemplate('A4')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-all ${
                  activeTemplate === 'A4'
                    ? 'bg-white text-blue-700 shadow-xs font-black'
                    : 'hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>A4</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTemplate('THERMAL_80')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-all ${
                  activeTemplate === 'THERMAL_80'
                    ? 'bg-white text-blue-700 shadow-xs font-black'
                    : 'hover:text-slate-900'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Cupom 80mm</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Fechar Comprovante"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Banner de Sucesso pós-venda */}
        {isInitialSuccess && (
          <div className="px-6 py-3 bg-emerald-600 text-white flex items-center justify-between shrink-0 no-print">
            <div className="flex items-center space-x-2.5">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <div>
                <span className="font-bold text-xs">Venda finalizada com sucesso!</span>
                <span className="text-[11px] text-emerald-100 block">
                  Comprovante gerado dinamicamente com dados históricos imutáveis.
                </span>
              </div>
            </div>
            <div className="text-right text-xs">
              <span className="text-emerald-100 block text-[10px]">Total Pago:</span>
              <strong className="text-sm font-black text-white">
                R$ {sale.total.toFixed(2).replace('.', ',')}
              </strong>
            </div>
          </div>
        )}

        {/* Área de Visualização com Scroll (Simulando Papel Real) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-8 bg-slate-200/80 flex justify-center printable-receipt-container">
          <div className="w-full flex justify-center py-2 printable-receipt-inner">
            {activeTemplate === 'A4' ? (
              <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl border border-slate-300 transition-all receipt-paper-box">
                <SaleReceipt
                  sale={sale}
                  company={company}
                  settings={receiptSettings}
                  template="A4"
                />
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-xl border border-slate-300 p-2 transition-all receipt-paper-box">
                <SaleReceipt
                  sale={sale}
                  company={company}
                  settings={receiptSettings}
                  template="THERMAL_80"
                />
              </div>
            )}
          </div>
        </div>

        {/* Barra de Ações Inferior (Botões de Imprimir, Exportar PDF, etc) */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 no-print">
          <div className="flex flex-wrap items-center gap-2">
            {/* Imprimir Modelo Ativo */}
            <button
              type="button"
              onClick={() => handlePrint(activeTemplate)}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir {activeTemplate === 'A4' ? 'A4' : 'Cupom'}</span>
            </button>

            {/* Exportar PDF do Modelo Ativo */}
            <button
              type="button"
              onClick={() => handleExportPDF(activeTemplate)}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              <span>Exportar PDF {activeTemplate === 'A4' ? 'A4' : 'Cupom'}</span>
            </button>

            {/* Ações Rápidas para o outro formato */}
            <button
              type="button"
              onClick={() => {
                const other = activeTemplate === 'A4' ? 'THERMAL_80' : 'A4';
                setActiveTemplate(other);
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Visualizar {activeTemplate === 'A4' ? 'Cupom 80mm' : 'A4'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
