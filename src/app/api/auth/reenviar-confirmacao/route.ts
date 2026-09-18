import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendBrevoEmail, getSignupConfirmationTemplate } from '@/lib/brevo';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fakytcdlffdulvdmbjut.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getAdminClient() {
  return createClient(supabaseUrl, supabaseKey);
}

// Armazenamento em memória simples para mitigar spam de requisições
const rateLimitMap = new Map<string, number>();

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

    // Controle de rate limit: mínimo de 60 segundos entre envios para o mesmo e-mail
    const lastSent = rateLimitMap.get(cleanEmail);
    const now = Date.now();
    if (lastSent && now - lastSent < 60000) {
      const waitSec = Math.ceil((60000 - (now - lastSent)) / 1000);
      return NextResponse.json(
        { success: false, message: `Aguarde ${waitSec} segundos antes de solicitar um novo e-mail.` },
        { status: 429 }
      );
    }

    const supabase = getAdminClient();

    // Verificar se o usuário existe no Supabase Auth
    const { data: usersList } = await supabase.auth.admin.listUsers();
    const existingUser = usersList?.users?.find((u) => u.email?.toLowerCase() === cleanEmail);

    if (!existingUser) {
      // Mensagem genérica para não vazar se o e-mail existe
      return NextResponse.json({
        success: true,
        message: 'Se o e-mail estiver cadastrado e pendente de validação, enviamos um novo link de confirmação.',
      });
    }

    // Se já estiver confirmado
    if (existingUser.email_confirmed_at) {
      return NextResponse.json({
        success: true,
        alreadyConfirmed: true,
        message: 'Este e-mail já foi confirmado! Você pode acessar sua conta diretamente no login.',
      });
    }

    // Gerar novo link oficial de validação/confirmação
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: cleanEmail,
      options: {
        redirectTo: `${appUrl}/auth/confirm?type=signup`,
      },
    });

    if (linkErr) {
      console.error('[Reenviar Confirmação] Erro ao gerar link:', linkErr);
      return NextResponse.json(
        { success: false, message: 'Não foi possível gerar um novo link no momento. Tente novamente mais tarde.' },
        { status: 500 }
      );
    }

    const hashedToken = linkData?.properties?.hashed_token || '';
    const confirmationUrl = `${appUrl}/auth/confirm?token_hash=${hashedToken}&type=signup`;

    const userName = existingUser.user_metadata?.full_name || cleanEmail.split('@')[0];
    const companyName = existingUser.user_metadata?.company_name || 'NegociaPro';

    const emailHtml = getSignupConfirmationTemplate({
      userName,
      companyName,
      confirmationUrl,
    });

    await sendBrevoEmail({
      to: cleanEmail,
      name: userName,
      subject: 'Reenvio de Confirmação de E-mail - NegociaPro',
      htmlContent: emailHtml,
      textContent: `Olá ${userName}, confirme seu cadastro no NegociaPro acessando: ${confirmationUrl}`,
    });

    rateLimitMap.set(cleanEmail, now);

    return NextResponse.json({
      success: true,
      message: 'Novo link de confirmação enviado para seu e-mail! Verifique sua caixa de entrada.',
    });
  } catch (err: any) {
    console.error('Erro na rota /api/auth/reenviar-confirmacao:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Erro ao processar solicitação.' },
      { status: 500 }
    );
  }
}
