import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendBrevoEmail, getSignupConfirmationTemplate } from '@/lib/brevo';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fakytcdlffdulvdmbjut.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getAdminClient() {
  return createClient(supabaseUrl, supabaseKey);
}

export async function POST(request: Request) {
  try {
    const { companyName, cnpj, userName, email, password } = await request.json();

    // 1. Validações de campos obrigatórios
    if (!userName || !userName.trim()) {
      return NextResponse.json({ success: false, message: 'O nome completo é obrigatório.' }, { status: 400 });
    }
    if (!companyName || !companyName.trim()) {
      return NextResponse.json({ success: false, message: 'O nome da empresa é obrigatório.' }, { status: 400 });
    }
    if (!email || !email.includes('@')) {
      return NextResponse.json({ success: false, message: 'Informe um e-mail válido.' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ success: false, message: 'A senha deve ter no mínimo 6 caracteres.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = userName.trim();
    const cleanCompany = companyName.trim();
    const cleanCnpj = cnpj ? cnpj.replace(/\D/g, '') : null;

    const supabase = getAdminClient();

    // 2. Verificar se o e-mail já existe no Supabase Auth
    const { data: usersList } = await supabase.auth.admin.listUsers();
    const existingUser = usersList?.users?.find((u) => u.email?.toLowerCase() === cleanEmail);

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Este e-mail já possui uma conta cadastrada no NegociaPro.' },
        { status: 409 }
      );
    }

    // 3. Criar a empresa (Company) com status ATIVO
    const { data: newCompany, error: compErr } = await supabase
      .from('companies')
      .insert([
        {
          name: cleanCompany,
          trade_name: cleanCompany,
          cnpj: cleanCnpj,
          email: cleanEmail,
          status: 'ATIVO',
        },
      ])
      .select()
      .single();

    if (compErr || !newCompany) {
      console.error('Erro ao criar empresa:', compErr);
      return NextResponse.json(
        { success: false, message: 'Não foi possível cadastrar a empresa. Tente novamente.' },
        { status: 500 }
      );
    }

    // 4. Criar o usuário no Supabase Auth com metadata
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: cleanEmail,
      password: password,
      email_confirm: false, // Exige confirmação de e-mail oficial
      user_metadata: {
        full_name: cleanName,
        company_id: newCompany.id,
        company_name: cleanCompany,
        role: 'ADMIN',
      },
    });

    if (authErr || !authData.user) {
      console.error('Erro ao criar usuário no Auth:', authErr);
      // Reverter criação de empresa para evitar registros órfãos
      await supabase.from('companies').delete().eq('id', newCompany.id);
      return NextResponse.json(
        { success: false, message: authErr?.message || 'Erro ao registrar usuário no sistema.' },
        { status: 500 }
      );
    }

    const authUserId = authData.user.id;

    // 5. Inserir perfil na tabela profiles vinculando user ao estabelecimento
    const { error: profileErr } = await supabase.from('profiles').insert([
      {
        id: authUserId,
        company_id: newCompany.id,
        name: cleanName,
        email: cleanEmail,
        role: 'ADMIN',
        active: true,
      },
    ]);

    if (profileErr) {
      console.error('Erro ao criar perfil:', profileErr);
    }

    // 6. Criar configuração padrão da empresa
    await supabase.from('company_settings').upsert({
      company_id: newCompany.id,
      currency: 'BRL',
      decimal_places: 2,
      default_discount_pct: 0.0,
      allow_sale_below_last_price: true,
      show_price_history_in_sale: true,
      price_history_limit: 5,
    });

    // 7. Gerar link oficial de confirmação de e-mail do Supabase Auth
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email: cleanEmail,
      password: password,
      options: {
        redirectTo: `${appUrl}/auth/confirm`,
      },
    });

    // Se a URL gerada pelo Supabase usar localhost ou domínio interno, apontamos para nosso callback
    let confirmationUrl = `${appUrl}/auth/confirm?token_hash=${linkData?.properties?.hashed_token || ''}&type=signup`;
    if (linkData?.properties?.action_link) {
      confirmationUrl = linkData.properties.action_link;
    }

    // 8. Enviar e-mail de confirmação via Brevo SMTP (API v3)
    const emailHtml = getSignupConfirmationTemplate({
      userName: cleanName,
      companyName: cleanCompany,
      confirmationUrl,
    });

    const sendRes = await sendBrevoEmail({
      to: cleanEmail,
      name: cleanName,
      subject: 'Confirme seu e-mail de cadastro - NegociaPro',
      htmlContent: emailHtml,
      textContent: `Olá ${cleanName}, confirme seu cadastro no NegociaPro acessando: ${confirmationUrl}`,
    });

    if (!sendRes.success) {
      console.warn('[Signup] Aviso ao enviar via Brevo:', sendRes.error);
    }

    return NextResponse.json({
      success: true,
      requiresEmailConfirmation: true,
      message: 'Cadastro realizado com sucesso! Enviamos um link de confirmação para o seu e-mail. Por favor, confirme seu e-mail antes de fazer login.',
      user: {
        id: authUserId,
        email: cleanEmail,
        name: cleanName,
        company_id: newCompany.id,
      },
    });
  } catch (err: any) {
    console.error('Erro na rota /api/auth/signup:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Erro interno ao processar cadastro.' },
      { status: 500 }
    );
  }
}
