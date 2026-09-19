import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fakytcdlffdulvdmbjut.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getAdminClient() {
  return createClient(supabaseUrl, supabaseKey);
}

// GET: Listar profissionais de uma empresa
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');

    if (!companyId) {
      return NextResponse.json({ success: false, error: 'company_id é obrigatório' }, { status: 400 });
    }

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('professionals')
      .select('*')
      .eq('company_id', companyId)
      .order('name', { ascending: true });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, professionals: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

// POST: Criar ou atualizar profissional
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { company_id, professional } = body;

    if (!company_id || !professional) {
      return NextResponse.json({ success: false, error: 'company_id e professional são obrigatórios' }, { status: 400 });
    }

    const supabase = getAdminClient();
    const profPayload = {
      company_id,
      name: professional.name,
      document: professional.document || null,
      phone: professional.phone || null,
      email: professional.email || null,
      avatar_url: professional.avatar_url || null,
      role_title: professional.role_title || 'Vendedor / Consultor',
      active: professional.active !== false,
      notes: professional.notes || null,
      updated_at: new Date().toISOString(),
    };

    if (professional.id && !professional.id.startsWith('prof-')) {
      const { data, error } = await supabase
        .from('professionals')
        .update(profPayload)
        .eq('id', professional.id)
        .eq('company_id', company_id)
        .select()
        .single();

      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, professional: data });
    } else {
      const { data, error } = await supabase
        .from('professionals')
        .insert([profPayload])
        .select()
        .single();

      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, professional: data });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

// DELETE: Remover profissional
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const companyId = searchParams.get('company_id');

    if (!id || !companyId) {
      return NextResponse.json({ success: false, error: 'id e company_id são obrigatórios' }, { status: 400 });
    }

    const supabase = getAdminClient();
    const { error } = await supabase
      .from('professionals')
      .delete()
      .eq('id', id)
      .eq('company_id', companyId);

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
