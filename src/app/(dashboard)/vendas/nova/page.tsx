'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
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
  RotateCcw,
  Lock,
  Key,
  Search,
  Filter,
  ChevronDown,
  Check,
  Building2,
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

function NovaVendaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerIdParam = searchParams.get('cliente') || '';
  const repeatSaleIdParam = searchParams.get('repetir_venda') || '';

  const { customers, products, professionals, sales, createSale } = useData();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isGerente = user?.role === 'GERENTE';
  const canAuthorizeBelowMinPrice = isAdmin || isGerente;

  // Estado de autorização de preço abaixo do mínimo
  const [managerAuthorized, setManagerAuthorized] = useState(false);
  const [managerNotes, setManagerNotes] = useState('');

  // Estado da Venda
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customerIdParam);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'VALOR' | 'PERCENTUAL'>('VALOR');
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // Carrinho de Itens da Venda Atual
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('PIX');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [autoLoadedNotice, setAutoLoadedNotice] = useState<string | null>(null);

  // Estados de busca e filtros no seletor de Clientes
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerTypeFilter, setCustomerTypeFilter] = useState<'ALL' | 'PF' | 'PJ'>('ALL');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const customerDropdownRef = React.useRef<HTMLDivElement>(null);

  // Estados de busca e filtros no seletor de Produtos
  const [productSearch, setProductSearch] = useState('');
  const [productBrandFilter, setProductBrandFilter] = useState<string>('ALL');
  const [productSortBy, setProductSortBy] = useState<'NAME' | 'PRICE_ASC' | 'PRICE_DESC' | 'STOCK_DESC'>('NAME');
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const productDropdownRef = React.useRef<HTMLDivElement>(null);

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
        setIsCustomerDropdownOpen(false);
      }
      if (productDropdownRef.current && !productDropdownRef.current.contains(event.target as Node)) {
        setIsProductDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Rastrear se já fizemos a carga inicial dos produtos do cliente
  const initializedRef = React.useRef(false);

  // 1. Sincronizar cliente inicial vindo da URL ou default para o primeiro cliente
  useEffect(() => {
    if (customerIdParam && customers.some(c => c.id === customerIdParam)) {
      setSelectedCustomerId(customerIdParam);
    } else if (customers.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(customers[0].id);
    }
  }, [customerIdParam, customers, selectedCustomerId]);

  // 2. Carregar produtos da última venda ou venda solicitada
  useEffect(() => {
    if (!selectedCustomerId || products.length === 0 || sales.length === 0 || initializedRef.current) return;

    // Buscar vendas do cliente ordenadas pelas mais recentes
    const customerSales = sales
      .filter((s) => s.customer_id === selectedCustomerId)
      .sort((a, b) => new Date(b.sold_at).getTime() - new Date(a.sold_at).getTime());

    // Se veio um ID específico para repetir, prioriza ele. Senão, pega a última venda.
    const targetSale = repeatSaleIdParam
      ? sales.find((s) => s.id === repeatSaleIdParam)
      : customerSales[0];

    if (targetSale && targetSale.items && targetSale.items.length > 0) {
      const restoredItems: CartItem[] = targetSale.items
        .map((item) => {
          const prod = products.find((p) => p.id === item.product_id);
          if (!prod) return null;

          return {
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount: item.discount,
            total: item.total,
            commission_type_snapshot: item.commission_type_snapshot || prod.commission_type || 'NONE',
            commission_value_snapshot: item.commission_value_snapshot ?? prod.commission_value ?? 0,
            commission_amount: item.commission_amount || 0,
          };
        })
        .filter(Boolean) as CartItem[];

      if (restoredItems.length > 0) {
        setCartItems(restoredItems);
        if (targetSale.professional_id) {
          setSelectedProfessionalId(targetSale.professional_id);
        }
        const firstProdId = restoredItems[0].product_id;
        setSelectedProductId(firstProdId);
        const prodObj = products.find((p) => p.id === firstProdId);
        if (prodObj) {
          setUnitPrice(prodObj.selling_price);
        }
        setAutoLoadedNotice(
          `Produtos carregados automaticamente da última compra do cliente (Pedido #${targetSale.sale_number}). Você pode editá-los ou adicionar novos.`
        );
      }
    }

    initializedRef.current = true;
  }, [selectedCustomerId, products, sales, repeatSaleIdParam]);

  // Sincronizar seleção do profissional
  useEffect(() => {
    if (professionals.length > 0 && !selectedProfessionalId) {
      setSelectedProfessionalId(professionals[0].id);
    }
  }, [professionals, selectedProfessionalId]);

  // Sincronizar produto selecionado inicial se ainda não houver
  useEffect(() => {
    if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
      setUnitPrice(products[0].selling_price);
    }
  }, [products, selectedProductId]);

  // Quando o usuário troca de cliente manualmente no select, dar opção de recarregar a última venda dele
  const handleCustomerChange = (newCustId: string) => {
    setSelectedCustomerId(newCustId);
    const customerSales = sales
      .filter((s) => s.customer_id === newCustId)
      .sort((a, b) => new Date(b.sold_at).getTime() - new Date(a.sold_at).getTime());

    const lastSale = customerSales[0];
    if (lastSale && lastSale.items && lastSale.items.length > 0) {
      const restoredItems: CartItem[] = lastSale.items
        .map((item) => {
          const prod = products.find((p) => p.id === item.product_id);
          if (!prod) return null;
          return {
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount: item.discount,
            total: item.total,
            commission_type_snapshot: item.commission_type_snapshot || prod.commission_type || 'NONE',
            commission_value_snapshot: item.commission_value_snapshot ?? prod.commission_value ?? 0,
            commission_amount: item.commission_amount || 0,
          };
        })
        .filter(Boolean) as CartItem[];

      if (restoredItems.length > 0) {
        setCartItems(restoredItems);
        if (lastSale.professional_id) {
          setSelectedProfessionalId(lastSale.professional_id);
        }
        setAutoLoadedNotice(
          `Cliente alterado: Itens da última venda (#${lastSale.sale_number}) foram carregados automaticamente.`
        );
        return;
      }
    }
    // Se não tiver compras anteriores, limpa o aviso
    setAutoLoadedNotice(null);
  };

  const currentCustomer = customers.find((c) => c.id === selectedCustomerId);
  const currentProfessional = professionals.find((p) => p.id === selectedProfessionalId);
  const currentProduct = products.find((p) => p.id === selectedProductId);

  // Lista de marcas disponíveis para o filtro de produtos
  const availableBrands = React.useMemo(() => {
    return Array.from(new Set(products.map((p) => p.brand).filter(Boolean) as string[])).sort();
  }, [products]);

  // Clientes filtrados por busca textual (nome, razão social, documento, cidade) e tipo (PF/PJ)
  const filteredCustomers = React.useMemo(() => {
    return customers.filter((c) => {
      const q = customerSearch.trim().toLowerCase();
      const matchesText =
        !q ||
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.trade_name && c.trade_name.toLowerCase().includes(q)) ||
        (c.document && c.document.includes(q)) ||
        (c.city && c.city.toLowerCase().includes(q));

      const matchesType = customerTypeFilter === 'ALL' || c.type === customerTypeFilter;
      return matchesText && matchesType;
    });
  }, [customers, customerSearch, customerTypeFilter]);

  // Produtos filtrados por busca textual (nome, código, marca), marca e ordenados por nome/preço/estoque
  const filteredProducts = React.useMemo(() => {
    const list = products.filter((p) => {
      const q = productSearch.trim().toLowerCase();
      const matchesText =
        !q ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q));

      const matchesBrand = productBrandFilter === 'ALL' || p.brand === productBrandFilter;
      return matchesText && matchesBrand;
    });

    return list.sort((a, b) => {
      if (productSortBy === 'PRICE_ASC') return a.selling_price - b.selling_price;
      if (productSortBy === 'PRICE_DESC') return b.selling_price - a.selling_price;
      if (productSortBy === 'STOCK_DESC') return b.current_stock - a.current_stock;
      return a.name.localeCompare(b.name, 'pt-BR');
    });
  }, [products, productSearch, productBrandFilter, productSortBy]);

  // Atualizar preço padrão ao selecionar outro produto
  const handleProductChange = (newProductId: string) => {
    setSelectedProductId(newProductId);
    const prod = products.find((p) => p.id === newProductId);
    if (prod) {
      setUnitPrice(prod.selling_price);
      setDiscount(0);
      setDiscountPercent(0);
    }
  };

  // Funções de sincronização de desconto (R$ <-> %)
  const handleDiscountValueChange = (val: number) => {
    const rawVal = Math.max(0, val);
    setDiscount(rawVal);
    const grossTotal = quantity * unitPrice;
    if (grossTotal > 0) {
      const pct = Number(((rawVal / grossTotal) * 100).toFixed(2));
      setDiscountPercent(pct);
    } else {
      setDiscountPercent(0);
    }
  };

  const handleDiscountPercentChange = (pct: number) => {
    const rawPct = Math.max(0, Math.min(100, pct));
    setDiscountPercent(rawPct);
    const grossTotal = quantity * unitPrice;
    const calculatedValue = Number(((grossTotal * rawPct) / 100).toFixed(2));
    setDiscount(calculatedValue);
  };

  const handleQuantityOrPriceChange = (newQty: number, newPrice: number) => {
    setQuantity(newQty);
    setUnitPrice(newPrice);
    if (discountType === 'PERCENTUAL') {
      const grossTotal = newQty * newPrice;
      const calculatedValue = Number(((grossTotal * discountPercent) / 100).toFixed(2));
      setDiscount(calculatedValue);
    } else {
      const grossTotal = newQty * newPrice;
      if (grossTotal > 0) {
        setDiscountPercent(Number(((discount / grossTotal) * 100).toFixed(2)));
      }
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

    // Se estiver abaixo do preço mínimo e for vendedor sem autorização do Gerente
    if (isBelowMinPrice && !canAuthorizeBelowMinPrice && !managerAuthorized) {
      alert('Preço abaixo do mínimo permitido! Apenas um GERENTE ou ADMINISTRADOR pode autorizar a venda deste item.');
      return;
    }

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
    setManagerAuthorized(false);
    setManagerNotes('');
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

      {/* Aviso de Produtos Pré-carregados da Última Venda */}
      {autoLoadedNotice && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-600 text-white rounded-xl shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-blue-950 block">Produtos Pré-carregados da Última Negociação</span>
              <p className="text-[11px] text-blue-700 mt-0.5">{autoLoadedNotice}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAutoLoadedNotice(null)}
            className="text-[11px] font-bold text-blue-600 hover:text-blue-800 shrink-0 px-2 py-1 bg-white rounded-lg border border-blue-200 shadow-2xs"
          >
            Entendi
          </button>
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
                  <div className="relative" ref={customerDropdownRef}>
                    {/* Botão Gatilho do Dropdown com Informações do Cliente Selecionado */}
                    <button
                      type="button"
                      onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
                      className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl px-4 py-3 text-left flex items-center justify-between transition-all focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs"
                    >
                      {currentCustomer ? (
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className={`p-2 rounded-lg shrink-0 ${currentCustomer.type === 'PJ' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {currentCustomer.type === 'PJ' ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 text-xs block truncate">
                              {currentCustomer.trade_name ? `${currentCustomer.trade_name} (${currentCustomer.name})` : currentCustomer.name}
                            </span>
                            <span className="text-[11px] text-slate-500 block truncate">
                              {currentCustomer.document} • {currentCustomer.city || 'Cidade não inf.'} [{currentCustomer.type}]
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">Selecione um cliente para a venda...</span>
                      )}
                      <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 ml-2 transition-transform duration-200 ${isCustomerDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Menu Dropdown Suspenso com Busca e Filtros */}
                    {isCustomerDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-40 p-3 animate-in fade-in zoom-in-95 space-y-2.5">
                        {/* Campo de Busca em Tempo Real */}
                        <div className="relative">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            autoFocus
                            value={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)}
                            placeholder="Buscar cliente por nome, CNPJ/CPF ou cidade..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        {/* Filtros por Tipo de Cliente (Todos / PF / PJ) */}
                        <div className="flex items-center space-x-1.5 pt-1">
                          {(['ALL', 'PF', 'PJ'] as const).map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setCustomerTypeFilter(t)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                customerTypeFilter === t
                                  ? 'bg-blue-600 text-white shadow-2xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                              }`}
                            >
                              {t === 'ALL' ? 'Todos' : t === 'PF' ? 'Pessoa Física (PF)' : 'Pessoa Jurídica (PJ)'}
                            </button>
                          ))}
                          <span className="text-[10px] text-slate-400 ml-auto font-semibold">
                            {filteredCustomers.length} encontrado(s)
                          </span>
                        </div>

                        {/* Lista Rolável de Clientes */}
                        <div className="max-h-60 overflow-y-auto space-y-1 pt-1 divide-y divide-slate-100 dark-scrollbar">
                          {filteredCustomers.length === 0 ? (
                            <div className="py-6 text-center text-xs text-slate-400">
                              Nenhum cliente corresponde aos filtros de busca.
                            </div>
                          ) : (
                            filteredCustomers.map((c) => {
                              const isSelected = c.id === selectedCustomerId;
                              return (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => {
                                    handleCustomerChange(c.id);
                                    setIsCustomerDropdownOpen(false);
                                  }}
                                  className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between transition-colors ${
                                    isSelected ? 'bg-blue-50/80 border border-blue-200/80' : 'hover:bg-slate-50'
                                  }`}
                                >
                                  <div className="flex items-center space-x-2.5 min-w-0">
                                    <div className={`p-1.5 rounded-lg shrink-0 ${c.type === 'PJ' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                      {c.type === 'PJ' ? <Building2 className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                                    </div>
                                    <div className="min-w-0">
                                      <span className={`text-xs block truncate ${isSelected ? 'font-black text-blue-900' : 'font-bold text-slate-800'}`}>
                                        {c.trade_name ? `${c.trade_name} (${c.name})` : c.name}
                                      </span>
                                      <span className="text-[10px] text-slate-500 block truncate">
                                        {c.document} • {c.city || 'Sem cidade'}/{c.state || ''}
                                      </span>
                                    </div>
                                  </div>
                                  {isSelected && (
                                    <span className="p-1 rounded-full bg-blue-600 text-white shrink-0 ml-2">
                                      <Check className="w-3 h-3 stroke-[3]" />
                                    </span>
                                  )}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
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
              <div className="relative" ref={productDropdownRef}>
                {/* Botão Gatilho do Dropdown com Foto e Detalhes do Produto Selecionado */}
                <button
                  type="button"
                  onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
                  className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl px-4 py-3 text-left flex items-center justify-between transition-all focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs"
                >
                  {currentProduct ? (
                    <div className="flex items-center space-x-3 min-w-0">
                      {currentProduct.image_url ? (
                        <img
                          src={currentProduct.image_url}
                          alt={currentProduct.name}
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                          <Package className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-slate-900 text-xs block truncate">
                          {currentProduct.name}
                        </span>
                        <span className="text-[11px] text-slate-500 block truncate">
                          {currentProduct.brand ? `Marca: ${currentProduct.brand} • ` : ''}
                          Tabela: <strong className="text-slate-800">{formatCurrency(currentProduct.selling_price)}</strong> • 
                          Estoque: <strong className={currentProduct.current_stock <= currentProduct.min_stock ? 'text-amber-600' : 'text-slate-700'}>{currentProduct.current_stock} {currentProduct.unit}</strong>
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500">Selecione um produto do catálogo...</span>
                  )}
                  <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 ml-2 transition-transform duration-200 ${isProductDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown com Barra de Busca, Filtro de Marca e Ordenação */}
                {isProductDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-40 p-3.5 animate-in fade-in zoom-in-95 space-y-3">
                    {/* Linha de Busca */}
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        autoFocus
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="Buscar produto por nome, código SKU, código de barras ou marca..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Linha de Filtros: Marcas e Ordenação por Preço / Estoque */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {/* Filtro por Marca */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center space-x-1">
                          <Filter className="w-3 h-3" />
                          <span>Marca</span>
                        </label>
                        <select
                          value={productBrandFilter}
                          onChange={(e) => setProductBrandFilter(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="ALL">Todas as Marcas ({availableBrands.length})</option>
                          {availableBrands.map((b) => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Ordenação */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center space-x-1">
                          <DollarSign className="w-3 h-3" />
                          <span>Ordenar por</span>
                        </label>
                        <select
                          value={productSortBy}
                          onChange={(e) => setProductSortBy(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="NAME">Nome (A a Z)</option>
                          <option value="PRICE_ASC">Menor Preço (Tabela)</option>
                          <option value="PRICE_DESC">Maior Preço (Tabela)</option>
                          <option value="STOCK_DESC">Maior Estoque Disponível</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      <span>{filteredProducts.length} produto(s) encontrado(s)</span>
                      {(productSearch || productBrandFilter !== 'ALL') && (
                        <button
                          type="button"
                          onClick={() => {
                            setProductSearch('');
                            setProductBrandFilter('ALL');
                          }}
                          className="text-blue-600 hover:text-blue-800 font-bold"
                        >
                          Limpar filtros
                        </button>
                      )}
                    </div>

                    {/* Lista Rolável de Produtos com Destaque de Preço, Marca e Estoque */}
                    <div className="max-h-64 overflow-y-auto space-y-1.5 pt-1 divide-y divide-slate-100 dark-scrollbar">
                      {filteredProducts.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400">
                          Nenhum produto encontrado com os filtros informados.
                        </div>
                      ) : (
                        filteredProducts.map((p) => {
                          const isSelected = p.id === selectedProductId;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                handleProductChange(p.id);
                                setIsProductDropdownOpen(false);
                              }}
                              className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between transition-colors ${
                                isSelected ? 'bg-blue-50/80 border border-blue-200/80' : 'hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center space-x-3 min-w-0 flex-1">
                                {p.image_url ? (
                                  <img
                                    src={p.image_url}
                                    alt={p.name}
                                    className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                                    <Package className="w-4 h-4" />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <span className={`text-xs block truncate ${isSelected ? 'font-black text-blue-900' : 'font-bold text-slate-900'}`}>
                                    {p.name}
                                  </span>
                                  <div className="flex items-center space-x-2 text-[10px] text-slate-500 mt-0.5">
                                    {p.brand && <span className="bg-slate-100 px-1.5 py-0.5 rounded font-medium">{p.brand}</span>}
                                    {p.sku && <span>SKU: {p.sku}</span>}
                                    <span>• {p.unit}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="text-right shrink-0 ml-3">
                                <span className="text-xs font-black text-slate-900 block">
                                  {formatCurrency(p.selling_price)}
                                </span>
                                <span className={`text-[10px] block font-semibold ${p.current_stock <= p.min_stock ? 'text-amber-600' : 'text-slate-400'}`}>
                                  Estoque: {p.current_stock}
                                </span>
                              </div>

                              {isSelected && (
                                <span className="p-1 rounded-full bg-blue-600 text-white shrink-0 ml-2">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </span>
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* Banner com Detalhes do Produto Selecionado */}
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
                    onChange={(e) => handleQuantityOrPriceChange(Math.max(1, Number(e.target.value)), unitPrice)}
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
                    onChange={(e) => handleQuantityOrPriceChange(quantity, Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-600">
                      Desconto
                    </label>
                    <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => setDiscountType('VALOR')}
                        className={`px-1.5 py-0.5 rounded-md transition-all ${
                          discountType === 'VALOR'
                            ? 'bg-white text-blue-700 shadow-xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        R$
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiscountType('PERCENTUAL')}
                        className={`px-1.5 py-0.5 rounded-md transition-all ${
                          discountType === 'PERCENTUAL'
                            ? 'bg-white text-blue-700 shadow-xs'
                            : 'text-slate-500 hover:text-slate-800'
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
                        step="0.01"
                        min="0"
                        value={discount}
                        onChange={(e) => handleDiscountValueChange(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-red-600 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                      {discount > 0 && (
                        <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400 pointer-events-none">
                          ({discountPercent}%)
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={discountPercent}
                        onChange={(e) => handleDiscountPercentChange(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-red-600 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400 pointer-events-none">
                        = {formatCurrency(discount)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Trava de Preço Mínimo com Autorização de Gerente */}
              {isBelowMinPrice && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl space-y-2.5 text-xs text-red-900">
                  <div className="flex items-start space-x-2">
                    <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">
                        Preço Abaixo do Mínimo Permitido!
                      </span>
                      <p className="text-[11px] text-red-700 mt-0.5">
                        O preço efetivo unitário negociado (R$ {(unitPrice - discount / quantity).toFixed(2)}) é inferior ao preço mínimo de tabela ({formatCurrency(currentProduct?.min_price)}).
                      </p>
                    </div>
                  </div>

                  {canAuthorizeBelowMinPrice ? (
                    <div className="p-2.5 bg-white/80 rounded-lg border border-red-100 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-700">
                        Como <strong>{user?.role}</strong>, você tem autonomia para autorizar essa margem.
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full">
                        AUTORIZAÇÃO GERENCIAL ATIVA
                      </span>
                    </div>
                  ) : managerAuthorized ? (
                    <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center justify-between text-emerald-800">
                      <span className="text-[11px] font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Autorizado pela gerência: {managerNotes || 'Autorização concedida'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setManagerAuthorized(false)}
                        className="text-[10px] font-semibold text-slate-500 underline hover:text-slate-800"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 bg-white rounded-lg border border-red-200 space-y-2">
                      <div className="flex items-center space-x-2 text-slate-700">
                        <Lock className="w-4 h-4 text-amber-600" />
                        <span className="text-[11px] font-bold">Solicitar / Informar Autorização de Gerência:</span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Nome ou motivo do Gerente (ex: Autorizado por Gerente Carlos)"
                          value={managerNotes}
                          onChange={(e) => setManagerNotes(e.target.value)}
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!managerNotes.trim()) {
                              alert('Por favor, informe a identificação da autorização ou do gerente responsável.');
                              return;
                            }
                            setManagerAuthorized(true);
                          }}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer"
                        >
                          Liberar Item
                        </button>
                      </div>
                    </div>
                  )}
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
                            {item.discount > 0 && (
                              <span className="text-red-600 font-semibold ml-1">
                                (Desc. -{formatCurrency(item.discount)} / {((item.discount / (item.quantity * item.unit_price)) * 100).toFixed(1)}%)
                              </span>
                            )}
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
                  <span className="text-red-600 font-medium">
                    - {formatCurrency(totalDiscount)}
                    {subtotal > 0 && totalDiscount > 0 && (
                      <span className="text-[11px] text-red-500 ml-1">
                        ({((totalDiscount / subtotal) * 100).toFixed(1)}%)
                      </span>
                    )}
                  </span>
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

export default function NovaVendaPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Carregando tela de negociação...</div>}>
      <NovaVendaForm />
    </Suspense>
  );
}
