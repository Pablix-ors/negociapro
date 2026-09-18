import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fakytcdlffdulvdmbjut.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getAdminClient() {
  return createClient(supabaseUrl, supabaseKey);
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Informe e-mail e senha.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const supabase = getAdminClient();

    // 1. Tentar login oficial no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: password,
    });

    // Se houve erro no Supabase Auth
    if (authError || !authData.user) {
      const errMsg = authError?.message?.toLowerCase() || '';

      if (errMsg.includes('email not confirmed') || errMsg.includes('not confirmed')) {
        return NextResponse.json(
          {
            success: false,
            needsEmailConfirmation: true,
            message: 'Confirme seu e-mail antes de acessar sua conta. Enviamos um link de ativação para você.',
          },
          { status: 403 }
        );
      }

      if (errMsg.includes('invalid login credentials') || errMsg.includes('invalid credentials')) {
        return NextResponse.json(
          { success: false, message: 'E-mail ou senha incorretos. Verifique os dados digitados.' },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { success: false, message: 'E-mail ou senha incorretos.' },
        { status: 401 }
      );
    }

    const user = authData.user;

    // 2. Verificar se a política do sistema exige e-mail confirmado
    // Se não tiver confirmação de e-mail registrada:
    if (!user.email_confirmed_at && user.confirmed_at === null) {
      return NextResponse.json(
        {
          success: false,
          needsEmailConfirmation: true,
          message: 'Confirme seu e-mail antes de acessar sua conta.',
        },
        { status: 403 }
      );
    }

    // 3. Buscar perfil correspondente na tabela profiles
    let { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile) {
      const { data: profileByEmail } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (profileByEmail) {
        profile = profileByEmail;
        await supabase
          .from('profiles')
          .update({ id: user.id, updated_at: new Date().toISOString() })
          .eq('id', profileByEmail.id);
      }
    }

    // Verificar se o usuário está desativado
    if (profile && profile.active === false) {
      return NextResponse.json(
        { success: false, message: 'Este usuário está desativado. Entre em contato com o administrador da sua empresa.' },
        { status: 403 }
      );
    }

    let company = null;

    // 4. Buscar empresa vinculada
    if (profile?.company_id) {
      const { data: comp } = await supabase
        .from('companies')
        .select('*')
        .eq('id', profile.company_id)
        .maybeSingle();
      company = comp;
    }

    if (!company && user.user_metadata?.company_id) {
      const { data: compByMeta } = await supabase
        .from('companies')
        .select('*')
        .eq('id', user.user_metadata.company_id)
        .maybeSingle();
      if (compByMeta) {
        company = compByMeta;
      }
    }

    if (!company) {
      const { data: compByEmail } = await supabase
        .from('companies')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();
      
      if (compByEmail) {
        company = compByEmail;
        await supabase.from('profiles').upsert({
          id: user.id,
          company_id: compByEmail.id,
          name: user.user_metadata?.full_name || profile?.name || cleanEmail.split('@')[0],
          email: cleanEmail,
          role: profile?.role || user.user_metadata?.role || 'ADMIN',
          active: true,
        });
      }
    }

    // 5. Verificar se o estabelecimento está desativado ou bloqueado
    if (company) {
      if (company.status === 'BLOQUEADO') {
        return NextResponse.json(
          {
            success: false,
            isCompanyBlocked: true,
            message: `O acesso do estabelecimento ${company.name} está bloqueado pela administração. Motivo: ${company.blocked_reason || 'Consulte o suporte.'}`,
          },
          { status: 403 }
        );
      }
      if (company.status === 'INATIVO') {
        return NextResponse.json(
          {
            success: false,
            message: `O estabelecimento ${company.name} encontra-se inativo.`,
          },
          { status: 403 }
        );
      }
    }

    const resolvedRole = profile?.role || user.user_metadata?.role || 'VENDEDOR';
    const resolvedName = profile?.name || user.user_metadata?.full_name || cleanEmail.split('@')[0];

    const finalProfile = {
      id: user.id,
      company_id: company?.id || profile?.company_id || '',
      name: resolvedName,
      email: cleanEmail,
      role: resolvedRole,
      phone: profile?.phone || user.phone || null,
      avatar_url: profile?.avatar_url || null,
      active: profile?.active ?? true,
    };

    return NextResponse.json({
      success: true,
      user: finalProfile,
      company: company,
      session: authData.session,
    });
  } catch (err: any) {
    console.error('Erro na rota de login:', err);
    return NextResponse.json(
      { success: false, message: 'Não foi possível conectar ao servidor. Tente novamente.' },
      { status: 500 }
    );
  }
}
