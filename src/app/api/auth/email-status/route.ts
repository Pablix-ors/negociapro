import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fakytcdlffdulvdmbjut.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getAdminClient() {
  return createClient(supabaseUrl, supabaseKey);
}

export async function POST(request: Request) {
  try {
    const { email, userId } = await request.json();

    if (!email && !userId) {
      return NextResponse.json(
        { success: false, message: 'Identificação do usuário não fornecida.' },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();
    let authUser = null;

    if (userId && !userId.startsWith('usr-')) {
      const { data } = await supabase.auth.admin.getUserById(userId);
      if (data?.user) {
        authUser = data.user;
      }
    }

    if (!authUser && email) {
      const cleanEmail = email.trim().toLowerCase();
      const { data: usersList } = await supabase.auth.admin.listUsers();
      authUser = usersList?.users?.find((u) => u.email?.toLowerCase() === cleanEmail) || null;
    }

    if (!authUser) {
      return NextResponse.json({
        success: true,
        verified: false,
        email: email || '',
        message: 'Usuário não localizado no sistema de autenticação.',
      });
    }

    const isVerified = Boolean(authUser.email_confirmed_at || authUser.confirmed_at);

    return NextResponse.json({
      success: true,
      verified: isVerified,
      email: authUser.email,
      confirmedAt: authUser.email_confirmed_at || authUser.confirmed_at || null,
      message: isVerified ? 'E-mail verificado com sucesso.' : 'E-mail pendente de confirmação.',
    });
  } catch (error: any) {
    console.error('Erro na rota /api/auth/email-status:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Erro ao consultar status do e-mail.' },
      { status: 500 }
    );
  }
}
