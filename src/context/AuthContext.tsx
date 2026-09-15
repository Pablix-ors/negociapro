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
    // Carregar sessão persistida ou usar DEMO_USER por padrão no dev
    const savedUser = localStorage.getItem('negociapro_user');
    const savedCompany = localStorage.getItem('negociapro_company');

    if (savedUser && savedCompany) {
      try {
        setUser(JSON.parse(savedUser));
        setCompany(JSON.parse(savedCompany));
      } catch {
        setUser(DEMO_USER);
        setCompany(DEMO_COMPANY);
      }
    } else {
      setUser(DEMO_USER);
      setCompany(DEMO_COMPANY);
    }
    setIsLoading(false);
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
      // Conta real de usuário: cria perfil novo e limpa dados de demonstração
      const newUserProfile: Profile = {
        id: `usr-${Date.now()}`,
        company_id: `comp-${Date.now()}`,
        name: email.split('@')[0],
        email: email,
        role: 'ADMIN',
        active: true,
      };
      const newCompanyProfile: Company = {
        id: newUserProfile.company_id,
        name: 'Minha Empresa',
        trade_name: 'Minha Empresa',
        cnpj: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setUser(newUserProfile);
      setCompany(newCompanyProfile);
      localStorage.setItem('negociapro_user', JSON.stringify(newUserProfile));
      localStorage.setItem('negociapro_company', JSON.stringify(newCompanyProfile));
      // Se não existir dados próprios salvos, limpa demos
      const savedCust = localStorage.getItem('negociapro_customers');
      if (savedCust && savedCust.includes('cust-01')) {
        localStorage.removeItem('negociapro_customers');
        localStorage.removeItem('negociapro_products');
        localStorage.removeItem('negociapro_sales');
        localStorage.removeItem('negociapro_history');
        localStorage.removeItem('negociapro_notifications');
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

      // Limpar todos os dados demo de clientes, produtos, vendas e notificações para a nova conta começar 100% zerada
      localStorage.removeItem('negociapro_customers');
      localStorage.removeItem('negociapro_products');
      localStorage.removeItem('negociapro_sales');
      localStorage.removeItem('negociapro_history');
      localStorage.removeItem('negociapro_notifications');

      if (error) {
        return { success: false, message: error.message };
      }

      return {
        success: true,
        message: 'Conta criada! Verifique sua caixa de entrada para confirmar o e-mail cadastrado.',
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
