-- ==============================================================================
-- NEGOCIAPRO - FIX: RACE CONDITION NA GERAÇÃO DE SALE_NUMBER
-- Data: 2026-09-26
-- Problema: generate_sale_number usava MAX(sale_number) sem lock,
--            permitindo que dois INSERTs simultâneos gerassem o mesmo número.
-- Solução: Advisory Lock por company_id + SELECT FOR UPDATE para serializar.
-- ==============================================================================

-- 1. TABELA AUXILIAR DE CONTADORES POR EMPRESA (substitui o MAX() sem lock)
-- Esta tabela é a "única fonte de verdade" para o próximo sale_number.
CREATE TABLE IF NOT EXISTS public.sale_number_counters (
    company_id UUID PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
    last_sale_number BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 2. Inicializar contadores para empresas já existentes com base no maior sale_number atual
INSERT INTO public.sale_number_counters (company_id, last_sale_number)
SELECT
    company_id,
    COALESCE(MAX(sale_number), 0) as last_sale_number
FROM public.sales
GROUP BY company_id
ON CONFLICT (company_id) DO UPDATE
    SET last_sale_number = GREATEST(
        public.sale_number_counters.last_sale_number,
        EXCLUDED.last_sale_number
    ),
    updated_at = TIMEZONE('utc', NOW());

-- 3. RLS para a tabela de contadores
ALTER TABLE public.sale_number_counters ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'sale_number_counters'
        AND policyname = 'sale_number_counters_all'
    ) THEN
        CREATE POLICY "sale_number_counters_all"
            ON public.sale_number_counters
            FOR ALL
            USING (company_id = public.get_auth_company_id());
    END IF;
END $$;

-- 4. NOVA FUNÇÃO: generate_sale_number com Advisory Lock atômico
-- Usa pg_advisory_xact_lock para serializar geração do número por empresa.
-- O lock é automáticamente liberado no commit/rollback da transação.
CREATE OR REPLACE FUNCTION public.generate_sale_number()
RETURNS TRIGGER AS $$
DECLARE
    next_num BIGINT;
    company_hash BIGINT;
BEGIN
    -- Só processar se sale_number não foi fornecido ou é inválido
    IF NEW.sale_number IS NOT NULL AND NEW.sale_number > 0 THEN
        RETURN NEW;
    END IF;

    -- Gerar hash numérico do company_id para usar como chave de advisory lock
    -- Isso garante que cada empresa tem seu próprio lock (sem contenção cross-tenant)
    company_hash := ('x' || substr(NEW.company_id::text, 1, 16))::bit(64)::bigint;

    -- Lock exclusivo para esta empresa durante a transação inteira
    -- pg_advisory_xact_lock bloqueia outras transações que tentem o mesmo lock
    PERFORM pg_advisory_xact_lock(company_hash);

    -- Inserir ou atualizar o contador atomicamente
    INSERT INTO public.sale_number_counters (company_id, last_sale_number, updated_at)
    VALUES (NEW.company_id, 1, TIMEZONE('utc', NOW()))
    ON CONFLICT (company_id) DO UPDATE
        SET last_sale_number = public.sale_number_counters.last_sale_number + 1,
            updated_at = TIMEZONE('utc', NOW())
    RETURNING last_sale_number INTO next_num;

    NEW.sale_number := next_num;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Recriar o trigger (já existe, mas a função foi atualizada)
DROP TRIGGER IF EXISTS trg_sale_number ON public.sales;
CREATE TRIGGER trg_sale_number
    BEFORE INSERT ON public.sales
    FOR EACH ROW EXECUTE FUNCTION public.generate_sale_number();

-- 6. Índice de suporte para acelerar consultas de sale_number
CREATE INDEX IF NOT EXISTS idx_sales_company_sale_number
    ON public.sales (company_id, sale_number DESC);

-- ==============================================================================
-- COMENTÁRIOS DE DIAGNÓSTICO
-- ==============================================================================
-- ANTES (bugado):
--   SELECT COALESCE(MAX(sale_number), 0) + 1 INTO next_num
--   FROM public.sales WHERE company_id = NEW.company_id;
--   → Dois INSERTs paralelos ambos lêem MAX=4, ambos geram 5 → duplicata!
--
-- DEPOIS (corrigido):
--   pg_advisory_xact_lock() serializa os INSERTs por empresa.
--   INSERT ... ON CONFLICT DO UPDATE incrementa atomicamente o contador.
--   → Primeiro INSERT gera 5, segundo INSERT aguarda o lock e gera 6. ✓
-- ==============================================================================
