import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getAdminClient() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function POST(request: Request) {
  try {
    const { email, userId, newPassword } = await request.json();

    if (!newPassword || newPassword.trim().length < 6) {
      return NextResponse.json(
        { success: false, message: 'A nova senha deve ter no mínimo 6 caracteres.' },
        { status: 400 }
      );
    }

    if (!email && !userId) {
      return NextResponse.json(
        { success: false, message: 'Identificação de usuário não informada.' },
        { status: 400 }
      );
    }

    const cleanEmail = email ? email.trim().toLowerCase() : '';
    const cleanPassword = newPassword.trim();

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = getAdminClient();
      let targetAuthId = userId && !userId.startsWith('usr-') ? userId : null;

      if (!targetAuthId && cleanEmail) {
        const { data: userList } = await supabase.auth.admin.listUsers();
        const found = userList?.users?.find(
          (u) => u.email?.toLowerCase() === cleanEmail
        );
        if (found) {
          targetAuthId = found.id;
        }
      }

      if (targetAuthId) {
        const { error: updateErr } = await supabase.auth.admin.updateUserById(targetAuthId, {
          password: cleanPassword,
          email_confirm: true,
        });

        if (updateErr) {
          console.error('Erro ao redefinir senha no Supabase Auth:', updateErr);
          return NextResponse.json(
            { success: false, message: updateErr.message || 'Erro ao redefinir senha no Supabase.' },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Sua senha foi redefinida com sucesso!',
    });
  } catch (error: any) {
    console.error('Erro ao redefinir senha na rota /api/users/change-password:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Erro interno ao processar redefinição de senha.' },
      { status: 500 }
    );
  }
}
