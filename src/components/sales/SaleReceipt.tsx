'use client';

import React from 'react';
import { Sale, Company, ReceiptSettings } from '@/types/database';
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import { TrendingUp } from 'lucide-react';

interface SaleReceiptProps {
  sale: Sale;
  company: Company | null;
  settings: ReceiptSettings;
  template: 'A4' | 'THERMAL_80';
  isPrinting?: boolean;
}

export function formatSaleNumber(num: number | string): string {
  const n = typeof num === 'string' ? parseInt(num, 10) : num;
  if (isNaN(n)) return String(num || '000001');
  return String(n).padStart(6, '0');
}

/**
 * Logo padrão do NegociaPro ou logotipo customizado da Empresa
 */
export function ReceiptLogo({
  company,
  settings,
  size = 'md',
}: {
  company: Company | null;
  settings: ReceiptSettings;
  size?: 'sm' | 'md' | 'lg';
}) {
  const hasCustomLogo = Boolean(settings.use_custom_logo && company?.logo_url);

  if (hasCustomLogo) {
    return (
      <img
        src={company!.logo_url!}
        alt={company?.trade_name || company?.name || 'Logotipo da Empresa'}
        className={`object-contain max-h-16 ${size === 'sm' ? 'max-h-10' : size === 'lg' ? 'max-h-20' : 'max-h-14'}`}
      />
    );
  }

  // Logotipo padrão NegociaPro
  return (
    <div className="flex items-center space-x-2">
      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
        <TrendingUp className="w-4 h-4 stroke-[2.5]" />
      </div>
      <div className="text-left leading-none">
        <span className="font-black text-slate-900 tracking-tight text-base">Negocia</span>
        <span className="text-blue-600 font-black text-base">Pro</span>
      </div>
    </div>
  );
}

/**
 * COMPROVANTE NÃO FISCAL - MODELO A4
 */
export function SaleReceiptA4({
  sale,
  company,
  settings,
}: {
  sale: Sale;
  company: Company | null;
  settings: ReceiptSettings;
}) {
  const companyName = company?.trade_name || company?.name || 'ESTABELECIMENTO COMERCIAL';
  const companyDoc = company?.cnpj ? `CNPJ: ${company.cnpj}` : '';
  const fullAddress = [
    company?.street ? `${company.street}${company.number ? `, ${company.number}` : ''}` : '',
    company?.complement,
    company?.neighborhood,
    company?.city ? `${company.city}${company.state ? ` - ${company.state}` : ''}` : '',
    company?.zip_code ? `CEP: ${company.zip_code}` : '',
  ]
    .filter(Boolean)
    .join(' • ');

  const totalQuantity = (sale.items || []).reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="w-full bg-white text-slate-900 p-8 font-sans text-xs leading-relaxed printable-a4-sheet">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
        <div className="flex items-start space-x-4">
          <div className="shrink-0 pt-1">
            <ReceiptLogo company={company} settings={settings} size="lg" />
          </div>
          <div>
            {settings.show_company_name && (
              <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">
                {companyName}
              </h1>
            )}
            {settings.show_cnpj_cpf && companyDoc && (
              <p className="text-[11px] font-semibold text-slate-600">{companyDoc}</p>
            )}
            {settings.show_address && fullAddress && (
              <p className="text-[11px] text-slate-500 mt-0.5 max-w-md">{fullAddress}</p>
            )}
            <div className="flex flex-wrap gap-x-3 text-[11px] text-slate-500 mt-0.5">
              {settings.show_phone && (company?.phone || company?.whatsapp) && (
                <span>Tel: {company.whatsapp || company.phone}</span>
              )}
              {settings.show_email && company?.email && (
                <span>E-mail: {company.email}</span>
              )}
            </div>
          </div>
        </div>

        {/* Bloco Identificador do Comprovante */}
        <div className="text-right shrink-0">
          <span className="inline-block px-2.5 py-1 bg-slate-900 text-white font-black text-[11px] uppercase tracking-wider rounded">
            Comprovante Não Fiscal
          </span>
          <div className="mt-2">
            <span className="text-slate-500 text-[11px] block">Número da Venda</span>
            <span className="text-xl font-black text-slate-900 tracking-tight">
              #{formatSaleNumber(sale.sale_number)}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            <span>{formatDateTime(sale.sold_at)}</span>
          </div>
        </div>
      </div>

      {/* Dados do Cliente e Responsável */}
      <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Dados do Cliente
          </span>
          {settings.show_customer && (
            <p className="font-bold text-slate-900 text-sm mt-0.5">
              {sale.customer?.name || 'Cliente Balcão / Não Identificado'}
            </p>
          )}
          {settings.show_customer_document && sale.customer?.document && (
            <p className="text-[11px] text-slate-600 font-medium">
              CPF/CNPJ: {sale.customer.document}
            </p>
          )}
          {sale.customer?.phone && (
            <p className="text-[11px] text-slate-500">Tel: {sale.customer.phone}</p>
          )}
        </div>

        <div className="text-right sm:text-left">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Vendedor / Profissional
          </span>
          {settings.show_seller && (
            <p className="font-bold text-slate-900 text-sm mt-0.5">
              {sale.professional?.name || sale.seller?.name || 'Atendimento Comercial'}
            </p>
          )}
          {sale.professional?.role_title && (
            <p className="text-[11px] text-slate-500">{sale.professional.role_title}</p>
          )}
          {settings.show_payment_method && (
            <p className="text-[11px] text-slate-700 mt-1 font-semibold">
              Pagamento: <span className="font-bold text-slate-900">{sale.payment_method_name || sale.payment_method?.name || 'PIX'}</span>
            </p>
          )}
        </div>
      </div>

      {/* Tabela de Itens */}
      <div className="mt-4">
        <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-800 mb-2">
          Itens da Venda
        </h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-y-2 border-slate-900 bg-slate-100 text-[11px] font-black uppercase text-slate-700">
              {settings.show_product_code && <th className="py-2 px-2 w-24">Código</th>}
              <th className="py-2 px-2">Produto / Serviço</th>
              <th className="py-2 px-2 text-center w-16">UN</th>
              <th className="py-2 px-2 text-right w-16">Qtd.</th>
              <th className="py-2 px-2 text-right w-24">Valor Unit.</th>
              <th className="py-2 px-2 text-right w-24">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {sale.items && sale.items.length > 0 ? (
              sale.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  {settings.show_product_code && (
                    <td className="py-2 px-2 font-mono text-[11px] text-slate-500">
                      {item.product?.sku || item.product?.barcode || '-'}
                    </td>
                  )}
                  <td className="py-2 px-2 font-medium text-slate-900">
                    <span className="font-bold block">{item.product?.name || 'Produto'}</span>
                    {item.discount > 0 && (
                      <span className="text-[10px] text-red-600 block">
                        Desconto aplicado: -{formatCurrency(item.discount)}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-center text-slate-600 font-medium">
                    {item.product?.unit || 'UN'}
                  </td>
                  <td className="py-2 px-2 text-right font-bold text-slate-800">
                    {item.quantity}
                  </td>
                  <td className="py-2 px-2 text-right text-slate-700">
                    {formatCurrency(item.unit_price)}
                  </td>
                  <td className="py-2 px-2 text-right font-black text-slate-900">
                    {formatCurrency(item.total)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-4 text-center text-slate-400">
                  Nenhum item discriminado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Resumo Financeiro */}
      <div className="mt-5 pt-3 border-t-2 border-slate-900 flex justify-end">
        <div className="w-72 space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal:</span>
            <span className="font-semibold">{formatCurrency(sale.subtotal || sale.total)}</span>
          </div>
          {sale.discount > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Desconto:</span>
              <span className="font-semibold">- {formatCurrency(sale.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-900 pt-2 border-t border-slate-300 text-sm font-black">
            <span>VALOR TOTAL:</span>
            <span className="text-base text-blue-700 font-black">{formatCurrency(sale.total)}</span>
          </div>
          <div className="flex justify-between text-[11px] text-slate-500 pt-1">
            <span>Qtd. Total de Itens:</span>
            <span className="font-bold">{totalQuantity}</span>
          </div>
          {settings.show_payment_method && (
            <div className="flex justify-between text-[11px] text-slate-700 pt-1 border-t border-dashed border-slate-200">
              <span>Forma de Pagamento:</span>
              <span className="font-bold">{sale.payment_method_name || sale.payment_method?.name || 'PIX'}</span>
            </div>
          )}
          {sale.installments_plan && sale.installments_plan.length > 0 && (
            <div className="pt-2 border-t border-slate-200 text-[10px] space-y-1">
              <span className="font-bold text-slate-700 block uppercase tracking-wider">Condições de Pagamento:</span>
              <div className="space-y-0.5 bg-slate-50 p-2 rounded border border-slate-200">
                {sale.installments_plan.map((inst, i) => (
                  <div key={i} className="flex justify-between text-slate-600">
                    <span>{inst.number}ª Parcela ({new Date(`${inst.due_date}T12:00:00`).toLocaleDateString('pt-BR')}):</span>
                    <span className="font-bold text-slate-900">{formatCurrency(inst.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Observações */}
      {settings.show_notes && sale.notes && (
        <div className="mt-5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px]">
          <span className="font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Observações:
          </span>
          <p className="text-slate-700 whitespace-pre-wrap">{sale.notes}</p>
        </div>
      )}

      {/* Rodapé e Aviso Legal de Não Fiscal */}
      <div className="mt-8 pt-5 border-t border-slate-300 text-center space-y-2">
        <p className="text-xs font-bold text-slate-800">{settings.footer_message}</p>
        <div className="inline-block px-4 py-1.5 rounded border border-amber-300 bg-amber-50 text-[10px] font-bold text-amber-900 uppercase tracking-wider">
          ESTE DOCUMENTO É UM COMPROVANTE NÃO FISCAL E NÃO SUBSTITUI A NOTA FISCAL
        </div>
      </div>
    </div>
  );
}

/**
 * COMPROVANTE NÃO FISCAL - MODELO CUPOM TÉRMICO 80MM
 */
export function SaleReceiptThermal80({
  sale,
  company,
  settings,
}: {
  sale: Sale;
  company: Company | null;
  settings: ReceiptSettings;
}) {
  const companyName = company?.trade_name || company?.name || 'NEGOCIAPRO';
  const totalQuantity = (sale.items || []).reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="w-[80mm] max-w-[80mm] bg-white text-black p-3 font-mono text-[11px] leading-tight printable-thermal-sheet select-text mx-auto">
      {/* Topo Centralizado */}
      <div className="text-center space-y-1 pb-2">
        <div className="flex justify-center mb-1">
          <ReceiptLogo company={company} settings={settings} size="sm" />
        </div>
        <div className="font-bold text-sm tracking-tight">{companyName}</div>
        <div className="text-[10px] font-black uppercase tracking-wider border-y border-dashed border-black py-1 my-1">
          COMPROVANTE DE VENDA NÃO FISCAL
        </div>
        {settings.show_cnpj_cpf && company?.cnpj && (
          <div className="text-[10px]">CNPJ: {company.cnpj}</div>
        )}
        {settings.show_phone && (company?.phone || company?.whatsapp) && (
          <div className="text-[10px]">TEL: {company.whatsapp || company.phone}</div>
        )}
        {settings.show_address && company?.city && (
          <div className="text-[10px]">{company.city}{company.state ? `/${company.state}` : ''}</div>
        )}
      </div>

      <div className="border-t border-dashed border-black my-2" />

      {/* Dados da Venda */}
      <div className="space-y-0.5">
        <div className="flex justify-between font-bold">
          <span>VENDA Nº {formatSaleNumber(sale.sale_number)}</span>
          <span>{formatDateTime(sale.sold_at).split(' ')[1] || ''}</span>
        </div>
        <div className="text-[10px] text-slate-700">
          DATA: {formatDateTime(sale.sold_at).split(' ')[0] || ''}
        </div>
        {settings.show_seller && (
          <div className="text-[10px] truncate">
            VENDEDOR: {sale.professional?.name || sale.seller?.name || 'Balcão'}
          </div>
        )}
      </div>

      {/* Cliente */}
      {(settings.show_customer || settings.show_customer_document) && (
        <>
          <div className="border-t border-dashed border-black my-2" />
          <div className="space-y-0.5">
            <div className="text-[10px] font-bold">CLIENTE:</div>
            {settings.show_customer && (
              <div className="font-bold truncate text-[11px]">
                {sale.customer?.name || 'Consumidor Final'}
              </div>
            )}
            {settings.show_customer_document && sale.customer?.document && (
              <div className="text-[10px]">CPF/CNPJ: {sale.customer.document}</div>
            )}
          </div>
        </>
      )}

      <div className="border-t border-dashed border-black my-2" />

      {/* Cabeçalho de Itens */}
      <div className="flex justify-between text-[10px] font-bold border-b border-black pb-1 mb-1">
        <span className="w-1/2">ITEM / DESCRIÇÃO</span>
        <span className="w-12 text-center">QTD</span>
        <span className="w-14 text-right">UNIT</span>
        <span className="w-14 text-right">TOTAL</span>
      </div>

      {/* Lista de Itens */}
      <div className="space-y-1.5 py-1">
        {sale.items && sale.items.length > 0 ? (
          sale.items.map((item, idx) => (
            <div key={idx} className="space-y-0.5">
              <div className="font-bold truncate text-[11px] leading-tight">
                {settings.show_product_code && item.product?.sku ? `[${item.product.sku}] ` : ''}
                {item.product?.name || 'Produto'}
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="w-1/2 text-[9px] text-slate-600">
                  {item.product?.unit || 'UN'}
                </span>
                <span className="w-12 text-center font-bold">{item.quantity}</span>
                <span className="w-14 text-right">{formatCurrency(item.unit_price).replace('R$', '').trim()}</span>
                <span className="w-14 text-right font-bold">{formatCurrency(item.total).replace('R$', '').trim()}</span>
              </div>
              {item.discount > 0 && (
                <div className="text-[9px] text-right">
                  Desc: -{formatCurrency(item.discount).replace('R$', '').trim()}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-2 text-[10px]">Sem itens</div>
        )}
      </div>

      <div className="border-t border-dashed border-black my-2" />

      {/* Totais */}
      <div className="space-y-1 text-[11px]">
        <div className="flex justify-between">
          <span>SUBTOTAL:</span>
          <span>{formatCurrency(sale.subtotal || sale.total)}</span>
        </div>
        {sale.discount > 0 && (
          <div className="flex justify-between">
            <span>DESCONTO:</span>
            <span>-{formatCurrency(sale.discount)}</span>
          </div>
        )}
        <div className="flex justify-between font-black text-sm border-t border-b border-black py-1 my-1">
          <span>TOTAL:</span>
          <span>{formatCurrency(sale.total)}</span>
        </div>
      </div>

      {/* Pagamento */}
      {settings.show_payment_method && (
        <div className="pt-1 text-[10px] space-y-0.5">
          <div className="font-bold">FORMA DE PAGAMENTO:</div>
          <div className="flex justify-between font-bold">
            <span>{sale.payment_method_name || sale.payment_method?.name || 'PIX'}</span>
            <span>{formatCurrency(sale.total)}</span>
          </div>
          {sale.installments_plan && sale.installments_plan.length > 0 && (
            <div className="pt-1 mt-1 border-t border-dotted border-black text-[9px] space-y-0.5">
              <div className="font-bold uppercase">Parcelamento:</div>
              {sale.installments_plan.map((inst, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{inst.number}ª parc ({new Date(`${inst.due_date}T12:00:00`).toLocaleDateString('pt-BR')}):</span>
                  <span>{formatCurrency(inst.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="text-[10px] pt-1">
        TOTAL DE ITENS: <strong>{totalQuantity}</strong>
      </div>

      {settings.show_notes && sale.notes && (
        <div className="mt-2 text-[10px] border-t border-dashed border-black pt-1">
          <strong>OBS:</strong> {sale.notes}
        </div>
      )}

      {/* Rodapé Cupom */}
      <div className="border-t border-dashed border-black my-3" />
      <div className="text-center space-y-1 pb-4">
        <div className="font-bold text-[11px]">{settings.footer_message}</div>
        <div className="text-[9px] uppercase font-bold tracking-wider pt-1">
          *** COMPROVANTE NÃO FISCAL ***
        </div>
      </div>
    </div>
  );
}

/**
 * Componente Geral que Renderiza A4 ou Térmico
 */
export default function SaleReceipt(props: SaleReceiptProps) {
  if (props.template === 'THERMAL_80') {
    return <SaleReceiptThermal80 {...props} />;
  }
  return <SaleReceiptA4 {...props} />;
}
