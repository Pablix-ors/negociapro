import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendBrevoEmail, getInviteProfessionalTemplate } from '@/lib/brevo';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getAdminClient() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function POST(request: Request) {
  try {
    const { name, email, phone, role, companyId, companyName } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Informe um e-mail válido.' },
        { status: 400 }
      );
    }

    if (!companyId) {
      return NextResponse.json(
        { success: false, message: 'Identificação do estabelecimento não informada.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const userRole = role || 'VENDEDOR';
    const cleanName = name?.trim() || 'Profissional';
    const targetCompanyName = companyName?.trim() || 'Minha Empresa';

    const supabase = getAdminClient();

    // 1. Verificar se o e-mail já existe no Supabase Auth
    const { data: userList } = await supabase.auth.admin.listUsers();
    const existingAuthUser = userList?.users?.find(
      (u) => u.email?.toLowerCase() === cleanEmail
    );

    let authUserId = existingAuthUser?.id;

    // Se o usuário já existir no Auth
    if (existingAuthUser) {
      // 1.1 Verificar se ele já está associado a OUTRA empresa diferente
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', existingAuthUser.id)
        .maybeSingle();

      if (existingProfile && existingProfile.company_id && existingProfile.company_id !== companyId) {
        return NextResponse.json(
          {
            success: false,
            message: 'Este e-mail já pertence a uma conta associada a outro estabelecimento comercial.',
          },
          { status: 403 }
        );
      }

      // 1.2 Atualizar dados e garantir que pertence a esta empresa
      await supabase.auth.admin.updateUserById(existingAuthUser.id, {
        user_metadata: {
          ...existingAuthUser.user_metadata,
          full_name: cleanName,
          company_id: companyId,
          company_name: targetCompanyName,
          role: userRole,
        },
      });

      await supabase.from('profiles').upsert({
        id: existingAuthUser.id,
        company_id: companyId,
        name: cleanName,
        email: cleanEmail,
        role: userRole,
        phone: phone || null,
        active: true,
        updated_at: new Date().toISOString(),
      });
    } else {
      // 2. Criar convite oficial no Supabase Auth (sem senha definida pelo administrador)
      // O usuário definirá sua própria senha através do link do convite
      const { data: createdUser, error: createAuthErr } = await supabase.auth.admin.createUser({
        email: cleanEmail,
        email_confirm: false, // Será confirmado quando ele aceitar e definir senha
        user_metadata: {
          full_name: cleanName,
          company_id: companyId,
          company_name: targetCompanyName,
          role: userRole,
        },
      });

      if (createAuthErr || !createdUser.user) {
        console.error('Erro ao registrar usuário convidado no Supabase Auth:', createAuthErr);
        return NextResponse.json(
          { success: false, message: createAuthErr?.message || 'Erro ao registrar convite no sistema.' },
          { status: 500 }
        );
      }

      authUserId = createdUser.user.id;

      // 3. Criar perfil associado à empresa
      await supabase.from('profiles').upsert({
        id: authUserId,
        company_id: companyId,
        name: cleanName,
        email: cleanEmail,
        role: userRole,
        phone: phone || null,
        active: true,
        updated_at: new Date().toISOString(),
      });
    }

    // 4. Também sincronizar na tabela professionals caso ainda não exista
    const { data: existingProfRecord } = await supabase
      .from('professionals')
      .select('id')
      .eq('company_id', companyId)
      .eq('email', cleanEmail)
      .maybeSingle();

    if (!existingProfRecord) {
      await supabase.from('professionals').insert([
        {
          company_id: companyId,
          name: cleanName,
          email: cleanEmail,
          phone: phone || null,
          role_title: userRole === 'ADMIN' ? 'Administrador' : userRole === 'GERENTE' ? 'Gerente Comercial' : 'Vendedor / Consultor',
          active: true,
        },
      ]);
    }

    // 5. Gerar link oficial de acesso / convite do Supabase Auth
    // Detectar a URL base de produção ou request dinamicamente
    const requestOrigin = request.headers.get('origin') || request.headers.get('referer');
    let appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    if (requestOrigin) {
      try {
        const parsed = new URL(requestOrigin);
        appUrl = parsed.origin;
      } catch {}
    } else if (process.env.VERCEL_URL) {
      appUrl = `https://${process.env.VERCEL_URL}`;
    }

    let hashedToken = '';
    let inviteUrl = '';

    // Tentar gerar link do tipo 'invite'
    const { data: inviteLinkData, error: inviteLinkErr } = await supabase.auth.admin.generateLink({
      type: 'invite',
      email: cleanEmail,
      options: {
        redirectTo: `${appUrl}/redefinir-senha?email=${encodeURIComponent(cleanEmail)}&type=invite`,
      },
    });

    if (inviteLinkData?.properties?.hashed_token) {
      hashedToken = inviteLinkData.properties.hashed_token;
      inviteUrl = `${appUrl}/auth/confirm?token_hash=${hashedToken}&type=invite`;
    } else {
      // Se o usuário já existia/já foi confirmado, 'invite' pode falhar com 'email_exists'.
      // Usamos fallback com link de recuperação de acesso seguro (recovery)
      const { data: recoveryData, error: recoveryErr } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: cleanEmail,
        options: {
          redirectTo: `${appUrl}/redefinir-senha?email=${encodeURIComponent(cleanEmail)}&type=recovery`,
        },
      });

      if (recoveryData?.properties?.hashed_token) {
        hashedToken = recoveryData.properties.hashed_token;
        inviteUrl = `${appUrl}/auth/confirm?token_hash=${hashedToken}&type=recovery`;
      } else {
        // Fallback final direto para a página de redefinição/login
        inviteUrl = `${appUrl}/redefinir-senha?email=${encodeURIComponent(cleanEmail)}&type=invite`;
      }
    }

    // 6. Enviar e-mail de convite com link oficial via Brevo SMTP
    const emailHtml = getInviteProfessionalTemplate({
      professionalName: cleanName,
      companyName: targetCompanyName,
      roleTitle: userRole === 'ADMIN' ? 'Administrador' : userRole === 'GERENTE' ? 'Gerente Comercial' : 'Vendedor',
      inviteUrl,
    });

    const sendRes = await sendBrevoEmail({
      to: cleanEmail,
      name: cleanName,
      subject: `Convite de Acesso - ${targetCompanyName} no NegociaPro`,
      htmlContent: emailHtml,
      textContent: `Olá ${cleanName}! Você foi convidado para a equipe de ${targetCompanyName}. Defina sua senha e acesse em: ${inviteUrl}`,
    });

    if (!sendRes.success) {
      console.warn('[Convite] Aviso no envio via Brevo:', sendRes.error);
    }

    return NextResponse.json({
      success: true,
      emailSent: sendRes.success,
      emailError: sendRes.success ? null : sendRes.error,
      message: sendRes.success
        ? `Convite enviado com sucesso para ${cleanEmail}! O colaborador definirá sua própria senha pelo link recebido.`
        : `Acesso criado com sucesso! O e-mail automático pelo Brevo pode levar alguns instantes ou exigir liberação de MX. Você pode copiar o link direto de ativação abaixo ou enviar via WhatsApp!`,
      inviteUrl,
    });
  } catch (error: any) {
    console.error('Erro na rota /api/auth/convite:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Erro interno ao processar convite.' },
      { status: 500 }
    );
  }
}
