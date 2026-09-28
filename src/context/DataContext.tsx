'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Customer,
  Product,
  Sale,
  PriceHistorySummary,
  PriceHistoryRecord,
  Professional,
  CommissionRecord,
  ReceiptSettings,
  DEFAULT_RECEIPT_SETTINGS,
  AccountReceivable,
  PaymentReceiptRecord,
  CashMovement,
  CashRegisterSession,
  ReceivableStatus,
  SaleAuditLog,
} from '@/types/database';
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
  receiptSettings: ReceiptSettings;
  updateReceiptSettings: (settings: Partial<ReceiptSettings>) => void;
  // Financeiro & Contas a Receber
  receivables: AccountReceivable[];
  paymentReceipts: PaymentReceiptRecord[];
  cashSession: CashRegisterSession | null;
  cashSessionsHistory: CashRegisterSession[];
  cashMovements: CashMovement[];
  receivePayment: (params: {
    receivable_id: string;
    amount: number;
    payment_method: string;
    payment_date?: string;
    notes?: string;
  }) => { success: boolean; message?: string };
  renegotiateReceivable: (params: {
    receivable_id: string;
    new_installments: Array<{ due_date: string; amount: number }>;
    reason: string;
  }) => void;
  cancelReceivable: (receivable_id: string, reason: string) => void;
  // Gestão de Caixa
  openCashRegister: (params: {
    name?: string;
    initial_balance: number;
    notes?: string;
  }) => CashRegisterSession;
  addCashMovement: (params: {
    type: 'ENTRADA' | 'SAÍDA';
    category: 'SUPRIMENTO' | 'SANGRIA' | 'DESPESA' | 'AJUSTE_POSITIVO' | 'AJUSTE_NEGATIVO';
    description: string;
    amount: number;
    payment_method: string;
    notes?: string;
  }) => CashMovement;
  closeCashRegister: (params: {
    counted_balance: number;
    notes?: string;
  }) => CashRegisterSession;
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
  deleteProduct: (id: string) => void;
  bulkUpdateProducts: (ids: string[], updates: Partial<Product>) => Promise<void>;
  bulkDeleteProducts: (ids: string[]) => Promise<void>;
  bulkImportProducts: (
    newProducts: Array<Omit<Product, 'id' | 'company_id' | 'created_at' | 'updated_at'>>,
    updateProducts: Array<{ id: string } & Partial<Product>>
  ) => { added: number; updated: number };
  adjustStock: (productId: string, quantityChange: number, reason: string) => void;
  addProfessional: (prof: Omit<Professional, 'id' | 'company_id' | 'created_at' | 'updated_at'>) => Professional;
  updateProfessional: (id: string, prof: Partial<Professional>) => void;
  deactivateProfessional: (id: string) => void;
  deleteProfessional: (id: string) => void;
  saleAuditLogs: SaleAuditLog[];
  createSale: (saleData: {
    customer_id?: string | null;
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
    payment_method_name?: string;
    payment_type?: 'A_VISTA' | 'A_PRAZO' | 'PARCELADO';
    installments_plan?: Array<{
      number: number;
      due_date: string;
      amount: number;
    }>;
    notes?: string;
    status?: 'COMPLETED' | 'QUOTE';
    converted_from_quote_id?: string | null;
  }) => Sale;
  convertQuoteToSale: (quoteId: string, options?: {
    customer_id?: string | null;
    professional_id?: string | null;
    items?: Array<{
      product_id: string;
      quantity: number;
      unit_price: number;
      discount: number;
      total: number;
      commission_type_snapshot?: 'NONE' | 'PERCENTAGE' | 'FIXED';
      commission_value_snapshot?: number;
      commission_amount?: number;
    }>;
    payment_method_name?: string;
    payment_type?: 'A_VISTA' | 'A_PRAZO' | 'PARCELADO';
    installments_plan?: Array<{
      number: number;
      due_date: string;
      amount: number;
    }>;
    notes?: string;
  }) => Sale | null;
  updateFinishedSale: (params: {
    sale_id: string;
    saleData: {
      customer_id?: string | null;
      professional_id?: string | null;
      payment_method_name?: string;
      payment_type?: 'A_VISTA' | 'A_PRAZO' | 'PARCELADO';
      installments_plan?: Array<{
        number: number;
        due_date: string;
        amount: number;
      }>;
      notes?: string;
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
    };
    reason?: string;
  }) => { success: boolean; sale?: Sale; message?: string };
  cancelSale: (id: string, reason?: string) => void;
  deleteSale: (idOrSaleNumber: string | number) => void;
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
  const [receiptSettings, setReceiptSettings] = useState<ReceiptSettings>(DEFAULT_RECEIPT_SETTINGS);

  // Estados Financeiros & Caixa
  const [receivables, setReceivables] = useState<AccountReceivable[]>([]);
  const [paymentReceipts, setPaymentReceipts] = useState<PaymentReceiptRecord[]>([]);
  const [cashSession, setCashSession] = useState<CashRegisterSession | null>(null);
  const [cashSessionsHistory, setCashSessionsHistory] = useState<CashRegisterSession[]>([]);
  const [cashMovements, setCashMovements] = useState<CashMovement[]>([]);
  const [saleAuditLogs, setSaleAuditLogs] = useState<SaleAuditLog[]>([]);

  // Chave prefixada para isolamento estrito entre empresas (Multi-Tenant)
  const tenantKey = company?.id ? `_tenant_${company.id}` : '';
  const isDemoCompany = React.useMemo(
    () => !company || company.id === 'a0000000-0000-0000-0000-000000000001' || company.id === 'demo-company',
    [company?.id] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Helper seguro para localStorage (evita travar a aplicação caso atinja a cota do navegador de 5MB)
  const safeSetItem = (key: string, value: string) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch (err) {
      console.warn(`[Storage] Aviso: Não foi possível salvar dados em cache para "${key}":`, err);
    }
  };

  // Carregar dados de acordo com a empresa atual (persistência segura por tenant)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const key = tenantKey;
    const isDemo = isDemoCompany;

    try {
      const savedCust = localStorage.getItem(`negociapro_customers${key}`);
      if (savedCust) {
        const parsedCust = JSON.parse(savedCust);
        if (Array.isArray(parsedCust)) {
          // Se for empresa real, filtra qualquer cliente de demo antigo que possa ter ficado no cache do navegador
          const cleanCust = isDemo
            ? parsedCust
            : parsedCust.filter((c) => !c.id.startsWith('cust-0') && c.company_id === company?.id);
          setCustomers(cleanCust);
        } else {
          setCustomers(isDemo ? DEMO_CUSTOMERS : []);
        }
      } else {
        setCustomers(isDemo ? DEMO_CUSTOMERS : []);
      }
    } catch {
      setCustomers(isDemo ? DEMO_CUSTOMERS : []);
    }

    try {
      const savedProd = localStorage.getItem(`negociapro_products${key}`);
      if (savedProd) {
        const parsedProd = JSON.parse(savedProd);
        if (Array.isArray(parsedProd) && parsedProd.length > 0) {
          setProducts(parsedProd);
        } else {
          setProducts(isDemo ? DEMO_PRODUCTS : []);
        }
      } else {
        setProducts(isDemo ? DEMO_PRODUCTS : []);
      }
    } catch {
      setProducts(isDemo ? DEMO_PRODUCTS : []);
    }

    // Se a empresa possui ID real (ex: Ração mais barato ltda ou criada pelo usuário), carregar dados reais do Supabase / API
    if (company?.id && !isDemo) {
      // 1. Produtos
      fetch(`/api/products?company_id=${company.id}`)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((data) => {
          if (data && data.success && Array.isArray(data.products) && data.products.length > 0) {
            setProducts(data.products);
            safeSetItem(`negociapro_products${key}`, JSON.stringify(data.products));
          } else {
            // Se o endpoint retornou vazio, tenta o arquivo estático de produtos da empresa
            fetch('/racao_mais_barato_products.json')
              .then((r) => (r.ok ? r.json() : null))
              .then((cachedList) => {
                if (Array.isArray(cachedList) && cachedList.length > 0) {
                  setProducts(cachedList);
                  safeSetItem(`negociapro_products${key}`, JSON.stringify(cachedList));
                }
              })
              .catch(() => {});
          }
        })
        .catch(() => {
          // Fallback caso esteja offline: verificar se há arquivo estático disponível para esta empresa
          fetch('/racao_mais_barato_products.json')
            .then((r) => {
              if (!r.ok) throw new Error(`HTTP ${r.status}`);
              return r.json();
            })
            .then((cachedList) => {
              if (Array.isArray(cachedList) && cachedList.length > 0) {
                setProducts(cachedList);
                safeSetItem(`negociapro_products${key}`, JSON.stringify(cachedList));
              }
            })
            .catch(() => {});
        });

      // 2. Clientes
      fetch(`/api/customers?company_id=${company.id}`)
        .then((res) => (res.ok ? res.json() : null))
        .then(async (data) => {
          if (data && data.success && Array.isArray(data.customers)) {
            let serverCustomers: Customer[] = data.customers;

            // Se no cache local houver clientes pendentes com ID provisório (cust-*), sincronizar com o banco
            const localRaw = localStorage.getItem(`negociapro_customers${key}`);
            if (localRaw) {
              try {
                const localList: Customer[] = JSON.parse(localRaw);
                const pending = localList.filter((c) => c.id?.startsWith('cust-'));
                for (const pend of pending) {
                  const alreadySaved = serverCustomers.some(
                    (sc) => sc.document && sc.document.replace(/\D/g, '') === pend.document.replace(/\D/g, '')
                  );
                  if (!alreadySaved) {
                    try {
                      const pushRes = await fetch('/api/customers', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ company_id: company.id, customer: pend }),
                      });
                      const pushData = await pushRes.json();
                      if (pushData.success && pushData.customer) {
                        serverCustomers = [pushData.customer, ...serverCustomers];
                      }
                    } catch {}
                  }
                }
              } catch {}
            }

            setCustomers(serverCustomers);
            safeSetItem(`negociapro_customers${key}`, JSON.stringify(serverCustomers));
          }
        })
        .catch(() => {});

      // 3. Profissionais
      fetch(`/api/professionals?company_id=${company.id}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.success && Array.isArray(data.professionals)) {
            setProfessionals(data.professionals);
            safeSetItem(`negociapro_professionals${key}`, JSON.stringify(data.professionals));
          }
        })
        .catch(() => {});

      // 4. Vendas
      fetch(`/api/sales?company_id=${company.id}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.success && Array.isArray(data.sales)) {
            setSales((prev) => {
              // 1. Mapear vendas do servidor por ID e por sale_number
              const serverSalesMap = new Map(data.sales.map((ss: Sale) => [ss.id, ss]));
              const serverSaleNumbers = new Set(data.sales.map((ss: Sale) => Number(ss.sale_number)));

              const merged = data.sales.map((serverSale: Sale) => {
                const existing = prev.find((p) => p.id === serverSale.id);
                if (existing && (!serverSale.items || serverSale.items.length === 0) && existing.items && existing.items.length > 0) {
                  return { ...serverSale, items: existing.items };
                }
                return serverSale;
              });

              // 2. Preservar APENAS:
              //   a) Orçamentos locais (QUOTE) com ID temporário cujo sale_number ainda não chegou no servidor
              //   b) Vendas locais marcadas como _pendingSync=true (POST ainda em andamento / falhou e será retentado)
              // NUNCA preservar vendas locais COMPLETED sem _pendingSync — causam duplicatas (bug Ivan)
              const localOnly = prev.filter((p: any) =>
                !serverSalesMap.has(p.id) &&
                !serverSaleNumbers.has(Number(p.sale_number)) &&
                (p.status === 'QUOTE' || p._pendingSync === true)
              );

              // 3. Retentar POST de vendas pendentes que não chegaram ao servidor
              localOnly
                .filter((p: any) => p._pendingSync === true && p.status !== 'QUOTE' && company?.id && !isDemoCompany)
                .forEach((pendingSale: any) => {
                  fetch('/api/sales', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      company_id: company!.id,
                      sale: pendingSale,
                      items: pendingSale.items || [],
                    }),
                  })
                    .then((res) => (res.ok ? res.json() : null))
                    .then((retryData) => {
                      if (retryData?.success && retryData.sale) {
                        const serverSale = retryData.sale;
                        setSales((prev2) => {
                          const withoutDup = prev2.filter(
                            (s) => s.id !== pendingSale.id && Number(s.sale_number) !== Number(serverSale.sale_number)
                          );
                          const merged2 = [{ ...pendingSale, ...serverSale, _pendingSync: undefined }, ...withoutDup];
                          safeSetItem(`negociapro_sales${key}`, JSON.stringify(merged2));
                          return merged2;
                        });
                        console.info('[NegociaPro] Venda pendente sincronizada com sucesso:', serverSale.sale_number);
                      }
                    })
                    .catch(() => { /* silencioso — tentará novamente no próximo ciclo */ });
                });

              const fullMerged = [...localOnly, ...merged];

              safeSetItem(`negociapro_sales${key}`, JSON.stringify(fullMerged));
              return fullMerged;
            });
          }
        })
        .catch(() => {});
    }

    try {
      const savedSales = localStorage.getItem(`negociapro_sales${key}`);
      if (savedSales) {
        const parsedSales = JSON.parse(savedSales);
        if (Array.isArray(parsedSales)) {
          // Filtrar apenas vendas de demonstração antigas que possam ter vazado para o cache real.
          // NÃO filtrar por prefixo de ID ('sale-0') pois vendas legítimas com sync ainda pendente
          // usam o padrão 'sale-TIMESTAMP' — descartá-las causa o bug de vendas sumindo (Yanna).
          const cleanSales = isDemo
            ? parsedSales
            : parsedSales.filter((s: any) =>
                s.company_id === company?.id &&
                s.id !== 'sale-01' && s.id !== 'sale-02' && s.id !== 'sale-03' &&
                s.id !== 'sale-04' && s.id !== 'sale-05' // apenas IDs de demo hard-coded
              );
          setSales(cleanSales);
        } else {
          setSales(isDemo ? DEMO_SALES : []);
        }
      } else {
        setSales(isDemo ? DEMO_SALES : []);
      }
    } catch {
      setSales(isDemo ? DEMO_SALES : []);
    }

    try {
      const savedProfs = localStorage.getItem(`negociapro_professionals${key}`);
      if (savedProfs) {
        const parsedProfs: Professional[] = JSON.parse(savedProfs);
        if (!isDemo) {
          const sanitized = parsedProfs.filter(p => p.company_id !== 'a0000000-0000-0000-0000-000000000001' && p.id !== 'prof-01' && p.id !== 'prof-02');
          setProfessionals(sanitized);
        } else {
          setProfessionals(parsedProfs);
        }
      } else {
        setProfessionals(isDemo ? DEMO_PROFESSIONALS : []);
      }
    } catch {
      setProfessionals(isDemo ? DEMO_PROFESSIONALS : []);
    }

    try {
      const savedComms = localStorage.getItem(`negociapro_commissions${key}`);
      if (savedComms) {
        const parsedComms: CommissionRecord[] = JSON.parse(savedComms);
        if (!isDemo && Array.isArray(parsedComms)) {
          const sanitized = parsedComms.filter(
            (c) =>
              c.company_id === company?.id &&
              c.id !== 'comm-01' &&
              c.id !== 'comm-02' &&
              c.id !== 'comm-03'
          );
          setCommissions(sanitized);
        } else {
          setCommissions(Array.isArray(parsedComms) ? parsedComms : isDemo ? DEMO_COMMISSION_RECORDS : []);
        }
      } else {
        setCommissions(isDemo ? DEMO_COMMISSION_RECORDS : []);
      }
    } catch {
      setCommissions(isDemo ? DEMO_COMMISSION_RECORDS : []);
    }

    try {
      const savedHist = localStorage.getItem(`negociapro_history${key}`);
      if (savedHist) {
        setPriceHistoryMap(JSON.parse(savedHist));
      } else {
        setPriceHistoryMap(isDemo ? DEMO_PRICE_HISTORY_MAP : {});
      }
    } catch {
      setPriceHistoryMap(isDemo ? DEMO_PRICE_HISTORY_MAP : {});
    }

    try {
      const savedNotifs = localStorage.getItem(`negociapro_notifications${key}`);
      if (savedNotifs) {
        setNotifications(JSON.parse(savedNotifs));
      } else {
        setNotifications(isDemo ? DEMO_NOTIFICATIONS : []);
      }
    } catch {
      setNotifications(isDemo ? DEMO_NOTIFICATIONS : []);
    }

    try {
      const savedReceipt = localStorage.getItem(`negociapro_receipt_settings${key}`);
      if (savedReceipt) {
        setReceiptSettings({ ...DEFAULT_RECEIPT_SETTINGS, ...JSON.parse(savedReceipt) });
      } else {
        setReceiptSettings(DEFAULT_RECEIPT_SETTINGS);
      }
    } catch {
      setReceiptSettings(DEFAULT_RECEIPT_SETTINGS);
    }

    // 5. Contas a Receber
    try {
      const savedReceivables = localStorage.getItem(`negociapro_receivables${key}`);
      if (savedReceivables) {
        const parsed: AccountReceivable[] = JSON.parse(savedReceivables);
        // Atualizar status de vencimento dinamicamente
        const todayStr = new Date().toISOString().split('T')[0];
        const refreshed = parsed.map((r) => {
          if (r.status === 'PAID' || r.status === 'CANCELLED' || r.status === 'RENEGOTIATED') return r;
          if (r.due_date < todayStr) {
            return { ...r, status: r.paid_amount > 0 ? ('PARTIALLY_PAID' as const) : ('OVERDUE' as const) };
          }
          if (r.due_date === todayStr) {
            return { ...r, status: r.paid_amount > 0 ? ('PARTIALLY_PAID' as const) : ('DUE_TODAY' as const) };
          }
          return { ...r, status: r.paid_amount > 0 ? ('PARTIALLY_PAID' as const) : ('OPEN' as const) };
        });
        setReceivables(refreshed);
      } else {
        if (isDemo) {
          const today = new Date();
          const dToday = today.toISOString().split('T')[0];
          const dOverdue = new Date(today.getTime() - 5 * 86400000).toISOString().split('T')[0];
          const dFuture1 = new Date(today.getTime() + 15 * 86400000).toISOString().split('T')[0];
          const dFuture2 = new Date(today.getTime() + 45 * 86400000).toISOString().split('T')[0];

          const demoRecs: AccountReceivable[] = [
            {
              id: 'rec-demo-01',
              company_id: company?.id || 'demo-company',
              sale_id: 'sale-01',
              sale_number: 1042,
              customer_id: 'cust-01',
              customer_name: 'Supermercado Progresso Ltda',
              customer_document: '12.345.678/0001-90',
              installment_number: 1,
              total_installments: 3,
              due_date: dOverdue,
              original_amount: 400,
              discount_amount: 0,
              interest_amount: 0,
              paid_amount: 0,
              balance: 400,
              status: 'OVERDUE',
              payment_method_predicted: 'Boleto',
              created_at: new Date(Date.now() - 35 * 86400000).toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: 'rec-demo-02',
              company_id: company?.id || 'demo-company',
              sale_id: 'sale-01',
              sale_number: 1042,
              customer_id: 'cust-01',
              customer_name: 'Supermercado Progresso Ltda',
              customer_document: '12.345.678/0001-90',
              installment_number: 2,
              total_installments: 3,
              due_date: dToday,
              original_amount: 400,
              discount_amount: 0,
              interest_amount: 0,
              paid_amount: 0,
              balance: 400,
              status: 'DUE_TODAY',
              payment_method_predicted: 'Boleto',
              created_at: new Date(Date.now() - 35 * 86400000).toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: 'rec-demo-03',
              company_id: company?.id || 'demo-company',
              sale_id: 'sale-01',
              sale_number: 1042,
              customer_id: 'cust-01',
              customer_name: 'Supermercado Progresso Ltda',
              customer_document: '12.345.678/0001-90',
              installment_number: 3,
              total_installments: 3,
              due_date: dFuture1,
              original_amount: 400,
              discount_amount: 0,
              interest_amount: 0,
              paid_amount: 0,
              balance: 400,
              status: 'OPEN',
              payment_method_predicted: 'Boleto',
              created_at: new Date(Date.now() - 35 * 86400000).toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: 'rec-demo-04',
              company_id: company?.id || 'demo-company',
              sale_id: 'sale-02',
              sale_number: 1043,
              customer_id: 'cust-02',
              customer_name: 'Drogaria Saúde & Bem-Estar',
              customer_document: '98.765.432/0001-10',
              installment_number: 1,
              total_installments: 1,
              due_date: dFuture2,
              original_amount: 1500,
              discount_amount: 0,
              interest_amount: 0,
              paid_amount: 500,
              balance: 1000,
              status: 'PARTIALLY_PAID',
              payment_method_predicted: 'À Prazo',
              created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
              updated_at: new Date().toISOString(),
            },
          ];
          setReceivables(demoRecs);
          safeSetItem(`negociapro_receivables${key}`, JSON.stringify(demoRecs));
        } else {
          setReceivables([]);
        }
      }
    } catch {
      setReceivables([]);
    }

    // 6. Recibos de Pagamento
    try {
      const savedReceipts = localStorage.getItem(`negociapro_payment_receipts${key}`);
      setPaymentReceipts(savedReceipts ? JSON.parse(savedReceipts) : []);
    } catch {
      setPaymentReceipts([]);
    }

    // 7. Sessão Ativa de Caixa
    try {
      const savedCashSession = localStorage.getItem(`negociapro_cash_session${key}`);
      if (savedCashSession) {
        setCashSession(JSON.parse(savedCashSession));
      } else {
        // Se for demo e não tiver caixa, abrir caixa inicial demonstrativo
        if (isDemo) {
          const demoSession: CashRegisterSession = {
            id: 'cash-demo-01',
            company_id: company?.id || 'demo-company',
            name: 'Caixa Principal',
            opened_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
            opened_by_user_id: user?.id || 'demo-user',
            opened_by_name: user?.name || 'Administrador',
            initial_balance: 200,
            total_inflows: 0,
            total_outflows: 0,
            expected_balance: 200,
            status: 'OPEN',
            notes: 'Abertura de caixa para demonstração',
          };
          setCashSession(demoSession);
          safeSetItem(`negociapro_cash_session${key}`, JSON.stringify(demoSession));
        } else {
          setCashSession(null);
        }
      }
    } catch {
      setCashSession(null);
    }

    // 8. Histórico de Fechamentos de Caixa
    try {
      const savedCashHistory = localStorage.getItem(`negociapro_cash_history${key}`);
      setCashSessionsHistory(savedCashHistory ? JSON.parse(savedCashHistory) : []);
    } catch {
      setCashSessionsHistory([]);
    }

    // 9. Movimentações de Caixa
    try {
      const savedMovements = localStorage.getItem(`negociapro_cash_movements${key}`);
      setCashMovements(savedMovements ? JSON.parse(savedMovements) : []);
    } catch {
      setCashMovements([]);
    }

    // 10. Auditoria de Vendas
    try {
      const savedAudit = localStorage.getItem(`negociapro_sale_audit${key}`);
      setSaleAuditLogs(savedAudit ? JSON.parse(savedAudit) : []);
    } catch {
      setSaleAuditLogs([]);
    }
  }, [tenantKey, company?.id]); // isDemoCompany já depende de company?.id via useMemo

  const updateReceiptSettings = (partial: Partial<ReceiptSettings>) => {
    setReceiptSettings((prev) => {
      const updated = { ...prev, ...partial };
      safeSetItem(`negociapro_receipt_settings${tenantKey}`, JSON.stringify(updated));
      return updated;
    });
  };

  // Sincronização periódica e em tempo real entre múltiplos navegadores e abas
  useEffect(() => {
    if (!company?.id || isDemoCompany || typeof window === 'undefined') return;

    let isMounted = true;

    const refreshLiveServerData = () => {
      if (!isMounted || document.visibilityState === 'hidden') return;

      // Sincronizar clientes
      fetch(`/api/customers?company_id=${company.id}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (isMounted && data?.success && Array.isArray(data.customers)) {
            setCustomers((prev) => {
              if (
                prev.length !== data.customers.length ||
                data.customers.some((sc: Customer, idx: number) => sc.id !== prev[idx]?.id)
              ) {
                safeSetItem(`negociapro_customers${tenantKey}`, JSON.stringify(data.customers));
                return data.customers;
              }
              return prev;
            });
          }
        })
        .catch(() => {});

      // Sincronizar produtos
      fetch(`/api/products?company_id=${company.id}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (isMounted && data?.success && Array.isArray(data.products) && data.products.length > 0) {
            setProducts((prev) => {
              if (
                prev.length !== data.products.length ||
                data.products.some(
                  (sp: Product, idx: number) =>
                    sp.id !== prev[idx]?.id ||
                    sp.current_stock !== prev[idx]?.current_stock ||
                    sp.selling_price !== prev[idx]?.selling_price
                )
              ) {
                safeSetItem(`negociapro_products${tenantKey}`, JSON.stringify(data.products));
                return data.products;
              }
              return prev;
            });
          }
        })
        .catch(() => {});

      // Sincronizar vendas
      fetch(`/api/sales?company_id=${company.id}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (isMounted && data?.success && Array.isArray(data.sales)) {
            setSales((prev) => {
              // Fazer merge inteligente preservando os itens da venda se prev tiver itens e data.sales não
              const serverSalesMap = new Map(data.sales.map((ss: Sale) => [ss.id, ss]));
              const serverSaleNumbers = new Set(data.sales.map((ss: Sale) => Number(ss.sale_number)));

              const mergedSales = data.sales.map((serverSale: Sale) => {
                const existing = prev.find((p) => p.id === serverSale.id);
                if (existing && (!serverSale.items || serverSale.items.length === 0) && existing.items && existing.items.length > 0) {
                  return { ...serverSale, items: existing.items };
                }
                return serverSale;
              });

              // Preservar APENAS orçamentos locais (QUOTE) ou vendas ainda aguardando confirmação
              // do servidor (_pendingSync=true). Nunca preservar vendas COMPLETED sem essa flag
              // para evitar duplicatas (bug Ivan) e vendas-fantasma ("caçadora").
              const localOnly = prev.filter((p: any) =>
                !serverSalesMap.has(p.id) &&
                !serverSaleNumbers.has(Number(p.sale_number)) &&
                (p.status === 'QUOTE' || p._pendingSync === true)
              );
              const fullMerged = [...localOnly, ...mergedSales];

              safeSetItem(`negociapro_sales${tenantKey}`, JSON.stringify(fullMerged));
              return fullMerged;
            });
          }
        })
        .catch(() => {});
    };

    const intervalId = setInterval(refreshLiveServerData, 5000);
    window.addEventListener('focus', refreshLiveServerData);
    window.addEventListener('visibilitychange', refreshLiveServerData);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      window.removeEventListener('focus', refreshLiveServerData);
      window.removeEventListener('visibilitychange', refreshLiveServerData);
    };
  }, [company?.id, isDemoCompany, tenantKey]);

  const saveNotifications = (data: AppNotification[]) => {
    setNotifications(data);
    safeSetItem(`negociapro_notifications${tenantKey}`, JSON.stringify(data));
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
    safeSetItem(`negociapro_customers${tenantKey}`, JSON.stringify(data));
  };

  const saveProd = (data: Product[]) => {
    setProducts(data);
    safeSetItem(`negociapro_products${tenantKey}`, JSON.stringify(data));
  };

  const saveSalesState = (data: Sale[]) => {
    setSales(data);
    safeSetItem(`negociapro_sales${tenantKey}`, JSON.stringify(data));
  };

  const saveProfsState = (data: Professional[]) => {
    setProfessionals(data);
    safeSetItem(`negociapro_professionals${tenantKey}`, JSON.stringify(data));
  };

  const saveCommsState = (data: CommissionRecord[]) => {
    setCommissions(data);
    safeSetItem(`negociapro_commissions${tenantKey}`, JSON.stringify(data));
  };

  const saveHistoryState = (map: Record<string, PriceHistorySummary>) => {
    setPriceHistoryMap(map);
    safeSetItem(`negociapro_history${tenantKey}`, JSON.stringify(map));
  };

  const saveReceivablesState = (data: AccountReceivable[]) => {
    setReceivables(data);
    safeSetItem(`negociapro_receivables${tenantKey}`, JSON.stringify(data));
  };

  const saveReceiptsState = (data: PaymentReceiptRecord[]) => {
    setPaymentReceipts(data);
    safeSetItem(`negociapro_payment_receipts${tenantKey}`, JSON.stringify(data));
  };

  const saveAuditState = (data: SaleAuditLog[]) => {
    setSaleAuditLogs(data);
    safeSetItem(`negociapro_sale_audit${tenantKey}`, JSON.stringify(data));
  };

  const saveCashSessionState = (session: CashRegisterSession | null) => {
    setCashSession(session);
    if (session) {
      safeSetItem(`negociapro_cash_session${tenantKey}`, JSON.stringify(session));
    } else {
      localStorage.removeItem(`negociapro_cash_session${tenantKey}`);
    }
  };

  const saveCashHistoryState = (history: CashRegisterSession[]) => {
    setCashSessionsHistory(history);
    safeSetItem(`negociapro_cash_history${tenantKey}`, JSON.stringify(history));
  };

  const saveMovementsState = (movements: CashMovement[]) => {
    setCashMovements(movements);
    safeSetItem(`negociapro_cash_movements${tenantKey}`, JSON.stringify(movements));
  };

  // --- MÉTODOS DE CAIXA ---
  const openCashRegister = (params: {
    name?: string;
    initial_balance: number;
    notes?: string;
  }): CashRegisterSession => {
    const nowIso = new Date().toISOString();
    const newSession: CashRegisterSession = {
      id: `cash-${Date.now()}`,
      company_id: company?.id || 'demo-company',
      name: params.name || 'Caixa Principal',
      opened_at: nowIso,
      opened_by_user_id: user?.id || null,
      opened_by_name: user?.name || 'Operador',
      initial_balance: params.initial_balance,
      total_inflows: 0,
      total_outflows: 0,
      expected_balance: params.initial_balance,
      status: 'OPEN',
      notes: params.notes,
    };

    saveCashSessionState(newSession);

    // Movimentação de abertura (saldo inicial)
    const initialMovement: CashMovement = {
      id: `mov-${Date.now()}`,
      company_id: company?.id || 'demo-company',
      cash_session_id: newSession.id,
      timestamp: nowIso,
      type: 'ENTRADA',
      category: 'SALDO_INICIAL',
      description: 'Abertura de Caixa (Saldo Inicial)',
      origin: 'ABERTURA_CAIXA',
      payment_method: 'Dinheiro',
      amount: params.initial_balance,
      current_balance_after: params.initial_balance,
      user_id: user?.id || null,
      user_name: user?.name || 'Operador',
      notes: params.notes,
    };

    saveMovementsState([initialMovement, ...cashMovements]);
    return newSession;
  };

  const addCashMovement = (params: {
    type: 'ENTRADA' | 'SAÍDA';
    category: 'SUPRIMENTO' | 'SANGRIA' | 'DESPESA' | 'AJUSTE_POSITIVO' | 'AJUSTE_NEGATIVO';
    description: string;
    amount: number;
    payment_method: string;
    notes?: string;
  }): CashMovement => {
    const nowIso = new Date().toISOString();
    const currentBal = cashSession?.expected_balance ?? (
      cashMovements.reduce((acc, m) => m.type === 'ENTRADA' ? acc + m.amount : acc - m.amount, 0)
    );
    const newBal = params.type === 'ENTRADA' ? currentBal + params.amount : currentBal - params.amount;

    const newMov: CashMovement = {
      id: `mov-${Date.now()}`,
      company_id: company?.id || 'demo-company',
      cash_session_id: cashSession?.id || 'daily-cash',
      timestamp: nowIso,
      type: params.type,
      category: params.category,
      description: params.description,
      origin: 'MANUAL',
      payment_method: params.payment_method,
      amount: params.amount,
      current_balance_after: Number(newBal.toFixed(2)),
      user_id: user?.id || null,
      user_name: user?.name || 'Operador',
      notes: params.notes,
    };

    // Atualizar saldo esperado na sessão de caixa
    if (cashSession) {
      const updatedSession: CashRegisterSession = {
        ...cashSession,
        total_inflows: params.type === 'ENTRADA' ? cashSession.total_inflows + params.amount : cashSession.total_inflows,
        total_outflows: params.type === 'SAÍDA' ? cashSession.total_outflows + params.amount : cashSession.total_outflows,
        expected_balance: Number(newBal.toFixed(2)),
      };
      saveCashSessionState(updatedSession);
    }

    const updatedMovs = [newMov, ...cashMovements];
    saveMovementsState(updatedMovs);
    return newMov;
  };

  const closeCashRegister = (params: {
    counted_balance: number;
    notes?: string;
  }): CashRegisterSession => {
    if (!cashSession) throw new Error('Não há caixa aberto para fechamento');

    const nowIso = new Date().toISOString();
    const diff = Number((params.counted_balance - cashSession.expected_balance).toFixed(2));
    let diffType: 'CORRECT' | 'SHORTAGE' | 'SURPLUS' = 'CORRECT';
    if (diff < -0.009) diffType = 'SHORTAGE';
    else if (diff > 0.009) diffType = 'SURPLUS';

    const closedSession: CashRegisterSession = {
      ...cashSession,
      closed_at: nowIso,
      closed_by_user_id: user?.id || null,
      closed_by_name: user?.name || 'Operador',
      counted_balance: params.counted_balance,
      difference: diff,
      difference_type: diffType,
      status: 'CLOSED',
      notes: params.notes || cashSession.notes,
    };

    // Adicionar histórico
    saveCashHistoryState([closedSession, ...cashSessionsHistory]);
    saveCashSessionState(null);

    return closedSession;
  };

  // --- MÉTODOS DE CONTAS A RECEBER ---
  const receivePayment = (params: {
    receivable_id: string;
    amount: number;
    payment_method: string;
    payment_date?: string;
    notes?: string;
  }): { success: boolean; message?: string } => {
    const target = receivables.find((r) => r.id === params.receivable_id);
    if (!target) return { success: false, message: 'Conta a receber não encontrada.' };
    if (params.amount <= 0) return { success: false, message: 'Valor recebido deve ser maior que zero.' };

    const nowIso = new Date().toISOString();
    const payDate = params.payment_date || nowIso;
    const newPaidAmount = Number((target.paid_amount + params.amount).toFixed(2));
    const newBalance = Number((target.original_amount + target.interest_amount - target.discount_amount - newPaidAmount).toFixed(2));

    const isFullyPaid = newBalance <= 0.009;
    const newStatus: ReceivableStatus = isFullyPaid ? 'PAID' : 'PARTIALLY_PAID';

    const updatedReceivables = receivables.map((r) => {
      if (r.id === params.receivable_id) {
        return {
          ...r,
          paid_amount: newPaidAmount,
          balance: Math.max(0, newBalance),
          status: newStatus,
          updated_at: nowIso,
        };
      }
      return r;
    });

    saveReceivablesState(updatedReceivables);

    // Criar registro de recebimento
    const receiptRecord: PaymentReceiptRecord = {
      id: `rec-${Date.now()}`,
      company_id: company?.id || 'demo-company',
      receivable_id: target.id,
      sale_id: target.sale_id,
      sale_number: target.sale_number,
      customer_id: target.customer_id,
      customer_name: target.customer_name,
      payment_date: payDate,
      amount_paid: params.amount,
      payment_method: params.payment_method,
      cash_session_id: cashSession?.id || null,
      user_id: user?.id || null,
      user_name: user?.name || 'Operador',
      notes: params.notes,
      created_at: nowIso,
    };

    saveReceiptsState([receiptRecord, ...paymentReceipts]);

    // Lançar movimentação no caixa diário
    const prevBal = cashSession?.expected_balance ?? (
      cashMovements.reduce((acc, m) => m.type === 'ENTRADA' ? acc + m.amount : acc - m.amount, 0)
    );
    const newBal = Number((prevBal + params.amount).toFixed(2));

    const cashMov: CashMovement = {
      id: `mov-${Date.now()}`,
      company_id: company?.id || 'demo-company',
      cash_session_id: cashSession?.id || 'daily-cash',
      timestamp: nowIso,
      type: 'ENTRADA',
      category: 'RECEBIMENTO_CONTA',
      description: `Recebimento Parcela ${target.installment_number}/${target.total_installments} - Venda #${target.sale_number} (${target.customer_name})`,
      origin: 'CONTA_A_RECEBER',
      reference_id: target.id,
      payment_method: params.payment_method,
      amount: params.amount,
      current_balance_after: newBal,
      user_id: user?.id || null,
      user_name: user?.name || 'Operador',
      notes: params.notes,
    };

    saveMovementsState([cashMov, ...cashMovements]);

    if (cashSession) {
      const updatedSession: CashRegisterSession = {
        ...cashSession,
        total_inflows: Number((cashSession.total_inflows + params.amount).toFixed(2)),
        expected_balance: newBal,
      };
      saveCashSessionState(updatedSession);
    }

    return { success: true };
  };

  const renegotiateReceivable = (params: {
    receivable_id: string;
    new_installments: Array<{ due_date: string; amount: number }>;
    reason: string;
  }) => {
    const target = receivables.find((r) => r.id === params.receivable_id);
    if (!target) return;

    const nowIso = new Date().toISOString();

    // 1. Marcar conta original como RENEGOTIATED
    const updatedList = receivables.map((r) => {
      if (r.id === params.receivable_id) {
        return {
          ...r,
          status: 'RENEGOTIATED' as const,
          notes: `${r.notes ? r.notes + ' | ' : ''}Renegociada em ${nowIso.split('T')[0]}: ${params.reason}`,
          updated_at: nowIso,
        };
      }
      return r;
    });

    // 2. Criar novas parcelas resultantes da renegociação
    const newItems: AccountReceivable[] = params.new_installments.map((inst, idx) => ({
      id: `rec-reneg-${Date.now()}-${idx}`,
      company_id: company?.id || 'demo-company',
      sale_id: target.sale_id,
      sale_number: target.sale_number,
      customer_id: target.customer_id,
      customer_name: target.customer_name,
      customer_document: target.customer_document,
      professional_id: target.professional_id,
      professional_name: target.professional_name,
      installment_number: idx + 1,
      total_installments: params.new_installments.length,
      due_date: inst.due_date,
      original_amount: inst.amount,
      discount_amount: 0,
      interest_amount: 0,
      paid_amount: 0,
      balance: inst.amount,
      status: 'OPEN' as const,
      payment_method_predicted: target.payment_method_predicted,
      notes: `Origem: Renegociação da parcela ${target.installment_number}/${target.total_installments}. Motivo: ${params.reason}`,
      created_at: nowIso,
      updated_at: nowIso,
    }));

    saveReceivablesState([...newItems, ...updatedList]);
  };

  const cancelReceivable = (receivable_id: string, reason: string) => {
    const nowIso = new Date().toISOString();
    const updated = receivables.map((r) => {
      if (r.id === receivable_id) {
        return {
          ...r,
          status: 'CANCELLED' as const,
          notes: `${r.notes ? r.notes + ' | ' : ''}Cancelada por ${user?.name || 'Usuário'} em ${nowIso.split('T')[0]}: ${reason}`,
          updated_at: nowIso,
        };
      }
      return r;
    });
    saveReceivablesState(updated);
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
    const tempId = `cust-${Date.now()}`;
    const newCustomer: Customer = {
      ...customerData,
      id: tempId,
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

    // Sincronizar com Supabase se não for empresa demo
    if (company?.id && !isDemoCompany) {
      fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: company.id, customer: newCustomer }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.success && data.customer) {
            setCustomers((prev) => {
              const mapped = prev.map((c) => (c.id === tempId ? data.customer : c));
              safeSetItem(`negociapro_customers${tenantKey}`, JSON.stringify(mapped));
              return mapped;
            });
          }
        })
        .catch((err) => console.warn('Falha ao persistir cliente no Supabase:', err));
    }

    return newCustomer;
  };

  const updateCustomer = (id: string, updatedFields: Partial<Customer>) => {
    // Atualização otimista imediata para UI responsiva
    const updated = customers.map(c => (c.id === id ? { ...c, ...updatedFields, updated_at: new Date().toISOString() } : c));
    saveCust(updated);

    if (company?.id && !isDemoCompany) {
      const target = updated.find((c) => c.id === id);
      if (target) {
        fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ company_id: company.id, customer: target }),
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data?.success && data.customer) {
              // Substituir com dados confirmados do servidor
              setCustomers((prev) => {
                const merged = prev.map(c => (c.id === id ? { ...c, ...data.customer } : c));
                safeSetItem(`negociapro_customers${tenantKey}`, JSON.stringify(merged));
                return merged;
              });
            }
          })
          .catch((err) => console.warn('Falha ao atualizar cliente no Supabase:', err));
      }
    }
  };

  const deleteCustomer = (id: string) => {
    // Remoção otimista imediata
    const updated = customers.filter(c => c.id !== id);
    saveCust(updated);

    if (company?.id && !isDemoCompany) {
      fetch(`/api/customers?id=${encodeURIComponent(id)}&company_id=${encodeURIComponent(company.id)}`, {
        method: 'DELETE',
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!data?.success) {
            // Reverter se o servidor rejeitou
            console.warn('[NegociaPro] Servidor rejeitou exclusão de cliente');
            fetch(`/api/customers?company_id=${company.id}`)
              .then((r) => (r.ok ? r.json() : null))
              .then((d) => { if (d?.success) saveCust(d.customers); })
              .catch(() => {});
          }
        })
        .catch((err) => console.warn('Falha ao deletar cliente no Supabase:', err));
    }
  };

  const addProduct = (productData: Omit<Product, 'id' | 'company_id' | 'created_at' | 'updated_at'>): Product => {
    const tempId = `prod-${Date.now()}`;
    const newProd: Product = {
      ...productData,
      id: tempId,
      company_id: company?.id || 'demo-company',
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const updated = [newProd, ...products];
    saveProd(updated);

    if (company?.id && !isDemoCompany) {
      fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: company.id, product: newProd }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.success && data.product) {
            setProducts((prev) => prev.map((p) => (p.id === tempId ? data.product : p)));
          }
        })
        .catch((err) => console.warn('Falha ao persistir produto no Supabase:', err));
    }

    return newProd;
  };

  const updateProduct = (id: string, updatedFields: Partial<Product>) => {
    const updated = products.map(p => (p.id === id ? { ...p, ...updatedFields, updated_at: new Date().toISOString() } : p));
    saveProd(updated);

    if (company?.id && !isDemoCompany) {
      fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: company.id, id, ...updatedFields }),
      }).catch((err) => console.warn('Falha ao atualizar produto no Supabase:', err));
    }
  };

  const deleteProduct = (id: string) => {
    const updated = products.filter(p => p.id !== id);
    saveProd(updated);

    if (company?.id && !isDemoCompany) {
      fetch(`/api/products?id=${encodeURIComponent(id)}&company_id=${encodeURIComponent(company.id)}`, {
        method: 'DELETE',
      }).catch((err) => console.warn('Falha ao deletar produto no Supabase:', err));
    }
  };

  // Edição em massa de múltiplos produtos selecionados
  const bulkUpdateProducts = async (ids: string[], updates: Partial<Product>): Promise<void> => {
    if (!ids || ids.length === 0) return;
    const idsSet = new Set(ids);
    const now = new Date().toISOString();

    const updated = products.map((p) => {
      if (idsSet.has(p.id)) {
        return {
          ...p,
          ...updates,
          updated_at: now,
        };
      }
      return p;
    });

    saveProd(updated);

    if (company?.id && !isDemoCompany) {
      try {
        await fetch('/api/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company_id: company.id,
            ids,
            updates,
          }),
        });
      } catch (err) {
        console.warn('Falha no update em lote no Supabase:', err);
      }
    }
  };

  // Exclusão em massa de produtos
  const bulkDeleteProducts = async (ids: string[]): Promise<void> => {
    if (!ids || ids.length === 0) return;
    const idsSet = new Set(ids);
    const updated = products.filter((p) => !idsSet.has(p.id));
    saveProd(updated);

    if (company?.id && !isDemoCompany) {
      try {
        await fetch('/api/products', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company_id: company.id,
            ids,
          }),
        });
      } catch (err) {
        console.warn('Falha na exclusão em massa no Supabase:', err);
      }
    }
  };

  // Importação em lote atômica: todos os novos e atualizações são aplicados
  // em um único setProducts/saveProd para evitar condição de corrida com estado stale
  const bulkImportProducts = (
    newProds: Array<Omit<Product, 'id' | 'company_id' | 'created_at' | 'updated_at'>>,
    updateProds: Array<{ id: string } & Partial<Product>>
  ): { added: number; updated: number } => {
    const now = new Date().toISOString();

    // Mapa de id -> campos atualizados para lookup O(1)
    const updateMap = new Map<string, Partial<Product>>();
    updateProds.forEach(({ id, ...fields }) => updateMap.set(id, fields));

    // 1. Aplica as atualizações nos produtos existentes
    const merged = products.map(p => {
      if (updateMap.has(p.id)) {
        return { ...p, ...updateMap.get(p.id)!, updated_at: now };
      }
      return p;
    });

    // 2. Adiciona os produtos novos
    const created: Product[] = newProds.map(data => ({
      ...data,
      id: `prod-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      company_id: company?.id || 'demo-company',
      active: true,
      created_at: now,
      updated_at: now,
    }));

    const finalProducts = [...created, ...merged];
    saveProd(finalProducts);

    if (company?.id && !isDemoCompany) {
      if (created.length > 0) {
        fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ company_id: company.id, products: created }),
        }).catch((err) => console.warn('Falha ao sincronizar novos produtos no Supabase:', err));
      }

      if (updateProds.length > 0) {
        fetch('/api/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ company_id: company.id, products: updateProds }),
        }).catch((err) => console.warn('Falha ao sincronizar lote de produtos atualizados no Supabase:', err));
      }
    }

    return { added: created.length, updated: updateProds.length };
  };

  const adjustStock = (productId: string, quantityChange: number, reason: string) => {
    let targetNewStock = 0;
    const updated = products.map(p => {
      if (p.id === productId) {
        targetNewStock = Math.max(0, p.current_stock + quantityChange);
        return {
          ...p,
          current_stock: targetNewStock,
          updated_at: new Date().toISOString(),
        };
      }
      return p;
    });
    saveProd(updated);

    if (company?.id && !isDemoCompany) {
      fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: company.id, id: productId, current_stock: targetNewStock }),
      }).catch((err) => console.warn('Falha ao ajustar estoque no Supabase:', err));
    }
  };

  // Módulo de Profissionais
  const addProfessional = (profData: Omit<Professional, 'id' | 'company_id' | 'created_at' | 'updated_at'>): Professional => {
    const tempId = `prof-${Date.now()}`;
    const newProf: Professional = {
      ...profData,
      id: tempId,
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

    if (company?.id && !isDemoCompany) {
      fetch('/api/professionals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: company.id, professional: newProf }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.success && data.professional) {
            setProfessionals((prev) => prev.map((p) => (p.id === tempId ? data.professional : p)));
          }
        })
        .catch((err) => console.warn('Falha ao persistir profissional no Supabase:', err));
    }

    return newProf;
  };

  const updateProfessional = (id: string, updatedFields: Partial<Professional>) => {
    const updated = professionals.map(p => (p.id === id ? { ...p, ...updatedFields, updated_at: new Date().toISOString() } : p));
    saveProfsState(updated);

    if (company?.id && !isDemoCompany) {
      const target = updated.find((p) => p.id === id);
      if (target) {
        fetch('/api/professionals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ company_id: company.id, professional: target }),
        }).catch((err) => console.warn('Falha ao atualizar profissional no Supabase:', err));
      }
    }
  };

  const deactivateProfessional = (id: string) => {
    const updated = professionals.map(p => (p.id === id ? { ...p, active: false, updated_at: new Date().toISOString() } : p));
    saveProfsState(updated);

    if (company?.id && !isDemoCompany) {
      const target = updated.find((p) => p.id === id);
      if (target) {
        fetch('/api/professionals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ company_id: company.id, professional: target }),
        }).catch((err) => console.warn('Falha ao desativar profissional no Supabase:', err));
      }
    }
  };

  const deleteProfessional = (id: string) => {
    const updated = professionals.filter(p => p.id !== id);
    saveProfsState(updated);

    if (company?.id && !isDemoCompany) {
      fetch(`/api/professionals?id=${encodeURIComponent(id)}&company_id=${encodeURIComponent(company.id)}`, {
        method: 'DELETE',
      }).catch((err) => console.warn('Falha ao deletar profissional no Supabase:', err));
    }
  };

  // Finalização da Venda ou Registro de Orçamento com Snapshot de Comissão e Vinculação de Profissional
  const createSale = (saleData: {
    customer_id?: string | null;
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
    payment_method_name?: string;
    payment_type?: 'A_VISTA' | 'A_PRAZO' | 'PARCELADO';
    installments_plan?: Array<{
      number: number;
      due_date: string;
      amount: number;
      notes?: string;
    }>;
    notes?: string;
    status?: 'COMPLETED' | 'QUOTE';
    converted_from_quote_id?: string | null;
  }): Sale => {
    const isQuote = saleData.status === 'QUOTE';
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

    const currentCustomer = saleData.customer_id ? customers.find(c => c.id === saleData.customer_id) : null;
    const selectedProf = professionals.find(p => p.id === saleData.professional_id);
    // IMPORTANTE: O sale_number local é apenas um placeholder temporário único.
    // O número definitivo e sequencial é SEMPRE gerado pelo banco de dados (trigger generate_sale_number)
    // e substituído no estado após o servidor confirmar a venda via POST.
    // Usar Date.now() evita colisão entre usuários simultâneos que teriam o mesmo sales.length local.
    const saleNumber = Date.now(); // Substituído pelo servidor após sync bem-sucedido
    const saleId = `sale-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const createdSale: Sale = {
      id: saleId,
      company_id: company?.id || 'demo-company',
      customer_id: saleData.customer_id || null,
      customer: currentCustomer || null,
      seller_id: user?.id || 'demo-user',
      seller: user || undefined,
      professional_id: saleData.professional_id || null,
      professional: selectedProf,
      sale_number: saleNumber,
      status: isQuote ? 'QUOTE' : 'COMPLETED',
      subtotal,
      discount,
      total,
      commission_total: Number(totalSaleCommission.toFixed(2)),
      payment_method_id: saleData.payment_method_id || null,
      payment_method_name: saleData.payment_method_name || null,
      payment_type: saleData.payment_type || (saleData.payment_method_name === 'À Prazo' ? 'A_PRAZO' : saleData.payment_method_name === 'Parcelado' ? 'PARCELADO' : 'A_VISTA'),
      installments_count: saleData.installments_plan?.length || 1,
      installments_plan: saleData.installments_plan,
      converted_from_quote_id: saleData.converted_from_quote_id || null,
      notes: saleData.notes,
      sold_at: nowIso,
      created_at: nowIso,
      updated_at: nowIso,
      items: enrichedItems.map(i => ({ ...i, sale_id: saleId })),
    };

    // Marcar a venda como pendente de sync enquanto o POST com o servidor ainda não retornou.
    // Isso impede que o refresh periódico (8s) a preserve como "localOnly" causando duplicatas (bug Ivan).
    const pendingSale: Sale = { ...createdSale, _pendingSync: true } as any;

    // 1. Atualizar vendas
    const newSales = [pendingSale, ...sales];
    saveSalesState(newSales);

    // Auditoria de criação
    const auditLog: SaleAuditLog = {
      id: `audit-${Date.now()}`,
      company_id: company?.id || 'demo-company',
      sale_id: saleId,
      sale_number: saleNumber,
      user_id: user?.id || null,
      user_name: user?.name || 'Operador',
      action: isQuote ? 'CREATE' : (saleData.converted_from_quote_id ? 'CONVERT_QUOTE' : 'CREATE'),
      description: isQuote
        ? `Orçamento #${saleNumber} salvo por ${user?.name || 'Operador'} no valor de R$ ${total.toFixed(2)} (${saleData.items.length} itens)`
        : `Venda #${saleNumber} concluída por ${user?.name || 'Operador'} (${currentCustomer?.name || 'Sem cliente'}) no valor de R$ ${total.toFixed(2)}`,
      new_state: { total, items_count: saleData.items.length, status: createdSale.status },
      created_at: nowIso,
    };
    saveAuditState([auditLog, ...saleAuditLogs]);

    // SE FOR ORÇAMENTO, NÃO REALIZAR MOVIMENTAÇÃO FINANCEIRA, ESTOQUE OU COMISSÃO
    if (isQuote) {
      // Sincronizar orçamento com Supabase se houver conexão ativa
      if (company?.id && !isDemoCompany) {
        fetch('/api/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company_id: company.id,
            sale: createdSale,
            items: enrichedItems,
          }),
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data && data.success && data.sale) {
              const serverSale = data.sale;
              const finalMergedSale: Sale = {
                ...createdSale,
                ...serverSale,
                // Garantir que o sale_number vem SEMPRE do servidor
                sale_number: serverSale.sale_number,
                items: (serverSale.items && serverSale.items.length > 0) ? serverSale.items : (createdSale.items || enrichedItems),
                customer: serverSale.customer || createdSale.customer,
                professional: serverSale.professional || createdSale.professional,
                // Remover a flag de pendencia — orçamento confirmado pelo servidor
                _pendingSync: undefined,
              } as Sale;
              // Usar saveSalesState para persistir no localStorage com o ID definitivo do servidor
              setSales((prev) => {
                const withoutDuplicate = prev.filter(
                  (s) => s.id !== saleId && Number(s.sale_number) !== Number(serverSale.sale_number)
                );
                const merged = [...withoutDuplicate.filter(s => s.id !== finalMergedSale.id), finalMergedSale];
                safeSetItem(`negociapro_sales${tenantKey}`, JSON.stringify(merged));
                return merged;
              });
            } else {
              // Servidor rejeitou: remover _pendingSync para que o refresh de 8s preserve o QUOTE local
              console.warn('[NegociaPro] Servidor rejeitou orçamento:', data?.error);
              setSales((prev) => prev.map((s: any) =>
                s.id === saleId ? { ...s, _pendingSync: false } : s
              ));
            }
          })
          .catch((err) => {
            console.warn('Falha ao persistir orçamento no Supabase:', err);
            // Em caso de falha de rede: remover _pendingSync, o QUOTE já é preservado pelo status
            setSales((prev) => prev.map((s: any) =>
              s.id === saleId ? { ...s, _pendingSync: false } : s
            ));
          });
      }
      return createdSale;
    }

    // 2. Criar registro de comissão se houver profissional e comissão > 0 (Apenas se finalizada)
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

    // 3. Atualizar métricas do cliente (se houver cliente)
    if (saleData.customer_id) {
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
    }

    // 4. Atualizar estoque dos produtos definitivamente
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

    // 5. REGISTRAR NO HISTÓRICO DE PREÇOS (se houver cliente cadastrado)
    if (saleData.customer_id) {
      const newHistoryMap = { ...priceHistoryMap };

      saleData.items.forEach(item => {
        const key = `${saleData.customer_id}_${item.product_id}`;
        const effectiveUnitPrice = item.unit_price - item.discount / (item.quantity || 1);

        const newRecord: PriceHistoryRecord = {
          id: `hist-${Date.now()}-${item.product_id}`,
          company_id: company?.id || 'demo-company',
          customer_id: saleData.customer_id!,
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
    }

    // 6. INTEGRAÇÃO FINANCEIRA: VENDAS À VISTA VS. A PRAZO / PARCELADAS
    const pType = saleData.payment_type || (saleData.payment_method_name === 'À Prazo' ? 'A_PRAZO' : saleData.payment_method_name === 'Parcelado' ? 'PARCELADO' : 'A_VISTA');
    const isCreditOrInstallment = pType === 'A_PRAZO' || pType === 'PARCELADO' || (saleData.installments_plan && saleData.installments_plan.length > 0);

    if (isCreditOrInstallment && saleData.installments_plan && saleData.installments_plan.length > 0) {
      // Venda a Prazo ou Parcelada: Gerar Contas a Receber (SEM entrada no caixa imediata)
      const newReceivables: AccountReceivable[] = saleData.installments_plan.map((inst, idx) => ({
        id: `rec-${Date.now()}-${idx}`,
        company_id: company?.id || 'demo-company',
        sale_id: saleId,
        sale_number: saleNumber,
        customer_id: saleData.customer_id || 'sem-cliente',
        customer_name: currentCustomer?.name || 'Venda sem Cliente',
        customer_document: currentCustomer?.document || null,
        professional_id: selectedProf?.id || null,
        professional_name: selectedProf?.name || null,
        installment_number: inst.number,
        total_installments: saleData.installments_plan!.length,
        due_date: inst.due_date,
        original_amount: inst.amount,
        discount_amount: 0,
        interest_amount: 0,
        paid_amount: 0,
        balance: inst.amount,
        status: 'OPEN' as const,
        payment_method_predicted: saleData.payment_method_name || 'A Prazo',
        notes: saleData.notes,
        created_at: nowIso,
        updated_at: nowIso,
      }));

      saveReceivablesState([...newReceivables, ...receivables]);
    } else {
      // Venda à Vista: Gerar Entrada Automática no Caixa Diário
      const prevBal = cashSession?.expected_balance ?? (
        cashMovements.reduce((acc, m) => m.type === 'ENTRADA' ? acc + m.amount : acc - m.amount, 0)
      );
      const newBal = Number((prevBal + total).toFixed(2));

      const cashMov: CashMovement = {
        id: `mov-${Date.now()}`,
        company_id: company?.id || 'demo-company',
        cash_session_id: cashSession?.id || 'daily-cash',
        timestamp: nowIso,
        type: 'ENTRADA',
        category: 'VENDA_A_VISTA',
        description: `Venda #${saleNumber} à vista (${saleData.payment_method_name || 'Dinheiro'}) - ${currentCustomer?.name || 'Consumidor Final'}`,
        origin: 'VENDA',
        reference_id: saleId,
        payment_method: saleData.payment_method_name || 'Dinheiro',
        amount: total,
        current_balance_after: newBal,
        user_id: user?.id || null,
        user_name: user?.name || 'Operador',
        notes: saleData.notes,
      };

      saveMovementsState([cashMov, ...cashMovements]);

      if (cashSession) {
        const updatedSession: CashRegisterSession = {
          ...cashSession,
          total_inflows: Number((cashSession.total_inflows + total).toFixed(2)),
          expected_balance: newBal,
        };
        saveCashSessionState(updatedSession);
      }
    }

    // 7. Sincronizar venda com Supabase se não for empresa de demonstração
    if (company?.id && !isDemoCompany) {
      fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: company.id,
          sale: createdSale,
          items: enrichedItems,
        }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.success && data.sale) {
            const serverSale = data.sale;
            const finalMergedSale: Sale = {
              ...createdSale,
              ...serverSale,
              // Garantir que o sale_number vem SEMPRE do servidor (ID definitivo do banco)
              sale_number: serverSale.sale_number,
              items: (serverSale.items && serverSale.items.length > 0) ? serverSale.items : (createdSale.items || enrichedItems),
              customer: serverSale.customer || createdSale.customer,
              professional: serverSale.professional || createdSale.professional,
              // Remover a flag de pendência — venda confirmada pelo servidor
              _pendingSync: undefined,
            } as Sale;
            setSales((prev) => {
              // Substituir a venda local (pendingSale com _pendingSync) pelo registro definitivo do servidor.
              // Remover também qualquer outra entrada local com o mesmo sale_number (evita duplicatas).
              const withoutDuplicate = prev.filter(
                (s) => s.id !== saleId && Number(s.sale_number) !== Number(serverSale.sale_number)
              );
              return [finalMergedSale, ...withoutDuplicate];
            });
          } else if (data && !data.success) {
            // Servidor rejeitou: manter _pendingSync=true para retentar no próximo refresh
            console.warn('[NegociaPro] Servidor rejeitou a venda (será retentada):', data?.error);
            // NÃO mudar _pendingSync para false — a venda precisa ser retentada
          }
        })
        .catch((err) => {
          console.warn('[NegociaPro] Falha de rede ao salvar venda (será retentada em 5s):', err);
          // Em caso de falha de rede: manter _pendingSync=true para retentar no próximo ciclo
          // A venda permanece visível e será reenviada automaticamente
        });
    }

    return createdSale;
  };

  // Conversão de Orçamento para Venda Concluída (Não duplica a venda, atualiza o status e dispara estoque/caixa)
  const convertQuoteToSale = (quoteId: string, options?: {
    customer_id?: string | null;
    professional_id?: string | null;
    items?: Array<{
      product_id: string;
      quantity: number;
      unit_price: number;
      discount: number;
      total: number;
      commission_type_snapshot?: 'NONE' | 'PERCENTAGE' | 'FIXED';
      commission_value_snapshot?: number;
      commission_amount?: number;
    }>;
    payment_method_name?: string;
    payment_type?: 'A_VISTA' | 'A_PRAZO' | 'PARCELADO';
    installments_plan?: Array<{
      number: number;
      due_date: string;
      amount: number;
    }>;
    notes?: string;
  }): Sale | null => {
    const targetQuote = sales.find((s) => s.id === quoteId);
    if (!targetQuote || targetQuote.status !== 'QUOTE') {
      return null;
    }

    const nowIso = new Date().toISOString();
    const finalPaymentMethod = options?.payment_method_name || targetQuote.payment_method_name || 'Dinheiro';
    const finalPaymentType = options?.payment_type || targetQuote.payment_type || 'A_VISTA';
    const finalInstallments = options?.installments_plan || targetQuote.installments_plan;
    const finalNotes = options?.notes || targetQuote.notes;

    // Se novos itens foram repassados na conversão
    const finalItems = options?.items && options.items.length > 0
      ? options.items.map((it, idx) => {
          const prod = products.find((p) => p.id === it.product_id);
          return {
            id: `si-${Date.now()}-${idx}`,
            sale_id: targetQuote.id,
            company_id: targetQuote.company_id,
            product_id: it.product_id,
            product: prod,
            quantity: it.quantity,
            unit_price: it.unit_price,
            discount: it.discount,
            total: it.total,
            commission_type_snapshot: it.commission_type_snapshot || prod?.commission_type || 'NONE',
            commission_value_snapshot: it.commission_value_snapshot ?? prod?.commission_value ?? 0,
            commission_amount: it.commission_amount || 0,
          };
        })
      : targetQuote.items;

    const finalSubtotal = finalItems ? finalItems.reduce((acc, it) => acc + it.quantity * it.unit_price, 0) : targetQuote.subtotal;
    const finalDiscount = finalItems ? finalItems.reduce((acc, it) => acc + (it.discount || 0), 0) : targetQuote.discount;
    const finalTotal = finalSubtotal - finalDiscount;
    const finalCommission = finalItems ? finalItems.reduce((acc, it) => acc + (it.commission_amount || 0), 0) : targetQuote.commission_total;

    const finalCustomer = options?.customer_id ? customers.find((c) => c.id === options.customer_id) : targetQuote.customer;
    const finalProf = options?.professional_id ? professionals.find((p) => p.id === options.professional_id) : targetQuote.professional;

    // Atualizar venda existente de QUOTE para COMPLETED
    const convertedSale: Sale = {
      ...targetQuote,
      customer_id: options?.customer_id !== undefined ? options.customer_id : targetQuote.customer_id,
      customer: finalCustomer,
      professional_id: options?.professional_id !== undefined ? options.professional_id : targetQuote.professional_id,
      professional: finalProf,
      items: finalItems,
      subtotal: finalSubtotal,
      discount: finalDiscount,
      total: finalTotal,
      commission_total: finalCommission,
      status: 'COMPLETED',
      payment_method_name: finalPaymentMethod,
      payment_type: finalPaymentType,
      installments_plan: finalInstallments,
      notes: finalNotes,
      sold_at: nowIso,
      updated_at: nowIso,
    };

    const updatedSales = sales.map((s) => (s.id === quoteId ? convertedSale : s));
    saveSalesState(updatedSales);

    // Auditoria
    const auditLog: SaleAuditLog = {
      id: `audit-${Date.now()}`,
      company_id: company?.id || 'demo-company',
      sale_id: targetQuote.id,
      sale_number: targetQuote.sale_number,
      user_id: user?.id || null,
      user_name: user?.name || 'Operador',
      action: 'CONVERT_QUOTE',
      description: `Orçamento #${targetQuote.sale_number} convertido em venda concluída por ${user?.name || 'Operador'}. Valor: R$ ${convertedSale.total.toFixed(2)}`,
      previous_state: { status: 'QUOTE' },
      new_state: { status: 'COMPLETED', payment_method: finalPaymentMethod },
      created_at: nowIso,
    };
    saveAuditState([auditLog, ...saleAuditLogs]);

    // Baixa de estoque dos itens
    if (convertedSale.items && convertedSale.items.length > 0) {
      const updatedProducts = products.map((p) => {
        const item = convertedSale.items!.find((i) => i.product_id === p.id);
        if (item) {
          return {
            ...p,
            current_stock: Math.max(0, p.current_stock - item.quantity),
          };
        }
        return p;
      });
      saveProd(updatedProducts);
    }

    // Comissão
    if (convertedSale.professional_id && convertedSale.commission_total > 0) {
      const newCommission: CommissionRecord = {
        id: `comm-${Date.now()}`,
        company_id: company?.id || 'demo-company',
        professional_id: convertedSale.professional_id,
        professional_name: convertedSale.professional?.name || 'Profissional',
        sale_id: convertedSale.id,
        sale_number: convertedSale.sale_number,
        customer_id: convertedSale.customer_id,
        customer_name: convertedSale.customer?.name,
        sale_date: nowIso,
        sale_total: convertedSale.total,
        commission_amount: convertedSale.commission_total,
        status: 'PENDENTE',
        created_at: nowIso,
        updated_at: nowIso,
      };
      saveCommsState([newCommission, ...commissions]);
    }

    // Integração Financeira
    const isCredit = finalPaymentType !== 'A_VISTA' && finalInstallments && finalInstallments.length > 0;
    if (isCredit) {
      const newReceivables: AccountReceivable[] = finalInstallments!.map((inst, idx) => ({
        id: `rec-${Date.now()}-${idx}`,
        company_id: company?.id || 'demo-company',
        sale_id: convertedSale.id,
        sale_number: convertedSale.sale_number,
        customer_id: convertedSale.customer_id || 'sem-cliente',
        customer_name: convertedSale.customer?.name || 'Venda sem Cliente',
        customer_document: convertedSale.customer?.document || null,
        professional_id: convertedSale.professional_id || null,
        professional_name: convertedSale.professional?.name || null,
        installment_number: inst.number,
        total_installments: finalInstallments!.length,
        due_date: inst.due_date,
        original_amount: inst.amount,
        discount_amount: 0,
        interest_amount: 0,
        paid_amount: 0,
        balance: inst.amount,
        status: 'OPEN' as const,
        payment_method_predicted: finalPaymentMethod,
        notes: finalNotes,
        created_at: nowIso,
        updated_at: nowIso,
      }));
      saveReceivablesState([...newReceivables, ...receivables]);
    } else {
      const prevBal = cashSession?.expected_balance ?? (
        cashMovements.reduce((acc, m) => m.type === 'ENTRADA' ? acc + m.amount : acc - m.amount, 0)
      );
      const newBal = Number((prevBal + convertedSale.total).toFixed(2));

      const cashMov: CashMovement = {
        id: `mov-${Date.now()}`,
        company_id: company?.id || 'demo-company',
        cash_session_id: cashSession?.id || 'daily-cash',
        timestamp: nowIso,
        type: 'ENTRADA',
        category: 'VENDA_A_VISTA',
        description: `Venda #${convertedSale.sale_number} à vista (${finalPaymentMethod}) - ${convertedSale.customer?.name || 'Consumidor Final'}`,
        origin: 'VENDA',
        reference_id: convertedSale.id,
        payment_method: finalPaymentMethod,
        amount: convertedSale.total,
        current_balance_after: newBal,
        user_id: user?.id || null,
        user_name: user?.name || 'Operador',
        notes: finalNotes,
      };
      saveMovementsState([cashMov, ...cashMovements]);

      if (cashSession) {
        const updatedSession: CashRegisterSession = {
          ...cashSession,
          total_inflows: Number((cashSession.total_inflows + convertedSale.total).toFixed(2)),
          expected_balance: newBal,
        };
        saveCashSessionState(updatedSession);
      }
    }

    // Sincronizar atualização no Supabase e forçar refresh para todos os usuários
    if (company?.id && !isDemoCompany) {
      fetch('/api/sales', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: company.id,
          sale_id: convertedSale.id,
          sale: convertedSale,
          items: convertedSale.items,
          requester_role: user?.role || 'ADMIN',
          requester_name: user?.name || 'Operador',
          requester_id: user?.id,
        }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.success && data.sale) {
            // Substituir com dados definitivos do servidor
            const serverSale = data.sale;
            setSales((prev) => {
              const merged = prev.map((s) =>
                s.id === convertedSale.id
                  ? { ...convertedSale, ...serverSale, items: serverSale.items?.length ? serverSale.items : convertedSale.items }
                  : s
              );
              safeSetItem(`negociapro_sales${tenantKey}`, JSON.stringify(merged));
              return merged;
            });
          }
        })
        .catch((err) => console.warn('Falha ao converter orçamento no Supabase:', err));
    }

    return convertedSale;
  };

  // Edição de Venda Concluída (Com controle rigoroso de permissão: Dono/Admin/Gerente)
  const updateFinishedSale = (params: {
    sale_id: string;
    saleData: {
      customer_id?: string | null;
      professional_id?: string | null;
      payment_method_name?: string;
      payment_type?: 'A_VISTA' | 'A_PRAZO' | 'PARCELADO';
      installments_plan?: Array<{
        number: number;
        due_date: string;
        amount: number;
      }>;
      notes?: string;
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
    };
    reason?: string;
  }): { success: boolean; sale?: Sale; message?: string } => {
    // 1. Validar permissão
    const isAuthorized = user?.role === 'ADMIN' || user?.role === 'GERENTE';
    if (!isAuthorized) {
      return { success: false, message: 'Apenas Administradores ou Gerentes possuem permissão para editar vendas finalizadas.' };
    }

    const targetSale = sales.find((s) => s.id === params.sale_id);
    if (!targetSale) {
      return { success: false, message: 'Venda não encontrada.' };
    }

    const previousTotal = targetSale.total;
    const previousItems = targetSale.items || [];
    const nowIso = new Date().toISOString();

    const subtotal = params.saleData.items.reduce((acc, item) => acc + item.quantity * item.unit_price, 0);
    const discount = params.saleData.items.reduce((acc, item) => acc + item.discount, 0);
    const total = subtotal - discount;

    let totalCommission = 0;
    const enrichedItems = params.saleData.items.map((item, idx) => {
      const prod = products.find(p => p.id === item.product_id);
      const cType = item.commission_type_snapshot || prod?.commission_type || 'NONE';
      const cVal = item.commission_value_snapshot !== undefined ? item.commission_value_snapshot : (prod?.commission_value || 0);

      let itemCommission = 0;
      if (params.saleData.professional_id && cType !== 'NONE') {
        if (cType === 'PERCENTAGE') {
          itemCommission = Number(((item.total * cVal) / 100).toFixed(2));
        } else if (cType === 'FIXED') {
          itemCommission = Number((item.quantity * cVal).toFixed(2));
        }
      }
      totalCommission += itemCommission;

      return {
        id: `si-${Date.now()}-${idx}`,
        sale_id: params.sale_id,
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

    const currentCustomer = params.saleData.customer_id ? customers.find(c => c.id === params.saleData.customer_id) : null;
    const selectedProf = professionals.find(p => p.id === params.saleData.professional_id);

    const updatedSale: Sale = {
      ...targetSale,
      customer_id: params.saleData.customer_id || null,
      customer: currentCustomer || null,
      professional_id: params.saleData.professional_id || null,
      professional: selectedProf,
      subtotal,
      discount,
      total,
      commission_total: Number(totalCommission.toFixed(2)),
      payment_method_name: params.saleData.payment_method_name || targetSale.payment_method_name,
      payment_type: params.saleData.payment_type || targetSale.payment_type,
      installments_plan: params.saleData.installments_plan || targetSale.installments_plan,
      notes: params.saleData.notes !== undefined ? params.saleData.notes : targetSale.notes,
      updated_at: nowIso,
      items: enrichedItems,
    };

    // 2. Atualizar array de vendas
    const newSales = sales.map((s) => (s.id === params.sale_id ? updatedSale : s));
    saveSalesState(newSales);

    // 3. Ajustar Estoque: Estornar quantidades antigas e aplicar novas quantidades
    if (targetSale.status === 'COMPLETED') {
      const stockDiffs: Record<string, number> = {};
      previousItems.forEach((oldIt) => {
        stockDiffs[oldIt.product_id] = (stockDiffs[oldIt.product_id] || 0) + oldIt.quantity; // Devolve ao estoque
      });
      params.saleData.items.forEach((newIt) => {
        stockDiffs[newIt.product_id] = (stockDiffs[newIt.product_id] || 0) - newIt.quantity; // Retira novo estoque
      });

      const updatedProducts = products.map((p) => {
        if (stockDiffs[p.id] !== undefined) {
          return {
            ...p,
            current_stock: Math.max(0, p.current_stock + stockDiffs[p.id]),
          };
        }
        return p;
      });
      saveProd(updatedProducts);
    }

    // 4. Ajustar Caixa se for venda à vista concluída
    const isCashSale = targetSale.status === 'COMPLETED' && updatedSale.payment_type === 'A_VISTA';
    if (isCashSale && cashSession) {
      const diffTotal = total - previousTotal;
      if (Math.abs(diffTotal) > 0.009) {
        const movType: 'ENTRADA' | 'SAÍDA' = diffTotal > 0 ? 'ENTRADA' : 'SAÍDA';
        const absDiff = Math.abs(diffTotal);
        const currentBal = cashSession.expected_balance || 0;
        const newBal = diffTotal > 0 ? currentBal + absDiff : currentBal - absDiff;

        const cashMov: CashMovement = {
          id: `mov-${Date.now()}`,
          company_id: company?.id || 'demo-company',
          cash_session_id: cashSession.id,
          timestamp: nowIso,
          type: movType,
          category: diffTotal > 0 ? 'AJUSTE_POSITIVO' : 'AJUSTE_NEGATIVO',
          description: `Ajuste por Edição na Venda #${targetSale.sale_number} (${movType === 'ENTRADA' ? '+' : '-'}${absDiff.toFixed(2)})`,
          origin: 'MANUAL',
          reference_id: targetSale.id,
          payment_method: updatedSale.payment_method_name || 'Dinheiro',
          amount: absDiff,
          current_balance_after: Number(newBal.toFixed(2)),
          user_id: user?.id || null,
          user_name: user?.name || 'Operador',
          notes: params.reason || 'Edição de venda autorizada',
        };

        saveMovementsState([cashMov, ...cashMovements]);

        const updatedSession: CashRegisterSession = {
          ...cashSession,
          total_inflows: diffTotal > 0 ? cashSession.total_inflows + absDiff : cashSession.total_inflows,
          total_outflows: diffTotal < 0 ? cashSession.total_outflows + absDiff : cashSession.total_outflows,
          expected_balance: Number(newBal.toFixed(2)),
        };
        saveCashSessionState(updatedSession);
      }
    }

    // 5. Ajustar Comissões se houver alteração
    const updatedComms = commissions.map((c) => {
      if (c.sale_id === params.sale_id && c.status !== 'PAGA' && c.status !== 'CANCELADA') {
        return {
          ...c,
          sale_total: total,
          commission_amount: Number(totalCommission.toFixed(2)),
          updated_at: nowIso,
          notes: `${c.notes ? c.notes + ' | ' : ''}Venda reajustada em ${nowIso.split('T')[0]}`,
        };
      }
      return c;
    });
    saveCommsState(updatedComms);

    // 6. Auditoria Completa da Edição
    const auditLog: SaleAuditLog = {
      id: `audit-${Date.now()}`,
      company_id: company?.id || 'demo-company',
      sale_id: targetSale.id,
      sale_number: targetSale.sale_number,
      user_id: user?.id || null,
      user_name: user?.name || 'Administrador',
      action: 'EDIT',
      description: `Venda #${targetSale.sale_number} editada por ${user?.name || 'Usuário'}. Total: R$ ${previousTotal.toFixed(2)} → R$ ${total.toFixed(2)}. ${params.reason ? 'Motivo: ' + params.reason : ''}`,
      previous_state: { total: previousTotal, items: previousItems.length },
      new_state: { total, items: enrichedItems.length, reason: params.reason },
      created_at: nowIso,
    };
    saveAuditState([auditLog, ...saleAuditLogs]);

    // 7. Sincronizar com Supabase e persistir dados confirmados no localStorage
    if (company?.id && !isDemoCompany) {
      fetch('/api/sales', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: company.id,
          sale_id: params.sale_id,
          sale: updatedSale,
          items: enrichedItems,
          requester_role: user?.role || 'ADMIN',
          requester_name: user?.name || 'Administrador',
          requester_id: user?.id,
        }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.success && data.sale) {
            const serverSale = data.sale;
            setSales((prev) => {
              const merged = prev.map((s) =>
                s.id === params.sale_id
                  ? { ...updatedSale, ...serverSale, items: serverSale.items?.length ? serverSale.items : enrichedItems }
                  : s
              );
              safeSetItem(`negociapro_sales${tenantKey}`, JSON.stringify(merged));
              return merged;
            });
          }
        })
        .catch((err) => console.warn('Falha ao sincronizar edicao de venda no Supabase:', err));
    }

    return { success: true, sale: updatedSale };
  };

  const cancelSale = (id: string, reason?: string) => {
    const target = sales.find((s) => s.id === id);
    if (!target) return;

    const nowIso = new Date().toISOString();

    // Atualização otimista imediata para UI responsiva
    const updated = sales.map(s => {
      if (s.id === id) {
        return {
          ...s,
          status: 'CANCELLED' as const,
          notes: `${s.notes ? s.notes + ' | ' : ''}Cancelada por ${user?.name || 'Usuário'}: ${reason || 'Sem motivo informado'}`,
          updated_at: nowIso,
        };
      }
      return s;
    });
    saveSalesState(updated);

    // Cancelar comissão correspondente
    const updatedComms = commissions.map(c => {
      if (c.sale_id === id) {
        return { ...c, status: 'CANCELADA' as const, updated_at: nowIso };
      }
      return c;
    });
    saveCommsState(updatedComms);

    // Estorno de Estoque se a venda cancelada já estava COMPLETED
    if (target.status === 'COMPLETED' && target.items && target.items.length > 0) {
      const updatedProducts = products.map((p) => {
        const it = target.items!.find((i) => i.product_id === p.id);
        if (it) {
          return {
            ...p,
            current_stock: p.current_stock + it.quantity,
          };
        }
        return p;
      });
      saveProd(updatedProducts);
    }

    // Cancelar parcelas a receber vinculadas se houver
    const updatedRecs = receivables.map((r) => {
      if (r.sale_id === id) {
        return { ...r, status: 'CANCELLED' as const, updated_at: nowIso };
      }
      return r;
    });
    saveReceivablesState(updatedRecs);

    // Auditoria de cancelamento
    const auditLog: SaleAuditLog = {
      id: `audit-${Date.now()}`,
      company_id: company?.id || 'demo-company',
      sale_id: target.id,
      sale_number: target.sale_number,
      user_id: user?.id || null,
      user_name: user?.name || 'Operador',
      action: 'CANCEL',
      description: `Venda #${target.sale_number} cancelada por ${user?.name || 'Operador'}. Motivo: ${reason || 'Não informado'}`,
      previous_state: { status: target.status, total: target.total },
      new_state: { status: 'CANCELLED', reason },
      created_at: nowIso,
    };
    saveAuditState([auditLog, ...saleAuditLogs]);

    // Sincronizar com servidor — se falhar, re-fetch do servidor para corrigir estado local
    if (company?.id && !isDemoCompany) {
      fetch('/api/sales', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, company_id: company.id, status: 'CANCELLED' }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.success && data.sale) {
            // Substituir com status confirmado pelo servidor
            setSales((prev) => {
              const merged = prev.map((s) =>
                s.id === id ? { ...s, ...data.sale, items: s.items } : s
              );
              safeSetItem(`negociapro_sales${tenantKey}`, JSON.stringify(merged));
              return merged;
            });
          } else if (!data?.success) {
            // Revert otimista: servidor rejeitou
            console.warn('[NegociaPro] Servidor rejeitou cancelamento da venda:', data?.error);
            fetch(`/api/sales?company_id=${company.id}`)
              .then((r) => (r.ok ? r.json() : null))
              .then((d) => {
                if (d?.success && Array.isArray(d.sales)) {
                  setSales((prev) => {
                    const serverMap = new Map(d.sales.map((ss: Sale) => [ss.id, ss]));
                    const merged = d.sales.map((serverSale: Sale) => {
                      const existing = prev.find((p) => p.id === serverSale.id);
                      return (existing?.items?.length && !serverSale.items?.length)
                        ? { ...serverSale, items: existing.items }
                        : serverSale;
                    });
                    const localOnly = prev.filter((p: any) => !serverMap.has(p.id) && (p.status === 'QUOTE' || p._pendingSync));
                    const fullMerged = [...localOnly, ...merged];
                    safeSetItem(`negociapro_sales${tenantKey}`, JSON.stringify(fullMerged));
                    return fullMerged;
                  });
                }
              })
              .catch(() => {});
          }
        })
        .catch((err) => console.warn('Falha ao cancelar venda no Supabase:', err));
    }
  };

  const deleteSale = (idOrSaleNumber: string | number) => {
    const isNum = typeof idOrSaleNumber === 'number' || (!isNaN(Number(idOrSaleNumber)) && String(idOrSaleNumber).length <= 6);
    const saleNum = isNum ? Number(idOrSaleNumber) : null;

    // Encontrar venda a ser excluída
    const targetSale = sales.find(
      (s) => s.id === String(idOrSaleNumber) || (saleNum !== null && Number(s.sale_number) === saleNum)
    );

    // 1. Remoção otimista imediata do array de vendas
    const updatedSales = sales.filter((s) => {
      if (saleNum !== null && Number(s.sale_number) === saleNum) return false;
      if (s.id === String(idOrSaleNumber)) return false;
      return true;
    });
    saveSalesState(updatedSales);

    // 2. Remover comissão correspondente se existir
    if (targetSale) {
      const updatedComms = commissions.filter((c) => c.sale_id !== targetSale.id && Number(c.sale_number) !== Number(targetSale.sale_number));
      saveCommsState(updatedComms);

      // 3. Remover contas a receber geradas por essa venda
      const updatedRecs = receivables.filter((r) => r.sale_id !== targetSale.id && Number(r.sale_number) !== Number(targetSale.sale_number));
      saveReceivablesState(updatedRecs);
    }

    // 4. Sincronizar exclusão definitiva com o Supabase
    if (company?.id && !isDemoCompany) {
      const queryParam = saleNum !== null ? `sale_number=${saleNum}` : `id=${encodeURIComponent(String(idOrSaleNumber))}`;
      fetch(`/api/sales?company_id=${encodeURIComponent(company.id)}&${queryParam}`, {
        method: 'DELETE',
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!data?.success) {
            // Se o servidor rejeitou, re-fetch para restaurar o estado correto
            console.warn('[NegociaPro] Servidor rejeitou exclusão da venda:', data?.error);
          }
          // Sempre re-fetch após delete para garantir consistência entre usuários
          fetch(`/api/sales?company_id=${company.id}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
              if (d?.success && Array.isArray(d.sales)) {
                setSales((prev) => {
                  const serverMap = new Map(d.sales.map((ss: Sale) => [ss.id, ss]));
                  const merged = d.sales.map((serverSale: Sale) => {
                    const existing = prev.find((p) => p.id === serverSale.id);
                    return (existing?.items?.length && !serverSale.items?.length)
                      ? { ...serverSale, items: existing.items }
                      : serverSale;
                  });
                  const localOnly = prev.filter((p: any) => !serverMap.has(p.id) && (p.status === 'QUOTE' || p._pendingSync));
                  const fullMerged = [...localOnly, ...merged];
                  safeSetItem(`negociapro_sales${tenantKey}`, JSON.stringify(fullMerged));
                  return fullMerged;
                });
              }
            })
            .catch(() => {});
        })
        .catch((err) => console.warn('Falha ao excluir venda no Supabase:', err));
    }
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
        receiptSettings,
        updateReceiptSettings,
        // Financeiro & Contas a Receber
        receivables,
        paymentReceipts,
        cashSession,
        cashSessionsHistory,
        cashMovements,
        receivePayment,
        renegotiateReceivable,
        cancelReceivable,
        openCashRegister,
        addCashMovement,
        closeCashRegister,
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
        deleteProduct,
        bulkUpdateProducts,
        bulkDeleteProducts,
        bulkImportProducts,
        adjustStock,
        addProfessional,
        updateProfessional,
        deactivateProfessional,
        deleteProfessional,
        createSale,
        convertQuoteToSale,
        updateFinishedSale,
        saleAuditLogs,
        cancelSale,
        deleteSale,
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
