import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fakytcdlffdulvdmbjut.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getAdminClient() {
  return createClient(supabaseUrl, supabaseKey);
}

// GET: Reconcilia perfil do usuário e empresa do banco de dados oficial
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');

    if (!userId && !email) {
      return NextResponse.json({ success: false, message: 'Identificador do usuário ausente' }, { status: 400 });
    }

    const supabase = getAdminClient();
    let profile = null;

    if (userId) {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      profile = data;
    }

    if (!profile && email) {
      const cleanEmail = email.trim().toLowerCase();
      const { data } = await supabase.from('profiles').select('*').eq('email', cleanEmail).maybeSingle();
      profile = data;
    }

    if (!profile) {
      return NextResponse.json({ success: false, message: 'Perfil não encontrado' }, { status: 404 });
    }

    let company = null;
    if (profile.company_id) {
      const { data: comp } = await supabase.from('companies').select('*').eq('id', profile.company_id).maybeSingle();
      company = comp;
    }

    return NextResponse.json({
      success: true,
      user: {
        id: profile.id,
        company_id: profile.company_id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        phone: profile.phone,
        avatar_url: profile.avatar_url,
        active: profile.active ?? true,
      },
      company: company,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
