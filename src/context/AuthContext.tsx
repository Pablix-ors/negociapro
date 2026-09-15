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
    // Simulação ou conexão Supabase
    const loggedUser: Profile = {
      ...DEMO_USER,
      email: email || DEMO_USER.email,
    };
    setUser(loggedUser);
    setCompany(DEMO_COMPANY);
    localStorage.setItem('negociapro_user', JSON.stringify(loggedUser));
    localStorage.setItem('negociapro_company', JSON.stringify(DEMO_COMPANY));
    setIsLoading(false);
    return true;
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
