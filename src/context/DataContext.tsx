'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Customer, Product, Sale, PriceHistorySummary, PriceHistoryRecord, Professional, CommissionRecord } from '@/types/database';
import {
  DEMO_CUSTOMERS,
  DEMO_PRODUCTS,
  DEMO_SALES,
  DEMO_PRICE_HISTORY_MAP,
  DEMO_PROFESSIONALS,
  DEMO_COMMISSION_RECORDS,
} from '@/lib/mockData';
import { useAuth } from './AuthContext';

export interface AppNotification {
  id: string;
  type: 'PRICE_ALERT' | 'MIN_PRICE' | 'STOCK_ALERT' | 'SALE_COMPLETED' | 'COMMISSION_ALERT';
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
  professionals: Professional[];
  commissions: CommissionRecord[];
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  getPriceHistory: (customerId: string, productId: string) => PriceHistorySummary;
  addCustomer: (customer: Omit<Customer, 'id' | 'company_id' | 'created_at' | 'updated_at'>) => Customer;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  addProduct: (product: Omit<Product, 'id' | 'company_id' | 'created_at' | 'updated_at'>) => Product;
  updateProduct: (id: string, product: Partial<Product>) => void;
  adjustStock: (productId: string, quantityChange: number, reason: string) => void;
  addProfessional: (prof: Omit<Professional, 'id' | 'company_id' | 'created_at' | 'updated_at'>) => Professional;
  updateProfessional: (id: string, prof: Partial<Professional>) => void;
  deactivateProfessional: (id: string) => void;
  createSale: (saleData: {
    customer_id: string;
    professional_id?: string;
    items: Array<{
      product_id: string;
      quantity: number;
      unit_price: number;
      discount: number;
      total: number;
      commission_type_snapshot?: 'NONE' | 'PERCENTAGE' | 'FIXED';
      commission_value_snapshot?: number;
      commission_amount?: number;
    }>;
    payment_method_id?: string;
    notes?: string;
  }) => Sale;
  cancelSale: (id: string) => void;
  markCommissionAsPaid: (commissionId: string, paidAmount?: number, notes?: string) => void;
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
  {
    id: 'notif-4',
    type: 'COMMISSION_ALERT',
    title: 'Nova Comissão Gerada',
    message: 'Carlos Vendedor Master gerou R$ 65,80 em comissões na Venda #1001.',
    timestamp: 'Há 4 horas',
    read: false,
    link: '/financeiro',
  },
];

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user, company } = useAuth();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [commissions, setCommissions] = useState<CommissionRecord[]>([]);
  const [priceHistoryMap, setPriceHistoryMap] = useState<Record<string, PriceHistorySummary>>({});
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Chave prefixada para isolamento estrito entre empresas (Multi-Tenant)
  const tenantKey = company?.id ? `_tenant_${company.id}` : '';
  const isDemoCompany = !company || company.id === 'a0000000-0000-0000-0000-000000000001' || company.id === 'demo-company';

  // Carregar dados de acordo com a empresa atual (persistência segura por tenant)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const key = tenantKey;
    const isDemo = isDemoCompany;

    const savedCust = localStorage.getItem(`negociapro_customers${key}`);
    const savedProd = localStorage.getItem(`negociapro_products${key}`);
    const savedSales = localStorage.getItem(`negociapro_sales${key}`);
    const savedProfs = localStorage.getItem(`negociapro_professionals${key}`);
    const savedComms = localStorage.getItem(`negociapro_commissions${key}`);
    const savedHist = localStorage.getItem(`negociapro_history${key}`);
    const savedNotifs = localStorage.getItem(`negociapro_notifications${key}`);

    if (savedCust) {
      try { setCustomers(JSON.parse(savedCust)); } catch {}
    } else {
      // Se for a empresa demo original e não tem dados salvos, usa demo. Se for empresa nova, começa zerada.
      setCustomers(isDemo ? DEMO_CUSTOMERS : []);
    }

    if (savedProd) {
      try { setProducts(JSON.parse(savedProd)); } catch {}
    } else {
      setProducts(isDemo ? DEMO_PRODUCTS : []);
    }

    // Se a empresa possui ID real (como Ração mais barato ltda), carregar produtos reais do Supabase / API
    if (company?.id && !isDemo) {
      fetch(`/api/products?company_id=${company.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.products && data.products.length > 0) {
            setProducts(data.products);
            localStorage.setItem(`negociapro_products${key}`, JSON.stringify(data.products));
          }
        })
        .catch(() => {
          // Fallback caso esteja offline: verificar se há arquivo estático disponível para esta empresa
          if (company.name?.toLowerCase().includes('ração mais barato') || company.id === '2bcee844-9475-4175-ae47-e0f6f53dbb09') {
            fetch('/racao_mais_barato_products.json')
              .then((r) => r.json())
              .then((cachedList) => {
                if (Array.isArray(cachedList) && cachedList.length > 0) {
                  setProducts(cachedList);
                  localStorage.setItem(`negociapro_products${key}`, JSON.stringify(cachedList));
                }
              })
              .catch(() => {});
          }
        });
    }

    if (savedSales) {
      try { setSales(JSON.parse(savedSales)); } catch {}
    } else {
      setSales(isDemo ? DEMO_SALES : []);
    }

    if (savedProfs) {
      try {
        const parsedProfs: Professional[] = JSON.parse(savedProfs);
        // Se a empresa não for demo, expurgar profissionais demo caso tenham sido herdados no passado
        if (!isDemo) {
          const sanitized = parsedProfs.filter(p => p.company_id !== 'a0000000-0000-0000-0000-000000000001' && p.id !== 'prof-01' && p.id !== 'prof-02');
          setProfessionals(sanitized);
        } else {
          setProfessionals(parsedProfs);
        }
      } catch {
        setProfessionals(isDemo ? DEMO_PROFESSIONALS : []);
      }
    } else {
      setProfessionals(isDemo ? DEMO_PROFESSIONALS : []);
    }

    if (savedComms) {
      try { setCommissions(JSON.parse(savedComms)); } catch {}
    } else {
      setCommissions(isDemo ? DEMO_COMMISSION_RECORDS : []);
    }

    if (savedHist) {
      try { setPriceHistoryMap(JSON.parse(savedHist)); } catch {}
    } else {
      setPriceHistoryMap(isDemo ? DEMO_PRICE_HISTORY_MAP : {});
    }

    if (savedNotifs) {
      try { setNotifications(JSON.parse(savedNotifs)); } catch {}
    } else {
      setNotifications(isDemo ? DEMO_NOTIFICATIONS : []);
    }
  }, [tenantKey, isDemoCompany, company?.id]);

  const saveNotifications = (data: AppNotification[]) => {
    setNotifications(data);
    localStorage.setItem(`negociapro_notifications${tenantKey}`, JSON.stringify(data));
  };

  const markNotificationAsRead = (id: string) => {
    const updated = notifications.map(n => (n.id === id ? { ...n, read: true } : n));
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
    localStorage.setItem(`negociapro_customers${tenantKey}`, JSON.stringify(data));
  };

  const saveProd = (data: Product[]) => {
    setProducts(data);
    localStorage.setItem(`negociapro_products${tenantKey}`, JSON.stringify(data));
  };

  const saveSalesState = (data: Sale[]) => {
    setSales(data);
    localStorage.setItem(`negociapro_sales${tenantKey}`, JSON.stringify(data));
  };

  const saveProfsState = (data: Professional[]) => {
    setProfessionals(data);
    localStorage.setItem(`negociapro_professionals${tenantKey}`, JSON.stringify(data));
  };

  const saveCommsState = (data: CommissionRecord[]) => {
    setCommissions(data);
    localStorage.setItem(`negociapro_commissions${tenantKey}`, JSON.stringify(data));
  };

  const saveHistoryState = (map: Record<string, PriceHistorySummary>) => {
    setPriceHistoryMap(map);
    localStorage.setItem(`negociapro_history${tenantKey}`, JSON.stringify(map));
  };

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

  const deleteCustomer = (id: string) => {
    const updated = customers.filter(c => c.id !== id);
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

  // Módulo de Profissionais
  const addProfessional = (profData: Omit<Professional, 'id' | 'company_id' | 'created_at' | 'updated_at'>): Professional => {
    const newProf: Professional = {
      ...profData,
      id: `prof-${Date.now()}`,
      company_id: company?.id || 'demo-company',
      active: true,
      sales_count: 0,
      total_sales: 0,
      commission_earned: 0,
      commission_paid: 0,
      commission_pending: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const updated = [newProf, ...professionals];
    saveProfsState(updated);
    return newProf;
  };

  const updateProfessional = (id: string, updatedFields: Partial<Professional>) => {
    const updated = professionals.map(p => (p.id === id ? { ...p, ...updatedFields, updated_at: new Date().toISOString() } : p));
    saveProfsState(updated);
  };

  const deactivateProfessional = (id: string) => {
    const updated = professionals.map(p => (p.id === id ? { ...p, active: false, updated_at: new Date().toISOString() } : p));
    saveProfsState(updated);
  };

  // Finalização da Venda com Snapshot de Comissão e Vinculação de Profissional
  const createSale = (saleData: {
    customer_id: string;
    professional_id?: string;
    items: Array<{
      product_id: string;
      quantity: number;
      unit_price: number;
      discount: number;
      total: number;
      commission_type_snapshot?: 'NONE' | 'PERCENTAGE' | 'FIXED';
      commission_value_snapshot?: number;
      commission_amount?: number;
    }>;
    payment_method_id?: string;
    notes?: string;
  }): Sale => {
    const subtotal = saleData.items.reduce((acc, item) => acc + item.quantity * item.unit_price, 0);
    const discount = saleData.items.reduce((acc, item) => acc + item.discount, 0);
    const total = subtotal - discount;

    // Calcular comissão total por item (com base nas regras do produto ou snapshot enviado)
    let totalSaleCommission = 0;
    const enrichedItems = saleData.items.map((item, idx) => {
      const prod = products.find(p => p.id === item.product_id);
      const cType = item.commission_type_snapshot || prod?.commission_type || 'NONE';
      const cVal = item.commission_value_snapshot !== undefined ? item.commission_value_snapshot : (prod?.commission_value || 0);

      let itemCommission = 0;
      if (saleData.professional_id && cType !== 'NONE') {
        if (cType === 'PERCENTAGE') {
          itemCommission = Number(((item.total * cVal) / 100).toFixed(2));
        } else if (cType === 'FIXED') {
          itemCommission = Number((item.quantity * cVal).toFixed(2));
        }
      }
      totalSaleCommission += itemCommission;

      return {
        id: `si-${Date.now()}-${idx}`,
        sale_id: '',
        company_id: company?.id || 'demo-company',
        product_id: item.product_id,
        product: prod,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount,
        total: item.total,
        commission_type_snapshot: cType,
        commission_value_snapshot: cVal,
        commission_amount: itemCommission,
      };
    });

    const currentCustomer = customers.find(c => c.id === saleData.customer_id);
    const selectedProf = professionals.find(p => p.id === saleData.professional_id);
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
      professional_id: saleData.professional_id || null,
      professional: selectedProf,
      sale_number: saleNumber,
      status: 'COMPLETED',
      subtotal,
      discount,
      total,
      commission_total: Number(totalSaleCommission.toFixed(2)),
      notes: saleData.notes,
      sold_at: nowIso,
      created_at: nowIso,
      updated_at: nowIso,
      items: enrichedItems.map(i => ({ ...i, sale_id: saleId })),
    };

    // 1. Atualizar vendas
    const newSales = [createdSale, ...sales];
    saveSalesState(newSales);

    // 2. Criar registro de comissão se houver profissional e comissão > 0
    if (selectedProf && totalSaleCommission > 0) {
      const newCommission: CommissionRecord = {
        id: `comm-${Date.now()}`,
        company_id: company?.id || 'demo-company',
        professional_id: selectedProf.id,
        professional_name: selectedProf.name,
        sale_id: saleId,
        sale_number: saleNumber,
        customer_id: currentCustomer?.id,
        customer_name: currentCustomer?.name,
        sale_date: nowIso,
        sale_total: total,
        commission_amount: Number(totalSaleCommission.toFixed(2)),
        status: 'PENDENTE',
        created_at: nowIso,
        updated_at: nowIso,
      };
      const updatedComms = [newCommission, ...commissions];
      saveCommsState(updatedComms);

      // Atualizar métricas acumuladas do profissional
      const updatedProfs = professionals.map(p => {
        if (p.id === selectedProf.id) {
          return {
            ...p,
            sales_count: (p.sales_count || 0) + 1,
            total_sales: (p.total_sales || 0) + total,
            commission_earned: (p.commission_earned || 0) + totalSaleCommission,
            commission_pending: (p.commission_pending || 0) + totalSaleCommission,
            updated_at: nowIso,
          };
        }
        return p;
      });
      saveProfsState(updatedProfs);
    }

    // 3. Atualizar métricas do cliente
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

    // 4. Atualizar estoque dos produtos
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

    // 5. REGISTRAR NO HISTÓRICO DE PREÇOS
    const newHistoryMap = { ...priceHistoryMap };

    saleData.items.forEach(item => {
      const key = `${saleData.customer_id}_${item.product_id}`;
      const effectiveUnitPrice = item.unit_price - item.discount / item.quantity;

      const newRecord: PriceHistoryRecord = {
        id: `hist-${Date.now()}-${item.product_id}`,
        company_id: company?.id || 'demo-company',
        customer_id: saleData.customer_id,
        product_id: item.product_id,
        sale_id: saleId,
        seller_id: user?.id || 'demo-user',
        seller_name: selectedProf ? selectedProf.name : user?.name || 'Vendedor',
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
        last_seller_name: selectedProf ? selectedProf.name : user?.name || 'Vendedor',
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

    // Cancelar comissão correspondente
    const updatedComms = commissions.map(c => {
      if (c.sale_id === id) {
        return { ...c, status: 'CANCELADA' as const, updated_at: new Date().toISOString() };
      }
      return c;
    });
    saveCommsState(updatedComms);
  };

  const markCommissionAsPaid = (commissionId: string, paidAmount?: number, notes?: string) => {
    const nowIso = new Date().toISOString();
    let targetProfId: string | null = null;
    let finalAmount = 0;

    const updatedComms = commissions.map(c => {
      if (c.id === commissionId) {
        targetProfId = c.professional_id;
        finalAmount = paidAmount !== undefined ? paidAmount : c.commission_amount;
        return {
          ...c,
          status: 'PAGA' as const,
          paid_at: nowIso,
          paid_by_name: user?.name || 'Administrador',
          paid_amount: finalAmount,
          notes: notes ? `${c.notes ? c.notes + ' • ' : ''}${notes}` : c.notes,
          updated_at: nowIso,
        };
      }
      return c;
    });
    saveCommsState(updatedComms);

    if (targetProfId) {
      const updatedProfs = professionals.map(p => {
        if (p.id === targetProfId) {
          return {
            ...p,
            commission_paid: (p.commission_paid || 0) + finalAmount,
            commission_pending: Math.max(0, (p.commission_pending || 0) - finalAmount),
            updated_at: nowIso,
          };
        }
        return p;
      });
      saveProfsState(updatedProfs);
    }
  };

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  return (
    <DataContext.Provider
      value={{
        customers,
        products,
        sales,
        professionals,
        commissions,
        notifications,
        unreadNotificationsCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        addNotification,
        getPriceHistory,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addProduct,
        updateProduct,
        adjustStock,
        addProfessional,
        updateProfessional,
        deactivateProfessional,
        createSale,
        cancelSale,
        markCommissionAsPaid,
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
