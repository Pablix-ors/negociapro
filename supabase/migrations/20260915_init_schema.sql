-- ==============================================================================
-- NEGOCIAPRO - MIGRATION INICIAL MULTI-TENANT
-- Slogan: "Venda com histórico. Negocie com inteligência."
-- ==============================================================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELA: COMPANIES (Empresas Tenants)
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255),
    cnpj VARCHAR(20) UNIQUE,
    state_registration VARCHAR(50),
    municipal_registration VARCHAR(50),
    email VARCHAR(255),
    phone VARCHAR(30),
    whatsapp VARCHAR(30),
    website VARCHAR(255),
    logo_url TEXT,
    zip_code VARCHAR(15),
    street VARCHAR(255),
    number VARCHAR(30),
    complement VARCHAR(100),
    neighborhood VARCHAR(100),
    city VARCHAR(100),
    state VARCHAR(5),
    country VARCHAR(50) DEFAULT 'Brasil',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 3. TABELA: COMPANY_SETTINGS (Preferências Comerciais da Empresa)
CREATE TABLE IF NOT EXISTS public.company_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    currency VARCHAR(10) DEFAULT 'BRL' NOT NULL,
    decimal_places INT DEFAULT 2 NOT NULL,
    date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY' NOT NULL,
    number_format VARCHAR(20) DEFAULT 'pt-BR' NOT NULL,
    default_discount_pct NUMERIC(5,2) DEFAULT 0.00 NOT NULL,
    allow_sale_below_last_price BOOLEAN DEFAULT true NOT NULL,
    show_price_history_in_sale BOOLEAN DEFAULT true NOT NULL,
    price_history_limit INT DEFAULT 5 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    CONSTRAINT uq_company_settings UNIQUE (company_id)
);

-- 4. TABELA: PROFILES (Usuários vinculados a Auth & Empresa)
-- Perfis: ADMIN, GERENTE, VENDEDOR
CREATE TYPE public.user_role AS ENUM ('ADMIN', 'GERENTE', 'VENDEDOR');

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role public.user_role DEFAULT 'VENDEDOR' NOT NULL,
    phone VARCHAR(30),
    avatar_url TEXT,
    active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 5. TABELA: PRODUCT_CATEGORIES (Categorias de Produtos)
CREATE TABLE IF NOT EXISTS public.product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 6. TABELA: PRODUCTS (Produtos)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    barcode VARCHAR(100),
    unit VARCHAR(15) DEFAULT 'UN' NOT NULL,
    brand VARCHAR(150),
    description TEXT,
    cost_price NUMERIC(12,2) DEFAULT 0.00 NOT NULL,
    selling_price NUMERIC(12,2) DEFAULT 0.00 NOT NULL,
    min_price NUMERIC(12,2) DEFAULT 0.00 NOT NULL,
    current_stock NUMERIC(12,3) DEFAULT 0.000 NOT NULL,
    min_stock NUMERIC(12,3) DEFAULT 0.000 NOT NULL,
    active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 7. TABELA: CUSTOMERS (Clientes PF e PJ)
CREATE TYPE public.customer_type AS ENUM ('PF', 'PJ');

CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    type public.customer_type DEFAULT 'PF' NOT NULL,
    name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255),
    document VARCHAR(30) NOT NULL, -- CPF ou CNPJ
    state_registration VARCHAR(50),
    municipal_registration VARCHAR(50),
    birth_date DATE,
    email VARCHAR(255),
    phone VARCHAR(30),
    whatsapp VARCHAR(30),
    contact_person VARCHAR(150),
    zip_code VARCHAR(15),
    street VARCHAR(255),
    number VARCHAR(30),
    complement VARCHAR(100),
    neighborhood VARCHAR(100),
    city VARCHAR(100),
    state VARCHAR(5),
    notes TEXT,
    active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    CONSTRAINT uq_customer_document_per_company UNIQUE (company_id, document)
);

-- 8. TABELA: PAYMENT_METHODS (Formas de Pagamento)
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 9. TABELA: SALES (Vendas Comerciais)
CREATE TYPE public.sale_status AS ENUM ('DRAFT', 'COMPLETED', 'CANCELLED');

CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    sale_number BIGINT NOT NULL,
    status public.sale_status DEFAULT 'COMPLETED' NOT NULL,
    subtotal NUMERIC(14,2) DEFAULT 0.00 NOT NULL,
    discount NUMERIC(14,2) DEFAULT 0.00 NOT NULL,
    total NUMERIC(14,2) DEFAULT 0.00 NOT NULL,
    payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
    notes TEXT,
    sold_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    CONSTRAINT uq_sale_number_per_company UNIQUE (company_id, sale_number)
);

-- 10. TABELA: SALE_ITEMS (Itens da Venda)
CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity NUMERIC(12,3) NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
    discount NUMERIC(12,2) DEFAULT 0.00 NOT NULL CHECK (discount >= 0),
    total NUMERIC(14,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 11. TABELA: PRICE_HISTORY (Diferencial Principal: Histórico de Preços Negociados)
CREATE TABLE IF NOT EXISTS public.price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
    seller_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    quantity NUMERIC(12,3) NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    discount NUMERIC(12,2) DEFAULT 0.00 NOT NULL,
    final_unit_price NUMERIC(12,2) NOT NULL,
    total_price NUMERIC(14,2) NOT NULL,
    negotiation_date TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 12. TABELA: AUDIT_LOGS (Auditoria de Ações)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ==============================================================================
-- ÍNDICES DE ALTA PERFORMANCE (ESPECIALMENTE HISTÓRICO DE PREÇO)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_price_history_lookup 
    ON public.price_history (company_id, customer_id, product_id, negotiation_date DESC);

CREATE INDEX IF NOT EXISTS idx_customers_company_doc 
    ON public.customers (company_id, document);

CREATE INDEX IF NOT EXISTS idx_products_company_sku 
    ON public.products (company_id, sku);

CREATE INDEX IF NOT EXISTS idx_sales_company_sold_at 
    ON public.sales (company_id, sold_at DESC);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale 
    ON public.sale_items (sale_id);

-- ==============================================================================
-- FUNÇÃO E TRIGGER PARA NÚMERO SEQUENCIAL DA VENDA POR EMPRESA
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.generate_sale_number()
RETURNS TRIGGER AS $$
DECLARE
    next_num BIGINT;
BEGIN
    IF NEW.sale_number IS NULL OR NEW.sale_number = 0 THEN
        SELECT COALESCE(MAX(sale_number), 0) + 1 INTO next_num
        FROM public.sales
        WHERE company_id = NEW.company_id;
        NEW.sale_number := next_num;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sale_number ON public.sales;
CREATE TRIGGER trg_sale_number
BEFORE INSERT ON public.sales
FOR EACH ROW EXECUTE FUNCTION public.generate_sale_number();

-- ==============================================================================
-- TRIGGER PARA ATUALIZAR ESTOQUE E GERAR PRICE_HISTORY AO FINALIZAR VENDA
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.after_sale_item_insert_history()
RETURNS TRIGGER AS $$
DECLARE
    v_sale RECORD;
    v_final_unit_price NUMERIC(12,2);
BEGIN
    SELECT * INTO v_sale FROM public.sales WHERE id = NEW.sale_id;

    IF v_sale.status = 'COMPLETED' THEN
        -- Calcula preço unitário efetivo considerando desconto unitário
        v_final_unit_price := ROUND(NEW.unit_price - (NEW.discount / NULLIF(NEW.quantity, 0)), 2);
        IF v_final_unit_price IS NULL OR v_final_unit_price < 0 THEN
            v_final_unit_price := NEW.unit_price;
        END IF;

        -- Inserir no histórico de preços
        INSERT INTO public.price_history (
            company_id,
            customer_id,
            product_id,
            sale_id,
            seller_id,
            quantity,
            unit_price,
            discount,
            final_unit_price,
            total_price,
            negotiation_date,
            notes
        ) VALUES (
            v_sale.company_id,
            v_sale.customer_id,
            NEW.product_id,
            v_sale.id,
            v_sale.seller_id,
            NEW.quantity,
            NEW.unit_price,
            NEW.discount,
            v_final_unit_price,
            NEW.total,
            v_sale.sold_at,
            'Venda #' || v_sale.sale_number
        );

        -- Baixar estoque do produto
        UPDATE public.products 
        SET current_stock = current_stock - NEW.quantity,
            updated_at = TIMEZONE('utc', NOW())
        WHERE id = NEW.product_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_after_sale_item_insert ON public.sale_items;
CREATE TRIGGER trg_after_sale_item_insert
AFTER INSERT ON public.sale_items
FOR EACH ROW EXECUTE FUNCTION public.after_sale_item_insert_history();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) MULTI-TENANCY SEGURO
-- ==============================================================================
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper: Obter company_id do usuário logado
CREATE OR REPLACE FUNCTION public.get_auth_company_id()
RETURNS UUID AS $$
    SELECT company_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- POLÍTICAS: PROFILES
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (company_id = public.get_auth_company_id());
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (id = auth.uid() OR (company_id = public.get_auth_company_id() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'GERENTE'))));

-- POLÍTICAS: COMPANIES
CREATE POLICY "companies_select" ON public.companies FOR SELECT USING (id = public.get_auth_company_id());
CREATE POLICY "companies_update" ON public.companies FOR UPDATE USING (id = public.get_auth_company_id());

-- POLÍTICAS: COMPANY_SETTINGS
CREATE POLICY "company_settings_select" ON public.company_settings FOR SELECT USING (company_id = public.get_auth_company_id());
CREATE POLICY "company_settings_update" ON public.company_settings FOR UPDATE USING (company_id = public.get_auth_company_id());

-- POLÍTICAS: PRODUCT_CATEGORIES
CREATE POLICY "product_categories_all" ON public.product_categories FOR ALL USING (company_id = public.get_auth_company_id());

-- POLÍTICAS: PRODUCTS
CREATE POLICY "products_all" ON public.products FOR ALL USING (company_id = public.get_auth_company_id());

-- POLÍTICAS: CUSTOMERS
CREATE POLICY "customers_all" ON public.customers FOR ALL USING (company_id = public.get_auth_company_id());

-- POLÍTICAS: PAYMENT_METHODS
CREATE POLICY "payment_methods_all" ON public.payment_methods FOR ALL USING (company_id = public.get_auth_company_id());

-- POLÍTICAS: SALES
CREATE POLICY "sales_all" ON public.sales FOR ALL USING (company_id = public.get_auth_company_id());

-- POLÍTICAS: SALE_ITEMS
CREATE POLICY "sale_items_all" ON public.sale_items FOR ALL USING (company_id = public.get_auth_company_id());

-- POLÍTICAS: PRICE_HISTORY
CREATE POLICY "price_history_all" ON public.price_history FOR ALL USING (company_id = public.get_auth_company_id());

-- POLÍTICAS: AUDIT_LOGS
CREATE POLICY "audit_logs_all" ON public.audit_logs FOR ALL USING (company_id = public.get_auth_company_id());
