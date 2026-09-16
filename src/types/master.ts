export type MasterPermission =
  | 'MANAGE_ESTABLISHMENTS'
  | 'CREATE_ESTABLISHMENTS'
  | 'EDIT_ESTABLISHMENTS'
  | 'DELETE_ESTABLISHMENTS'
  | 'ACCESS_ESTABLISHMENTS'
  | 'MANAGE_MASTER_USERS'
  | 'VIEW_AUDIT'
  | 'MANAGE_SETTINGS';

export type CompanyStatus = 'ATIVO' | 'INATIVO' | 'BLOQUEADO';

export interface MasterUser {
  id: string;
  name: string;
  email: string;
  password_hash?: string;
  is_primary_master: boolean;
  active: boolean;
  must_change_password: boolean;
  permissions: MasterPermission[];
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
}

export type MasterAction =
  | 'LOGIN_MASTER'
  | 'LOGOUT_MASTER'
  | 'CHANGE_PASSWORD_MASTER'
  | 'CREATE_ESTABLISHMENT'
  | 'UPDATE_ESTABLISHMENT'
  | 'ACTIVATE_ESTABLISHMENT'
  | 'DISABLE_ESTABLISHMENT'
  | 'BLOCK_ESTABLISHMENT'
  | 'ACCESS_ESTABLISHMENT'
  | 'EXIT_ESTABLISHMENT'
  | 'CREATE_MASTER'
  | 'UPDATE_MASTER'
  | 'DISABLE_MASTER'
  | 'ENABLE_MASTER'
  | 'DELETE_MASTER'
  | 'UPDATE_SETTINGS';

export interface MasterAuditLog {
  id: string;
  master_user_id?: string | null;
  master_email: string;
  company_id?: string | null;
  company_name?: string | null;
  action: MasterAction;
  description: string;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}

export interface MasterSession {
  id: string;
  master_user_id: string;
  company_id: string;
  company_name: string;
  started_at: string;
  ended_at?: string | null;
  reason?: string | null;
}
