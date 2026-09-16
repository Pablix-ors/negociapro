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
  Award,
  DollarSign,
  Percent,
} from 'lucide-react';

interface CartItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
  commission_type_snapshot: 'NONE' | 'PERCENTAGE' | 'FIXED';
  commission_value_snapshot: number;
  commission_amount: number;
}

export default function NovaVendaPage() {
  const router = useRouter();
  const { customers, products, professionals, createSale } = useData();

  // Estado da Venda
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);

  // Sincronizar seleção inicial quando os dados carregarem
  React.useEffect(() => {
    if (customers.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(customers[0].id);
    }
  }, [customers, selectedCustomerId]);

  React.useEffect(() => {
    if (professionals.length > 0 && !selectedProfessionalId) {
      setSelectedProfessionalId(professionals[0].id);
    }
  }, [professionals, selectedProfessionalId]);

  React.useEffect(() => {
    if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
      setUnitPrice(products[0].selling_price);
    }
  }, [products, selectedProductId]);

  // Carrinho de Itens da Venda Atual
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('PIX');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const currentCustomer = customers.find((c) => c.id === selectedCustomerId);
  const currentProfessional = professionals.find((p) => p.id === selectedProfessionalId);
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

  // Cálculo da comissão estimada do item em edição
  const calculateItemCommission = () => {
    if (!currentProduct || currentProduct.commission_type === 'NONE') return 0;
    const itemTotal = Math.max(0, quantity * unitPrice - discount);
    if (currentProduct.commission_type === 'PERCENTAGE') {
      return Number(((itemTotal * currentProduct.commission_value) / 100).toFixed(2));
    }
    if (currentProduct.commission_type === 'FIXED') {
      return Number((quantity * currentProduct.commission_value).toFixed(2));
    }
    return 0;
  };

  // Adicionar item ao carrinho
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || quantity <= 0 || unitPrice < 0) return;

    const itemTotal = Math.max(0, quantity * unitPrice - discount);
    const commAmount = calculateItemCommission();

    const newItem: CartItem = {
      product_id: selectedProductId,
      quantity,
      unit_price: unitPrice,
      discount,
      total: itemTotal,
      commission_type_snapshot: currentProduct?.commission_type || 'NONE',
      commission_value_snapshot: currentProduct?.commission_value || 0,
      commission_amount: commAmount,
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
  const totalCommission = cartItems.reduce((acc, item) => acc + item.commission_amount, 0);

  // Validação de Preço Mínimo
  const isBelowMinPrice = currentProduct && unitPrice - discount / quantity < currentProduct.min_price;

  // Finalizar Venda com gravação atômica em price_history e comissão
  const handleFinishSale = () => {
    if (cartItems.length === 0 || !selectedCustomerId) return;

    createSale({
      customer_id: selectedCustomerId,
      professional_id: selectedProfessionalId || undefined,
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
            Selecione o cliente, o profissional responsável e os produtos. Visualize os preços negociados anteriormente e as comissões calculadas.
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
              O histórico de preços e a comissão do profissional foram registrados com snapshot imutável. Redirecionando...
            </p>
          </div>
        </div>
      )}

      {/* Grid Principal: Formulário à Esquerda, Resumo à Direita */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Painel Esquerdo: Seleção de Cliente, Profissional e Produto */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Seleção do Cliente e Profissional Responsável */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  1. Cliente da Negociação
                </label>
                <button
                  type="button"
                  onClick={() => router.push('/clientes/novo')}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800"
                >
                  + Novo Cliente
                </button>
              </div>

              {customers.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center">
                  <p className="text-xs text-slate-500 mb-2">Sua carteira de clientes ainda está vazia.</p>
                  <button
                    type="button"
                    onClick={() => router.push('/clientes/novo')}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-xs hover:bg-blue-700"
                  >
                    Cadastrar Primeiro Cliente
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
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
                </>
              )}
            </div>

            {/* Profissional Responsável pela Venda */}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-1.5">
                  <Award className="w-4 h-4 text-blue-600" />
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Profissional Responsável
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => router.push('/profissionais')}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800"
                >
                  Gerenciar Equipe
                </button>
              </div>

              {professionals.length === 0 ? (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
                  <span>Nenhum profissional cadastrado. A comissão ficará zerada.</span>
                  <button
                    type="button"
                    onClick={() => router.push('/profissionais')}
                    className="font-bold underline"
                  >
                    Cadastrar
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={selectedProfessionalId}
                    onChange={(e) => setSelectedProfessionalId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Nenhum Profissional Vinculado</option>
                    {professionals
                      .filter((p) => p.active)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.role_title})
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Seleção do Produto & Valores de Negociação */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                2. Selecione o Produto & Negocie o Preço
              </label>
              <button
                type="button"
                onClick={() => router.push('/produtos/novo')}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800"
              >
                + Novo Produto
              </button>
            </div>

            {products.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center">
                <p className="text-xs text-slate-500 mb-2">Seu catálogo de produtos ainda está vazio.</p>
                <button
                  type="button"
                  onClick={() => router.push('/produtos/novo')}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-xs hover:bg-blue-700"
                >
                  Cadastrar Primeiro Produto
                </button>
              </div>
            ) : (
              <div>
                <select
                  value={selectedProductId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.sku ? `[${p.sku}]` : ''} — Tabela: {formatCurrency(p.selling_price)} (Estoque: {p.current_stock} {p.unit})
                    </option>
                  ))}
                </select>

                {currentProduct && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center space-x-3">
                    {currentProduct.image_url ? (
                      <img
                        src={currentProduct.image_url}
                        alt={currentProduct.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-200 text-slate-400 flex items-center justify-center shrink-0">
                        <Package className="w-6 h-6" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-slate-800 text-xs block truncate">{currentProduct.name}</span>
                      <span className="text-[11px] text-slate-500">
                        Marca: {currentProduct.brand || '-'} • Unidade: {currentProduct.unit}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 block">Regra de Comissão</span>
                      <span className="text-xs font-bold text-emerald-600">
                        {currentProduct.commission_type === 'PERCENTAGE'
                          ? `${currentProduct.commission_value}%`
                          : currentProduct.commission_type === 'FIXED'
                          ? `${formatCurrency(currentProduct.commission_value)} / un`
                          : 'Sem comissão'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Histórico Automático de Preços Negociados */}
            {selectedCustomerId && selectedProductId && currentProduct && (
              <div className="pt-2">
                <CustomerProductPriceHistory
                  customerId={selectedCustomerId}
                  productId={selectedProductId}
                  currentProduct={currentProduct}
                  proposedPrice={unitPrice - (discount / (quantity || 1))}
                  onApplyPrice={(price) => {
                    setUnitPrice(price);
                    setDiscount(0);
                  }}
                />
              </div>
            )}

            {/* Inputs de Quantidade, Preço Unitário e Desconto */}
            <form onSubmit={handleAddItem} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Quantidade ({currentProduct?.unit || 'UN'})
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
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
                    required
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
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
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-red-600 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Trava de Preço Mínimo */}
              {isBelowMinPrice && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-xs text-red-800 font-semibold">
                  <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                  <span>
                    Atenção: O preço efetivo unitário (R$ {(unitPrice - discount / quantity).toFixed(2)}) está abaixo do preço mínimo permitido de {formatCurrency(currentProduct?.min_price)}.
                  </span>
                </div>
              )}

              {/* Prévia da Comissão do Item */}
              {currentProduct && currentProduct.commission_type !== 'NONE' && (
                <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                  <span className="flex items-center space-x-1.5 font-medium">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>Comissão estimada deste item:</span>
                  </span>
                  <span className="font-black text-emerald-700">
                    {formatCurrency(calculateItemCommission())}
                  </span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-98 flex items-center justify-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Produto ao Pedido</span>
              </button>
            </form>
          </div>
        </div>

        {/* Painel Direito: Resumo do Pedido & Comissões */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between min-h-[460px]">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <ShoppingCart className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Resumo do Pedido ({cartItems.length} itens)
                  </h3>
                </div>
                {cartItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCartItems([])}
                    className="text-[11px] text-red-600 hover:underline"
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
                    Nenhum item adicionado ainda. Selecione um produto à esquerda e clique em &quot;Adicionar Produto ao Pedido&quot;.
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
                          {item.commission_amount > 0 && (
                            <span className="text-[10px] text-emerald-700 block font-medium">
                              Comissão: {formatCurrency(item.commission_amount)}
                            </span>
                          )}
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

              {/* Totais Finais com Destaque para Profissional e Comissão */}
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Descontos:</span>
                  <span className="text-red-600 font-medium">- {formatCurrency(totalDiscount)}</span>
                </div>
                <div className="flex justify-between text-slate-700 font-semibold pt-1 border-t border-slate-100">
                  <span>Profissional Responsável:</span>
                  <span className="text-blue-700">{currentProfessional ? currentProfessional.name : 'Nenhum'}</span>
                </div>
                <div className="flex justify-between text-slate-700 font-semibold">
                  <span>Comissão Total Calculada:</span>
                  <span className="text-emerald-600 font-bold">{formatCurrency(totalCommission)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Final da Venda:</span>
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
