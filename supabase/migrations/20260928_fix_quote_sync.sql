-- ==============================================================================
-- NEGOCIAPRO - FIX CRITICO: SINCRONIZACAO DE ORCAMENTOS ENTRE USUARIOS
-- Data: 2026-09-28
-- Problema: Status 'QUOTE' nao existia no ENUM sale_status do PostgreSQL.
--           O frontend tentava salvar orcamentos com status='QUOTE', mas o
--           Supabase rejeitava a gravacao silenciosamente, fazendo com que
--           orcamentos ficassem apenas no localStorage do dispositivo de quem
--           criou, sem sincronizar para outros usuarios da mesma empresa.
--
-- Solucao:
--   1. Adicionar 'QUOTE' ao ENUM public.sale_status
--   2. Adicionar colunas que o frontend usa mas nao existiam na tabela sales:
--      - payment_method_name (texto livre do metodo de pagamento)
--      - payment_type        (A_VISTA, A_PRAZO, PARCELADO)
--      - installments_count  (qtd. de parcelas)
--      - installments_plan   (JSON com as parcelas)
--      - converted_from_quote_id (rastreabilidade orcamento => venda)
-- ==============================================================================

-- 1. ADICIONAR 'QUOTE' AO ENUM sale_status
-- O ALTER TYPE ... ADD VALUE e seguro e nao exige lock de tabela em Postgres 9.1+
ALTER TYPE public.sale_status ADD VALUE IF NOT EXISTS 'QUOTE';

-- 2. ADICIONAR COLUNAS AUSENTES NA TABELA SALES
-- Todas as adicoes usam IF NOT EXISTS para idempotencia (safe re-run)

DO $$
BEGIN
    -- payment_method_name: texto livre como "Dinheiro", "Pix", "Boleto"
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'sales'
        AND column_name = 'payment_method_name'
    ) THEN
        ALTER TABLE public.sales ADD COLUMN payment_method_name VARCHAR(100);
    END IF;

    -- payment_type: tipo de pagamento
    -- Valores validos: 'A_VISTA', 'A_PRAZO', 'PARCELADO'
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'sales'
        AND column_name = 'payment_type'
    ) THEN
        ALTER TABLE public.sales ADD COLUMN payment_type VARCHAR(20) DEFAULT 'A_VISTA';
    END IF;

    -- installments_count: numero de parcelas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'sales'
        AND column_name = 'installments_count'
    ) THEN
        ALTER TABLE public.sales ADD COLUMN installments_count INT DEFAULT 1;
    END IF;

    -- installments_plan: plano de parcelas em JSON
    -- Estrutura esperada: [{ "number": 1, "due_date": "2026-10-15", "amount": 500.00 }, ...]
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'sales'
        AND column_name = 'installments_plan'
    ) THEN
        ALTER TABLE public.sales ADD COLUMN installments_plan JSONB;
    END IF;

    -- converted_from_quote_id: rastreabilidade de qual orcamento originou esta venda
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'sales'
        AND column_name = 'converted_from_quote_id'
    ) THEN
        ALTER TABLE public.sales ADD COLUMN converted_from_quote_id UUID REFERENCES public.sales(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. INDICE PARA CONSULTAS DE ORCAMENTOS
-- Facilita busca de orcamentos ativos por empresa (status = 'QUOTE')
CREATE INDEX IF NOT EXISTS idx_sales_company_status
    ON public.sales (company_id, status, sold_at DESC);

-- ==============================================================================
-- VALIDACAO FINAL
-- Apos aplicar esta migration, execute a query abaixo para confirmar:
--   SELECT unnest(enum_range(NULL::public.sale_status));
-- Deve retornar: DRAFT, COMPLETED, CANCELLED, QUOTE
-- ==============================================================================
