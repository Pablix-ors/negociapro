import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fakytcdlffdulvdmbjut.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getAdminClient() {
  return createClient(supabaseUrl, supabaseKey);
}

// GET: Listar clientes da empresa
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');

    if (!companyId) {
      return NextResponse.json({ success: false, error: 'company_id é obrigatório' }, { status: 400 });
    }

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('company_id', companyId)
      .order('name', { ascending: true });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, customers: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

// POST: Criar ou atualizar cliente
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { company_id, customer } = body;

    if (!company_id || !customer) {
      return NextResponse.json({ success: false, error: 'Dados incompletos' }, { status: 400 });
    }

    const supabase = getAdminClient();
    const customerPayload = {
      company_id,
      type: customer.type || 'PF',
      name: customer.name,
      trade_name: customer.trade_name || null,
      document: customer.document || '',
      state_registration: customer.state_registration || null,
      municipal_registration: customer.municipal_registration || null,
      email: customer.email || null,
      phone: customer.phone || null,
      whatsapp: customer.whatsapp || null,
      contact_person: customer.contact_person || null,
      zip_code: customer.zip_code || null,
      street: customer.street || null,
      number: customer.number || null,
      complement: customer.complement || null,
      neighborhood: customer.neighborhood || null,
      city: customer.city || null,
      state: customer.state || null,
      registration_status: customer.registration_status || 'ATIVA',
      cnae: customer.cnae || null,
      notes: customer.notes || null,
      active: customer.active !== false,
      updated_at: new Date().toISOString(),
    };

    if (customer.id && !customer.id.startsWith('cust-')) {
      // Update
      const { data, error } = await supabase
        .from('customers')
        .update(customerPayload)
        .eq('id', customer.id)
        .eq('company_id', company_id)
        .select()
        .single();

      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, customer: data });
    } else {
      // Insert
      const { data, error } = await supabase
        .from('customers')
        .insert([customerPayload])
        .select()
        .single();

      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, customer: data });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

// DELETE: Deletar cliente
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
      .from('customers')
      .delete()
      .eq('id', id)
      .eq('company_id', companyId);

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
