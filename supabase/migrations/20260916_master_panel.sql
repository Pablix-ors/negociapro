-- ==============================================================================
-- NEGOCIAPRO - MIGRATION PAINEL MASTER ADMINISTRATIVO
-- ==============================================================================

-- 1. EXPANSÃO DA TABELA: COMPANIES (Status de Operação e Auditoria)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'status') THEN
        ALTER TABLE public.companies ADD COLUMN status VARCHAR(20) DEFAULT 'ATIVO' NOT NULL; -- 'ATIVO', 'INATIVO', 'BLOQUEADO'
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'blocked_reason') THEN
        ALTER TABLE public.companies ADD COLUMN blocked_reason TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'last_accessed_at') THEN
        ALTER TABLE public.companies ADD COLUMN last_accessed_at TIMESTAMPTZ;
    END IF;
END $$;

-- 2. TABELA: MASTER_USERS (Usuários da Plataforma Global)
CREATE TABLE IF NOT EXISTS public.master_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT,
    is_primary_master BOOLEAN DEFAULT false NOT NULL,
    active BOOLEAN DEFAULT true NOT NULL,
    must_change_password BOOLEAN DEFAULT true NOT NULL,
    permissions TEXT[] DEFAULT ARRAY[
        'MANAGE_ESTABLISHMENTS',
        'CREATE_ESTABLISHMENTS',
        'EDIT_ESTABLISHMENTS',
        'DELETE_ESTABLISHMENTS',
        'ACCESS_ESTABLISHMENTS',
        'MANAGE_MASTER_USERS',
        'VIEW_AUDIT',
        'MANAGE_SETTINGS'
    ]::TEXT[] NOT NULL,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 3. TABELA: MASTER_AUDIT_LOGS (Trilha de Auditoria Global)
CREATE TABLE IF NOT EXISTS public.master_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    master_user_id UUID REFERENCES public.master_users(id) ON DELETE SET NULL,
    master_email VARCHAR(255) NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    company_name VARCHAR(255),
    action VARCHAR(60) NOT NULL,
    description TEXT NOT NULL,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 4. TABELA: MASTER_SESSIONS (Controle de Sessões de Impersonation)
CREATE TABLE IF NOT EXISTS public.master_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    master_user_id UUID NOT NULL REFERENCES public.master_users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    ended_at TIMESTAMPTZ,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 5. ÍNDICES DE PERFORMANCE E CONSULTAS
CREATE INDEX IF NOT EXISTS idx_companies_status ON public.companies(status);
CREATE INDEX IF NOT EXISTS idx_master_audit_master_id ON public.master_audit_logs(master_user_id);
CREATE INDEX IF NOT EXISTS idx_master_audit_company_id ON public.master_audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_master_audit_action ON public.master_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_master_audit_created_at ON public.master_audit_logs(created_at DESC);
