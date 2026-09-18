import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendBrevoEmail, getPasswordRecoveryTemplate } from '@/lib/brevo';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fakytcdlffdulvdmbjut.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getAdminClient() {
  return createClient(supabaseUrl, supabaseKey);
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Informe um endereço de e-mail válido.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const supabase = getAdminClient();

    // 1. Verificar se o usuário existe no Supabase Auth
    const { data: usersList } = await supabase.auth.admin.listUsers();
    const existingUser = usersList?.users?.find((u) => u.email?.toLowerCase() === cleanEmail);

    if (!existingUser) {
      // Retorna sucesso neutro para não expor lista de e-mails existentes
      return NextResponse.json({
        success: true,
        message: 'Se este e-mail estiver cadastrado, enviamos um link seguro de recuperação para a sua caixa de entrada.',
      });
    }

    // 2. Gerar link oficial de recuperação no Supabase Auth
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: cleanEmail,
      options: {
        redirectTo: `${appUrl}/redefinir-senha`,
      },
    });

    if (linkErr) {
      console.error('[Recuperar Senha] Erro ao gerar link oficial:', linkErr);
      return NextResponse.json(
        { success: false, message: 'Não foi possível enviar o e-mail de recuperação. Tente novamente.' },
        { status: 500 }
      );
    }

    let recoveryUrl = `${appUrl}/auth/confirm?token_hash=${linkData?.properties?.hashed_token || ''}&type=recovery`;
    if (linkData?.properties?.action_link) {
      recoveryUrl = linkData.properties.action_link;
    }

    // 3. Enviar e-mail de recuperação com link oficial via Brevo SMTP
    const emailHtml = getPasswordRecoveryTemplate({
      userEmail: cleanEmail,
      recoveryUrl,
    });

    const sendRes = await sendBrevoEmail({
      to: cleanEmail,
      subject: 'Recuperação de Senha - NegociaPro',
      htmlContent: emailHtml,
      textContent: `Olá! Acesse o link oficial para redefinir sua senha no NegociaPro: ${recoveryUrl}`,
    });

    if (!sendRes.success) {
      console.warn('[Recuperar Senha] Aviso ao disparar Brevo:', sendRes.error);
    }

    return NextResponse.json({
      success: true,
      message: 'Enviamos um link seguro de recuperação para o seu e-mail. Verifique sua caixa de entrada.',
    });
  } catch (error: any) {
    console.error('Erro na rota /api/auth/recuperar-senha:', error);
    return NextResponse.json(
      { success: false, message: 'Não foi possível enviar o e-mail de recuperação. Tente novamente.' },
      { status: 500 }
    );
  }
}
