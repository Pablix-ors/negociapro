'use client';

import React, { useState } from 'react';
import { useMaster } from '@/context/MasterAuthContext';
import { MasterUser, MasterPermission } from '@/types/master';
import {
  Users,
  Plus,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  AlertCircle,
  X,
  Check,
  Lock,
  Mail,
  User,
} from 'lucide-react';

const ALL_PERMISSIONS: { id: MasterPermission; label: string; desc: string }[] = [
  {
    id: 'MANAGE_ESTABLISHMENTS',
    label: 'Gerenciar Estabelecimentos',
    desc: 'Ativar, desativar, bloquear e alterar status de empresas.',
  },
  {
    id: 'CREATE_ESTABLISHMENTS',
    label: 'Cadastrar Estabelecimentos',
    desc: 'Criar novas empresas diretamente na plataforma.',
  },
  {
    id: 'EDIT_ESTABLISHMENTS',
    label: 'Editar Estabelecimentos',
    desc: 'Alterar dados cadastrais, CNPJ e contatos de empresas.',
  },
  {
    id: 'ACCESS_ESTABLISHMENTS',
    label: 'Acessar Estabelecimentos (Impersonation)',
    desc: 'Entrar administrativamente no painel de qualquer empresa.',
  },
  {
    id: 'MANAGE_MASTER_USERS',
    label: 'Gerenciar Usuários Master',
    desc: 'Criar e editar outros operadores Master da plataforma.',
  },
  {
    id: 'VIEW_AUDIT',
    label: 'Visualizar Auditoria',
    desc: 'Consultar logs e histórico detalhado de todas as ações Master.',
  },
  {
    id: 'MANAGE_SETTINGS',
    label: 'Configurações da Plataforma',
    desc: 'Modificar parâmetros globais do sistema.',
  },
];

export default function MasterUsuariosPage() {
  const {
    masterUser,
    isPrimaryMaster,
    createMasterUser,
    updateMasterUser,
    deleteMasterUser,
  } = useMaster();

  // Carregar lista de masters
  const [usersList, setUsersList] = useState<MasterUser[]>(() => {
    try {
      const saved = localStorage.getItem('negociapro_master_users');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'master-01',
        name: 'Pablix (Primary Master)',
        email: 'pablixgamezgg@gmail.com',
        is_primary_master: true,
        active: true,
        must_change_password: false,
        permissions: ALL_PERMISSIONS.map((p) => p.id),
        last_login_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingMaster, setEditingMaster] = useState<MasterUser | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<MasterPermission[]>([
    'MANAGE_ESTABLISHMENTS',
    'ACCESS_ESTABLISHMENTS',
    'VIEW_AUDIT',
  ]);
  const [error, setError] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingMaster(null);
    setName('');
    setEmail('');
    setSelectedPermissions(['MANAGE_ESTABLISHMENTS', 'ACCESS_ESTABLISHMENTS', 'VIEW_AUDIT']);
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (target: MasterUser) => {
    setEditingMaster(target);
    setName(target.name);
    setEmail(target.email);
    setSelectedPermissions(target.permissions || []);
    setError(null);
    setModalOpen(true);
  };

  const togglePermission = (perm: MasterPermission) => {
    if (selectedPermissions.includes(perm)) {
      setSelectedPermissions(selectedPermissions.filter((p) => p !== perm));
    } else {
      setSelectedPermissions([...selectedPermissions, perm]);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Nome e E-mail são obrigatórios.');
      return;
    }

    if (editingMaster) {
      updateMasterUser(editingMaster.id, {
        name,
        email,
        permissions: editingMaster.is_primary_master
          ? ALL_PERMISSIONS.map((p) => p.id)
          : selectedPermissions,
      });
      setUsersList((prev) =>
        prev.map((m) =>
          m.id === editingMaster.id
            ? {
                ...m,
                name,
                email,
                permissions: editingMaster.is_primary_master
                  ? ALL_PERMISSIONS.map((p) => p.id)
                  : selectedPermissions,
              }
            : m
        )
      );
    } else {
      const created = createMasterUser({
        name,
        email,
        active: true,
        must_change_password: true,
        permissions: selectedPermissions,
      });
      setUsersList((prev) => [...prev, created]);
    }

    setModalOpen(false);
  };

  const handleDelete = (target: MasterUser) => {
    if (target.is_primary_master) {
      alert('O Primary Master não pode ser excluído.');
      return;
    }

    if (confirm(`Tem certeza que deseja remover o usuário Master ${target.name}?`)) {
      deleteMasterUser(target.id);
      setUsersList((prev) => prev.filter((m) => m.id !== target.id));
    }
  };

  const handleToggleStatus = (target: MasterUser) => {
    if (target.is_primary_master) {
      alert('O Primary Master não pode ser desativado.');
      return;
    }

    const newStatus = !target.active;
    updateMasterUser(target.id, { active: newStatus });
    setUsersList((prev) =>
      prev.map((m) => (m.id === target.id ? { ...m, active: newStatus } : m))
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Usuários Master da Plataforma
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gerencie quem tem permissão administrativa global sobre o sistema e estabelecimentos.
          </p>
        </div>

        {isPrimaryMaster && (
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black transition-all shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Master</span>
          </button>
        )}
      </div>

      {/* Tabela de Usuários Master */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/60 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-4">Nome</th>
                <th className="p-4">E-mail</th>
                <th className="p-4">Tipo</th>
                <th className="p-4">Permissões</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {usersList.map((m) => (
                <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-bold text-white flex items-center space-x-2">
                    <span className="p-1.5 bg-slate-800 text-amber-400 rounded-lg">
                      <User className="w-4 h-4" />
                    </span>
                    <span>{m.name}</span>
                  </td>
                  <td className="p-4 text-slate-300 font-mono">{m.email}</td>
                  <td className="p-4">
                    {m.is_primary_master ? (
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-black bg-amber-500 text-slate-950 uppercase tracking-wider">
                        Primary Master
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        Master Delegado
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-slate-400">
                    {m.is_primary_master ? (
                      <span className="text-[11px] font-bold text-amber-400">Acesso Total Irrestrito</span>
                    ) : (
                      <span className="text-[11px]">{m.permissions?.length || 0} permissões ativas</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        m.active
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}
                    >
                      {m.active ? 'Ativo' : 'Desativado'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="inline-flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(m)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
                        title="Editar Master"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {!m.is_primary_master && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(m)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg transition-colors cursor-pointer"
                            title={m.active ? 'Desativar Master' : 'Ativar Master'}
                          >
                            {m.active ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(m)}
                            className="p-1.5 bg-slate-800 hover:bg-rose-950/60 text-rose-400 rounded-lg transition-colors cursor-pointer"
                            title="Excluir Master"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Criação / Edição de Master */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-800 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-base font-black text-white flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <span>{editingMaster ? 'Editar Usuário Master' : 'Novo Usuário Master'}</span>
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-rose-950/70 border border-rose-800 rounded-xl flex items-center space-x-2 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: João Silva Master"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">E-mail Corporativo *</label>
                <input
                  type="email"
                  required
                  disabled={!!editingMaster?.is_primary_master}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="master@plataforma.com.br"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
                />
              </div>

              {/* Permissões Granulares */}
              {!editingMaster?.is_primary_master && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">
                    Permissões Atribuídas
                  </label>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {ALL_PERMISSIONS.map((p) => {
                      const isChecked = selectedPermissions.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className="flex items-start space-x-2.5 p-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl cursor-pointer hover:bg-slate-800 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => togglePermission(p.id)}
                            className="mt-0.5 rounded border-slate-600 text-amber-500 focus:ring-amber-500"
                          />
                          <div>
                            <span className="text-xs font-bold text-white block">{p.label}</span>
                            <span className="text-[10px] text-slate-400 block">{p.desc}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center space-x-1.5 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Usuário Master</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
