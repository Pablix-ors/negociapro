import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/resend';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Informe um endereço de e-mail válido.' },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetUrl = `${appUrl}/redefinir-senha?email=${encodeURIComponent(email)}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recuperação de Senha - NegociaPro</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; margin: 0; padding: 40px 20px; color: #f1f5f9; }
          .container { max-width: 540px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 36px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
          .logo { text-align: center; margin-bottom: 28px; }
          .logo-text { font-size: 26px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px; }
          .logo-accent { color: #3b82f6; }
          h1 { font-size: 20px; font-weight: 800; color: #ffffff; margin-top: 0; margin-bottom: 12px; }
          p { font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 20px 0; }
          .btn-container { text-align: center; margin: 32px 0; }
          .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 14px; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3); }
          .footer { margin-top: 36px; padding-top: 20px; border-top: 1px solid #1e293b; font-size: 12px; color: #64748b; text-align: center; }
          .code-box { background-color: #1e293b; border-radius: 8px; padding: 12px; font-family: monospace; font-size: 12px; color: #cbd5e1; word-break: break-all; margin-top: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <span class="logo-text">Negocia<span class="logo-accent">Pro</span></span>
          </div>
          <h1>Recuperação de Senha</h1>
          <p>Olá,</p>
          <p>Recebemos uma solicitação para redefinir a senha da sua conta corporativa vinculada ao e-mail <strong>${email}</strong> no <strong>NegociaPro</strong>.</p>
          <p>Para criar uma nova senha de acesso com total segurança, clique no botão abaixo:</p>
          
          <div class="btn-container">
            <a href="${resetUrl}" class="btn" target="_blank">Redefinir Minha Senha</a>
          </div>

          <p>Se você não fez essa solicitação, por favor ignore este e-mail. Sua senha atual permanecerá inalterada.</p>
          
          <div class="footer">
            <p>Se o botão acima não funcionar, copie e cole o link no seu navegador:</p>
            <div class="code-box">${resetUrl}</div>
            <p style="margin-top: 16px;">© ${new Date().getFullYear()} NegociaPro. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await sendEmail({
      to: email,
      subject: 'Recuperação de Senha - NegociaPro',
      html: htmlContent,
      text: `Olá! Acesse o link a seguir para redefinir sua senha no NegociaPro: ${resetUrl}`,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error || 'Erro ao enviar e-mail pelo Resend.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Link de recuperação enviado com sucesso via Resend! Verifique sua caixa de entrada.',
    });
  } catch (error: any) {
    console.error('Erro na rota /api/auth/recuperar-senha:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
