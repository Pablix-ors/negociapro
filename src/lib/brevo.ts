interface SendBrevoEmailParams {
  to: string;
  name?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export async function sendBrevoEmail({
  to,
  name,
  subject,
  htmlContent,
  textContent,
}: SendBrevoEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn('[Brevo] BREVO_API_KEY não configurada no ambiente.');
    return { success: false, error: 'Chave do Brevo SMTP não configurada.' };
  }

  const senderEmail = process.env.BREVO_FROM_EMAIL?.includes('<')
    ? process.env.BREVO_FROM_EMAIL.match(/<([^>]+)>/)?.[1] || 'pablixgamezgg@gmail.com'
    : process.env.BREVO_FROM_EMAIL || 'pablixgamezgg@gmail.com';

  const senderName = process.env.BREVO_FROM_EMAIL?.includes('<')
    ? process.env.BREVO_FROM_EMAIL.split('<')[0].trim() || 'NegociaPro'
    : 'NegociaPro';

  try {
    const payload = {
      sender: {
        name: senderName,
        email: senderEmail,
      },
      to: [
        {
          email: to.trim().toLowerCase(),
          name: name?.trim() || to.split('@')[0],
        },
      ],
      subject: subject,
      htmlContent: htmlContent,
      textContent: textContent || subject,
    };

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('[Brevo Error Response]:', response.status, data);
      return {
        success: false,
        error: data?.message || `Erro ao enviar e-mail via Brevo (${response.status})`,
      };
    }

    return {
      success: true,
      messageId: data?.messageId,
    };
  } catch (err: any) {
    console.error('[Brevo Exception]:', err);
    return {
      success: false,
      error: err?.message || 'Falha de comunicação com o servidor Brevo.',
    };
  }
}

/**
 * Template de Confirmação de Cadastro de Usuário / Estabelecimento
 */
export function getSignupConfirmationTemplate({
  userName,
  companyName,
  confirmationUrl,
}: {
  userName: string;
  companyName: string;
  confirmationUrl: string;
}): string {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirme seu e-mail - NegociaPro</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; margin: 0; padding: 40px 20px; color: #f1f5f9; }
      .container { max-width: 560px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 20px; padding: 40px 32px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
      .logo { text-align: center; margin-bottom: 28px; }
      .logo-text { font-size: 28px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px; }
      .logo-accent { color: #38bdf8; }
      h1 { font-size: 22px; font-weight: 800; color: #ffffff; margin: 0 0 16px 0; text-align: center; }
      p { font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 18px 0; }
      .highlight-box { background: rgba(30, 41, 59, 0.7); border: 1px solid #334155; border-radius: 12px; padding: 16px 20px; margin: 20px 0; font-size: 13px; color: #cbd5e1; }
      .btn-container { text-align: center; margin: 32px 0; }
      .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 36px; border-radius: 12px; box-shadow: 0 10px 20px -5px rgba(37, 99, 235, 0.4); }
      .footer { margin-top: 36px; padding-top: 24px; border-top: 1px solid #1e293b; font-size: 12px; color: #64748b; text-align: center; }
      .code-box { background-color: #1e293b; border-radius: 8px; padding: 12px; font-family: monospace; font-size: 11px; color: #93c5fd; word-break: break-all; margin-top: 12px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="logo">
        <span class="logo-text">Negocia<span class="logo-accent">Pro</span></span>
      </div>
      <h1>Confirmação de Cadastro</h1>
      <p>Olá <strong>${userName}</strong>,</p>
      <p>Seja bem-vindo ao <strong>NegociaPro</strong>! A conta da empresa <strong>${companyName}</strong> foi criada com sucesso.</p>
      
      <div class="highlight-box">
        Para ativar a sua conta e liberar o acesso com segurança aos dados comerciais do seu estabelecimento, confirme seu endereço de e-mail clicando no botão abaixo:
      </div>

      <div class="btn-container">
        <a href="${confirmationUrl}" class="btn" target="_blank">Confirmar Meu E-mail</a>
      </div>

      <p style="font-size: 13px; color: #64748b; text-align: center;">
        Este link é válido por tempo limitado. Se você não solicitou este cadastro, pode desconsiderar esta mensagem.
      </p>

      <div class="footer">
        <p>Se o botão não funcionar, copie e cole o link no seu navegador:</p>
        <div class="code-box">${confirmationUrl}</div>
        <p style="margin-top: 20px;">© ${new Date().getFullYear()} NegociaPro — Venda com histórico. Negocie com inteligência.</p>
      </div>
    </div>
  </body>
  </html>
  `;
}

/**
 * Template de Recuperação de Senha Oficial do Supabase Auth
 */
export function getPasswordRecoveryTemplate({
  userEmail,
  recoveryUrl,
}: {
  userEmail: string;
  recoveryUrl: string;
}): string {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recuperação de Senha - NegociaPro</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; margin: 0; padding: 40px 20px; color: #f1f5f9; }
      .container { max-width: 560px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 20px; padding: 40px 32px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
      .logo { text-align: center; margin-bottom: 28px; }
      .logo-text { font-size: 28px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px; }
      .logo-accent { color: #38bdf8; }
      h1 { font-size: 22px; font-weight: 800; color: #ffffff; margin: 0 0 16px 0; text-align: center; }
      p { font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 18px 0; }
      .btn-container { text-align: center; margin: 32px 0; }
      .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 36px; border-radius: 12px; box-shadow: 0 10px 20px -5px rgba(37, 99, 235, 0.4); }
      .footer { margin-top: 36px; padding-top: 24px; border-top: 1px solid #1e293b; font-size: 12px; color: #64748b; text-align: center; }
      .code-box { background-color: #1e293b; border-radius: 8px; padding: 12px; font-family: monospace; font-size: 11px; color: #93c5fd; word-break: break-all; margin-top: 12px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="logo">
        <span class="logo-text">Negocia<span class="logo-accent">Pro</span></span>
      </div>
      <h1>Recuperação de Senha</h1>
      <p>Olá,</p>
      <p>Recebemos uma solicitação de redefinição de senha para a conta vinculada ao e-mail <strong>${userEmail}</strong> no <strong>NegociaPro</strong>.</p>
      
      <p>Para definir sua nova senha de acesso, clique no botão seguro abaixo:</p>

      <div class="btn-container">
        <a href="${recoveryUrl}" class="btn" target="_blank">Redefinir Minha Senha</a>
      </div>

      <p style="font-size: 13px; color: #64748b; text-align: center;">
        Se você não fez essa solicitação, pode ignorar este e-mail. Sua senha atual permanecerá protegida e inalterada.
      </p>

      <div class="footer">
        <p>Se o botão não funcionar, copie e cole o link oficial no navegador:</p>
        <div class="code-box">${recoveryUrl}</div>
        <p style="margin-top: 20px;">© ${new Date().getFullYear()} NegociaPro — Todos os direitos reservados.</p>
      </div>
    </div>
  </body>
  </html>
  `;
}

/**
 * Template de Convite para Colaborador / Profissional
 */
export function getInviteProfessionalTemplate({
  professionalName,
  companyName,
  roleTitle,
  inviteUrl,
}: {
  professionalName: string;
  companyName: string;
  roleTitle: string;
  inviteUrl: string;
}): string {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Convite para o NegociaPro</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; margin: 0; padding: 40px 20px; color: #f1f5f9; }
      .container { max-width: 560px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 20px; padding: 40px 32px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
      .logo { text-align: center; margin-bottom: 28px; }
      .logo-text { font-size: 28px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px; }
      .logo-accent { color: #38bdf8; }
      h1 { font-size: 22px; font-weight: 800; color: #ffffff; margin: 0 0 16px 0; text-align: center; }
      p { font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 18px 0; }
      .role-card { background: rgba(30, 41, 59, 0.7); border: 1px solid #334155; border-radius: 12px; padding: 18px 20px; margin: 24px 0; }
      .role-item { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
      .role-item:last-child { margin-bottom: 0; }
      .role-label { color: #94a3b8; font-weight: 600; }
      .role-value { color: #38bdf8; font-weight: 700; }
      .btn-container { text-align: center; margin: 32px 0; }
      .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 36px; border-radius: 12px; box-shadow: 0 10px 20px -5px rgba(37, 99, 235, 0.4); }
      .footer { margin-top: 36px; padding-top: 24px; border-top: 1px solid #1e293b; font-size: 12px; color: #64748b; text-align: center; }
      .code-box { background-color: #1e293b; border-radius: 8px; padding: 12px; font-family: monospace; font-size: 11px; color: #93c5fd; word-break: break-all; margin-top: 12px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="logo">
        <span class="logo-text">Negocia<span class="logo-accent">Pro</span></span>
      </div>
      <h1>Você foi convidado para a equipe! 🎉</h1>
      <p>Olá <strong>${professionalName}</strong>,</p>
      <p>Você foi cadastrado como profissional na equipe de <strong>${companyName}</strong> no sistema comercial <strong>NegociaPro</strong>.</p>
      
      <div class="role-card">
        <div class="role-item">
          <span class="role-label">Empresa:</span>
          <span class="role-value">${companyName}</span>
        </div>
        <div class="role-item">
          <span class="role-label">Perfil de Acesso:</span>
          <span class="role-value">${roleTitle}</span>
        </div>
      </div>

      <p>Para concluir a ativação da sua conta e <strong>definir sua própria senha pessoal</strong>, clique no botão abaixo:</p>

      <div class="btn-container">
        <a href="${inviteUrl}" class="btn" target="_blank">Aceitar Convite e Definir Senha</a>
      </div>

      <p style="font-size: 13px; color: #64748b; text-align: center;">
        O administrador da sua empresa não tem acesso à sua senha. Ela é definida exclusivamente por você.
      </p>

      <div class="footer">
        <p>Se o botão não funcionar, copie e cole o link no seu navegador:</p>
        <div class="code-box">${inviteUrl}</div>
        <p style="margin-top: 20px;">© ${new Date().getFullYear()} NegociaPro — Venda com histórico. Negocie com inteligência.</p>
      </div>
    </div>
  </body>
  </html>
  `;
}
