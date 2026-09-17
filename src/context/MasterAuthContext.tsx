'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { MasterUser, MasterPermission, MasterAuditLog, CompanyStatus } from '@/types/master';
import { Company } from '@/types/database';

interface MasterContextType {
  masterUser: MasterUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isPrimaryMaster: boolean;
  impersonatedCompany: Company | null;
  auditLogs: MasterAuditLog[];
  companies: Company[];
  loginMaster: (email: string, pass: string) => Promise<{ success: boolean; mustChangePass?: boolean; message?: string }>;
  logoutMaster: () => void;
  updateMasterPassword: (newPass: string) => Promise<{ success: boolean; message?: string }>;
  enterCompany: (company: Company, reason?: string) => void;
  exitCompany: () => void;
  createEstablishment: (companyData: Partial<Company>) => Company;
  updateEstablishment: (id: string, updatedFields: Partial<Company>) => void;
  setEstablishmentStatus: (id: string, status: CompanyStatus, reason?: string) => void;
  createMasterUser: (userData: Omit<MasterUser, 'id' | 'created_at' | 'updated_at' | 'is_primary_master'>) => MasterUser;
  updateMasterUser: (id: string, updatedFields: Partial<MasterUser>) => void;
  deleteMasterUser: (id: string) => boolean;
  addAuditLog: (action: MasterAuditLog['action'], description: string, companyId?: string, companyName?: string) => void;
}

const MasterContext = createContext<MasterContextType | undefined>(undefined);

const PRIMARY_MASTER_EMAIL = 'pablixgamezgg@gmail.com';

const DEFAULT_MASTER_USERS: MasterUser[] = [
  {
    id: 'master-01',
    name: 'Pablix (Primary Master)',
    email: PRIMARY_MASTER_EMAIL,
    is_primary_master: true,
    active: true,
    must_change_password: true,
    permissions: [
      'MANAGE_ESTABLISHMENTS',
      'CREATE_ESTABLISHMENTS',
      'EDIT_ESTABLISHMENTS',
      'DELETE_ESTABLISHMENTS',
      'ACCESS_ESTABLISHMENTS',
      'MANAGE_MASTER_USERS',
      'VIEW_AUDIT',
      'MANAGE_SETTINGS',
    ],
    last_login_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const INITIAL_COMPANIES_SEED: Company[] = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    name: 'Distribuidora Pro Comercial LTDA',
    trade_name: 'Distribuidora Pro',
    cnpj: '12.345.678/0001-90',
    email: 'contato@distribuidorapro.com.br',
    phone: '(11) 3456-7890',
    whatsapp: '(11) 98765-4321',
    city: 'São Paulo',
    state: 'SP',
    status: 'ATIVO',
    created_at: '2026-09-01T10:00:00Z',
    last_accessed_at: '2026-09-16T14:30:00Z',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000002',
    name: 'Comércio de Ferragens e Metais Silva ME',
    trade_name: 'Ferragens Silva',
    cnpj: '98.765.432/0001-10',
    email: 'vendas@ferragenssilva.com.br',
    phone: '(21) 2234-5678',
    whatsapp: '(21) 97654-3210',
    city: 'Rio de Janeiro',
    state: 'RJ',
    status: 'ATIVO',
    created_at: '2026-09-05T11:20:00Z',
    last_accessed_at: '2026-09-15T18:45:00Z',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000003',
    name: 'Autopeças & Acessórios Rodoviário EIRELI',
    trade_name: 'Rodoviário Peças',
    cnpj: '45.678.901/0001-23',
    email: 'financeiro@rodoviariopecas.com.br',
    phone: '(31) 3345-6789',
    city: 'Belo Horizonte',
    state: 'MG',
    status: 'INATIVO',
    created_at: '2026-09-10T09:15:00Z',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000004',
    name: 'Supermercado Central de Alimentos LTDA',
    trade_name: 'Central Alimentos',
    cnpj: '56.789.012/0001-34',
    email: 'diretoria@centralalimentos.com.br',
    phone: '(41) 3210-9876',
    city: 'Curitiba',
    state: 'PR',
    status: 'BLOQUEADO',
    blocked_reason: 'Inadimplência de mensalidade há mais de 45 dias.',
    created_at: '2026-08-15T08:00:00Z',
  },
];

const INITIAL_AUDIT_LOGS_SEED: MasterAuditLog[] = [
  {
    id: 'aud-1',
    master_user_id: 'master-01',
    master_email: PRIMARY_MASTER_EMAIL,
    action: 'LOGIN_MASTER',
    description: 'Login realizado com sucesso no Painel Master',
    ip_address: '127.0.0.1',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'aud-2',
    master_user_id: 'master-01',
    master_email: PRIMARY_MASTER_EMAIL,
    company_id: 'a0000000-0000-0000-0000-000000000001',
    company_name: 'Distribuidora Pro Comercial LTDA',
    action: 'ACCESS_ESTABLISHMENT',
    description: 'Iniciou acesso temporário (impersonation) ao estabelecimento',
    ip_address: '127.0.0.1',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
];

export function MasterAuthProvider({ children }: { children: React.ReactNode }) {
  const [masterUser, setMasterUser] = useState<MasterUser | null>(null);
  const [masterUsersList, setMasterUsersList] = useState<MasterUser[]>(DEFAULT_MASTER_USERS);
  const [companies, setCompanies] = useState<Company[]>(INITIAL_COMPANIES_SEED);
  const [auditLogs, setAuditLogs] = useState<MasterAuditLog[]>(INITIAL_AUDIT_LOGS_SEED);
  const [impersonatedCompany, setImpersonatedCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar dados reais diretamente do Supabase e sincronizar
  useEffect(() => {
    async function loadRealData() {
      try {
        const savedMaster = localStorage.getItem('negociapro_master_session');
        const savedMasterUsers = localStorage.getItem('negociapro_master_users');
        const savedImpersonation = localStorage.getItem('negociapro_master_impersonated');

        if (savedMasterUsers) setMasterUsersList(JSON.parse(savedMasterUsers));
        if (savedMaster) setMasterUser(JSON.parse(savedMaster));
        if (savedImpersonation) setImpersonatedCompany(JSON.parse(savedImpersonation));

        // 1. Buscar empresas reais do Supabase
        const compRes = await fetch('/api/master/estabelecimentos');
        if (compRes.ok) {
          const compData = await compRes.json();
          if (compData.success && compData.companies) {
            setCompanies(compData.companies);
            localStorage.setItem('negociapro_master_companies', JSON.stringify(compData.companies));
          }
        }

        // 2. Buscar logs reais de auditoria do Supabase
        const auditRes = await fetch('/api/master/auditoria');
        if (auditRes.ok) {
          const auditData = await auditRes.json();
          if (auditData.success && auditData.logs && auditData.logs.length > 0) {
            setAuditLogs(auditData.logs);
            localStorage.setItem('negociapro_master_audit', JSON.stringify(auditData.logs));
          }
        }
      } catch (e) {
        console.error('Erro ao recuperar dados do Supabase:', e);
      } finally {
        setIsLoading(false);
      }
    }

    loadRealData();
  }, []);

  const addAuditLog = (
    action: MasterAuditLog['action'],
    description: string,
    companyId?: string,
    companyName?: string
  ) => {
    const newLog: MasterAuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      master_user_id: masterUser?.id || 'master-01',
      master_email: masterUser?.email || PRIMARY_MASTER_EMAIL,
      company_id: companyId || null,
      company_name: companyName || null,
      action,
      description,
      ip_address: '127.0.0.1',
      user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
      created_at: new Date().toISOString(),
    };

    setAuditLogs((prev) => {
      const updated = [newLog, ...prev];
      localStorage.setItem('negociapro_master_audit', JSON.stringify(updated));
      return updated;
    });
  };

  const loginMaster = async (
    email: string,
    pass: string
  ): Promise<{ success: boolean; mustChangePass?: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/master/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        return { success: false, message: data.message || 'Credenciais inválidas.' };
      }

      // Verificar se a senha salva já foi alterada no navegador
      const storedChangedPass = localStorage.getItem(`master_pass_changed_${email.trim().toLowerCase()}`);
      const mustChange = storedChangedPass ? false : data.masterUser.must_change_password;

      const loggedMaster: MasterUser = {
        ...data.masterUser,
        must_change_password: mustChange,
        last_login_at: new Date().toISOString(),
      };

      setMasterUser(loggedMaster);
      localStorage.setItem('negociapro_master_session', JSON.stringify(loggedMaster));

      addAuditLog('LOGIN_MASTER', 'Autenticação realizada com sucesso no Painel Master');

      return {
        success: true,
        mustChangePass: mustChange,
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Erro de conexão com o servidor.' };
    }
  };

  const logoutMaster = () => {
    if (masterUser) {
      addAuditLog('LOGOUT_MASTER', 'Sessão Master finalizada');
    }
    setMasterUser(null);
    setImpersonatedCompany(null);
    localStorage.removeItem('negociapro_master_session');
    localStorage.removeItem('negociapro_master_impersonated');
  };

  const updateMasterPassword = async (newPass: string): Promise<{ success: boolean; message?: string }> => {
    if (!masterUser) return { success: false, message: 'Usuário não autenticado.' };

    if (newPass.length < 8) {
      return { success: false, message: 'A senha deve conter no mínimo 8 caracteres.' };
    }

    try {
      const res = await fetch('/api/master/auth', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: masterUser.email, newPassword: newPass }),
      });

      if (!res.ok) {
        const data = await res.json();
        return { success: false, message: data.message || 'Falha ao salvar nova senha.' };
      }
    } catch (e: any) {
      console.warn('Aviso: atualizando credencial master localmente:', e);
    }

    const updatedUser: MasterUser = {
      ...masterUser,
      must_change_password: false,
      updated_at: new Date().toISOString(),
    };

    setMasterUser(updatedUser);
    localStorage.setItem('negociapro_master_session', JSON.stringify(updatedUser));
    localStorage.setItem(`master_pass_changed_${masterUser.email.toLowerCase()}`, 'true');

    addAuditLog('CHANGE_PASSWORD_MASTER', 'Senha inicial alterada para senha pessoal definitiva');

    return { success: true, message: 'Senha alterada com sucesso!' };
  };

  // Impersonation: Acessar Estabelecimento Temporariamente
  const enterCompany = (company: Company, reason?: string) => {
    setImpersonatedCompany(company);
    localStorage.setItem('negociapro_master_impersonated', JSON.stringify(company));

    // Define a empresa no contexto normal para que o dashboard mostre os dados dela
    localStorage.setItem('negociapro_company', JSON.stringify(company));

    // Define o perfil ativo de usuário com a identidade real do Master Administrador
    const masterProfile = {
      id: masterUser?.id || 'master-primary-001',
      company_id: company.id,
      name: masterUser?.name ? `${masterUser.name} (Suporte Master)` : 'Pablix (Suporte Master)',
      email: masterUser?.email || PRIMARY_MASTER_EMAIL,
      role: 'ADMIN',
      active: true,
    };
    localStorage.setItem('negociapro_user', JSON.stringify(masterProfile));

    addAuditLog(
      'ACCESS_ESTABLISHMENT',
      `Iniciou acesso administrativo temporário ao estabelecimento (${reason || 'Auditoria / Suporte Master'})`,
      company.id,
      company.name
    );
  };

  const exitCompany = () => {
    if (impersonatedCompany) {
      addAuditLog(
        'EXIT_ESTABLISHMENT',
        'Encerrou acesso administrativo ao estabelecimento e retornou ao Painel Master',
        impersonatedCompany.id,
        impersonatedCompany.name
      );
    }
    setImpersonatedCompany(null);
    localStorage.removeItem('negociapro_master_impersonated');
    localStorage.removeItem('negociapro_company');
    localStorage.removeItem('negociapro_user');
  };

  // Gerenciamento de Estabelecimentos com persistência direta no Supabase
  const createEstablishment = (companyData: Partial<Company>): Company => {
    const tempId = `comp-${Date.now()}`;
    const newComp: Company = {
      id: tempId,
      name: companyData.name || 'Novo Estabelecimento',
      trade_name: companyData.trade_name || companyData.name,
      cnpj: companyData.cnpj || null,
      state_registration: companyData.state_registration || null,
      municipal_registration: companyData.municipal_registration || null,
      email: companyData.email || null,
      phone: companyData.phone || null,
      whatsapp: companyData.whatsapp || null,
      city: companyData.city || null,
      state: companyData.state || null,
      status: companyData.status || 'ATIVO',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updated = [newComp, ...companies];
    setCompanies(updated);
    localStorage.setItem('negociapro_master_companies', JSON.stringify(updated));

    // Salvar diretamente no Supabase em segundo plano
    fetch('/api/master/estabelecimentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newComp),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.company) {
          setCompanies((prev) => prev.map((c) => (c.id === tempId ? data.company : c)));
        }
      })
      .catch((err) => console.error('Erro ao sincronizar com Supabase:', err));

    addAuditLog(
      'CREATE_ESTABLISHMENT',
      `Novo estabelecimento cadastrado: ${newComp.name} (CNPJ: ${newComp.cnpj || 'Não inf.'})`,
      newComp.id,
      newComp.name
    );

    return newComp;
  };

  const updateEstablishment = (id: string, updatedFields: Partial<Company>) => {
    const updated = companies.map((c) => (c.id === id ? { ...c, ...updatedFields, updated_at: new Date().toISOString() } : c));
    setCompanies(updated);
    localStorage.setItem('negociapro_master_companies', JSON.stringify(updated));

    // Atualizar no Supabase
    fetch('/api/master/estabelecimentos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updatedFields }),
    }).catch((err) => console.error('Erro ao atualizar no Supabase:', err));

    const target = companies.find((c) => c.id === id);
    addAuditLog(
      'UPDATE_ESTABLISHMENT',
      `Dados do estabelecimento atualizados: ${target?.name || id}`,
      id,
      target?.name
    );
  };

  const setEstablishmentStatus = (id: string, status: CompanyStatus, reason?: string) => {
    const updated = companies.map((c) => {
      if (c.id === id) {
        return {
          ...c,
          status,
          blocked_reason: status === 'BLOQUEADO' ? reason || 'Bloqueado pela administração Master' : null,
          updated_at: new Date().toISOString(),
        };
      }
      return c;
    });

    setCompanies(updated);
    localStorage.setItem('negociapro_master_companies', JSON.stringify(updated));

    // Persistir status no Supabase
    fetch('/api/master/estabelecimentos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        status,
        blocked_reason: status === 'BLOQUEADO' ? reason || 'Bloqueado pela administração Master' : null,
      }),
    }).catch((err) => console.error('Erro ao atualizar status no Supabase:', err));

    const target = companies.find((c) => c.id === id);
    const action = status === 'ATIVO' ? 'ACTIVATE_ESTABLISHMENT' : status === 'BLOQUEADO' ? 'BLOCK_ESTABLISHMENT' : 'DISABLE_ESTABLISHMENT';
    addAuditLog(
      action,
      `Status do estabelecimento alterado para ${status}${reason ? ` (Motivo: ${reason})` : ''}`,
      id,
      target?.name
    );
  };

  // Gestão de Masters
  const createMasterUser = (userData: Omit<MasterUser, 'id' | 'created_at' | 'updated_at' | 'is_primary_master'>): MasterUser => {
    const newMaster: MasterUser = {
      ...userData,
      id: `master-${Date.now()}`,
      is_primary_master: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updated = [...masterUsersList, newMaster];
    setMasterUsersList(updated);
    localStorage.setItem('negociapro_master_users', JSON.stringify(updated));

    addAuditLog('CREATE_MASTER', `Novo usuário Master criado: ${newMaster.name} (${newMaster.email})`);
    return newMaster;
  };

  const updateMasterUser = (id: string, updatedFields: Partial<MasterUser>) => {
    const target = masterUsersList.find((m) => m.id === id);
    if (target?.is_primary_master && updatedFields.active === false) {
      throw new Error('O Primary Master não pode ser desativado.');
    }

    const updated = masterUsersList.map((m) => (m.id === id ? { ...m, ...updatedFields, updated_at: new Date().toISOString() } : m));
    setMasterUsersList(updated);
    localStorage.setItem('negociapro_master_users', JSON.stringify(updated));

    addAuditLog('UPDATE_MASTER', `Usuário Master atualizado: ${target?.name || id}`);
  };

  const deleteMasterUser = (id: string): boolean => {
    const target = masterUsersList.find((m) => m.id === id);
    if (target?.is_primary_master) {
      throw new Error('O Primary Master não pode ser excluído.');
    }

    const updated = masterUsersList.filter((m) => m.id !== id);
    setMasterUsersList(updated);
    localStorage.setItem('negociapro_master_users', JSON.stringify(updated));

    addAuditLog('DELETE_MASTER', `Usuário Master removido: ${target?.name || id}`);
    return true;
  };

  return (
    <MasterContext.Provider
      value={{
        masterUser,
        isAuthenticated: !!masterUser,
        isLoading,
        isPrimaryMaster: !!masterUser?.is_primary_master,
        impersonatedCompany,
        auditLogs,
        companies,
        loginMaster,
        logoutMaster,
        updateMasterPassword,
        enterCompany,
        exitCompany,
        createEstablishment,
        updateEstablishment,
        setEstablishmentStatus,
        createMasterUser,
        updateMasterUser,
        deleteMasterUser,
        addAuditLog,
      }}
    >
      {children}
    </MasterContext.Provider>
  );
}

export function useMaster() {
  const context = useContext(MasterContext);
  if (!context) {
    throw new Error('useMaster deve ser utilizado dentro de um MasterAuthProvider');
  }
  return context;
}
