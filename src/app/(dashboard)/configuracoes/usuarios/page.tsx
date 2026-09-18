'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserCheck, Plus, Shield, User, Check, X } from 'lucide-react';
import { Profile, UserRole } from '@/types/database';

const DEFAULT_USERS: Profile[] = [
  {
    id: 'b0000000-0000-0000-0000-000000000001',
    company_id: 'a0000000-0000-0000-0000-000000000001',
    name: 'Carlos Vendedor Master',
    email: 'admin@negociapro.com.br',
    role: 'ADMIN',
    phone: '(11) 99999-8888',
    active: true,
  },
  {
    id: 'b0000000-0000-0000-0000-000000000002',
    company_id: 'a0000000-0000-0000-0000-000000000001',
    name: 'Fernanda Gerente Comercial',
    email: 'gerente@negociapro.com.br',
    role: 'GERENTE',
    phone: '(11) 98888-7777',
    active: true,
  },
  {
    id: 'b0000000-0000-0000-0000-000000000003',
    company_id: 'a0000000-0000-0000-0000-000000000001',
    name: 'Lucas Vendedor Externo',
    email: 'lucas.vendas@negociapro.com.br',
    role: 'VENDEDOR',
    phone: '(11) 97777-6666',
    active: true,
  },
];

export default function UsuariosConfigPage() {
  const { user, company } = useAuth();

  const [usersList, setUsersList] = useState<Profile[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('VENDEDOR');

  const isDemo = !company || company.id === 'a0000000-0000-0000-0000-000000000001' || company.id === 'demo-company';
  const tenantStorageKey = company?.id ? `negociapro_users_list_tenant_${company.id}` : 'negociapro_users_list';

  // Carregar usuários salvos do localStorage de acordo com a empresa
  useEffect(() => {
    const raw = localStorage.getItem(tenantStorageKey);
    if (raw) {
      try {
        const parsed: Profile[] = JSON.parse(raw);
        if (!isDemo) {
          const sanitized = parsed.filter(u => u.company_id !== 'a0000000-0000-0000-0000-000000000001' && u.name !== 'Carlos Vendedor Master');
          setUsersList(sanitized);
        } else {
          setUsersList(parsed);
        }
        return;
      } catch {}
    }
    
    // Se não for demo, começar apenas com o usuário atual autenticado ou vazio
    if (!isDemo) {
      const initialUsers: Profile[] = user ? [user] : [];
      setUsersList(initialUsers);
      localStorage.setItem(tenantStorageKey, JSON.stringify(initialUsers));
    } else {
      setUsersList(DEFAULT_USERS);
      localStorage.setItem(tenantStorageKey, JSON.stringify(DEFAULT_USERS));
    }
  }, [tenantStorageKey, isDemo, user]);

  const saveUsersState = (newList: Profile[]) => {
    setUsersList(newList);
    localStorage.setItem(tenantStorageKey, JSON.stringify(newList));
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes('@')) return;

    const targetCompanyId = company?.id || user?.company_id || 'demo-company';
    const targetCompanyName = company?.trade_name || company?.name || 'Minha Empresa';

    const newUser: Profile = {
      id: `usr-${Date.now()}`,
      company_id: targetCompanyId,
      name: newName || newEmail.split('@')[0],
      email: newEmail.trim().toLowerCase(),
      role: newRole,
      active: true,
    };
    saveUsersState([...usersList, newUser]);
    setShowModal(false);

    // Disparar convite oficial do Supabase Auth via Brevo SMTP
    try {
      await fetch('/api/auth/convite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          email: newEmail.trim(),
          role: newRole,
          companyId: targetCompanyId,
          companyName: targetCompanyName,
        }),
      });
      setFeedbackMessage({ type: 'success', text: `Convite enviado com sucesso para ${newEmail}!` });
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err) {
      console.error('Erro ao enviar convite:', err);
    }

    setNewName('');
    setNewEmail('');
  };

  const isAdmin = user?.role === 'ADMIN';
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleRoleChange = async (userId: string, userEmail: string, newRole: UserRole) => {
    if (!isAdmin) {
      setFeedbackMessage({ type: 'error', text: 'Apenas administradores podem alterar o cargo de usuários.' });
      setTimeout(() => setFeedbackMessage(null), 3000);
      return;
    }

    setUpdatingRoleId(userId);

    // 1. Atualizar imediatamente no estado local e localStorage
    const updated = usersList.map((u) => (u.id === userId ? { ...u, role: newRole } : u));
    saveUsersState(updated);

    // Se o usuário atual for o mesmo alterado, atualizar o contexto local
    if (user && (user.id === userId || user.email.toLowerCase() === userEmail.toLowerCase())) {
      const updatedProfile = { ...user, role: newRole };
      localStorage.setItem('negociapro_user', JSON.stringify(updatedProfile));
    }

    // 2. Persistir no Supabase via API backend
    try {
      const res = await fetch('/api/users/role', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          email: userEmail,
          newRole,
          requesterRole: user?.role || 'ADMIN',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedbackMessage({ type: 'success', text: `Cargo atualizado para ${newRole} com sucesso!` });
      } else {
        setFeedbackMessage({ type: 'error', text: data.message || 'Erro ao sincronizar novo cargo no servidor.' });
      }
    } catch {
      setFeedbackMessage({ type: 'success', text: `Cargo alterado localmente para ${newRole}.` });
    } finally {
      setUpdatingRoleId(null);
      setTimeout(() => setFeedbackMessage(null), 3500);
    }
  };

  const toggleUserStatus = (id: string) => {
    const updated = usersList.map((u) => (u.id === id ? { ...u, active: !u.active } : u));
    saveUsersState(updated);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Feedback Banner */}
      {feedbackMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between animate-in fade-in ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span>{feedbackMessage.text}</span>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Equipe e Perfis de Acesso (RBAC)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerencie administradores, gerentes e vendedores com permissões granulares por empresa.
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Convidar Usuário</span>
          </button>
        )}
      </div>

      {/* Cards de Permissões */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-50 text-rose-700">ADMIN</span>
          <p className="text-xs text-slate-600 mt-2 font-medium">
            Acesso total ao sistema, faturamento, relatórios, configurações de empresa e gestão de usuários.
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-50 text-indigo-700">GERENTE</span>
          <p className="text-xs text-slate-600 mt-2 font-medium">
            Supervisão de clientes, produtos, autorização de preços abaixo do mínimo e relatórios comerciais.
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-50 text-blue-700">VENDEDOR</span>
          <p className="text-xs text-slate-600 mt-2 font-medium">
            Cadastro de clientes, abertura de vendas e consulta instantânea do histórico de preços negociados.
          </p>
        </div>
      </div>

      {/* Tabela de Usuários */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="p-4">Nome do Usuário</th>
              <th className="p-4">E-mail</th>
              <th className="p-4">Perfil de Acesso</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {usersList.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-bold text-slate-900">{u.name}</td>
                <td className="p-4 text-slate-600">{u.email}</td>
                <td className="p-4">
                  {isAdmin ? (
                    <div className="inline-flex items-center space-x-1.5">
                      <select
                        value={u.role}
                        disabled={updatingRoleId === u.id}
                        onChange={(e) => handleRoleChange(u.id, u.email, e.target.value as UserRole)}
                        title="Alterar cargo deste colaborador"
                        className={`text-[11px] font-bold rounded-lg px-2.5 py-1 border cursor-pointer transition-all outline-hidden focus:ring-2 focus:ring-blue-500 ${
                          u.role === 'ADMIN'
                            ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100/70'
                            : u.role === 'GERENTE'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100/70'
                            : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100/70'
                        } ${updatingRoleId === u.id ? 'opacity-50 pointer-events-none' : ''}`}
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="GERENTE">GERENTE</option>
                        <option value="VENDEDOR">VENDEDOR</option>
                      </select>
                      {updatingRoleId === u.id && (
                        <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      )}
                    </div>
                  ) : (
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.role === 'ADMIN'
                          ? 'bg-rose-50 text-rose-700'
                          : u.role === 'GERENTE'
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {u.role}
                    </span>
                  )}
                </td>
                <td className="p-4 text-center">
                  {u.active ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                      Ativo
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                      Desativado
                    </span>
                  )}
                </td>
                <td className="p-4 text-center">
                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={() => toggleUserStatus(u.id)}
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                    >
                      {u.active ? 'Desativar' : 'Reativar'}
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-medium">Sem permissão</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Convidar Usuário */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-4">Adicionar Novo Membro</h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">E-mail</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Perfil de Acesso</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                >
                  <option value="VENDEDOR">VENDEDOR</option>
                  <option value="GERENTE">GERENTE</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs rounded-xl border border-slate-200 text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700"
                >
                  Salvar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
