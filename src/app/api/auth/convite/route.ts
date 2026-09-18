import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/resend';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getAdminClient() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function POST(request: Request) {
  try {
    const { name, email, phone, role, tempPassword, companyId, companyName } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Informe um e-mail válido.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = (tempPassword && tempPassword.trim().length >= 6) ? tempPassword.trim() : '123456';
    const userRole = role || 'VENDEDOR';
    const cleanName = name?.trim() || 'Profissional';

    // 1. Provisionar o usuário no Supabase Auth e na tabela profiles
    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabase = getAdminClient();

        // Verificar se o usuário já existe no Supabase Auth
        const { data: userList } = await supabase.auth.admin.listUsers();
        const existingAuthUser = userList?.users?.find(
          (u) => u.email?.toLowerCase() === cleanEmail
        );

        let authUserId = existingAuthUser?.id;

        if (!existingAuthUser) {
          // Criar novo usuário no Supabase Auth com e-mail já confirmado
          const { data: createdUser, error: createAuthErr } = await supabase.auth.admin.createUser({
            email: cleanEmail,
            password: cleanPassword,
            email_confirm: true,
            user_metadata: {
              full_name: cleanName,
              company_id: companyId || null,
              company_name: companyName || null,
              role: userRole,
            },
          });

          if (createAuthErr) {
            console.error('Erro ao criar usuário no Supabase Auth:', createAuthErr);
          } else if (createdUser?.user) {
            authUserId = createdUser.user.id;
          }
        } else {
          // Atualizar senha e metadados caso já exista
          await supabase.auth.admin.updateUserById(existingAuthUser.id, {
            password: cleanPassword,
            email_confirm: true,
            user_metadata: {
              ...existingAuthUser.user_metadata,
              full_name: cleanName,
              company_id: companyId || existingAuthUser.user_metadata?.company_id,
              company_name: companyName || existingAuthUser.user_metadata?.company_name,
              role: userRole,
            },
          });
        }

        // 2. Criar ou atualizar perfil na tabela profiles vinculando à empresa do estabelecimento
        if (authUserId && companyId) {
          const { error: profileErr } = await supabase.from('profiles').upsert({
            id: authUserId,
            company_id: companyId,
            name: cleanName,
            email: cleanEmail,
            role: userRole,
            phone: phone || null,
            active: true,
            updated_at: new Date().toISOString(),
          });

          if (profileErr) {
            console.error('Erro ao salvar na tabela profiles:', profileErr);
          }
        }
      } catch (authProvisionErr) {
        console.error('Erro geral no provisionamento Supabase:', authProvisionErr);
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const loginUrl = `${appUrl}/login`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bem-vindo ao NegociaPro</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; margin: 0; padding: 40px 20px; color: #f1f5f9; }
          .container { max-width: 540px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 36px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
          .logo { text-align: center; margin-bottom: 28px; }
          .logo-text { font-size: 26px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px; }
          .logo-accent { color: #3b82f6; }
          h1 { font-size: 20px; font-weight: 800; color: #ffffff; margin-top: 0; margin-bottom: 12px; }
          p { font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 20px 0; }
          .credential-card { background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 18px 20px; margin: 24px 0; }
          .credential-item { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
          .credential-item:last-child { margin-bottom: 0; }
          .credential-label { color: #94a3b8; font-weight: 600; }
          .credential-value { color: #ffffff; font-weight: 700; font-family: monospace; }
          .btn-container { text-align: center; margin: 32px 0; }
          .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 14px; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3); }
          .footer { margin-top: 36px; padding-top: 20px; border-top: 1px solid #1e293b; font-size: 12px; color: #64748b; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <span class="logo-text">Negocia<span class="logo-accent">Pro</span></span>
          </div>
          <h1>Seu acesso ao sistema foi liberado! 🎉</h1>
          <p>Olá <strong>${name || 'Colaborador'}</strong>,</p>
          <p>Você foi cadastrado na equipe de <strong>${companyName || 'NegociaPro'}</strong> com o perfil de <strong>${role || 'Vendedor'}</strong>.</p>
          <p>Abaixo estão os seus dados de acesso provisórios:</p>
          
          <div class="credential-card">
            <div class="credential-item">
              <span class="credential-label">E-mail:</span>
              <span class="credential-value">${email}</span>
            </div>
            <div class="credential-item">
              <span class="credential-label">Senha Inicial:</span>
              <span class="credential-value">${tempPassword || '123456'}</span>
            </div>
          </div>

          <div class="btn-container">
            <a href="${loginUrl}" class="btn" target="_blank">Acessar o NegociaPro</a>
          </div>

          <p style="font-size: 13px; color: #64748b;">Recomendamos alterar sua senha no primeiro acesso através das configurações do seu perfil.</p>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} NegociaPro. Venda com histórico. Negocie com inteligência.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await sendEmail({
      to: email,
      subject: `Bem-vindo ao NegociaPro - Seus dados de acesso (${companyName || 'Equipe'})`,
      html: htmlContent,
      text: `Olá ${name}! Seu acesso ao NegociaPro foi criado. E-mail: ${email} | Senha inicial: ${tempPassword || '123456'}. Acesse em: ${loginUrl}`,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error || 'Erro ao enviar e-mail de convite.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Convite enviado com sucesso para o colaborador via Resend!',
    });
  } catch (error: any) {
    console.error('Erro na rota /api/auth/convite:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
