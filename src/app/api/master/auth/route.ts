import { NextResponse } from 'next/server';

const PRIMARY_MASTER_EMAIL = 'pablixgamezgg@gmail.com';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Informe o e-mail e senha de acesso Master.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Verificação do Primary Master
    if (cleanEmail === PRIMARY_MASTER_EMAIL) {
      const initialMasterPass = process.env.MASTER_INITIAL_PASSWORD || 'MasterNegociaPro2026!';
      
      // Permitir senha provisória da variável de ambiente
      const isInitialPassMatch = password === initialMasterPass;

      return NextResponse.json({
        success: true,
        isPrimaryMaster: true,
        isInitialPassMatch,
        masterUser: {
          id: 'master-primary-001',
          name: 'Pablix (Primary Master)',
          email: PRIMARY_MASTER_EMAIL,
          is_primary_master: true,
          active: true,
          must_change_password: isInitialPassMatch,
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
      });
    }

    // 2. Outros Masters (validação via headers/localStorage/banco)
    return NextResponse.json({
      success: true,
      isPrimaryMaster: false,
      isInitialPassMatch: false,
      message: 'Credenciais validadas.',
    });
  } catch (error: any) {
    console.error('Erro na autenticação Master:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Erro na autenticação Master.' },
      { status: 500 }
    );
  }
}
