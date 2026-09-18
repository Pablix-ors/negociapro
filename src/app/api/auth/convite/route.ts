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

    // 5. Gerar link oficial de convite do Supabase Auth
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const { data: inviteLinkData, error: inviteLinkErr } = await supabase.auth.admin.generateLink({
      type: 'invite',
      email: cleanEmail,
      options: {
        redirectTo: `${appUrl}/redefinir-senha?email=${encodeURIComponent(cleanEmail)}&type=invite`,
      },
    });

    let inviteUrl = `${appUrl}/auth/confirm?token_hash=${inviteLinkData?.properties?.hashed_token || ''}&type=invite`;
    if (inviteLinkData?.properties?.action_link) {
      inviteUrl = inviteLinkData.properties.action_link;
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
      message: `Convite enviado com sucesso para ${cleanEmail}! O colaborador definirá sua própria senha pelo link recebido.`,
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
