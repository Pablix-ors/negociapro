'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Profile, Company } from '@/types/database';
import { DEMO_COMPANY } from '@/lib/mockData';
import { createClient } from '@/lib/supabase/client';

interface AuthContextType {
  user: Profile | null;
  company: Company | null;
  role: 'ADMIN' | 'GERENTE' | 'VENDEDOR';
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; message?: string; needsEmailConfirmation?: boolean }>;
  signUp: (email: string, pass: string, companyName: string, fullName: string, cnpj?: string) => Promise<{ success: boolean; message?: string; requiresEmailConfirmation?: boolean }>;
  resetPassword: (email: string) => Promise<{ success: boolean; message?: string }>;
  updateUserPassword: (newPass: string) => Promise<{ success: boolean; message?: string }>;
  resendConfirmation: (email: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  updateCompany: (updated: Partial<Company>) => void;
  updateProfile: (updated: Partial<Profile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const syncAuth = useCallback(() => {
    if (typeof window === 'undefined') return;

    // 1. Verificar se existe sessão do Master (impersonation)
    const savedImpersonation = localStorage.getItem('negociapro_master_impersonated');
    const savedUser = localStorage.getItem('negociapro_user');
    const savedCompany = localStorage.getItem('negociapro_company');

    if (savedImpersonation) {
      try {
        const comp = JSON.parse(savedImpersonation);
        setCompany((prev) => (prev?.id === comp.id ? prev : comp));
        if (savedUser) {
          const u = JSON.parse(savedUser);
          setUser((prev) => (prev?.id === u.id && prev?.email === u.email ? prev : u));
        } else {
          setUser((prev) => (prev?.id === 'master-primary-001' ? prev : {
            id: 'master-primary-001',
            company_id: comp.id,
            name: 'Pablix (Suporte Master)',
            email: 'pablixgamezgg@gmail.com',
            role: 'ADMIN',
            active: true,
          }));
        }
        setIsLoading(false);
        return;
      } catch {}
    }

    // 2. Verificar estado salvo no localStorage
    if (savedUser && savedCompany) {
      try {
        const parsedUser: Profile = JSON.parse(savedUser);
        const parsedComp: Company = JSON.parse(savedCompany);
        setUser((prev) => (prev?.id === parsedUser.id && prev?.email === parsedUser.email ? prev : parsedUser));
        setCompany((prev) => (prev?.id === parsedComp.id ? prev : parsedComp));
      } catch {
        setUser(null);
        setCompany(null);
      }
    } else {
      setUser(null);
      setCompany(null);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    syncAuth();
    window.addEventListener('storage', syncAuth);

    // Escutar mudanças oficiais de sessão do Supabase Auth
    try {
      const supabase = createClient();
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setCompany(null);
          localStorage.removeItem('negociapro_user');
          localStorage.removeItem('negociapro_company');
        } else if (session?.user) {
          // Se houver usuário no Supabase mas não no state local, reconciliar
          setUser((prev) => {
            if (prev) return prev;
            const savedUser = localStorage.getItem('negociapro_user');
            if (savedUser) {
              try {
                return JSON.parse(savedUser);
              } catch {}
            }
            return null;
          });
        }
      });

      return () => {
        window.removeEventListener('storage', syncAuth);
        authListener?.subscription?.unsubscribe();
      };
    } catch {
      return () => {
        window.removeEventListener('storage', syncAuth);
      };
    }
  }, [syncAuth]);

  const login = async (
    email: string,
    pass: string
  ): Promise<{ success: boolean; message?: string; needsEmailConfirmation?: boolean }> => {
    setIsLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();

      // Chamada à rota segura de autenticação no backend
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: pass }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setIsLoading(false);
        return {
          success: false,
          needsEmailConfirmation: data.needsEmailConfirmation,
          message: data.message || 'Credenciais inválidas.',
        };
      }

      // Sincronizar sessão oficial no Supabase Client do navegador se houver sessão
      if (data.session) {
        try {
          const supabase = createClient();
          await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });
        } catch (sessErr) {
          console.warn('Erro ao sincronizar sessão no client Supabase:', sessErr);
        }
      }

      const loggedUser: Profile = data.user;
      const loggedCompany: Company = data.company || DEMO_COMPANY;

      setUser(loggedUser);
      setCompany(loggedCompany);
      localStorage.setItem('negociapro_user', JSON.stringify(loggedUser));
      localStorage.setItem('negociapro_company', JSON.stringify(loggedCompany));

      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      console.error('Erro no login:', err);
      setIsLoading(false);
      return { success: false, message: 'Não foi possível conectar ao servidor. Tente novamente.' };
    }
  };

  const signUp = async (
    email: string,
    pass: string,
    companyName: string,
    fullName: string,
    cnpj?: string
  ): Promise<{ success: boolean; message?: string; requiresEmailConfirmation?: boolean }> => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: pass,
          companyName: companyName.trim(),
          userName: fullName.trim(),
          cnpj: cnpj || '',
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        return {
          success: false,
          message: data.message || 'Erro ao realizar cadastro.',
        };
      }

      return {
        success: true,
        requiresEmailConfirmation: true,
        message: data.message || 'Cadastro realizado com sucesso! Enviamos um link de confirmação para o seu e-mail.',
      };
    } catch (err: any) {
      return {
        success: false,
        message: 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
      };
    }
  };

  const resendConfirmation = async (email: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/auth/reenviar-confirmacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();
      return {
        success: data.success,
        message: data.message || 'Solicitação enviada com sucesso.',
      };
    } catch (err: any) {
      return {
        success: false,
        message: 'Falha ao solicitar reenvio de confirmação.',
      };
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/auth/recuperar-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();
      return {
        success: data.success,
        message: data.message || 'Link seguro enviado com sucesso para seu e-mail.',
      };
    } catch {
      return {
        success: false,
        message: 'Não foi possível conectar ao servidor. Tente novamente.',
      };
    }
  };

  const updateUserPassword = async (newPass: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPass,
      });

      if (error) {
        // Fallback pelo backend caso o usuário esteja redefinindo via token
        const res = await fetch('/api/users/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user?.id,
            email: user?.email,
            newPassword: newPass,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          return { success: false, message: data.message || error.message };
        }
      }

      return { success: true, message: 'Sua senha foi redefinida com sucesso!' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Erro ao alterar senha.' };
    }
  };

  const logout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Erro ao chamar supabase.auth.signOut():', e);
    } finally {
      setUser(null);
      setCompany(null);
      localStorage.removeItem('negociapro_user');
      localStorage.removeItem('negociapro_company');
      localStorage.removeItem('negociapro_master_impersonated');
    }
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
        resendConfirmation,
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
