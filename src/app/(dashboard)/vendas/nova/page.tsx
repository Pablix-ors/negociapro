'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import CustomerProductPriceHistory from '@/components/sales/CustomerProductPriceHistory';
import SaleReceiptModal from '@/components/sales/SaleReceiptModal';
import { Sale } from '@/types/database';
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
  CreditCard,
  Edit2,
  FileText,
  UserX,
  XCircle,
  X,
  Minus,
  ChevronUp,
  History,
  QrCode,
  Banknote,
  CalendarDays,
  Wallet,
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
  const quoteIdParam = searchParams.get('orcamento_id') || '';

  const { customers, products, professionals, sales, createSale, convertQuoteToSale } = useData();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isGerente = user?.role === 'GERENTE';
  const canAuthorizeBelowMinPrice = isAdmin || isGerente;

  // Estado de autorização de preço abaixo do mínimo
  const [managerAuthorized, setManagerAuthorized] = useState(false);
  const [managerNotes, setManagerNotes] = useState('');

  // Modo Venda Sem Cliente (Consumidor Final)
  const [isGuestSale, setIsGuestSale] = useState<boolean>(false);

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
  const [editingCartIndex, setEditingCartIndex] = useState<number | null>(null);
  const [editItemQty, setEditItemQty] = useState<number>(1);
  const [editItemPrice, setEditItemPrice] = useState<number>(0);
  const [editItemDiscount, setEditItemDiscount] = useState<number>(0);

  const [notes, setNotes] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('PIX à Vista');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [autoLoadedNotice, setAutoLoadedNotice] = useState<string | null>(null);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [savedQuoteModal, setSavedQuoteModal] = useState<Sale | null>(null);
  const [showCustomerHistory, setShowCustomerHistory] = useState<boolean>(false);
  const [showCustomerAllHistoryModal, setShowCustomerAllHistoryModal] = useState<boolean>(false);
  const [customerHistorySearch, setCustomerHistorySearch] = useState<string>('');
  const [showNotes, setShowNotes] = useState<boolean>(false);
  const [orderDiscount, setOrderDiscount] = useState<number>(0);

  // Estados de Condições de Pagamento / Parcelamento
  const [paymentType, setPaymentType] = useState<'A_VISTA' | 'A_PRAZO' | 'PARCELADO'>('A_VISTA');
  const [installmentsCount, setInstallmentsCount] = useState<number>(3);
  const [firstDueDate, setFirstDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [installmentInterval, setInstallmentInterval] = useState<string>('30');
  const [customInstallments, setCustomInstallments] = useState<Array<{ number: number; due_date: string; amount: number; notes?: string }>>([]);

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

  // Estados dos dropdowns modernos e estilizados de Vendedor(a) e Forma de Pagamento
  const [isProfessionalDropdownOpen, setIsProfessionalDropdownOpen] = useState(false);
  const professionalDropdownRef = React.useRef<HTMLDivElement>(null);

  const [isPaymentDropdownOpen, setIsPaymentDropdownOpen] = useState(false);
  const paymentDropdownRef = React.useRef<HTMLDivElement>(null);

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
        setIsCustomerDropdownOpen(false);
      }
      if (productDropdownRef.current && !productDropdownRef.current.contains(event.target as Node)) {
        setIsProductDropdownOpen(false);
      }
      if (professionalDropdownRef.current && !professionalDropdownRef.current.contains(event.target as Node)) {
        setIsProfessionalDropdownOpen(false);
      }
      if (paymentDropdownRef.current && !paymentDropdownRef.current.contains(event.target as Node)) {
        setIsPaymentDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Rastrear se já fizemos a carga inicial dos produtos do cliente
  const initializedRef = React.useRef(false);

  // 1. Sincronizar cliente inicial vindo da URL ou default para o primeiro cliente (se não for venda sem cliente)
  useEffect(() => {
    if (isGuestSale) {
      setSelectedCustomerId('');
      return;
    }
    if (customerIdParam && customers.some(c => c.id === customerIdParam)) {
      setSelectedCustomerId(customerIdParam);
    } else if (customers.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(customers[0].id);
    }
  }, [customerIdParam, customers, selectedCustomerId, isGuestSale]);

  // 2. Carregar produtos APENAS quando explicitamente solicitado (Orçamento ou Repetir Venda)
  useEffect(() => {
    if (products.length === 0 || sales.length === 0 || initializedRef.current) return;

    // Se veio um ID de orçamento para reabrir/finalizar
    if (quoteIdParam) {
      const quoteSale = sales.find((s) => s.id === quoteIdParam);
      if (quoteSale && quoteSale.items && quoteSale.items.length > 0) {
        if (quoteSale.customer_id) {
          setSelectedCustomerId(quoteSale.customer_id);
          setIsGuestSale(false);
        } else {
          setIsGuestSale(true);
        }
        if (quoteSale.professional_id) {
          setSelectedProfessionalId(quoteSale.professional_id);
        }
        if (quoteSale.notes) {
          setNotes(quoteSale.notes);
        }
        if (quoteSale.payment_method_name) {
          setPaymentMethod(quoteSale.payment_method_name);
        }

        const restoredItems: CartItem[] = quoteSale.items
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
          setAutoLoadedNotice(`Orçamento #${quoteSale.sale_number} carregado no PDV. Você pode editar itens ou convertê-lo em venda final.`);
        }
        initializedRef.current = true;
        return;
      }
    }

    // Se o usuário clicou explicitamente em "Iniciar nova venda repetindo itens deste pedido"
    if (repeatSaleIdParam) {
      const targetSale = sales.find((s) => s.id === repeatSaleIdParam);

      if (targetSale && targetSale.items && targetSale.items.length > 0) {
        if (targetSale.customer_id) {
          setSelectedCustomerId(targetSale.customer_id);
          setIsGuestSale(false);
        }
        if (targetSale.professional_id) {
          setSelectedProfessionalId(targetSale.professional_id);
        }

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
          const firstProdId = restoredItems[0].product_id;
          setSelectedProductId(firstProdId);
          const prodObj = products.find((p) => p.id === firstProdId);
          if (prodObj) {
            setUnitPrice(prodObj.selling_price);
          }
          setAutoLoadedNotice(
            `Produtos carregados da negociação anterior (Pedido #${targetSale.sale_number}). Você pode editar os itens ou adicionar novos produtos.`
          );
        }
      }
    }

    initializedRef.current = true;
  }, [selectedCustomerId, products, sales, repeatSaleIdParam, quoteIdParam, isGuestSale]);

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

  // Quando o usuário troca de cliente manualmente no select: apenas atualiza o cliente (venda limpa)
  const handleCustomerChange = (newCustId: string) => {
    setSelectedCustomerId(newCustId);
    setAutoLoadedNotice(null);
  };

  const currentCustomer = customers.find((c) => c.id === selectedCustomerId);
  const currentProfessional = professionals.find((p) => p.id === selectedProfessionalId);
  const currentProduct = products.find((p) => p.id === selectedProductId);

  // Resumo de todos os produtos já negociados com o cliente selecionado
  const customerNegotiatedSummary = React.useMemo(() => {
    if (!selectedCustomerId || isGuestSale) return [];

    const custSales = sales.filter((s) => {
      const matchId = s.customer_id === selectedCustomerId || s.customer?.id === selectedCustomerId;
      const matchDoc = currentCustomer?.document && s.customer?.document === currentCustomer.document;
      return (matchId || matchDoc) && s.status !== 'CANCELLED';
    });

    const map = new Map<string, {
      productId: string;
      productName: string;
      brand?: string;
      unit?: string;
      catalogPrice: number;
      lastPrice: number;
      lastDiscount: number;
      lastSaleDate: string;
      lastSaleNumber: number;
      totalPurchasedQty: number;
      timesPurchased: number;
      minPrice: number;
      maxPrice: number;
    }>();

    // Iterar pelas vendas em ordem cronológica (mais antigas para mais recentes)
    const sortedSales = [...custSales].sort((a, b) => new Date(a.sold_at || a.created_at).getTime() - new Date(b.sold_at || b.created_at).getTime());

    sortedSales.forEach((sale) => {
      if (!sale.items) return;
      sale.items.forEach((it) => {
        const prod = products.find((p) => p.id === it.product_id) || it.product;
        const prodId = it.product_id;
        const effectiveUnit = it.unit_price - ((it.discount || 0) / (it.quantity || 1));
        const existing = map.get(prodId);

        if (!existing) {
          map.set(prodId, {
            productId: prodId,
            productName: prod?.name || 'Produto',
            brand: prod?.brand || undefined,
            unit: prod?.unit || 'UN',
            catalogPrice: prod?.selling_price || it.unit_price,
            lastPrice: effectiveUnit,
            lastDiscount: it.discount || 0,
            lastSaleDate: sale.sold_at || sale.created_at,
            lastSaleNumber: sale.sale_number,
            totalPurchasedQty: it.quantity,
            timesPurchased: 1,
            minPrice: effectiveUnit,
            maxPrice: effectiveUnit,
          });
        } else {
          existing.lastPrice = effectiveUnit;
          existing.lastDiscount = it.discount || 0;
          existing.lastSaleDate = sale.sold_at || sale.created_at;
          existing.lastSaleNumber = sale.sale_number;
          existing.totalPurchasedQty += it.quantity;
          existing.timesPurchased += 1;
          existing.minPrice = Math.min(existing.minPrice, effectiveUnit);
          existing.maxPrice = Math.max(existing.maxPrice, effectiveUnit);
        }
      });
    });

    return Array.from(map.values()).sort((a, b) => new Date(b.lastSaleDate).getTime() - new Date(a.lastSaleDate).getTime());
  }, [selectedCustomerId, isGuestSale, sales, currentCustomer, products]);

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

  // Preço efetivo unitário e verificação de trava de preço mínimo
  const effectiveUnitPrice = quantity > 0 ? unitPrice - (discount / quantity) : unitPrice;
  const isBelowMinPrice = Boolean(
    currentProduct &&
    currentProduct.min_price !== undefined &&
    currentProduct.min_price > 0 &&
    effectiveUnitPrice < currentProduct.min_price
  );

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

  // Atualização direta e instantânea de quantidade no carrinho
  const updateCartItemQuantity = (index: number, newQty: number) => {
    const safeQty = Math.max(1, newQty);
    const item = cartItems[index];
    if (!item) return;
    const prod = products.find((p) => p.id === item.product_id);
    const newTotal = Math.max(0, safeQty * item.unit_price - item.discount);

    let recalculatedCommission = 0;
    if (prod && prod.commission_type !== 'NONE') {
      if (prod.commission_type === 'PERCENTAGE') {
        recalculatedCommission = Number(((newTotal * (prod.commission_value || 0)) / 100).toFixed(2));
      } else if (prod.commission_type === 'FIXED') {
        recalculatedCommission = Number((safeQty * (prod.commission_value || 0)).toFixed(2));
      }
    }

    const updated = [...cartItems];
    updated[index] = {
      ...item,
      quantity: safeQty,
      total: newTotal,
      commission_amount: recalculatedCommission,
    };
    setCartItems(updated);
  };

  // Atualização direta e instantânea de preço no carrinho
  const updateCartItemPrice = (index: number, newPrice: number) => {
    const safePrice = Math.max(0, newPrice);
    const item = cartItems[index];
    if (!item) return;
    const prod = products.find((p) => p.id === item.product_id);
    const newTotal = Math.max(0, item.quantity * safePrice - item.discount);

    let recalculatedCommission = 0;
    if (prod && prod.commission_type !== 'NONE') {
      if (prod.commission_type === 'PERCENTAGE') {
        recalculatedCommission = Number(((newTotal * (prod.commission_value || 0)) / 100).toFixed(2));
      } else if (prod.commission_type === 'FIXED') {
        recalculatedCommission = Number((item.quantity * (prod.commission_value || 0)).toFixed(2));
      }
    }

    const updated = [...cartItems];
    updated[index] = {
      ...item,
      unit_price: safePrice,
      total: newTotal,
      commission_amount: recalculatedCommission,
    };
    setCartItems(updated);
  };

  // Totais Gerais
  const subtotal = cartItems.reduce((acc, item) => acc + item.quantity * item.unit_price, 0);
  const totalItemDiscount = cartItems.reduce((acc, item) => acc + item.discount, 0);
  const totalDiscount = totalItemDiscount + orderDiscount;
  const grandTotal = Math.max(0, subtotal - totalDiscount);
  const totalUnits = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalCommission = cartItems.reduce((acc, item) => acc + item.commission_amount, 0);

  // Sincronizar plano de parcelas gerado automaticamente quando grandTotal, número de parcelas ou vencimento mudar
  useEffect(() => {
    if (paymentType === 'A_VISTA') {
      setCustomInstallments([]);
      return;
    }

    const count = paymentType === 'A_PRAZO' ? 1 : Math.max(1, installmentsCount);
    const baseAmount = Number((grandTotal / count).toFixed(2));
    const remainder = Number((grandTotal - baseAmount * count).toFixed(2));

    const generated: Array<{ number: number; due_date: string; amount: number; notes?: string }> = [];
    const startDate = new Date(`${firstDueDate}T12:00:00`);

    for (let i = 0; i < count; i++) {
      const d = new Date(startDate);
      if (installmentInterval === 'MENSAL') {
        d.setMonth(d.getMonth() + i);
      } else {
        const days = parseInt(installmentInterval, 10) || 30;
        d.setDate(d.getDate() + i * days);
      }

      // Adicionar centavo residual na primeira parcela para fechar a soma com perfeição
      const instAmount = i === 0 ? Number((baseAmount + remainder).toFixed(2)) : baseAmount;

      generated.push({
        number: i + 1,
        due_date: d.toISOString().split('T')[0],
        amount: Math.max(0, instAmount),
        notes: `Parcela ${i + 1}/${count}`,
      });
    }

    setCustomInstallments(generated);
  }, [paymentType, installmentsCount, firstDueDate, installmentInterval, grandTotal]);

  // Atualizar parcela individual modificada pelo usuário
  const handleUpdateInstallment = (index: number, field: 'due_date' | 'amount', value: any) => {
    const updated = [...customInstallments];
    if (field === 'due_date') {
      updated[index].due_date = value;
    } else {
      updated[index].amount = parseFloat(value) || 0;
    }
    setCustomInstallments(updated);
  };

  // Abrir modal de edição de item do carrinho
  const handleOpenEditCartItem = (idx: number) => {
    const item = cartItems[idx];
    setEditingCartIndex(idx);
    setEditItemQty(item.quantity);
    setEditItemPrice(item.unit_price);
    setEditItemDiscount(item.discount);
  };

  // Salvar alterações do item no carrinho
  const handleSaveEditCartItem = () => {
    if (editingCartIndex === null) return;
    const currentItem = cartItems[editingCartIndex];
    const prod = products.find((p) => p.id === currentItem.product_id);

    const safeQty = Math.max(1, editItemQty);
    const safePrice = Math.max(0, editItemPrice);
    const safeDiscount = Math.max(0, editItemDiscount);
    const newTotal = Math.max(0, safeQty * safePrice - safeDiscount);

    // Recalcular comissão snapshot para o novo valor
    let recalculatedCommission = 0;
    if (prod && prod.commission_type !== 'NONE') {
      if (prod.commission_type === 'PERCENTAGE') {
        recalculatedCommission = Number(((newTotal * (prod.commission_value || 0)) / 100).toFixed(2));
      } else if (prod.commission_type === 'FIXED') {
        recalculatedCommission = Number((safeQty * (prod.commission_value || 0)).toFixed(2));
      }
    }

    const updatedList = [...cartItems];
    updatedList[editingCartIndex] = {
      ...currentItem,
      quantity: safeQty,
      unit_price: safePrice,
      discount: safeDiscount,
      total: newTotal,
      commission_amount: recalculatedCommission,
    };

    setCartItems(updatedList);
    setEditingCartIndex(null);
  };

  // Salvar como Orçamento (status: 'QUOTE') - Não movimenta estoque, nem caixa, nem comissão
  const handleSaveQuote = () => {
    if (cartItems.length === 0) {
      alert('Adicione pelo menos um item ao pedido para salvar como orçamento.');
      return;
    }

    const createdQuote = createSale({
      customer_id: !isGuestSale && selectedCustomerId ? selectedCustomerId : undefined,
      professional_id: selectedProfessionalId || undefined,
      payment_method_name: paymentMethod,
      payment_type: paymentType,
      items: cartItems,
      notes: notes ? `[ORÇAMENTO] ${notes}` : '[ORÇAMENTO]',
      status: 'QUOTE',
    });

    setSavedQuoteModal(createdQuote);
  };

  // Finalizar Venda com gravação atômica em price_history, comissão, contas a receber e comprovante
  const handleFinishSale = () => {
    if (cartItems.length === 0) return;
    if (!isGuestSale && !selectedCustomerId) {
      alert('Selecione um cliente ou clique na opção "Venda sem cliente / Consumidor Final".');
      return;
    }

    // Se for parcelado ou a prazo, valida se a soma das parcelas fecha o total
    if (paymentType !== 'A_VISTA' && customInstallments.length > 0) {
      const sum = Number(customInstallments.reduce((acc, inst) => acc + inst.amount, 0).toFixed(2));
      if (Math.abs(sum - grandTotal) > 0.05) {
        alert(`A soma das parcelas (R$ ${sum.toFixed(2)}) deve ser exatamente igual ao total da venda (R$ ${grandTotal.toFixed(2)}). Ajuste os valores.`);
        return;
      }
    }

    // Se estiver reabrindo um orçamento existente para finalizar
    if (quoteIdParam) {
      const converted = convertQuoteToSale(quoteIdParam, {
        customer_id: !isGuestSale && selectedCustomerId ? selectedCustomerId : null,
        professional_id: selectedProfessionalId || null,
        payment_method_name: paymentMethod,
        payment_type: paymentType,
        installments_plan: paymentType !== 'A_VISTA' ? customInstallments : undefined,
        items: cartItems,
        notes,
      });

      if (converted) {
        setIsSuccess(true);
        setCompletedSale(converted);
        return;
      }
    }

    const newSale = createSale({
      customer_id: !isGuestSale && selectedCustomerId ? selectedCustomerId : undefined,
      professional_id: selectedProfessionalId || undefined,
      payment_method_name: paymentMethod,
      payment_type: paymentType,
      installments_plan: paymentType !== 'A_VISTA' ? customInstallments : undefined,
      items: cartItems,
      notes,
    });

    setIsSuccess(true);
    setCompletedSale(newSale);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Título & Instrução (Conforme imagem de referência) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Nova venda
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastre os produtos e finalize o pedido
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
              <span className="text-xs font-bold text-blue-950 block">Produtos carregados da negociação anterior</span>
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

      {/* Grid Principal: Área de Venda à Esquerda (Col 8) e Resumo Fixo à Direita (Col 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Coluna Principal: Cliente, Adicionar Produto, Itens do Pedido e Histórico */}
        <div className="lg:col-span-8 space-y-4">
          {/* CARD 1: CLIENTE E VENDEDOR(A) (Conforme imagem de referência) */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Cliente */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                    {isGuestSale ? (
                      <UserX className="w-6 h-6 text-amber-600" />
                    ) : currentCustomer?.type === 'PJ' ? (
                      <Building2 className="w-6 h-6 text-blue-700" />
                    ) : (
                      <User className="w-6 h-6 text-blue-700" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    {isGuestSale ? (
                      <div>
                        <div className="flex items-center space-x-2">
                          <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                            Consumidor Final (Sem Cliente)
                          </h2>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            Venda Rápida
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Venda sem cadastro • Estoque e caixa com total integridade
                        </p>
                      </div>
                    ) : currentCustomer ? (
                      <div>
                        <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                          {currentCustomer.trade_name ? `${currentCustomer.trade_name} (${currentCustomer.name})` : currentCustomer.name}
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                          {currentCustomer.document ? `CPF/CNPJ ${currentCustomer.document}` : 'Sem documento'}
                          {currentCustomer.city ? ` • ${currentCustomer.city} / ${currentCustomer.state || 'UF'}` : ''}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <h2 className="text-sm sm:text-base font-bold text-slate-500">
                          Nenhum cliente selecionado
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Selecione um cliente para vincular ao pedido
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Ações do Cliente: Trocar e Ver Produtos Negociados */}
                  <div className="relative shrink-0 flex items-center space-x-2" ref={customerDropdownRef}>
                    {/* Botão Ver Todos os Produtos Negociados com Este Cliente */}
                    {selectedCustomerId && !isGuestSale && customerNegotiatedSummary.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerHistorySearch('');
                          setShowCustomerAllHistoryModal(true);
                        }}
                        className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center space-x-1.5"
                        title="Ver todos os produtos já comprados por este cliente e seus preços"
                      >
                        <History className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="hidden sm:inline">Histórico do Cliente</span>
                        <span className="bg-indigo-200/80 text-indigo-900 px-1.5 py-0.2 rounded-md text-[10px] font-black">
                          {customerNegotiatedSummary.length}
                        </span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
                      className="px-3.5 py-2 border border-blue-600/30 text-blue-700 hover:bg-blue-50/60 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center space-x-1.5"
                    >
                      <span>Trocar cliente</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isCustomerDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown com Busca e Opções */}
                    {isCustomerDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-3 animate-in fade-in zoom-in-95 space-y-2">
                        {/* Opções rápidas: Consumidor Final ou Novo Cliente */}
                        <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
                          <button
                            type="button"
                            onClick={() => {
                              setIsGuestSale(true);
                              setSelectedCustomerId('');
                              setIsCustomerDropdownOpen(false);
                            }}
                            className={`flex-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1 ${
                              isGuestSale ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>Sem Cliente</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => router.push('/clientes/novo')}
                            className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors"
                          >
                            + Cadastrar
                          </button>
                        </div>

                        {/* Campo de Busca */}
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            autoFocus
                            value={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)}
                            placeholder="Buscar cliente..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        {/* Lista de Clientes */}
                        <div className="max-h-56 overflow-y-auto space-y-1 divide-y divide-slate-100">
                          {filteredCustomers.length === 0 ? (
                            <div className="py-4 text-center text-xs text-slate-400">
                              Nenhum cliente encontrado
                            </div>
                          ) : (
                            filteredCustomers.map((c) => {
                              const isSelected = !isGuestSale && c.id === selectedCustomerId;
                              return (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => {
                                    setIsGuestSale(false);
                                    handleCustomerChange(c.id);
                                    setIsCustomerDropdownOpen(false);
                                  }}
                                  className={`w-full p-2 rounded-lg text-left flex items-center justify-between text-xs transition-colors ${
                                    isSelected ? 'bg-blue-50 text-blue-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                                  }`}
                                >
                                  <div className="truncate pr-2">
                                    <span className="block truncate font-semibold">
                                      {c.trade_name ? `${c.trade_name} (${c.name})` : c.name}
                                    </span>
                                    <span className="text-[10px] text-slate-400 block truncate">
                                      {c.document || 'Sem doc'} • {c.city || 'Sem cidade'}
                                    </span>
                                  </div>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Vendedor(a) - Seletor Personalizado Moderno */}
              <div className="w-full md:w-60 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4">
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Vendedor(a)
                </label>
                <div className="relative" ref={professionalDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsProfessionalDropdownOpen(!isProfessionalDropdownOpen)}
                    className="w-full bg-slate-50 hover:bg-slate-100/90 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all flex items-center justify-between text-left shadow-2xs"
                  >
                    <div className="flex items-center space-x-2 truncate pr-1">
                      <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-black shrink-0">
                        {currentProfessional ? currentProfessional.name.charAt(0).toUpperCase() : 'V'}
                      </div>
                      <span className="truncate">
                        {currentProfessional ? currentProfessional.name : 'Vendas internas'}
                      </span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${isProfessionalDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Customizado */}
                  {isProfessionalDropdownOpen && (
                    <div className="absolute right-0 mt-1.5 w-full min-w-[200px] bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1.5 animate-in fade-in zoom-in-95 space-y-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProfessionalId('');
                          setIsProfessionalDropdownOpen(false);
                        }}
                        className={`w-full px-2.5 py-2 rounded-lg text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                          !selectedProfessionalId
                            ? 'bg-blue-50 text-blue-800'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                            VI
                          </span>
                          <span className="truncate">Vendas internas</span>
                        </div>
                        {!selectedProfessionalId && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                      </button>

                      {professionals
                        .filter((p) => p.active)
                        .map((p) => {
                          const isSelected = p.id === selectedProfessionalId;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setSelectedProfessionalId(p.id);
                                setIsProfessionalDropdownOpen(false);
                              }}
                              className={`w-full px-2.5 py-2 rounded-lg text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                                isSelected
                                  ? 'bg-blue-50 text-blue-800'
                                  : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center space-x-2 truncate">
                                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                                  {p.name.charAt(0).toUpperCase()}
                                </span>
                                <span className="truncate">{p.name}</span>
                              </div>
                              {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                            </button>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* CARD 2: ADICIONAR PRODUTO (Conforme imagem de referência) */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Adicionar produto</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Busque um produto e informe a quantidade e o preço para adicionar ao pedido.
              </p>
            </div>

            <form onSubmit={handleAddItem} className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                {/* Filtro por Marca (Opcional) */}
                {availableBrands.length > 0 && (
                  <div className="sm:col-span-6 xl:col-span-2">
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Marca
                    </label>
                    <select
                      value={productBrandFilter}
                      onChange={(e) => setProductBrandFilter(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs"
                    >
                      <option value="ALL">Todas as marcas</option>
                      {availableBrands.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Buscar por nome ou código */}
                <div className={`sm:col-span-6 ${availableBrands.length > 0 ? 'xl:col-span-3' : 'xl:col-span-3'}`}>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Buscar por nome ou código
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        if (!isProductDropdownOpen) setIsProductDropdownOpen(true);
                      }}
                      onFocus={() => setIsProductDropdownOpen(true)}
                      placeholder="Digite o nome ou código..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Selecionar Produto com Dropdown de Resultados */}
                <div className={`sm:col-span-12 ${availableBrands.length > 0 ? 'xl:col-span-3' : 'xl:col-span-4'} relative`} ref={productDropdownRef}>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Produto
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
                    className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl px-3.5 py-2.5 text-left text-xs font-semibold text-slate-800 flex items-center justify-between transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  >
                    <span className="truncate">
                      {currentProduct ? currentProduct.name : 'Selecione um produto'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-1.5" />
                  </button>

                  {/* Menu suspenso de busca de produtos */}
                  {isProductDropdownOpen && (
                    <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 animate-in fade-in zoom-in-95 space-y-1 max-h-60 overflow-y-auto">
                      {filteredProducts.length === 0 ? (
                        <div className="py-4 text-center text-xs text-slate-400">
                          Nenhum produto encontrado
                        </div>
                      ) : (
                        filteredProducts.map((p) => {
                          const isSelected = p.id === selectedProductId;
                          const clientHist = customerNegotiatedSummary.find((c) => c.productId === p.id);
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                handleProductChange(p.id);
                                setIsProductDropdownOpen(false);
                              }}
                              className={`w-full p-2.5 rounded-lg text-left flex items-center justify-between text-xs transition-colors ${
                                isSelected ? 'bg-blue-50 text-blue-900 font-bold' : 'hover:bg-slate-50 text-slate-800'
                              }`}
                            >
                              <div className="truncate pr-2 flex-1">
                                <div className="flex items-center space-x-1.5">
                                  <span className="truncate font-semibold">{p.name}</span>
                                  {clientHist && (
                                    <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                                      Último: {formatCurrency(clientHist.lastPrice)}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                  {formatCurrency(p.selling_price)} • Estoque: {p.current_stock} {p.unit}
                                </span>
                              </div>
                              {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-2" />}
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* Quantidade */}
                <div className="sm:col-span-4 xl:col-span-2">
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Quantidade
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => handleQuantityOrPriceChange(Math.max(1, Number(e.target.value)), unitPrice)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-center text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  />
                </div>

                {/* Preço unitário (R$) */}
                <div className="sm:col-span-4 xl:col-span-3">
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Preço unitário (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={unitPrice}
                      onChange={(e) => handleQuantityOrPriceChange(quantity, Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs"
                    />
                  </div>
                </div>

                {/* Botão Adicionar ao Pedido */}
                <div className="sm:col-span-4 xl:col-span-12 xl:w-auto xl:ml-auto">
                  <button
                    type="submit"
                    disabled={!selectedProductId || quantity <= 0}
                    className="w-full xl:w-auto px-5 py-2.5 bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-40 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar ao pedido</span>
                  </button>
                </div>
              </div>

              {/* Informações de Estoque e Link para Histórico */}
              {currentProduct && (
                <div className="flex items-center justify-between text-xs pt-1 text-slate-600">
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] text-slate-500">Estoque:</span>
                    <span className={`font-bold text-xs px-2 py-0.5 rounded-full border ${
                      currentProduct.current_stock > 0
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200/60'
                        : currentProduct.current_stock < 0
                        ? 'text-rose-700 bg-rose-50 border-rose-200/60'
                        : 'text-slate-600 bg-slate-100 border-slate-200'
                    }`}>
                      {currentProduct.current_stock} {currentProduct.unit || 'UN'}
                    </span>
                  </div>

                  {selectedCustomerId ? (
                    <button
                      type="button"
                      onClick={() => setShowCustomerHistory(!showCustomerHistory)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center space-x-1 cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5 text-blue-600" />
                      <span>{showCustomerHistory ? 'Ocultar histórico de negociação' : 'Ver histórico e preço mínimo'}</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showCustomerHistory ? 'rotate-180 text-blue-800' : ''}`} />
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">
                      Selecione um cliente para ver o histórico de negociações anteriores
                    </span>
                  )}
                </div>
              )}

              {/* Trava de Preço Mínimo com Autorização de Gerente */}
              {isBelowMinPrice && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2 text-xs text-red-900">
                  <div className="flex items-start space-x-2">
                    <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">
                        Preço Abaixo do Mínimo Permitido!
                      </span>
                      <p className="text-[11px] text-red-700 mt-0.5">
                        O preço informado (R$ {effectiveUnitPrice.toFixed(2)}) é inferior ao preço mínimo cadastrado ({formatCurrency(currentProduct?.min_price)}).
                      </p>
                    </div>
                  </div>

                  {canAuthorizeBelowMinPrice ? (
                    <div className="p-2 bg-white/80 rounded-lg border border-red-100 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-700">
                        Como <strong>{user?.role}</strong>, você tem autonomia para autorizar essa margem.
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full">
                        AUTORIZAÇÃO GERENCIAL ATIVA
                      </span>
                    </div>
                  ) : managerAuthorized ? (
                    <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center justify-between text-emerald-800">
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
                    <div className="p-2.5 bg-white rounded-lg border border-red-200 space-y-2">
                      <div className="flex items-center space-x-2 text-slate-700">
                        <Lock className="w-3.5 h-3.5 text-amber-600" />
                        <span className="text-[11px] font-bold">Solicitar Autorização da Gerência:</span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Identificação do Gerente (ex: Autorizado por Carlos)"
                          value={managerNotes}
                          onChange={(e) => setManagerNotes(e.target.value)}
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!managerNotes.trim()) {
                              alert('Por favor, informe a identificação da autorização.');
                              return;
                            }
                            setManagerAuthorized(true);
                          }}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer"
                        >
                          Liberar Item
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Histórico de Negociação do Cliente para o Produto Selecionado */}
              {showCustomerHistory && selectedCustomerId && currentProduct && (
                <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <CustomerProductPriceHistory
                    customerId={selectedCustomerId}
                    productId={currentProduct.id}
                    currentProduct={currentProduct}
                    proposedPrice={unitPrice}
                    onApplyPrice={(price) => {
                      handleQuantityOrPriceChange(quantity, price);
                    }}
                  />
                </div>
              )}
            </form>
          </div>

          {/* CARD 3: PRODUTOS DO PEDIDO (Tabela interativa como na imagem de referência) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {/* Cabeçalho da seção */}
            <div className="p-4 sm:p-5 pb-3 flex items-center justify-between border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Produtos do pedido</h3>
                <span className="text-xs text-slate-500">
                  {cartItems.length} {cartItems.length === 1 ? 'produto' : 'produtos'} • {totalUnits} {totalUnits === 1 ? 'unidade' : 'unidades'}
                </span>
              </div>

              {cartItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCartItems([])}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Limpar pedido</span>
                </button>
              )}
            </div>

            {/* Tabela de Produtos */}
            {cartItems.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <ShoppingCart className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-medium">Nenhum produto adicionado ao pedido</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Use o formulário acima para buscar e incluir itens</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-slate-500 font-semibold text-[11px] border-b border-slate-100">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Produto</th>
                      <th className="py-2.5 px-3 font-semibold">Estoque</th>
                      <th className="py-2.5 px-3 font-semibold text-center">Quantidade</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Preço unitário (R$)</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Total (R$)</th>
                      <th className="py-2.5 px-3 font-semibold text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cartItems.map((item, idx) => {
                      const prod = products.find((p) => p.id === item.product_id);
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          {/* Produto */}
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block">
                              {prod?.name || 'Produto'}
                            </span>
                            {prod?.brand && (
                              <span className="text-[10px] text-slate-400 block">
                                {prod.brand} {prod.sku ? `• SKU ${prod.sku}` : ''}
                              </span>
                            )}
                          </td>

                          {/* Estoque */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="text-emerald-700 font-medium text-[11px] bg-emerald-50 px-2 py-0.5 rounded-full">
                              {prod ? `${prod.current_stock} ${prod.unit || 'un'}` : '-'}
                            </span>
                          </td>

                          {/* Quantidade com botões [-] Qty [+] */}
                          <td className="py-3 px-3">
                            <div className="flex items-center justify-center space-x-1.5">
                              <button
                                type="button"
                                onClick={() => updateCartItemQuantity(idx, item.quantity - 1)}
                                className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer shadow-2xs"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateCartItemQuantity(idx, parseInt(e.target.value, 10) || 1)}
                                className="w-14 h-8 text-center font-bold text-sm border border-slate-200 rounded-lg bg-white text-slate-900 shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                              />
                              <button
                                type="button"
                                onClick={() => updateCartItemQuantity(idx, item.quantity + 1)}
                                className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer shadow-2xs"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                          {/* Preço Unitário Editável Diretamente */}
                          <td className="py-3 px-3 text-right">
                            <div className="inline-flex items-center space-x-1">
                              <span className="text-xs font-semibold text-slate-400">R$</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.unit_price}
                                onChange={(e) => updateCartItemPrice(idx, parseFloat(e.target.value) || 0)}
                                className="w-28 text-right font-black text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-900 shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                              />
                            </div>
                          </td>

                          {/* Total Calculado */}
                          <td className="py-3 px-3 text-right font-black text-slate-900 whitespace-nowrap">
                            {formatCurrency(item.total)}
                          </td>

                          {/* Ações (Lixeira) */}
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              title="Remover produto"
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Rodapé expansível: Histórico de compras do cliente */}
            {selectedCustomerId && currentProduct && (
              <div className="border-t border-slate-100 bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setShowCustomerHistory(!showCustomerHistory)}
                  className="w-full px-4 py-3 text-left flex items-center justify-between text-xs font-semibold text-slate-700 hover:bg-slate-100/60 transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <History className="w-4 h-4 text-slate-500" />
                    <span>Histórico de compras do cliente</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showCustomerHistory ? 'rotate-180' : ''}`} />
                </button>

                {showCustomerHistory && (
                  <div className="p-4 pt-1 border-t border-slate-100 bg-white animate-in fade-in">
                    <CustomerProductPriceHistory
                      customerId={selectedCustomerId}
                      productId={selectedProductId}
                      currentProduct={currentProduct}
                      proposedPrice={unitPrice}
                      onApplyPrice={(price) => {
                        setUnitPrice(price);
                        setDiscount(0);
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Coluna Direita: Resumo do Pedido Fixo (Conforme imagem de referência) */}
        <div className="lg:col-span-4 sticky top-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              Resumo do pedido
            </h3>

            {/* Linhas de Resumo */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Subtotal ({cartItems.length} {cartItems.length === 1 ? 'produto' : 'produtos'} • {totalUnits} {totalUnits === 1 ? 'unidade' : 'unidades'})</span>
                <span className="font-bold text-slate-900">{formatCurrency(subtotal)}</span>
              </div>

              {/* Desconto */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-600">Desconto</span>
                <div className="flex items-center space-x-1">
                  <span className="text-[11px] text-slate-400 font-semibold">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={orderDiscount}
                    onChange={(e) => setOrderDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-24 text-right font-bold text-xs border border-slate-200 rounded-lg px-2 py-1 bg-slate-50 text-red-600 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-slate-600 pt-1">
                <span>Total de produtos</span>
                <span className="font-bold text-slate-900">{formatCurrency(subtotal)}</span>
              </div>
            </div>

            {/* Forma de Pagamento - Seletor Personalizado Moderno */}
            <div className="pt-3 border-t border-slate-100 space-y-1.5">
              <label className="block text-[11px] font-medium text-slate-600">
                Forma de pagamento
              </label>
              <div className="relative" ref={paymentDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsPaymentDropdownOpen(!isPaymentDropdownOpen)}
                  className="w-full bg-slate-50 hover:bg-slate-100/90 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all flex items-center justify-between text-left shadow-2xs"
                >
                  <div className="flex items-center space-x-2 truncate pr-1">
                    {paymentMethod.toLowerCase().includes('pix') ? (
                      <QrCode className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : paymentMethod.toLowerCase().includes('dinheiro') ? (
                      <Banknote className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : paymentMethod.toLowerCase().includes('cartão') ? (
                      <CreditCard className="w-4 h-4 text-blue-600 shrink-0" />
                    ) : paymentMethod.toLowerCase().includes('boleto') ? (
                      <FileText className="w-4 h-4 text-slate-600 shrink-0" />
                    ) : (
                      <CalendarDays className="w-4 h-4 text-indigo-600 shrink-0" />
                    )}
                    <span className="truncate">{paymentMethod}</span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${isPaymentDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Customizado de Pagamento */}
                {isPaymentDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1.5 animate-in fade-in zoom-in-95 space-y-0.5">
                    {[
                      { name: 'Pix à vista', icon: QrCode, color: 'text-emerald-600', type: 'A_VISTA' },
                      { name: 'Dinheiro', icon: Banknote, color: 'text-emerald-600', type: 'A_VISTA' },
                      { name: 'Cartão de Débito', icon: CreditCard, color: 'text-blue-600', type: 'A_VISTA' },
                      { name: 'Cartão de Crédito', icon: CreditCard, color: 'text-blue-600', type: 'A_VISTA' },
                      { name: 'Boleto Bancário', icon: FileText, color: 'text-slate-600', type: 'A_VISTA' },
                      { name: 'À Prazo (Conta a Receber)', icon: CalendarDays, color: 'text-indigo-600', type: 'A_PRAZO', badge: '1 parcela' },
                      { name: 'Parcelado (Múltiplas Parcelas)', icon: CalendarDays, color: 'text-indigo-600', type: 'PARCELADO', badge: 'Até 36x' },
                    ].map((opt) => {
                      const isSelected = paymentMethod === opt.name;
                      const IconComponent = opt.icon;
                      return (
                        <button
                          key={opt.name}
                          type="button"
                          onClick={() => {
                            setPaymentMethod(opt.name);
                            setPaymentType(opt.type as any);
                            setIsPaymentDropdownOpen(false);
                          }}
                          className={`w-full px-2.5 py-2 rounded-lg text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'bg-blue-50 text-blue-800'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <IconComponent className={`w-3.5 h-3.5 shrink-0 ${opt.color}`} />
                            <span className="truncate">{opt.name}</span>
                          </div>
                          <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                            {opt.badge && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                                {opt.badge}
                              </span>
                            )}
                            {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

              {/* Condições de parcelas se for a prazo */}
              {paymentType !== 'A_VISTA' && (
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2 mt-2 text-xs">
                  <div className="flex items-center justify-between text-blue-900 font-bold text-[11px]">
                    <span>Condições a Prazo</span>
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px]">
                      {paymentType === 'A_PRAZO' ? '1 parcela' : `${customInstallments.length}x`}
                    </span>
                  </div>

                  {paymentType === 'PARCELADO' && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[1, 2, 3, 4, 5, 6, 10, 12].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setInstallmentsCount(num)}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            installmentsCount === num
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {num}x
                        </button>
                      ))}
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                      1º Vencimento
                    </label>
                    <input
                      type="date"
                      value={firstDueDate}
                      onChange={(e) => setFirstDueDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800"
                    />
                  </div>
                </div>
              )}

            {/* Observações (Opcional) - Expansível */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowNotes(!showNotes)}
                className="w-full flex items-center justify-between text-xs text-slate-600 hover:text-slate-900 transition-colors"
              >
                <span>Observações (opcional)</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showNotes ? 'rotate-180' : ''}`} />
              </button>

              {showNotes && (
                <div className="mt-2 animate-in fade-in">
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Instruções de entrega, observações do cliente..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            {/* Total da Venda em Destaque (Como na imagem) */}
            <div className="pt-4 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-medium block">Total da venda</span>
              <div className="text-2xl sm:text-3xl font-black text-blue-600 tracking-tight mt-0.5">
                {formatCurrency(grandTotal)}
              </div>
              {totalCommission > 0 && (
                <span className="text-[11px] text-emerald-600 font-semibold block mt-1">
                  Comissão calculada: {formatCurrency(totalCommission)}
                </span>
              )}
            </div>

            {/* Botões Principais da Venda */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                disabled={cartItems.length === 0 || isSuccess}
                onClick={handleFinishSale}
                className="w-full py-3.5 px-4 bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-all shadow-md active:scale-98 flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>Finalizar venda</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                disabled={cartItems.length === 0 || isSuccess}
                onClick={handleSaveQuote}
                className="w-full py-2.5 px-4 border border-slate-200 hover:bg-slate-50 disabled:opacity-40 text-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Salvar rascunho / orçamento</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Pós-Venda Automático com Pré-visualização do Comprovante */}
      {completedSale && (
        <SaleReceiptModal
          sale={completedSale}
          isInitialSuccess={true}
          onClose={() => {
            setCompletedSale(null);
            router.push('/vendas');
          }}
        />
      )}

      {/* Modal Moderno de Sucesso ao Salvar Orçamento */}
      {savedQuoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform animate-in zoom-in-95 duration-200">
            {/* Topo decorativo */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white text-center relative">
              <button
                type="button"
                onClick={() => {
                  setSavedQuoteModal(null);
                  router.push('/vendas');
                }}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-3 shadow-inner">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-black tracking-tight">Orçamento Salvo!</h3>
              <p className="text-xs text-blue-100 mt-1">
                Proposta #{savedQuoteModal.sale_number} registrada com sucesso no sistema.
              </p>
            </div>

            {/* Corpo do Resumo */}
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Cliente</span>
                  <span className="font-bold text-slate-900">
                    {savedQuoteModal.customer?.trade_name || savedQuoteModal.customer?.name || 'Consumidor Final (Sem cliente)'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Profissional / Vendedor</span>
                  <span className="font-bold text-slate-800">
                    {savedQuoteModal.professional?.name || 'Vendas Internas'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Quantidade de Itens</span>
                  <span className="font-bold text-slate-800">
                    {savedQuoteModal.items?.length || 0} {(savedQuoteModal.items?.length || 0) === 1 ? 'item' : 'itens'}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200/70 flex justify-between items-center">
                  <span className="text-slate-700 font-bold text-xs">Total do Orçamento</span>
                  <span className="text-base font-black text-blue-700">
                    {formatCurrency(savedQuoteModal.total)}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/60 flex items-start space-x-2.5">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Este orçamento <strong>não reservou estoque</strong> nem movimentou o caixa. Você pode consultá-lo, editá-lo ou convertê-lo em venda a qualquer momento no <strong>Histórico de Vendas</strong>.
                </p>
              </div>

              {/* Botões de Ação */}
              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSavedQuoteModal(null);
                    setCartItems([]);
                    setNotes('');
                  }}
                  className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all text-center cursor-pointer"
                >
                  Novo Pedido
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSavedQuoteModal(null);
                    router.push('/vendas');
                  }}
                  className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 text-center flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <span>Ver Orçamentos</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Completo de Todos os Produtos Já Negociados com Este Cliente */}
      {showCustomerAllHistoryModal && currentCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95">
            {/* Topo do Modal */}
            <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200/80 flex items-center justify-center shrink-0">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Histórico de Produtos de {currentCustomer.trade_name || currentCustomer.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {customerNegotiatedSummary.length} {customerNegotiatedSummary.length === 1 ? 'produto diferente já negociado' : 'produtos diferentes já negociados'} com este cliente
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCustomerAllHistoryModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Barra de Pesquisa de Produtos do Histórico */}
            <div className="p-4 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={customerHistorySearch}
                  onChange={(e) => setCustomerHistorySearch(e.target.value)}
                  placeholder="Pesquisar produto pelo nome ou marca no histórico..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Conteúdo / Tabela de Produtos */}
            <div className="overflow-y-auto flex-1 p-4 divide-y divide-slate-100">
              {(() => {
                const q = customerHistorySearch.trim().toLowerCase();
                const filtered = customerNegotiatedSummary.filter(
                  (item) => !q || item.productName.toLowerCase().includes(q) || (item.brand && item.brand.toLowerCase().includes(q))
                );

                if (filtered.length === 0) {
                  return (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      <p className="font-semibold text-slate-600">Nenhum produto encontrado na busca.</p>
                    </div>
                  );
                }

                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[620px]">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-100">
                        <tr>
                          <th className="py-2.5 px-3">Produto</th>
                          <th className="py-2.5 px-3 text-right">Preço de Tabela</th>
                          <th className="py-2.5 px-3 text-right text-indigo-700">Último Preço</th>
                          <th className="py-2.5 px-3 text-right">Mín / Máx Negociado</th>
                          <th className="py-2.5 px-3 text-center">Compras</th>
                          <th className="py-2.5 px-3 text-center">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filtered.map((item) => (
                          <tr key={item.productId} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-3">
                              <span className="font-bold text-slate-900 block truncate max-w-[240px]">
                                {item.productName}
                              </span>
                              <span className="text-[10px] text-slate-400 block">
                                {item.brand ? `Marca: ${item.brand} • ` : ''}Pedido #{item.lastSaleNumber} ({new Date(item.lastSaleDate).toLocaleDateString('pt-BR')})
                              </span>
                            </td>

                            <td className="py-3 px-3 text-right font-medium text-slate-400 line-through">
                              {formatCurrency(item.catalogPrice)}
                            </td>

                            <td className="py-3 px-3 text-right font-black text-indigo-600 text-xs">
                              {formatCurrency(item.lastPrice)}
                            </td>

                            <td className="py-3 px-3 text-right text-slate-600 text-[11px]">
                              {formatCurrency(item.minPrice)} / {formatCurrency(item.maxPrice)}
                            </td>

                            <td className="py-3 px-3 text-center text-slate-600">
                              <span className="font-bold text-slate-800">{item.timesPurchased}x</span>
                              <span className="text-[10px] text-slate-400 block">({item.totalPurchasedQty} {item.unit})</span>
                            </td>

                            <td className="py-3 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedProductId(item.productId);
                                  handleQuantityOrPriceChange(quantity || 1, item.lastPrice);
                                  setShowCustomerAllHistoryModal(false);
                                  setShowCustomerHistory(true);
                                }}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center space-x-1 mx-auto active:scale-95"
                              >
                                <span>Usar este produto e preço</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>

            {/* Rodapé do Modal */}
            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50/50">
              <button
                type="button"
                onClick={() => setShowCustomerAllHistoryModal(false)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
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

export default function NovaVendaPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Carregando tela de negociação...</div>}>
      <NovaVendaForm />
    </Suspense>
  );
}
