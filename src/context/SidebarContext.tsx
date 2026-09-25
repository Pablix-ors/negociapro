'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface SidebarContextType {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  expandSidebar: () => void;
  collapseSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Carregar preferência salva do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('negociapro_sidebar_collapsed');
      if (saved !== null) {
        setIsCollapsed(saved === 'true');
      }
    } catch {
      // Ignorar erros de storage
    }
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('negociapro_sidebar_collapsed', String(next));
      } catch {
        // Ignorar
      }
      return next;
    });
  };

  const expandSidebar = () => {
    setIsCollapsed(false);
    try {
      localStorage.setItem('negociapro_sidebar_collapsed', 'false');
    } catch {}
  };

  const collapseSidebar = () => {
    setIsCollapsed(true);
    try {
      localStorage.setItem('negociapro_sidebar_collapsed', 'true');
    } catch {}
  };

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        toggleSidebar,
        expandSidebar,
        collapseSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar deve ser usado dentro de um SidebarProvider');
  }
  return context;
}
