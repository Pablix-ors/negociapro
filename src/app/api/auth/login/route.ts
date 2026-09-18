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

    if (authError || !authData.user) {
      return NextResponse.json(
        { success: false, message: 'E-mail ou senha incorretos. Verifique os dados digitados.' },
        { status: 401 }
      );
    }

    const user = authData.user;

    // 2. Buscar perfil correspondente na tabela profiles (por id ou por e-mail)
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
        // Atualizar id do perfil para bater com user.id
        await supabase
          .from('profiles')
          .update({ id: user.id, updated_at: new Date().toISOString() })
          .eq('id', profileByEmail.id);
      }
    }

    let company = null;

    // 3. Se achou perfil com company_id, buscar a empresa
    if (profile?.company_id) {
      const { data: comp } = await supabase
        .from('companies')
        .select('*')
        .eq('id', profile.company_id)
        .maybeSingle();
      company = comp;
    }

    // Se o metadata do usuário tiver company_id e ainda não achou a empresa
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

    // Se ainda não encontrou empresa pelo profile, busca diretamente na tabela companies pelo e-mail
    if (!company) {
      const { data: compByEmail } = await supabase
        .from('companies')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();
      
      if (compByEmail) {
        company = compByEmail;
        // Cria ou atualiza o perfil vinculado a esta empresa
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

    // Se mesmo assim não achou empresa, criar uma empresa padrão com o nome do metadata
    if (!company) {
      const companyName = user.user_metadata?.company_name || 'Minha Empresa';
      const { data: newComp, error: newCompErr } = await supabase
        .from('companies')
        .insert([{
          name: companyName,
          trade_name: companyName,
          email: cleanEmail,
          status: 'ATIVO',
        }])
        .select()
        .single();

      if (!newCompErr && newComp) {
        company = newComp;
        await supabase.from('profiles').upsert({
          id: user.id,
          company_id: newComp.id,
          name: user.user_metadata?.full_name || cleanEmail.split('@')[0],
          email: cleanEmail,
          role: user.user_metadata?.role || 'ADMIN',
          active: true,
        });
      }
    }

    // Determinar a role final de forma segura respeitando profissionais/vendedores
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
    });
  } catch (err: any) {
    console.error('Erro na rota de login:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Erro interno ao processar login.' },
      { status: 500 }
    );
  }
}
