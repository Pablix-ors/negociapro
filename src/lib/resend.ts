import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;

// Cliente Resend inicializado com fallback seguro para não travar build ou testes se a chave não estiver presente
export const resend = resendApiKey ? new Resend(resendApiKey) : null;

export const DEFAULT_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || '';

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  text?: string;
}

/**
 * Envia e-mail transacional via Resend com tratamento de erro e log
 */
export async function sendEmail({ to, subject, html, from, text }: SendEmailParams) {
  const sender = from || DEFAULT_FROM_EMAIL;
  if (!sender) {
    console.warn('[Resend] RESEND_FROM_EMAIL não configurado no ambiente.');
    return { success: false, error: 'Remetente do Resend (RESEND_FROM_EMAIL) não configurado.' };
  }

  if (!resend) {
    console.warn('[Resend] API Key não configurada. E-mail simulado:', { to, subject });
    return { success: true, simulated: true };
  }

  try {
    const data = await resend.emails.send({
      from: sender,
      to,
      subject,
      html,
      text,
    });

    if (data.error) {
      console.error('[Resend Error]:', data.error);
      return { success: false, error: data.error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error('[Resend Exception]:', err);
    return { success: false, error: err?.message || 'Erro inesperado ao enviar e-mail via Resend' };
  }
}
