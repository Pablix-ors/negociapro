'use client';

import React, { useState, useRef, useMemo } from 'react';
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
  CheckCircle2,
} from 'lucide-react';

interface SaleReceiptModalProps {
  sale: Sale;
  onClose: () => void;
  isInitialSuccess?: boolean;
}

export default function SaleReceiptModal({
  sale,
  onClose,
  isInitialSuccess = false,
}: SaleReceiptModalProps) {
  const { company } = useAuth();
  const { receiptSettings, products } = useData();

  const [activeTemplate, setActiveTemplate] = useState<ReceiptTemplateType>(
    receiptSettings.template_default || 'A4'
  );

  // Refs para capturar o HTML dos comprovantes renderizados
  const receiptA4Ref = useRef<HTMLDivElement>(null);
  const receiptThermalRef = useRef<HTMLDivElement>(null);

  /**
   * Re-enriquece os itens da venda com o objeto Product completo.
   * Isso resolve o bug onde items vindos do servidor/localStorage
   * têm product_id mas product === undefined/null.
   */
  const enrichedSale = useMemo((): Sale => {
    if (!sale.items || sale.items.length === 0) return sale;
    const enrichedItems = sale.items.map(item => {
      // Se já tem product com nome, não precisa enriquecer
      if (item.product && item.product.name) return item;
      // Busca o produto pelo product_id nos produtos do contexto
      const found = products.find(p => p.id === item.product_id);
      return { ...item, product: found || item.product };
    });
    return { ...sale, items: enrichedItems };
  }, [sale, products]);

  /**
   * Abre janela popup isolada com apenas o conteúdo do comprovante.
   * Isso evita imprimir o dashboard, sidebar, modal e qualquer elemento externo.
   */
  const openPrintWindow = (template: ReceiptTemplateType) => {
    const isA4 = template === 'A4';
    const ref = isA4 ? receiptA4Ref : receiptThermalRef;
    const saleNumber = formatSaleNumber(sale.sale_number);

    if (!ref.current) return;

    // Captura o HTML renderizado do comprovante (já com estilos inline via Tailwind JIT)
    const receiptHtml = ref.current.innerHTML;

    const pageStyles = isA4
      ? `
        @page { size: A4 portrait; margin: 8mm; }
        body { margin: 0; padding: 0; background: #fff; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #000; }
      `
      : `
        @page { size: 80mm auto; margin: 2mm; }
        body { margin: 0; padding: 0; background: #fff; width: 80mm; font-family: 'Courier New', monospace; font-size: 11px; color: #000; }
      `;

    const fullHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Comprovante Não Fiscal - Venda #${saleNumber}</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>
    ${pageStyles}
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
    /* Remove min-width que quebraria a tabela na impressão */
    .min-w-\\[500px\\] { min-width: 0 !important; }
    .overflow-x-auto { overflow: visible !important; }
    @media screen {
      body { display: flex; justify-content: center; padding: 20px; }
      .receipt-wrapper { max-width: ${isA4 ? '800px' : '80mm'}; width: 100%; }
    }
  </style>
</head>
<body>
  <div class="receipt-wrapper">
    ${receiptHtml}
  </div>
  <script>
    // Aguarda o Tailwind carregar antes de imprimir
    function tryPrint() {
      if (document.readyState === 'complete') {
        setTimeout(function() { window.print(); }, 600);
      } else {
        window.addEventListener('load', function() {
          setTimeout(function() { window.print(); }, 600);
        });
      }
    }
    tryPrint();
  <\/script>
</body>
</html>`;

    const win = window.open(
      '',
      `comprovante_${saleNumber}_${isA4 ? 'A4' : 'Cupom'}`,
      `width=${isA4 ? 900 : 400},height=700,scrollbars=yes,toolbar=no,menubar=no`
    );

    if (!win) {
      // fallback blob se popup bloqueado
      const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      return;
    }

    win.document.open();
    win.document.write(fullHtml);
    win.document.close();
  };

  /**
   * Exporta como PDF via Salvar Como PDF no diálogo de impressão
   * (mesmo mecanismo, mas o título é ajustado para sugerir o nome do arquivo)
   */
  const handleExportPDF = (template: ReceiptTemplateType) => {
    // A janela popup já abre com auto-print; ao escolher "Salvar como PDF"
    // o navegador usa o título como nome do arquivo
    const isA4 = template === 'A4';
    const ref = isA4 ? receiptA4Ref : receiptThermalRef;
    const saleNumber = formatSaleNumber(sale.sale_number);
    const templateLabel = isA4 ? 'A4' : 'Cupom_80mm';

    if (!ref.current) return;

    const receiptHtml = ref.current.innerHTML;

    const pageStyles = isA4
      ? `@page { size: A4 portrait; margin: 8mm; } body { margin: 0; padding: 0; background: #fff; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #000; }`
      : `@page { size: 80mm auto; margin: 2mm; } body { margin: 0; padding: 0; background: #fff; width: 80mm; font-family: 'Courier New', monospace; font-size: 11px; color: #000; }`;

    const fullHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Comprovante_Venda_${saleNumber}_${templateLabel}</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>
    ${pageStyles}
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
    .min-w-\\[500px\\] { min-width: 0 !important; }
    .overflow-x-auto { overflow: visible !important; }
    @media screen {
      body { display: flex; justify-content: center; padding: 20px; }
      .receipt-wrapper { max-width: ${isA4 ? '800px' : '80mm'}; width: 100%; }
    }
  </style>
</head>
<body>
  <div class="receipt-wrapper">
    ${receiptHtml}
  </div>
  <script>
    window.addEventListener('load', function() { setTimeout(function() { window.print(); }, 600); });
  <\/script>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (!win) {
      const link = document.createElement('a');
      link.href = url;
      link.download = `Comprovante_Venda_${saleNumber}_${templateLabel}.html`;
      link.click();
    }
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
        <div className="p-4 sm:px-6 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
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
          <div className="px-6 py-3 bg-emerald-600 text-white flex items-center justify-between shrink-0">
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

        {/* Área de Visualização com Scroll */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-8 bg-slate-200/80 flex justify-center">
          <div className="w-full flex justify-center py-2">
            {/* A4 — sempre renderizado (para captura via ref) */}
            <div
              className={`w-full max-w-2xl bg-white rounded-xl shadow-xl border border-slate-300 transition-all ${
                activeTemplate === 'A4' ? 'block' : 'hidden'
              }`}
            >
              <div ref={receiptA4Ref}>
                <SaleReceipt
                  sale={enrichedSale}
                  company={company}
                  settings={receiptSettings}
                  template="A4"
                />
              </div>
            </div>

            {/* Cupom — sempre renderizado (para captura via ref) */}
            <div
              className={`bg-white rounded-xl shadow-xl border border-slate-300 p-2 transition-all ${
                activeTemplate === 'THERMAL_80' ? 'block' : 'hidden'
              }`}
            >
              <div ref={receiptThermalRef}>
                <SaleReceipt
                  sale={enrichedSale}
                  company={company}
                  settings={receiptSettings}
                  template="THERMAL_80"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Ações Inferior */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            {/* Imprimir Modelo Ativo */}
            <button
              type="button"
              onClick={() => openPrintWindow(activeTemplate)}
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

            {/* Alternar formato */}
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
