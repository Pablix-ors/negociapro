import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fakytcdlffdulvdmbjut.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getAdminClient() {
  return createClient(supabaseUrl, supabaseKey);
}

// GET: Listar todos os estabelecimentos do banco real
export async function GET() {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao listar estabelecimentos:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, companies: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

// POST: Criar novo estabelecimento diretamente no banco real
export async function POST(request: Request) {
  try {
    const companyData = await request.json();
    const supabase = getAdminClient();

    const newCompany = {
      name: companyData.name,
      trade_name: companyData.trade_name || companyData.name,
      cnpj: companyData.cnpj || null,
      state_registration: companyData.state_registration || null,
      municipal_registration: companyData.municipal_registration || null,
      email: companyData.email || null,
      phone: companyData.phone || null,
      whatsapp: companyData.whatsapp || null,
      zip_code: companyData.zip_code || null,
      street: companyData.street || null,
      number: companyData.number || null,
      complement: companyData.complement || null,
      neighborhood: companyData.neighborhood || null,
      city: companyData.city || null,
      state: companyData.state || null,
      website: companyData.website || null,
      status: companyData.status || 'ATIVO',
    };

    const { data, error } = await supabase
      .from('companies')
      .insert([newCompany])
      .select()
      .single();

    if (error) {
      console.error('Erro ao inserir estabelecimento no banco:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, company: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

// PATCH: Atualizar estabelecimento ou alterar status (Ativo/Inativo/Bloqueado)
export async function PATCH(request: Request) {
  try {
    const { id, ...updatedFields } = await request.json();
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID do estabelecimento obrigatório' }, { status: 400 });
    }

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('companies')
      .update({
        ...updatedFields,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, company: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
