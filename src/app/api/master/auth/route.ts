import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const PRIMARY_MASTER_EMAIL = 'pablixgamezgg@gmail.com';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fakytcdlffdulvdmbjut.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getAdminClient() {
  return createClient(supabaseUrl, supabaseKey);
}

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
      const supabase = getAdminClient();

      // Verificar se já existe registro com hash de senha customizada no banco
      const { data: dbMaster } = await supabase
        .from('master_users')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      let isPasswordValid = false;
      let mustChangePassword = false;

      if (dbMaster && dbMaster.password_hash) {
        // Se já definiu senha no banco
        isPasswordValid = (password === dbMaster.password_hash) || (password === initialMasterPass);
        mustChangePassword = dbMaster.must_change_password && password === initialMasterPass;
      } else {
        // Primeiro acesso: apenas a senha provisória oficial é aceita
        isPasswordValid = (password === initialMasterPass);
        mustChangePassword = true;
      }

      if (!isPasswordValid) {
        return NextResponse.json(
          { success: false, message: 'Senha incorreta para o usuário Master.' },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        isPrimaryMaster: true,
        masterUser: {
          id: dbMaster?.id || 'master-primary-001',
          name: dbMaster?.name || 'Pablix (Primary Master)',
          email: PRIMARY_MASTER_EMAIL,
          is_primary_master: true,
          active: true,
          must_change_password: mustChangePassword,
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
          created_at: dbMaster?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      });
    }

    // 2. Outros Masters cadastrados no banco
    const supabase = getAdminClient();
    const { data: userMaster } = await supabase
      .from('master_users')
      .select('*')
      .eq('email', cleanEmail)
      .eq('active', true)
      .maybeSingle();

    if (!userMaster || !userMaster.password_hash || userMaster.password_hash !== password) {
      return NextResponse.json(
        { success: false, message: 'Credenciais inválidas ou usuário Master inativo.' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      isPrimaryMaster: false,
      masterUser: {
        id: userMaster.id,
        name: userMaster.name,
        email: userMaster.email,
        is_primary_master: false,
        active: userMaster.active,
        must_change_password: userMaster.must_change_password,
        permissions: userMaster.permissions || [],
        last_login_at: new Date().toISOString(),
        created_at: userMaster.created_at,
        updated_at: userMaster.updated_at,
      },
    });
  } catch (error: any) {
    console.error('Erro na autenticação Master:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Erro na autenticação Master.' },
      { status: 500 }
    );
  }
}

// PUT: Atualizar senha do usuário Master
export async function PUT(request: Request) {
  try {
    const { email, newPassword } = await request.json();

    if (!email || !newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Nova senha inválida (mínimo 8 caracteres).' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const supabase = getAdminClient();

    // Upsert / Update na tabela master_users
    const { data: existingUser } = await supabase
      .from('master_users')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existingUser) {
      const { error: updateError } = await supabase
        .from('master_users')
        .update({
          password_hash: newPassword,
          must_change_password: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingUser.id);

      if (updateError) {
        console.error('Erro ao atualizar senha no Supabase:', updateError);
        return NextResponse.json({ success: false, message: updateError.message }, { status: 500 });
      }
    } else {
      // Criar usuário master inicial no banco caso ainda não exista
      const { error: insertError } = await supabase
        .from('master_users')
        .insert([{
          name: cleanEmail === PRIMARY_MASTER_EMAIL ? 'Pablix (Primary Master)' : 'Master Admin',
          email: cleanEmail,
          password_hash: newPassword,
          is_primary_master: cleanEmail === PRIMARY_MASTER_EMAIL,
          active: true,
          must_change_password: false,
        }]);

      if (insertError) {
        console.error('Erro ao registrar senha Master no Supabase:', insertError);
        return NextResponse.json({ success: false, message: insertError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, message: 'Senha atualizada com sucesso!' });
  } catch (error: any) {
    console.error('Erro ao atualizar senha Master:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Erro interno ao atualizar senha.' },
      { status: 500 }
    );
  }
}

