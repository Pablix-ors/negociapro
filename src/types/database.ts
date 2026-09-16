export type UserRole = 'ADMIN' | 'GERENTE' | 'VENDEDOR';
export type CustomerType = 'PF' | 'PJ';
export type SaleStatus = 'DRAFT' | 'COMPLETED' | 'CANCELLED';
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
  customer_id: string;
  customer?: Customer;
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
  notes?: string | null;
  sold_at: string;
  created_at: string;
  updated_at: string;
  items?: SaleItem[];
}

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
