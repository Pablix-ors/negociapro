'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ShoppingCart,
  History,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  TrendingUp,
  Package,
  Users,
  Sparkles,
  Info,
  DollarSign,
  Play,
  RotateCcw,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/formatters';

interface DemoItem {
  id: string;
  name: string;
  sku: string;
  tablePrice: number;
  minPrice: number;
  lastNegotiatedPrice: number;
  lastNegotiatedDate: string;
  lastQuantity: number;
  minHistorical: number;
  avgHistorical: number;
  maxHistorical: number;
  historyList: Array<{
    date: string;
    qty: number;
    price: number;
    notes: string;
  }>;
}

const DEMO_CLIENTS = [
  { id: 'c1', name: 'João da Silva Santos (Pessoa Física)', doc: '123.456.789-01', location: 'São Paulo/SP' },
  { id: 'c2', name: 'Empresa ABC Manutenções Prediais LTDA (PJ)', doc: '22.333.444/0001-55', location: 'Barueri/SP' },
  { id: 'c3', name: 'Construtora Alfa Engenharia LTDA (PJ)', doc: '11.222.333/0001-44', location: 'São Paulo/SP' },
];

const DEMO_PRODUCTS: Record<string, DemoItem[]> = {
  c1: [
    {
      id: 'p1',
      name: 'Cimento CP II 50kg (Votoran)',
      sku: 'MAT-CIM-50',
      tablePrice: 36.90,
      minPrice: 31.00,
      lastNegotiatedPrice: 32.90,
      lastNegotiatedDate: '12/09/2026',
      lastQuantity: 40,
      minHistorical: 32.90,
      avgHistorical: 34.08,
      maxHistorical: 35.00,
      historyList: [
        { date: '12/09/2026', qty: 40, price: 32.90, notes: 'Negociação especial lote reforma' },
        { date: '28/08/2026', qty: 30, price: 34.50, notes: 'Pagamento à vista' },
        { date: '10/08/2026', qty: 20, price: 35.00, notes: 'Primeira compra do cliente' },
        { date: '22/07/2026', qty: 50, price: 33.90, notes: 'Campanha de inverno' },
      ],
    },
    {
      id: 'p2',
      name: 'Argamassa AC-II 20kg (Quartzolit)',
      sku: 'MAT-ARG-20',
      tablePrice: 19.90,
      minPrice: 16.50,
      lastNegotiatedPrice: 17.50,
      lastNegotiatedDate: '28/08/2026',
      lastQuantity: 25,
      minHistorical: 17.00,
      avgHistorical: 17.75,
      maxHistorical: 18.50,
      historyList: [
        { date: '28/08/2026', qty: 25, price: 17.50, notes: 'Combo cimento' },
        { date: '10/08/2026', qty: 15, price: 18.00, notes: 'Preço padrão negociado' },
      ],
    },
  ],
  c2: [
    {
      id: 'p3',
      name: 'Furadeira de Impacto 1/2 750W (Bosch)',
      sku: 'FER-FUR-750',
      tablePrice: 389.00,
      minPrice: 320.00,
      lastNegotiatedPrice: 350.00,
      lastNegotiatedDate: '05/09/2026',
      lastQuantity: 5,
      minHistorical: 350.00,
      avgHistorical: 355.00,
      maxHistorical: 360.00,
      historyList: [
        { date: '05/09/2026', qty: 5, price: 350.00, notes: 'Equipe nova em campo' },
        { date: '15/07/2026', qty: 2, price: 360.00, notes: 'Urgência na obra' },
      ],
    },
  ],
  c3: [
    {
      id: 'p4',
      name: 'Cabo Flexível 2,5mm 100m Azul (Sil)',
      sku: 'ELE-CAB-25A',
      tablePrice: 229.00,
      minPrice: 195.00,
      lastNegotiatedPrice: 205.00,
      lastNegotiatedDate: '10/09/2026',
      lastQuantity: 20,
      minHistorical: 205.00,
      avgHistorical: 205.00,
      maxHistorical: 205.00,
      historyList: [
        { date: '10/09/2026', qty: 20, price: 205.00, notes: 'Obra Residencial Morumbi' },
      ],
    },
  ],
};

export default function SandboxDemonstracaoPage() {
  const [selectedClientId, setSelectedClientId] = useState('c1');
  const availableProducts = DEMO_PRODUCTS[selectedClientId] || DEMO_PRODUCTS['c1'];
  const [selectedProductId, setSelectedProductId] = useState(availableProducts[0].id);

  const currentProduct = availableProducts.find((p) => p.id === selectedProductId) || availableProducts[0];
  const currentClient = DEMO_CLIENTS.find((c) => c.id === selectedClientId) || DEMO_CLIENTS[0];

  const [proposedPrice, setProposedPrice] = useState<number>(currentProduct.lastNegotiatedPrice);
  const [quantity, setQuantity] = useState<number>(30);
  const [discount, setDiscount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'VALOR' | 'PERCENTUAL'>('VALOR');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [cartItems, setCartItems] = useState<Array<any>>([]);
  const [saleFinished, setSaleFinished] = useState(false);

  // Sincronizar descontos R$ <-> %
  const handleDiscountValueChange = (val: number) => {
    const rawVal = Math.max(0, val);
    setDiscount(rawVal);
    const grossTotal = quantity * proposedPrice;
    if (grossTotal > 0) {
      setDiscountPercent(Number(((rawVal / grossTotal) * 100).toFixed(1)));
    } else {
      setDiscountPercent(0);
    }
  };

  const handleDiscountPercentChange = (pct: number) => {
    const rawPct = Math.max(0, Math.min(100, pct));
    setDiscountPercent(rawPct);
    const grossTotal = quantity * proposedPrice;
    const calcValue = Number(((grossTotal * rawPct) / 100).toFixed(2));
    setDiscount(calcValue);
  };

  const handleQuantityOrProposedPriceChange = (newQty: number, newPrice: number) => {
    setQuantity(newQty);
    setProposedPrice(newPrice);
    if (discountType === 'PERCENTUAL') {
      const grossTotal = newQty * newPrice;
      const calcValue = Number(((grossTotal * discountPercent) / 100).toFixed(2));
      setDiscount(calcValue);
    } else {
      const grossTotal = newQty * newPrice;
      if (grossTotal > 0) {
        setDiscountPercent(Number(((discount / grossTotal) * 100).toFixed(1)));
      }
    }
  };

  // Alerta de Negociação Dinâmico
  let alertType: 'below_min' | 'below_last' | 'good' | 'neutral' = 'neutral';
  let alertMsg = '';
  let diffPct = 0;

  if (proposedPrice < currentProduct.minPrice) {
    alertType = 'below_min';
    alertMsg = `PREÇO ABAIXO DO MÍNIMO! O valor informado (${formatCurrency(proposedPrice)}) está abaixo do mínimo configurado (${formatCurrency(currentProduct.minPrice)}). Exige aprovação de Gerente/Admin.`;
  } else if (proposedPrice < currentProduct.lastNegotiatedPrice) {
    alertType = 'below_last';
    diffPct = Number((((proposedPrice - currentProduct.lastNegotiatedPrice) / currentProduct.lastNegotiatedPrice) * 100).toFixed(1));
    alertMsg = `Atenção: O preço ofertado (${formatCurrency(proposedPrice)}) está ${Math.abs(diffPct)}% abaixo do último preço pago por este cliente (${formatCurrency(currentProduct.lastNegotiatedPrice)}).`;
  } else if (proposedPrice >= currentProduct.lastNegotiatedPrice) {
    alertType = 'good';
    alertMsg = `Margem aprovada! Preço alinhado ou superior ao histórico anterior do cliente.`;
  }

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    const prods = DEMO_PRODUCTS[clientId] || DEMO_PRODUCTS['c1'];
    setSelectedProductId(prods[0].id);
    setProposedPrice(prods[0].lastNegotiatedPrice);
    setDiscount(0);
    setDiscountPercent(0);
  };

  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    const prod = availableProducts.find((p) => p.id === productId);
    if (prod) {
      setProposedPrice(prod.lastNegotiatedPrice);
      setDiscount(0);
      setDiscountPercent(0);
    }
  };

  const handleAddToCart = () => {
    const itemTotal = quantity * proposedPrice - discount;
    setCartItems([
      ...cartItems,
      {
        product: currentProduct,
        qty: quantity,
        price: proposedPrice,
        discount,
        total: Math.max(0, itemTotal),
      },
    ]);
  };

  const handleFinish = () => {
    setSaleFinished(true);
  };

  const handleReset = () => {
    setCartItems([]);
    setSaleFinished(false);
    setProposedPrice(currentProduct.lastNegotiatedPrice);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white pb-16">
      {/* Top Banner de Demonstração Interativa */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-600 text-white px-4 py-2.5 text-xs font-semibold flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-2 max-w-4xl mx-auto w-full justify-between">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] uppercase tracking-wider font-extrabold">
              Ambiente Seguro de Demonstração
            </span>
            <span>Teste em tempo real a inteligência de negociação sem precisar de login ou criar conta!</span>
          </div>
          <Link
            href="/"
            className="inline-flex items-center space-x-1 px-3 py-1 bg-white text-slate-900 rounded-lg hover:bg-slate-100 font-bold transition-colors text-[11px]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar à Página Inicial</span>
          </Link>
        </div>
      </div>

      {/* Container Principal */}
      <div className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <Link href="/" className="group flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className="font-black text-white text-lg">Negocia<span className="text-blue-400">Pro</span></span>
              </Link>
              <span className="text-slate-600">•</span>
              <h1 className="text-lg font-bold text-slate-200">
                Simulador de Negociação Comercial
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Altere os clientes, escolha produtos e digite preços diferentes para ver os alertas e cálculos inteligentes em ação.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reiniciar Simulação</span>
            </button>
            <Link
              href="/cadastro"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/25"
            >
              Criar Conta Grátis
            </Link>
          </div>
        </div>

        {/* Mensagem de Venda Concluída no Simulador */}
        {saleFinished && (
          <div className="p-5 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 flex items-center justify-between animate-in fade-in">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <h3 className="font-bold text-sm text-white">Venda Simulada Concluída!</h3>
                <p className="text-xs text-emerald-300/80">
                  No NegociaPro real, o preço final de cada item é gravado automaticamente em <code>price_history</code> para a próxima venda deste cliente.
                </p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 transition-colors"
            >
              Fazer Outra Venda
            </button>
          </div>
        )}

        {/* Grid de Demonstração */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Coluna Esquerda: Formulário e Histórico Inteligente */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Selecionar Cliente */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Passo 1: Selecione o Cliente para Negociar
              </label>
              <div className="grid grid-cols-1 gap-2">
                {DEMO_CLIENTS.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => handleClientChange(client.id)}
                    className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                      selectedClientId === client.id
                        ? 'bg-blue-950/70 border-blue-500 ring-2 ring-blue-500/20 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                    }`}
                  >
                    <div>
                      <span className="font-bold block text-slate-200">{client.name}</span>
                      <span className="text-[11px] text-slate-500">{client.doc} • {client.location}</span>
                    </div>
                    {selectedClientId === client.id && (
                      <span className="text-[10px] font-bold text-blue-400 bg-blue-900/60 px-2 py-0.5 rounded">
                        Selecionado
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Selecionar Produto & Inteligência de Preço */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Passo 2: Selecione o Produto
              </label>

              <select
                value={selectedProductId}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {availableProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — Preço Tabela: {formatCurrency(p.tablePrice)} (Mínimo: {formatCurrency(p.minPrice)})
                  </option>
                ))}
              </select>

              {/* CARD DE HISTÓRICO AUTOMÁTICO (O DIFERENCIAL) */}
              <div className="rounded-xl border border-blue-500/50 bg-gradient-to-br from-blue-950/80 via-slate-900 to-indigo-950/60 p-4 relative shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-blue-900/60">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg bg-blue-600 text-white">
                      <History className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black uppercase text-blue-300 tracking-wider block">
                        Inteligência de Histórico do Cliente
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Consultado automaticamente sem sair desta tela
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowHistoryModal(true)}
                    className="text-[11px] font-bold text-blue-300 hover:text-white bg-blue-900/40 hover:bg-blue-900/80 px-2.5 py-1 rounded-lg border border-blue-700/50 transition-colors"
                  >
                    Ver Todas as Negociações ({currentProduct.historyList.length}) →
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 bg-slate-950/80 p-3 rounded-xl border border-blue-900/40">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                      Último Preço Negociado para este Cliente
                    </span>
                    <div className="flex items-baseline space-x-2 mt-0.5">
                      <span className="text-2xl font-black text-white">
                        {formatCurrency(currentProduct.lastNegotiatedPrice)}
                      </span>
                      <span className="text-xs text-slate-400">
                        em {currentProduct.lastNegotiatedDate}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Quantidade comprada: <strong>{currentProduct.lastQuantity} unidades</strong>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setProposedPrice(currentProduct.lastNegotiatedPrice)}
                    className="text-xs font-bold px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all shadow-md active:scale-95"
                  >
                    Aplicar {formatCurrency(currentProduct.lastNegotiatedPrice)}
                  </button>
                </div>

                {/* Grid 4 Métricas */}
                <div className="grid grid-cols-4 gap-2 text-center text-xs mt-3">
                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Preço Tabela</span>
                    <span className="font-bold text-slate-200">{formatCurrency(currentProduct.tablePrice)}</span>
                  </div>
                  <div className="bg-emerald-950/40 p-2 rounded-lg border border-emerald-800/40">
                    <span className="text-[10px] text-emerald-400 block">Menor Pago</span>
                    <span className="font-bold text-emerald-300">{formatCurrency(currentProduct.minHistorical)}</span>
                  </div>
                  <div className="bg-blue-950/40 p-2 rounded-lg border border-blue-800/40">
                    <span className="text-[10px] text-blue-400 block">Média Paga</span>
                    <span className="font-bold text-blue-300">{formatCurrency(currentProduct.avgHistorical)}</span>
                  </div>
                  <div className="bg-amber-950/40 p-2 rounded-lg border border-amber-800/40">
                    <span className="text-[10px] text-amber-400 block">Maior Pago</span>
                    <span className="font-bold text-amber-300">{formatCurrency(currentProduct.maxHistorical)}</span>
                  </div>
                </div>

                {/* Alerta Dinâmico de Teste */}
                <div
                  className={`mt-3 p-3 rounded-xl text-xs flex items-start space-x-2.5 transition-all ${
                    alertType === 'below_min'
                      ? 'bg-rose-950/80 border border-rose-800 text-rose-300'
                      : alertType === 'below_last'
                      ? 'bg-amber-950/80 border border-amber-800 text-amber-300'
                      : 'bg-emerald-950/80 border border-emerald-800 text-emerald-300'
                  }`}
                >
                  {alertType === 'below_min' ? (
                    <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  ) : alertType === 'below_last' ? (
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold block">
                      {alertType === 'below_min'
                        ? '🚨 ALERTA: PREÇO ABAIXO DO MÍNIMO'
                        : alertType === 'below_last'
                        ? '⚠️ ALERTA: ABAIXO DO ÚLTIMO PREÇO NEGOCIADO'
                        : '✓ CONDIÇÃO DE PREÇO APROVADA'}
                    </span>
                    <p className="mt-0.5">{alertMsg}</p>
                  </div>
                </div>
              </div>

              {/* Inputs de Negociação */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    Quantidade
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => handleQuantityOrProposedPriceChange(Math.max(1, Number(e.target.value)), proposedPrice)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-bold text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    Preço Ofertado (R$)
                  </label>
                  <input
                    type="number"
                    step="0.10"
                    value={proposedPrice}
                    onChange={(e) => handleQuantityOrProposedPriceChange(quantity, Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-bold text-blue-400 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Experimente digitar R$ 28 ou R$ 34</span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-400">
                      Desconto
                    </label>
                    <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => setDiscountType('VALOR')}
                        className={`px-1.5 py-0.5 rounded-md transition-all ${
                          discountType === 'VALOR'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        R$
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiscountType('PERCENTUAL')}
                        className={`px-1.5 py-0.5 rounded-md transition-all ${
                          discountType === 'PERCENTUAL'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        %
                      </button>
                    </div>
                  </div>

                  {discountType === 'VALOR' ? (
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={discount}
                        onChange={(e) => handleDiscountValueChange(Math.max(0, Number(e.target.value)))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-bold text-red-400 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                      {discount > 0 && (
                        <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-500 pointer-events-none">
                          ({discountPercent}%)
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={discountPercent}
                        onChange={(e) => handleDiscountPercentChange(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-bold text-red-400 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                      <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-500 pointer-events-none">
                        = {formatCurrency(discount)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400">Total deste item: </span>
                  <span className="text-base font-black text-white">
                    {formatCurrency(Math.max(0, quantity * proposedPrice - discount))}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center space-x-1.5"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Adicionar ao Pedido de Teste</span>
                </button>
              </div>
            </div>
          </div>

          {/* Coluna Direita: Carrinho e Finalização */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Itens no Carrinho ({cartItems.length})
                  </h3>
                  {cartItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCartItems([])}
                      className="text-[11px] text-rose-400 hover:underline"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                {cartItems.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    Adicione o produto negociado para simular o fechamento.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800 my-3 max-h-64 overflow-y-auto">
                    {cartItems.map((item, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-white block">{item.product.name}</span>
                          <span className="text-[11px] text-slate-400">
                            {item.qty} un × {formatCurrency(item.price)}
                          </span>
                        </div>
                        <span className="font-black text-blue-400">{formatCurrency(item.total)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Forma de Pagamento */}
                <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">
                      Forma de Pagamento
                    </label>
                    <select className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white">
                      <option>PIX à Vista</option>
                      <option>Cartão de Débito</option>
                      <option>Cartão de Crédito</option>
                      <option>Boleto Bancário 30 Dias</option>
                      <option>Dinheiro</option>
                    </select>
                  </div>
                </div>

                {/* Totais */}
                <div className="mt-4 pt-4 border-t border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(cartItems.reduce((acc, i) => acc + i.total, 0))}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-slate-800">
                    <span>Total Final:</span>
                    <span className="text-xl text-blue-400">
                      {formatCurrency(cartItems.reduce((acc, i) => acc + i.total, 0))}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  disabled={cartItems.length === 0}
                  onClick={handleFinish}
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg active:scale-98 flex items-center justify-center space-x-2"
                >
                  <span>Finalizar Venda de Teste</span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>

                <Link
                  href="/cadastro"
                  className="w-full py-2.5 text-center block text-xs font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Gostou da velocidade? Cadastre sua empresa agora →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Histórico Completo de Negociações no Mockup */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-blue-400" />
                  Histórico de Negociações: {currentClient.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{currentProduct.name}</p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="p-2.5">Data</th>
                  <th className="p-2.5">Quantidade</th>
                  <th className="p-2.5 font-bold text-white">Preço Negociado</th>
                  <th className="p-2.5">Observação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {currentProduct.historyList.map((h, i) => (
                  <tr key={i} className="hover:bg-slate-800/40">
                    <td className="p-2.5 text-slate-300">{h.date}</td>
                    <td className="p-2.5 text-slate-400">{h.qty} un</td>
                    <td className="p-2.5 font-black text-blue-400">{formatCurrency(h.price)}</td>
                    <td className="p-2.5 text-slate-500 italic">{h.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
