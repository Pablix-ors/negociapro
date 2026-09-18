import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fakytcdlffdulvdmbjut.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getAdminClient() {
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Endpoint de Callback/Confirmação de E-mail do Supabase Auth
 * Trata confirmação de cadastro (signup), recuperação de senha (recovery) e convite (invite)
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as 'signup' | 'recovery' | 'invite' | 'email_change' | null;
  const next = searchParams.get('next') || '/dashboard';

  if (!token_hash || !type) {
    // Redireciona com erro de link inválido
    return NextResponse.redirect(`${origin}/login?error=invalid_link`);
  }

  const supabase = getAdminClient();

  try {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    });

    if (error) {
      console.error('[Auth Confirm Error]:', error);
      if (error.message?.toLowerCase().includes('expired')) {
        return NextResponse.redirect(`${origin}/login?error=expired_link`);
      }
      return NextResponse.redirect(`${origin}/login?error=invalid_token`);
    }

    // Se for recuperação de senha ou convite de profissional, encaminhar para redefinir senha
    if (type === 'recovery' || type === 'invite') {
      const email = data.user?.email || '';
      return NextResponse.redirect(`${origin}/redefinir-senha?email=${encodeURIComponent(email)}&type=${type}`);
    }

    // Se for confirmação de cadastro de nova empresa/usuário
    if (type === 'signup') {
      return NextResponse.redirect(`${origin}/login?confirmed=true`);
    }

    return NextResponse.redirect(`${origin}${next}`);
  } catch (err) {
    console.error('[Auth Confirm Exception]:', err);
    return NextResponse.redirect(`${origin}/login?error=server_error`);
  }
}
