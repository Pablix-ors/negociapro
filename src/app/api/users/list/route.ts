import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fakytcdlffdulvdmbjut.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getAdminClient() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

// GET: Lista todos os usuários e profissionais da empresa
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ success: false, message: 'companyId é obrigatório' }, { status: 400 });
    }

    const supabase = getAdminClient();

    // 1. Buscar perfis na tabela profiles
    const { data: profiles, error: profError } = await supabase
      .from('profiles')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: true });

    if (profError) {
      console.warn('Erro ao buscar profiles no banco:', profError.message);
    }

    // 2. Buscar usuários do Supabase Auth para cruzar informações de email / confirmação
    let authUsersMap: Record<string, any> = {};
    try {
      const { data: authData } = await supabase.auth.admin.listUsers();
      if (authData?.users) {
        authData.users.forEach((u) => {
          if (u.email) {
            authUsersMap[u.email.toLowerCase()] = u;
          }
        });
      }
    } catch (authErr) {
      console.warn('Aviso ao listar auth users:', authErr);
    }

    // 3. Montar lista consolidada
    const combinedUsers = (profiles || []).map((p) => {
      const authUser = authUsersMap[p.email.toLowerCase()];
      return {
        id: p.id,
        company_id: p.company_id,
        name: p.name,
        email: p.email,
        role: p.role,
        phone: p.phone,
        active: p.active ?? true,
        email_confirmed_at: authUser?.email_confirmed_at || null,
      };
    });

    return NextResponse.json({
      success: true,
      users: combinedUsers,
    });
  } catch (error: any) {
    console.error('Erro na rota /api/users/list:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Erro interno ao listar usuários.' },
      { status: 500 }
    );
  }
}

// DELETE: Exclui um usuário da empresa (tanto da tabela profiles quanto do Supabase Auth se for o caso)
export async function DELETE(request: Request) {
  try {
    const { userId, email, companyId, requesterRole } = await request.json();

    if (requesterRole !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Apenas administradores podem excluir membros da equipe.' },
        { status: 403 }
      );
    }

    if (!userId && !email) {
      return NextResponse.json(
        { success: false, message: 'ID ou e-mail do usuário não informado.' },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    // 1. Remover do profiles
    if (userId && !userId.startsWith('usr-')) {
      await supabase.from('profiles').delete().eq('id', userId);
    } else if (email) {
      await supabase.from('profiles').delete().eq('email', email.trim().toLowerCase());
    }

    // 2. Remover também da tabela professionals (interligação automática)
    if (email) {
      const profQuery = supabase.from('professionals').delete().eq('email', email.trim().toLowerCase());
      if (companyId) {
        profQuery.eq('company_id', companyId);
      }
      await profQuery;
    }

    // 3. Se tiver no Auth, deletar ou desvincular
    if (email) {
      const { data: authData } = await supabase.auth.admin.listUsers();
      const authUser = authData?.users?.find(
        (u) => u.email?.toLowerCase() === email.trim().toLowerCase()
      );
      if (authUser) {
        // Se o usuário pertencia especificamente a esse tenant, pode remover do auth
        if (authUser.user_metadata?.company_id === companyId) {
          await supabase.auth.admin.deleteUser(authUser.id);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Usuário removido com sucesso!',
    });
  } catch (error: any) {
    console.error('Erro ao excluir usuário:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Erro interno ao remover usuário.' },
      { status: 500 }
    );
  }
}
