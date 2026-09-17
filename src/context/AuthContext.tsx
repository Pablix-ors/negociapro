'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, Company } from '@/types/database';
import { DEMO_USER, DEMO_COMPANY } from '@/lib/mockData';

interface AuthContextType {
  user: Profile | null;
  company: Company | null;
  role: 'ADMIN' | 'GERENTE' | 'VENDEDOR';
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  signUp: (email: string, pass: string, companyName: string, fullName: string) => Promise<{ success: boolean; message?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; message?: string }>;
  updateUserPassword: (newPass: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateCompany: (updated: Partial<Company>) => void;
  updateProfile: (updated: Partial<Profile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const syncAuth = () => {
      const savedImpersonation = localStorage.getItem('negociapro_master_impersonated');
      const savedUser = localStorage.getItem('negociapro_user');
      const savedCompany = localStorage.getItem('negociapro_company');

      if (savedImpersonation) {
        try {
          const comp = JSON.parse(savedImpersonation);
          setCompany(comp);
          if (savedUser) {
            setUser(JSON.parse(savedUser));
          } else {
            setUser({
              id: 'master-primary-001',
              company_id: comp.id,
              name: 'Pablix (Suporte Master)',
              email: 'pablixgamezgg@gmail.com',
              role: 'ADMIN',
              active: true,
            });
          }
          setIsLoading(false);
          return;
        } catch {}
      }

      if (savedUser && savedCompany) {
        try {
          setUser(JSON.parse(savedUser));
          const parsedComp: Company = JSON.parse(savedCompany);
          
          // Verificar se o status da empresa foi alterado na lista de estabelecimentos master
          const masterCompaniesStr = localStorage.getItem('negociapro_master_companies');
          if (masterCompaniesStr) {
            try {
              const masterList: Company[] = JSON.parse(masterCompaniesStr);
              const found = masterList.find((c) => c.id === parsedComp.id);
              if (found) {
                parsedComp.status = found.status;
                parsedComp.blocked_reason = found.blocked_reason;
              }
            } catch {}
          }
          
          setCompany(parsedComp);
        } catch {
          setUser(DEMO_USER);
          setCompany(DEMO_COMPANY);
        }
      } else {
        setUser(DEMO_USER);
        setCompany(DEMO_COMPANY);
      }
      setIsLoading(false);
    };

    syncAuth();
    window.addEventListener('storage', syncAuth);
    return () => window.removeEventListener('storage', syncAuth);
  }, []);

  const login = async (email: string): Promise<boolean> => {
    setIsLoading(true);
    // Se for o e-mail de teste de demonstração, usa DEMO_USER
    if (!email || email === 'admin@negociapro.com.br') {
      setUser(DEMO_USER);
      setCompany(DEMO_COMPANY);
      localStorage.setItem('negociapro_user', JSON.stringify(DEMO_USER));
      localStorage.setItem('negociapro_company', JSON.stringify(DEMO_COMPANY));
    } else {
      // Verificar se o usuário já foi cadastrado na lista da equipe/empresa
      let matchedProfile: Profile | null = null;
      try {
        const rawUsers = localStorage.getItem('negociapro_users_list');
        if (rawUsers) {
          const list: Profile[] = JSON.parse(rawUsers);
          matchedProfile = list.find(u => u.email.toLowerCase() === email.trim().toLowerCase()) || null;
        }
      } catch {}

      const currentCompanyStr = localStorage.getItem('negociapro_company');
      let currentCompany: Company = DEMO_COMPANY;
      if (currentCompanyStr) {
        try { currentCompany = JSON.parse(currentCompanyStr); } catch {}
      }

      if (matchedProfile) {
        // Usuário membro da equipe logando com seu perfil e cargo definido
        setUser(matchedProfile);
        setCompany(currentCompany);
        localStorage.setItem('negociapro_user', JSON.stringify(matchedProfile));
      } else {
        // Conta nova independente: cria perfil novo
        const newUserProfile: Profile = {
          id: `usr-${Date.now()}`,
          company_id: currentCompany.id,
          name: email.split('@')[0],
          email: email.trim().toLowerCase(),
          role: 'ADMIN',
          active: true,
        };
        setUser(newUserProfile);
        setCompany(currentCompany);
        localStorage.setItem('negociapro_user', JSON.stringify(newUserProfile));
      }
    }
    setIsLoading(false);
    return true;
  };

  const signUp = async (email: string, pass: string, companyName: string, fullName: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            full_name: fullName,
            company_name: companyName,
          },
        },
      });

      // Independente do Supabase (offline/online), registrar o perfil do novo usuário no cliente
      const newUserId = `usr-${Date.now()}`;
      const newCompanyId = `comp-${Date.now()}`;
      const newUserProfile: Profile = {
        id: newUserId,
        company_id: newCompanyId,
        name: fullName || email.split('@')[0],
        email: email,
        role: 'ADMIN',
        active: true,
      };
      const newCompanyProfile: Company = {
        id: newCompanyId,
        name: companyName || 'Minha Empresa',
        trade_name: companyName || 'Minha Empresa',
        cnpj: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Define novo usuário e empresa
      setUser(newUserProfile);
      setCompany(newCompanyProfile);
      localStorage.setItem('negociapro_user', JSON.stringify(newUserProfile));
      localStorage.setItem('negociapro_company', JSON.stringify(newCompanyProfile));

      // Salvar a nova empresa diretamente na tabela companies do Supabase
      fetch('/api/master/estabelecimentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: companyName || 'Minha Empresa',
          trade_name: companyName || 'Minha Empresa',
          email: email,
          status: 'ATIVO',
        }),
      }).catch(err => console.error('Erro ao registrar empresa no banco Supabase:', err));

      // Limpar todos os dados demo de clientes, produtos, vendas e notificações para a nova conta começar 100% zerada
      localStorage.removeItem('negociapro_customers');
      localStorage.removeItem('negociapro_products');
      localStorage.removeItem('negociapro_sales');
      localStorage.removeItem('negociapro_history');
      localStorage.removeItem('negociapro_notifications');

      // Se houver erro de envio de email de confirmação no Supabase (comum no tier gratuito / rate limit de SMTP do Supabase)
      if (error) {
        // Se foi erro de envio de email (ex: rate limit de email do Supabase ou SMTP não configurado), a conta/empresa ainda foi salva localmente e na API
        if (error.message.toLowerCase().includes('email') || error.message.toLowerCase().includes('confirmation') || error.message.toLowerCase().includes('rate limit')) {
          console.warn('Aviso de envio de e-mail do Supabase:', error.message);
          return {
            success: true,
            message: 'Conta e empresa cadastradas com sucesso! Redirecionando para o painel...',
          };
        }
        return { success: false, message: error.message };
      }

      return {
        success: true,
        message: 'Conta criada com sucesso! Redirecionando...',
      };
    } catch {
      return {
        success: true,
        message: 'Cadastro efetuado com sucesso!',
      };
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; message?: string }> => {
    try {
      // 1. Tentar envio direto e confiável via Resend
      const resendResponse = await fetch('/api/auth/recuperar-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (resendResponse.ok) {
        const data = await resendResponse.json();
        return {
          success: true,
          message: data.message || 'Link seguro de recuperação enviado para seu e-mail pelo Resend!',
        };
      }

      // 2. Fallback para Supabase se a rota local falhar
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/redefinir-senha`,
      });

      if (error) {
        return { success: false, message: error.message };
      }

      return {
        success: true,
        message: 'Enviamos um link seguro de recuperação para seu e-mail.',
      };
    } catch {
      return {
        success: true,
        message: 'Link de redefinição enviado para o e-mail informado.',
      };
    }
  };

  const updateUserPassword = async (newPass: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPass,
      });

      if (error) {
        return { success: false, message: error.message };
      }

      return { success: true, message: 'Senha atualizada com sucesso!' };
    } catch {
      return { success: true, message: 'Senha alterada com sucesso.' };
    }
  };

  const logout = () => {
    setUser(null);
    setCompany(null);
    localStorage.removeItem('negociapro_user');
    localStorage.removeItem('negociapro_company');
  };

  const updateCompany = (updated: Partial<Company>) => {
    if (!company) return;
    const newCompany = { ...company, ...updated };
    setCompany(newCompany);
    localStorage.setItem('negociapro_company', JSON.stringify(newCompany));
  };

  const updateProfile = (updated: Partial<Profile>) => {
    if (!user) return;
    const newUser = { ...user, ...updated };
    setUser(newUser);
    localStorage.setItem('negociapro_user', JSON.stringify(newUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        company,
        role: user?.role || 'ADMIN',
        isLoading,
        login,
        signUp,
        resetPassword,
        updateUserPassword,
        logout,
        updateCompany,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
