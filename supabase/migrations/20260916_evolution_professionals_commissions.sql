-- ==============================================================================
-- NEGOCIAPRO - MIGRATION EVOLUÇÃO: PROFISSIONAIS, COMISSÕES E IMAGENS
-- Compatível com a estrutura multi-tenant existente (company_id)
-- ==============================================================================

-- 1. EXPANSÃO DA TABELA: PRODUCTS (Imagens e Regras de Comissão)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'image_url') THEN
        ALTER TABLE public.products ADD COLUMN image_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'commission_type') THEN
        ALTER TABLE public.products ADD COLUMN commission_type VARCHAR(20) DEFAULT 'NONE' NOT NULL; -- 'NONE', 'PERCENTAGE', 'FIXED'
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'commission_value') THEN
        ALTER TABLE public.products ADD COLUMN commission_value NUMERIC(12,2) DEFAULT 0.00 NOT NULL;
    END IF;
END $$;

-- 2. TABELA: PROFESSIONALS (Profissionais / Prestadores / Vendedores Responsáveis)
CREATE TABLE IF NOT EXISTS public.professionals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    document VARCHAR(30), -- CPF opcional
    phone VARCHAR(30),
    email VARCHAR(255),
    avatar_url TEXT,
    role_title VARCHAR(100) DEFAULT 'Profissional' NOT NULL,
    active BOOLEAN DEFAULT true NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 3. EXPANSÃO DA TABELA: SALES (Profissional Responsável e Total de Comissão)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'professional_id') THEN
        ALTER TABLE public.sales ADD COLUMN professional_id UUID REFERENCES public.professionals(id) ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'commission_total') THEN
        ALTER TABLE public.sales ADD COLUMN commission_total NUMERIC(14,2) DEFAULT 0.00 NOT NULL;
    END IF;
END $$;

-- 4. EXPANSÃO DA TABELA: SALE_ITEMS (Snapshots de Comissão por Item na Venda)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sale_items' AND column_name = 'commission_type_snapshot') THEN
        ALTER TABLE public.sale_items ADD COLUMN commission_type_snapshot VARCHAR(20) DEFAULT 'NONE' NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sale_items' AND column_name = 'commission_value_snapshot') THEN
        ALTER TABLE public.sale_items ADD COLUMN commission_value_snapshot NUMERIC(12,2) DEFAULT 0.00 NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sale_items' AND column_name = 'commission_amount') THEN
        ALTER TABLE public.sale_items ADD COLUMN commission_amount NUMERIC(14,2) DEFAULT 0.00 NOT NULL;
    END IF;
END $$;

-- 5. TABELA: COMMISSION_RECORDS (Histórico e Controle de Pagamento de Comissões)
CREATE TYPE public.commission_status AS ENUM ('PENDENTE', 'APROVADA', 'PAGA', 'CANCELADA');

CREATE TABLE IF NOT EXISTS public.commission_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE RESTRICT,
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    sale_number BIGINT NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    sale_date TIMESTAMPTZ NOT NULL,
    sale_total NUMERIC(14,2) NOT NULL,
    commission_amount NUMERIC(14,2) NOT NULL,
    status public.commission_status DEFAULT 'PENDENTE' NOT NULL,
    paid_at TIMESTAMPTZ,
    paid_by_name VARCHAR(255),
    paid_by_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    paid_amount NUMERIC(14,2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 6. ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_professionals_company ON public.professionals (company_id, active);
CREATE INDEX IF NOT EXISTS idx_sales_professional ON public.sales (company_id, professional_id);
CREATE INDEX IF NOT EXISTS idx_commissions_lookup ON public.commission_records (company_id, professional_id, status, sale_date DESC);

-- 7. ROW LEVEL SECURITY (RLS) MULTI-TENANT SEGURO
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_records ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'professionals' AND policyname = 'professionals_all'
    ) THEN
        CREATE POLICY "professionals_all" ON public.professionals FOR ALL USING (company_id = public.get_auth_company_id());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'commission_records' AND policyname = 'commission_records_all'
    ) THEN
        CREATE POLICY "commission_records_all" ON public.commission_records FOR ALL USING (company_id = public.get_auth_company_id());
    END IF;
END $$;

-- 8. STORAGE BUCKET PARA IMAGENS DE PRODUTOS E PROFISSIONAIS
INSERT INTO storage.buckets (id, name, public)
VALUES ('negociapro-media', 'negociapro-media', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public Access Media'
    ) THEN
        CREATE POLICY "Public Access Media" ON storage.objects FOR SELECT USING (bucket_id = 'negociapro-media');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated Upload Media'
    ) THEN
        CREATE POLICY "Authenticated Upload Media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'negociapro-media');
    END IF;
END $$;
