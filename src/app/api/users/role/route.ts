import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getAdminClient() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function PATCH(request: Request) {
  try {
    const { userId, email, newRole, requesterRole } = await request.json();

    if (!newRole || !['ADMIN', 'GERENTE', 'VENDEDOR'].includes(newRole)) {
      return NextResponse.json(
        { success: false, message: 'Perfil de acesso inválido.' },
        { status: 400 }
      );
    }

    if (requesterRole !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Apenas administradores podem alterar o cargo de usuários.' },
        { status: 403 }
      );
    }

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = getAdminClient();

      // 1. Atualizar na tabela profiles
      if (userId && !userId.startsWith('usr-')) {
        await supabase
          .from('profiles')
          .update({ role: newRole, updated_at: new Date().toISOString() })
          .eq('id', userId);
      } else if (email) {
        await supabase
          .from('profiles')
          .update({ role: newRole, updated_at: new Date().toISOString() })
          .eq('email', email.trim().toLowerCase());
      }

      // 2. Atualizar nos metadados do Supabase Auth se o usuário existir lá
      if (email) {
        const { data: userList } = await supabase.auth.admin.listUsers();
        const found = userList?.users?.find(
          (u) => u.email?.toLowerCase() === email.trim().toLowerCase()
        );
        if (found) {
          await supabase.auth.admin.updateUserById(found.id, {
            user_metadata: {
              ...found.user_metadata,
              role: newRole,
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Perfil alterado para ${newRole} com sucesso!`,
    });
  } catch (error: any) {
    console.error('Erro ao atualizar cargo de usuário:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Erro interno ao atualizar cargo.' },
      { status: 500 }
    );
  }
}
