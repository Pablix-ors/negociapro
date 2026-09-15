'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Customer, Product, Sale, PriceHistorySummary, PriceHistoryRecord } from '@/types/database';
import { DEMO_CUSTOMERS, DEMO_PRODUCTS, DEMO_SALES, DEMO_PRICE_HISTORY_MAP } from '@/lib/mockData';
import { useAuth } from './AuthContext';

export interface AppNotification {
  id: string;
  type: 'PRICE_ALERT' | 'MIN_PRICE' | 'STOCK_ALERT' | 'SALE_COMPLETED';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
}

interface DataContextType {
  customers: Customer[];
  products: Product[];
  sales: Sale[];
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  getPriceHistory: (customerId: string, productId: string) => PriceHistorySummary;
  addCustomer: (customer: Omit<Customer, 'id' | 'company_id' | 'created_at' | 'updated_at'>) => Customer;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  addProduct: (product: Omit<Product, 'id' | 'company_id' | 'created_at' | 'updated_at'>) => Product;
  updateProduct: (id: string, product: Partial<Product>) => void;
  adjustStock: (productId: string, quantityChange: number, reason: string) => void;
  createSale: (saleData: {
    customer_id: string;
    items: Array<{
      product_id: string;
      quantity: number;
      unit_price: number;
      discount: number;
      total: number;
    }>;
    payment_method_id?: string;
    notes?: string;
  }) => Sale;
  cancelSale: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const DEMO_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    type: 'PRICE_ALERT',
    title: 'Alerta de Negociação: Cimento CP II 50kg',
    message: 'João da Silva Santos recebeu proposta de R$ 32,90 (abaixo da tabela de R$ 36,90).',
    timestamp: 'Há 15 minutos',
    read: false,
    link: '/vendas/nova',
  },
  {
    id: 'notif-2',
    type: 'STOCK_ALERT',
    title: 'Alerta de Estoque Crítico',
    message: 'Argamassa AC-II 20kg atingiu 20 SC (estoque mínimo é 50 SC).',
    timestamp: 'Há 1 hora',
    read: false,
    link: '/produtos',
  },
  {
    id: 'notif-3',
    type: 'SALE_COMPLETED',
    title: 'Venda Concluída #1002',
    message: 'Venda de R$ 5.475,00 para Construtora Alfa Engenharia finalizada.',
    timestamp: 'Há 3 horas',
    read: true,
    link: '/vendas',
  },
];

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user, company } = useAuth();
  const isDemo = !user || user.email === 'admin@negociapro.com.br';

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [priceHistoryMap, setPriceHistoryMap] = useState<Record<string, PriceHistorySummary>>({});
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Carregar dados de acordo com o usuário (conta nova = zerada; conta demo = mock)
  useEffect(() => {
    const isDemoUser = !user || user.email === 'admin@negociapro.com.br';

    const savedCust = localStorage.getItem('negociapro_customers');
    const savedProd = localStorage.getItem('negociapro_products');
    const savedSales = localStorage.getItem('negociapro_sales');
    const savedHist = localStorage.getItem('negociapro_history');
    const savedNotifs = localStorage.getItem('negociapro_notifications');

    if (savedCust) {
      try { setCustomers(JSON.parse(savedCust)); } catch {}
    } else {
      setCustomers(isDemoUser ? DEMO_CUSTOMERS : []);
    }

    if (savedProd) {
      try { setProducts(JSON.parse(savedProd)); } catch {}
    } else {
      setProducts(isDemoUser ? DEMO_PRODUCTS : []);
    }

    if (savedSales) {
      try { setSales(JSON.parse(savedSales)); } catch {}
    } else {
      setSales(isDemoUser ? DEMO_SALES : []);
    }

    if (savedHist) {
      try { setPriceHistoryMap(JSON.parse(savedHist)); } catch {}
    } else {
      setPriceHistoryMap(isDemoUser ? DEMO_PRICE_HISTORY_MAP : {});
    }

    if (savedNotifs) {
      try { setNotifications(JSON.parse(savedNotifs)); } catch {}
    } else {
      setNotifications(isDemoUser ? DEMO_NOTIFICATIONS : []);
    }
  }, [user]);

  const saveNotifications = (data: AppNotification[]) => {
    setNotifications(data);
    localStorage.setItem('negociapro_notifications', JSON.stringify(data));
  };

  const markNotificationAsRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    saveNotifications(updated);
  };

  const markAllNotificationsAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    saveNotifications(updated);
  };

  const addNotification = (item: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: AppNotification = {
      ...item,
      id: `notif-${Date.now()}`,
      timestamp: 'Agora',
      read: false,
    };
    const updated = [newNotif, ...notifications];
    saveNotifications(updated);
  };

  const saveCust = (data: Customer[]) => {
    setCustomers(data);
    localStorage.setItem('negociapro_customers', JSON.stringify(data));
  };

  const saveProd = (data: Product[]) => {
    setProducts(data);
    localStorage.setItem('negociapro_products', JSON.stringify(data));
  };

  const saveSalesState = (data: Sale[]) => {
    setSales(data);
    localStorage.setItem('negociapro_sales', JSON.stringify(data));
  };

  const saveHistoryState = (map: Record<string, PriceHistorySummary>) => {
    setPriceHistoryMap(map);
    localStorage.setItem('negociapro_history', JSON.stringify(map));
  };

  // Consulta do histórico com cálculo de indicadores principais
  const getPriceHistory = (customerId: string, productId: string): PriceHistorySummary => {
    const key = `${customerId}_${productId}`;
    if (priceHistoryMap[key]) {
      return priceHistoryMap[key];
    }
    return {
      last_price: null,
      last_negotiation_date: null,
      last_quantity: null,
      last_seller_name: null,
      min_price: null,
      max_price: null,
      avg_price: null,
      history: [],
    };
  };

  const addCustomer = (customerData: Omit<Customer, 'id' | 'company_id' | 'created_at' | 'updated_at'>): Customer => {
    const newCustomer: Customer = {
      ...customerData,
      id: `cust-${Date.now()}`,
      company_id: company?.id || 'demo-company',
      active: true,
      total_purchased: 0,
      orders_count: 0,
      last_purchase_date: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const updated = [newCustomer, ...customers];
    saveCust(updated);
    return newCustomer;
  };

  const updateCustomer = (id: string, updatedFields: Partial<Customer>) => {
    const updated = customers.map(c => (c.id === id ? { ...c, ...updatedFields, updated_at: new Date().toISOString() } : c));
    saveCust(updated);
  };

  const addProduct = (productData: Omit<Product, 'id' | 'company_id' | 'created_at' | 'updated_at'>): Product => {
    const newProd: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
      company_id: company?.id || 'demo-company',
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const updated = [newProd, ...products];
    saveProd(updated);
    return newProd;
  };

  const updateProduct = (id: string, updatedFields: Partial<Product>) => {
    const updated = products.map(p => (p.id === id ? { ...p, ...updatedFields, updated_at: new Date().toISOString() } : p));
    saveProd(updated);
  };

  const adjustStock = (productId: string, quantityChange: number, reason: string) => {
    const updated = products.map(p => {
      if (p.id === productId) {
        const newStock = Math.max(0, p.current_stock + quantityChange);
        return {
          ...p,
          current_stock: newStock,
          updated_at: new Date().toISOString(),
        };
      }
      return p;
    });
    saveProd(updated);
  };

  // Finalização da Venda: Gravação da venda e geração automática e indelével de histórico de preços
  const createSale = (saleData: {
    customer_id: string;
    items: Array<{
      product_id: string;
      quantity: number;
      unit_price: number;
      discount: number;
      total: number;
    }>;
    payment_method_id?: string;
    notes?: string;
  }): Sale => {
    const subtotal = saleData.items.reduce((acc, item) => acc + item.quantity * item.unit_price, 0);
    const discount = saleData.items.reduce((acc, item) => acc + item.discount, 0);
    const total = subtotal - discount;

    const currentCustomer = customers.find(c => c.id === saleData.customer_id);
    const saleNumber = 1000 + sales.length + 1;
    const saleId = `sale-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const createdSale: Sale = {
      id: saleId,
      company_id: company?.id || 'demo-company',
      customer_id: saleData.customer_id,
      customer: currentCustomer,
      seller_id: user?.id || 'demo-user',
      seller: user || undefined,
      sale_number: saleNumber,
      status: 'COMPLETED',
      subtotal,
      discount,
      total,
      notes: saleData.notes,
      sold_at: nowIso,
      created_at: nowIso,
      updated_at: nowIso,
      items: saleData.items.map((item, idx) => ({
        id: `si-${Date.now()}-${idx}`,
        sale_id: saleId,
        company_id: company?.id || 'demo-company',
        product_id: item.product_id,
        product: products.find(p => p.id === item.product_id),
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount,
        total: item.total,
      })),
    };

    // 1. Atualizar vendas
    const newSales = [createdSale, ...sales];
    saveSalesState(newSales);

    // 2. Atualizar métricas do cliente
    const updatedCustomers = customers.map(c => {
      if (c.id === saleData.customer_id) {
        return {
          ...c,
          total_purchased: (c.total_purchased || 0) + total,
          orders_count: (c.orders_count || 0) + 1,
          last_purchase_date: nowIso,
        };
      }
      return c;
    });
    saveCust(updatedCustomers);

    // 3. Atualizar estoque dos produtos
    const updatedProducts = products.map(p => {
      const soldItem = saleData.items.find(i => i.product_id === p.id);
      if (soldItem) {
        return {
          ...p,
          current_stock: Math.max(0, p.current_stock - soldItem.quantity),
        };
      }
      return p;
    });
    saveProd(updatedProducts);

    // 4. REGISTRAR NO HISTÓRICO DE PREÇOS (Core Feature do NegociaPro)
    const newHistoryMap = { ...priceHistoryMap };

    saleData.items.forEach(item => {
      const key = `${saleData.customer_id}_${item.product_id}`;
      const effectiveUnitPrice = item.unit_price - (item.discount / item.quantity);

      const newRecord: PriceHistoryRecord = {
        id: `hist-${Date.now()}-${item.product_id}`,
        company_id: company?.id || 'demo-company',
        customer_id: saleData.customer_id,
        product_id: item.product_id,
        sale_id: saleId,
        seller_id: user?.id || 'demo-user',
        seller_name: user?.name || 'Vendedor',
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount,
        final_unit_price: effectiveUnitPrice,
        total_price: item.total,
        negotiation_date: nowIso,
        notes: `Venda #${saleNumber}`,
      };

      const existing = newHistoryMap[key] || {
        last_price: null,
        last_negotiation_date: null,
        last_quantity: null,
        last_seller_name: null,
        min_price: null,
        max_price: null,
        avg_price: null,
        history: [],
      };

      const updatedHistoryList = [newRecord, ...existing.history];
      const prices = updatedHistoryList.map(h => h.final_unit_price);
      const minP = Math.min(...prices);
      const maxP = Math.max(...prices);
      const avgP = prices.reduce((a, b) => a + b, 0) / prices.length;

      newHistoryMap[key] = {
        last_price: effectiveUnitPrice,
        last_negotiation_date: nowIso,
        last_quantity: item.quantity,
        last_seller_name: user?.name || 'Vendedor',
        min_price: minP,
        max_price: maxP,
        avg_price: Number(avgP.toFixed(2)),
        history: updatedHistoryList,
      };
    });

    saveHistoryState(newHistoryMap);

    return createdSale;
  };

  const cancelSale = (id: string) => {
    const updated = sales.map(s => {
      if (s.id === id) {
        return { ...s, status: 'CANCELLED' as const, updated_at: new Date().toISOString() };
      }
      return s;
    });
    saveSalesState(updated);
  };

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  return (
    <DataContext.Provider
      value={{
        customers,
        products,
        sales,
        notifications,
        unreadNotificationsCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        addNotification,
        getPriceHistory,
        addCustomer,
        updateCustomer,
        addProduct,
        updateProduct,
        adjustStock,
        createSale,
        cancelSale,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData deve ser usado dentro de um DataProvider');
  }
  return context;
}
