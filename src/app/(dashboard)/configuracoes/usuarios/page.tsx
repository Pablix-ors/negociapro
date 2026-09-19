'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserCheck, Plus, Shield, User, Check, X, Trash2, AlertTriangle, Loader2, Send, RefreshCw } from 'lucide-react';
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
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('VENDEDOR');
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [resendingInviteEmail, setResendingInviteEmail] = useState<string | null>(null);

  const isDemo = !company || company.id === 'a0000000-0000-0000-0000-000000000001' || company.id === 'demo-company';
  const targetCompanyId = company?.id || user?.company_id || '';
  const tenantStorageKey = targetCompanyId ? `negociapro_users_list_tenant_${targetCompanyId}` : 'negociapro_users_list';

  // Carregar usuários salvos do banco Supabase e sincronizar com localStorage
  useEffect(() => {
    let isMounted = true;

    async function loadUsers() {
      // 1. Carregamento inicial rápido do cache local
      const raw = localStorage.getItem(tenantStorageKey);
      const generalRaw = localStorage.getItem('negociapro_users_list');
      let cached: Profile[] = [];
      if (raw) {
        try { cached = JSON.parse(raw); } catch {}
      } else if (generalRaw) {
        try {
          const parsed = JSON.parse(generalRaw);
          cached = parsed.filter((u: any) => !targetCompanyId || u.company_id === targetCompanyId);
        } catch {}
      }

      if (!isDemo && cached.length > 0) {
        const sanitized = cached.filter(u => u.company_id !== 'a0000000-0000-0000-0000-000000000001' && u.name !== 'Carlos Vendedor Master');
        if (isMounted) setUsersList(sanitized);
      } else if (isDemo) {
        if (isMounted) setUsersList(cached.length > 0 ? cached : DEFAULT_USERS);
      }

      // 2. Se não for demo e tiver targetCompanyId, buscar do banco de dados remoto
      if (!isDemo && targetCompanyId) {
        setLoadingUsers(true);
        try {
          const res = await fetch(`/api/users/list?companyId=${encodeURIComponent(targetCompanyId)}`);
          const data = await res.json();
          if (res.ok && data.success && Array.isArray(data.users)) {
            let serverUsers: Profile[] = data.users;

            // Se o usuário atual logado não estiver na lista retornada do banco, incluir
            if (user && !serverUsers.some(u => u.email.toLowerCase() === user.email.toLowerCase())) {
              serverUsers = [user, ...serverUsers];
            }

            // Mesclar também com usuários locais que ainda não foram sincronizados
            cached.forEach(locU => {
              if (!serverUsers.some(su => su.email.toLowerCase() === locU.email.toLowerCase())) {
                serverUsers.push(locU);
              }
            });

            if (isMounted) {
              setUsersList(serverUsers);
              localStorage.setItem(tenantStorageKey, JSON.stringify(serverUsers));
              localStorage.setItem('negociapro_users_list', JSON.stringify(serverUsers));
            }
          }
        } catch (err) {
          console.warn('Não foi possível sincronizar usuários com a nuvem:', err);
        } finally {
          if (isMounted) setLoadingUsers(false);
        }
      }
    }

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, [tenantStorageKey, targetCompanyId, isDemo, user]);

  const saveUsersState = (newList: Profile[]) => {
    setUsersList(newList);
    localStorage.setItem(tenantStorageKey, JSON.stringify(newList));
    localStorage.setItem('negociapro_users_list', JSON.stringify(newList));
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes('@')) return;

    const companyIdToUse = targetCompanyId || 'demo-company';
    const targetCompanyName = company?.trade_name || company?.name || 'Minha Empresa';

    const newUser: Profile = {
      id: `usr-${Date.now()}`,
      company_id: companyIdToUse,
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
          companyId: companyIdToUse,
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

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    if (!isAdmin) {
      setFeedbackMessage({ type: 'error', text: 'Apenas administradores podem excluir usuários.' });
      return;
    }

    // Não permitir que o usuário exclua a si mesmo diretamente
    if (user && (user.id === userToDelete.id || user.email.toLowerCase() === userToDelete.email.toLowerCase())) {
      setFeedbackMessage({ type: 'error', text: 'Você não pode excluir o seu próprio usuário logado.' });
      setUserToDelete(null);
      return;
    }

    setIsDeleting(true);

    try {
      // 1. Chamar API para remover do banco e auth
      await fetch('/api/users/list', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userToDelete.id,
          email: userToDelete.email,
          companyId: targetCompanyId,
          requesterRole: user?.role || 'ADMIN',
        }),
      });

      // 2. Atualizar estado local
      const updated = usersList.filter((u) => u.id !== userToDelete.id && u.email.toLowerCase() !== userToDelete.email.toLowerCase());
      saveUsersState(updated);
      setFeedbackMessage({ type: 'success', text: `Usuário ${userToDelete.name} excluído com sucesso!` });
    } catch {
      const updated = usersList.filter((u) => u.id !== userToDelete.id);
      saveUsersState(updated);
      setFeedbackMessage({ type: 'success', text: `Usuário ${userToDelete.name} removido da lista.` });
    } finally {
      setIsDeleting(false);
      setUserToDelete(null);
      setTimeout(() => setFeedbackMessage(null), 3500);
    }
  };

  const handleResendInvite = async (targetUser: Profile) => {
    if (!targetUser.email) return;
    setResendingInviteEmail(targetUser.email);

    try {
      const companyIdToUse = targetCompanyId || 'demo-company';
      const targetCompanyName = company?.trade_name || company?.name || 'Minha Empresa';

      const res = await fetch('/api/auth/convite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: targetUser.name,
          email: targetUser.email,
          role: targetUser.role,
          companyId: companyIdToUse,
          companyName: targetCompanyName,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedbackMessage({ type: 'success', text: `Convite reenviado com sucesso para ${targetUser.email} via Brevo!` });
      } else {
        setFeedbackMessage({ type: 'error', text: data.message || 'Erro ao reenviar convite via Brevo.' });
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: 'Falha na conexão ao reenviar convite.' });
    } finally {
      setResendingInviteEmail(null);
      setTimeout(() => setFeedbackMessage(null), 4500);
    }
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
              {usersList.map((u) => {
                const isOwnerAccount = company?.email && u.email.toLowerCase() === company.email.toLowerCase();
                const isSelf = user && (user.id === u.id || user.email.toLowerCase() === u.email.toLowerCase());

                return (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900">{u.name}</span>
                      {isOwnerAccount && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-purple-50 text-purple-700 border border-purple-200">
                          TITULAR
                        </span>
                      )}
                      {isSelf && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                          VOCÊ
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-slate-600 font-mono text-[11px]">{u.email}</td>
                  <td className="p-4">
                    {isAdmin && !isOwnerAccount ? (
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
                        {u.role} {isOwnerAccount ? '(DONO)' : ''}
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
                      <div className="flex items-center justify-center space-x-2">
                        {isOwnerAccount || isSelf ? (
                          <span className="text-[11px] text-slate-400 italic">Conta Principal</span>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleResendInvite(u)}
                              disabled={resendingInviteEmail === u.email}
                              className="inline-flex items-center space-x-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                              title="Reenviar e-mail de convite via Brevo"
                            >
                              {resendingInviteEmail === u.email ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <Send className="w-3 h-3" />
                              )}
                              <span>Reenviar Convite</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleUserStatus(u.id)}
                              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 underline cursor-pointer ml-1"
                            >
                              {u.active ? 'Desativar' : 'Reativar'}
                            </button>

                            <button
                              type="button"
                              onClick={() => setUserToDelete(u)}
                              className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Excluir este usuário"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium">Sem permissão</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Confirmar Exclusão de Usuário */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 border border-slate-100 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Excluir Usuário</h3>
                <p className="text-xs text-slate-500">Esta ação revoga o acesso deste colaborador.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
              <p className="font-bold text-slate-800">{userToDelete.name}</p>
              <p className="text-slate-500 font-mono text-[11px]">{userToDelete.email}</p>
              <p className="text-[11px] text-slate-600">
                Cargo atual: <strong className="text-blue-600">{userToDelete.role}</strong>
              </p>
            </div>

            <p className="text-xs text-slate-600">
              Tem certeza de que deseja remover este usuário da equipe? Ele não poderá mais acessar o sistema deste estabelecimento.
            </p>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteUser}
                className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-md shadow-rose-600/20 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirmar Exclusão</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
