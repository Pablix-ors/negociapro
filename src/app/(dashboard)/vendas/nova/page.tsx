'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useData } from '@/context/DataContext';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import CustomerProductPriceHistory from '@/components/sales/CustomerProductPriceHistory';
import {
  ShoppingCart,
  User,
  Package,
  Plus,
  Trash2,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Info,
} from 'lucide-react';

interface CartItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
}

export default function NovaVendaPage() {
  const router = useRouter();
  const { customers, products, createSale } = useData();

  // Estado da Venda
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('cust-01'); // Padrão: João da Silva Santos
  const [selectedProductId, setSelectedProductId] = useState<string>('prod-01'); // Padrão: Cimento CP II
  const [quantity, setQuantity] = useState<number>(40);
  const [unitPrice, setUnitPrice] = useState<number>(34.50);
  const [discount, setDiscount] = useState<number>(0);

  // Carrinho de Itens da Venda Atual
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('PIX');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const currentCustomer = customers.find((c) => c.id === selectedCustomerId);
  const currentProduct = products.find((p) => p.id === selectedProductId);

  // Atualizar preço padrão ao selecionar outro produto
  const handleProductChange = (newProductId: string) => {
    setSelectedProductId(newProductId);
    const prod = products.find((p) => p.id === newProductId);
    if (prod) {
      setUnitPrice(prod.selling_price);
      setDiscount(0);
    }
  };

  // Adicionar item ao carrinho
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || quantity <= 0 || unitPrice < 0) return;

    const itemTotal = quantity * unitPrice - discount;
    const newItem: CartItem = {
      product_id: selectedProductId,
      quantity,
      unit_price: unitPrice,
      discount,
      total: Math.max(0, itemTotal),
    };

    setCartItems([...cartItems, newItem]);
  };

  // Remover item do carrinho
  const handleRemoveItem = (index: number) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  // Totais Gerais
  const subtotal = cartItems.reduce((acc, item) => acc + item.quantity * item.unit_price, 0);
  const totalDiscount = cartItems.reduce((acc, item) => acc + item.discount, 0);
  const grandTotal = subtotal - totalDiscount;

  // Finalizar Venda com gravação atômica em price_history
  const handleFinishSale = () => {
    if (cartItems.length === 0 || !selectedCustomerId) return;

    createSale({
      customer_id: selectedCustomerId,
      items: cartItems,
      notes,
    });

    setIsSuccess(true);
    setTimeout(() => {
      router.push('/vendas');
    }, 1500);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Título & Instrução */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-600/20">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Nova Negociação & Venda
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Selecione o cliente e os produtos. O sistema exibe automaticamente os preços negociados anteriormente.
          </p>
        </div>
      </div>

      {/* Sucesso State */}
      {isSuccess && (
        <div className="p-6 bg-emerald-600 text-white rounded-2xl shadow-xl flex items-center space-x-4 animate-in fade-in zoom-in-95">
          <div className="p-3 bg-white/20 rounded-full">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-black">Venda Finalizada com Sucesso!</h3>
            <p className="text-xs text-emerald-100 mt-0.5">
              O histórico de preços do cliente foi atualizado automaticamente. Redirecionando...
            </p>
          </div>
        </div>
      )}

      {/* Grid Principal: Formulário de Adição & Inteligência de Histórico à Esquerda, Resumo do Pedido à Direita */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Painel de Configuração da Linha de Venda (8 colunas) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Seleção do Cliente */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              1. Selecione o Cliente
            </label>
            <div className="relative">
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.trade_name ? `${c.trade_name} (${c.name})` : c.name} — {c.document} [{c.type}]
                  </option>
                ))}
              </select>
            </div>

            {currentCustomer && (
              <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <div>
                  <span className="font-bold text-slate-800">{currentCustomer.name}</span>
                  <span className="block text-[11px] text-slate-400">
                    {currentCustomer.city}/{currentCustomer.state} • {currentCustomer.phone}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Total já comprado</span>
                  <span className="font-bold text-blue-700">
                    {formatCurrency(currentCustomer.total_purchased)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Seleção do Produto & Valores */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              2. Selecione o Produto & Negocie o Preço
            </label>

            <div>
              <select
                value={selectedProductId}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (SKU: {p.sku || '-'}) — Estoque: {p.current_stock} {p.unit} — Tabela: {formatCurrency(p.selling_price)}
                  </option>
                ))}
              </select>
            </div>

            {/* Inclusão do Componente Principal: Histórico de Preços para este Cliente */}
            {currentProduct && selectedCustomerId && (
              <CustomerProductPriceHistory
                customerId={selectedCustomerId}
                productId={selectedProductId}
                currentProduct={currentProduct}
                proposedPrice={unitPrice}
                onApplyPrice={(price) => setUnitPrice(price)}
              />
            )}

            {/* Inputs de Quantidade, Preço Unitário e Desconto */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Quantidade
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Preço Unitário (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Desconto Total (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Botão de Adicionar ao Pedido */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <div className="text-xs">
                <span className="text-slate-400">Total desta linha: </span>
                <span className="text-base font-black text-slate-900">
                  {formatCurrency(Math.max(0, quantity * unitPrice - discount))}
                </span>
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar ao Pedido</span>
              </button>
            </div>
          </div>
        </div>

        {/* Resumo do Pedido & Fechamento (5 colunas) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Itens do Pedido ({cartItems.length})
                </h3>
                {cartItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCartItems([])}
                    className="text-[11px] text-red-600 hover:underline font-medium"
                  >
                    Limpar
                  </button>
                )}
              </div>

              {/* Lista de Itens no Carrinho */}
              {cartItems.length === 0 ? (
                <div className="py-12 text-center">
                  <ShoppingCart className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">
                    Nenhum item adicionado ainda. Selecione um produto à esquerda e clique em &quot;Adicionar ao Pedido&quot;.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 my-3 max-h-72 overflow-y-auto">
                  {cartItems.map((item, idx) => {
                    const prod = products.find((p) => p.id === item.product_id);
                    return (
                      <div key={idx} className="py-3 flex items-center justify-between">
                        <div className="pr-2">
                          <span className="text-xs font-bold text-slate-800 block">
                            {prod?.name}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {item.quantity} {prod?.unit || 'un'} × {formatCurrency(item.unit_price)}
                            {item.discount > 0 && ` (Desc. ${formatCurrency(item.discount)})`}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-xs font-black text-slate-900">
                            {formatCurrency(item.total)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-slate-300 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Forma de Pagamento e Observações */}
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800"
                  >
                    <option value="PIX">PIX à Vista</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Boleto 30 Dias">Boleto Bancário 30 Dias</option>
                    <option value="Dinheiro">Dinheiro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Observações da Negociação
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Condição especial autorizada para obra rápida..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Totais Finais */}
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Descontos:</span>
                  <span className="text-red-600 font-medium">- {formatCurrency(totalDiscount)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-100">
                  <span>Total Final:</span>
                  <span className="text-xl text-blue-700">{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Botão Finalizar */}
            <div className="mt-6">
              <button
                type="button"
                disabled={cartItems.length === 0 || isSuccess}
                onClick={handleFinishSale}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-emerald-600/20 active:scale-98 flex items-center justify-center space-x-2"
              >
                <span>Concluir Venda & Gravar Histórico</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
