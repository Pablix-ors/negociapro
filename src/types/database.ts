export type UserRole = 'ADMIN' | 'GERENTE' | 'VENDEDOR';
export type CustomerType = 'PF' | 'PJ';
export type SaleStatus = 'DRAFT' | 'COMPLETED' | 'CANCELLED' | 'QUOTE';
export type CommissionType = 'NONE' | 'PERCENTAGE' | 'FIXED';
export type CommissionStatus = 'PENDENTE' | 'APROVADA' | 'PAGA' | 'CANCELADA';

export interface Company {
  id: string;
  name: string;
  trade_name?: string | null;
  cnpj?: string | null;
  state_registration?: string | null;
  municipal_registration?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  website?: string | null;
  logo_url?: string | null;
  zip_code?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string;
  status?: 'ATIVO' | 'INATIVO' | 'BLOQUEADO';
  blocked_reason?: string | null;
  last_accessed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CompanySettings {
  id: string;
  company_id: string;
  currency: string;
  decimal_places: number;
  date_format: string;
  number_format: string;
  default_discount_pct: number;
  allow_sale_below_last_price: boolean;
  show_price_history_in_sale: boolean;
  price_history_limit: number;
}

export interface Profile {
  id: string;
  company_id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string | null;
  avatar_url?: string | null;
  active: boolean;
  company?: Company;
}

export interface Professional {
  id: string;
  company_id: string;
  name: string;
  document?: string | null; // CPF opcional
  phone?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  role_title: string;
  active: boolean;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  // Métricas agregadas
  sales_count?: number;
  total_sales?: number;
  commission_earned?: number;
  commission_paid?: number;
  commission_pending?: number;
}

export interface ProductCategory {
  id: string;
  company_id: string;
  name: string;
  description?: string | null;
}

export interface Product {
  id: string;
  company_id: string;
  category_id?: string | null;
  category?: ProductCategory;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  unit: string;
  brand?: string | null;
  description?: string | null;
  cost_price: number;
  selling_price: number;
  min_price: number;
  current_stock: number;
  min_stock: number;
  active: boolean;
  image_url?: string | null;
  commission_type: CommissionType;
  commission_value: number;
  created_at?: string;
  updated_at?: string;
}

export interface Customer {
  id: string;
  company_id: string;
  type: CustomerType;
  name: string;
  trade_name?: string | null;
  document: string; // CPF ou CNPJ
  state_registration?: string | null;
  municipal_registration?: string | null;
  birth_date?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  contact_person?: string | null;
  zip_code?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  registration_status?: string | null;
  cnae?: string | null;
  notes?: string | null;
  active: boolean;
  created_at?: string;
  updated_at?: string;
  // Métricas agregadas
  total_purchased?: number;
  orders_count?: number;
  last_purchase_date?: string | null;
}

export interface PaymentMethod {
  id: string;
  company_id: string;
  name: string;
  active: boolean;
}

export interface SaleItem {
  id?: string;
  sale_id?: string;
  company_id: string;
  product_id: string;
  product?: Product;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
  // Snapshots de comissão imutáveis
  commission_type_snapshot?: CommissionType;
  commission_value_snapshot?: number;
  commission_amount?: number;
}

export interface Sale {
  id: string;
  company_id: string;
  customer_id?: string | null;
  customer?: Customer | null;
  seller_id: string;
  seller?: Profile;
  professional_id?: string | null;
  professional?: Professional;
  sale_number: number;
  status: SaleStatus;
  subtotal: number;
  discount: number;
  total: number;
  commission_total: number;
  payment_method_id?: string | null;
  payment_method?: PaymentMethod;
  payment_method_name?: string | null;
  // Estrutura de parcelamento / prazo
  payment_type?: 'A_VISTA' | 'A_PRAZO' | 'PARCELADO';
  installments_count?: number;
  installments_plan?: Array<{
    number: number;
    due_date: string;
    amount: number;
  }>;
  converted_from_quote_id?: string | null;
  notes?: string | null;
  sold_at: string;
  created_at: string;
  updated_at: string;
  items?: SaleItem[];
}

export type ReceivableStatus = 'OPEN' | 'DUE_TODAY' | 'OVERDUE' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED' | 'RENEGOTIATED';

export interface AccountReceivable {
  id: string;
  company_id: string;
  sale_id: string;
  sale_number: number;
  customer_id: string;
  customer_name: string;
  customer_document?: string | null;
  professional_id?: string | null;
  professional_name?: string | null;
  installment_number: number;
  total_installments: number;
  due_date: string; // YYYY-MM-DD
  original_amount: number;
  discount_amount: number;
  interest_amount: number;
  paid_amount: number;
  balance: number; // Saldo em aberto
  status: ReceivableStatus;
  payment_method_predicted?: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentReceiptRecord {
  id: string;
  company_id: string;
  receivable_id: string;
  sale_id: string;
  sale_number: number;
  customer_id: string;
  customer_name: string;
  payment_date: string;
  amount_paid: number;
  payment_method: string;
  cash_session_id?: string | null;
  user_id?: string | null;
  user_name?: string | null;
  notes?: string | null;
  created_at: string;
}

export type CashMovementType = 'ENTRADA' | 'SAÍDA';

export type CashMovementCategory =
  | 'SALDO_INICIAL'
  | 'VENDA_A_VISTA'
  | 'RECEBIMENTO_CONTA'
  | 'SUPRIMENTO'
  | 'SANGRIA'
  | 'DESPESA'
  | 'AJUSTE_POSITIVO'
  | 'AJUSTE_NEGATIVO';

export interface CashMovement {
  id: string;
  company_id: string;
  cash_session_id: string;
  timestamp: string;
  type: CashMovementType;
  category: CashMovementCategory;
  description: string;
  origin: 'VENDA' | 'CONTA_A_RECEBER' | 'MANUAL' | 'ABERTURA_CAIXA';
  reference_id?: string | null;
  payment_method: string;
  amount: number;
  current_balance_after: number;
  user_id?: string | null;
  user_name?: string | null;
  notes?: string | null;
}

export interface CashRegisterSession {
  id: string;
  company_id: string;
  name: string;
  opened_at: string;
  closed_at?: string | null;
  opened_by_user_id?: string | null;
  opened_by_name?: string | null;
  closed_by_user_id?: string | null;
  closed_by_name?: string | null;
  initial_balance: number;
  total_inflows: number;
  total_outflows: number;
  expected_balance: number;
  counted_balance?: number | null;
  difference?: number | null;
  difference_type?: 'CORRECT' | 'SHORTAGE' | 'SURPLUS' | null;
  status: 'OPEN' | 'CLOSED';
  notes?: string | null;
}

export type ReceiptTemplateType = 'A4' | 'THERMAL_80';

export interface ReceiptSettings {
  template_default: ReceiptTemplateType;
  use_custom_logo: boolean;
  show_company_name: boolean;
  show_cnpj_cpf: boolean;
  show_address: boolean;
  show_phone: boolean;
  show_email: boolean;
  show_customer: boolean;
  show_customer_document: boolean;
  show_seller: boolean;
  show_product_code: boolean;
  show_notes: boolean;
  show_payment_method: boolean;
  footer_message: string;
}

export const DEFAULT_RECEIPT_SETTINGS: ReceiptSettings = {
  template_default: 'A4',
  use_custom_logo: true,
  show_company_name: true,
  show_cnpj_cpf: true,
  show_address: true,
  show_phone: true,
  show_email: true,
  show_customer: true,
  show_customer_document: true,
  show_seller: true,
  show_product_code: true,
  show_notes: true,
  show_payment_method: true,
  footer_message: 'Obrigado pela preferência!',
};

export interface CommissionRecord {
  id: string;
  company_id: string;
  professional_id: string;
  professional_name: string;
  sale_id: string;
  sale_number: number;
  customer_id?: string | null;
  customer_name?: string | null;
  sale_date: string;
  sale_total: number;
  commission_amount: number;
  status: CommissionStatus;
  paid_at?: string | null;
  paid_by_name?: string | null;
  paid_amount?: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PriceHistoryRecord {
  id: string;
  company_id: string;
  customer_id: string;
  product_id: string;
  sale_id?: string | null;
  seller_id?: string | null;
  seller_name?: string;
  quantity: number;
  unit_price: number;
  discount: number;
  final_unit_price: number;
  total_price: number;
  negotiation_date: string;
  notes?: string | null;
}

export interface PriceHistorySummary {
  last_price: number | null;
  last_negotiation_date: string | null;
  last_quantity: number | null;
  last_seller_name: string | null;
  min_price: number | null;
  max_price: number | null;
  avg_price: number | null;
  history: PriceHistoryRecord[];
}

export interface SaleAuditLog {
  id: string;
  company_id: string;
  sale_id: string;
  sale_number: number;
  user_id?: string | null;
  user_name: string;
  action: 'CREATE' | 'EDIT' | 'CANCEL' | 'CONVERT_QUOTE';
  description: string;
  reason?: string | null;
  previous_state?: any;
  new_state?: any;
  created_at: string;
}

