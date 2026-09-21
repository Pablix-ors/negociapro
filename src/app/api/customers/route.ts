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

    // Mapear campos agregados e metadados preservados em notes
    const mapped = (data || []).map((c: any) => {
      let regStatus = c.registration_status || null;
      let cnaeVal = c.cnae || null;
      if (c.notes) {
        if (!regStatus) {
          const m = c.notes.match(/Situação:\s*([^|\n]+)/);
          if (m) regStatus = m[1].trim();
        }
        if (!cnaeVal) {
          const m = c.notes.match(/CNAE:\s*([^|\n]+)/);
          if (m) cnaeVal = m[1].trim();
        }
      }
      return {
        ...c,
        registration_status: regStatus || 'ATIVA',
        cnae: cnaeVal || null,
        total_purchased: Number(c.total_purchased) || 0,
        orders_count: Number(c.orders_count) || 0,
      };
    });

    return NextResponse.json({ success: true, customers: mapped });
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

    // Preservar situação cadastral e CNAE nas observações sem quebrar schema do Postgres
    let notes = customer.notes || '';
    if (customer.registration_status && !notes.includes(customer.registration_status)) {
      notes = notes ? `${notes} | Situação: ${customer.registration_status}` : `Situação: ${customer.registration_status}`;
    }
    if (customer.cnae && !notes.includes(customer.cnae)) {
      notes = notes ? `${notes} | CNAE: ${customer.cnae}` : `CNAE: ${customer.cnae}`;
    }

    // Payload compatível estritamente com as colunas da tabela customers no banco
    const customerPayload: Record<string, any> = {
      company_id,
      type: customer.type === 'PJ' ? 'PJ' : 'PF',
      name: customer.name?.trim() || '',
      trade_name: customer.trade_name?.trim() || null,
      document: customer.document?.trim() || '',
      state_registration: customer.state_registration?.trim() || null,
      municipal_registration: customer.municipal_registration?.trim() || null,
      birth_date: customer.birth_date ? customer.birth_date : null,
      email: customer.email?.trim() || null,
      phone: customer.phone?.trim() || null,
      whatsapp: customer.whatsapp?.trim() || null,
      contact_person: customer.contact_person?.trim() || null,
      zip_code: customer.zip_code?.trim() || null,
      street: customer.street?.trim() || null,
      number: customer.number?.trim() || null,
      complement: customer.complement?.trim() || null,
      neighborhood: customer.neighborhood?.trim() || null,
      city: customer.city?.trim() || null,
      state: customer.state?.trim() || null,
      notes: notes || null,
      active: customer.active !== false,
      updated_at: new Date().toISOString(),
    };

    let savedCustomer = null;

    if (customer.id && !customer.id.startsWith('cust-')) {
      // Update por id existente
      const { data, error } = await supabase
        .from('customers')
        .update(customerPayload)
        .eq('id', customer.id)
        .eq('company_id', company_id)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Erro ao atualizar cliente por id:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      savedCustomer = data;
    }

    if (!savedCustomer) {
      // Tentar upsert com onConflict em company_id,document se documento informado
      if (customerPayload.document) {
        const { data: upsertData, error: upsertError } = await supabase
          .from('customers')
          .upsert([customerPayload], { onConflict: 'company_id,document' })
          .select()
          .maybeSingle();

        if (!upsertError && upsertData) {
          savedCustomer = upsertData;
        } else if (upsertError) {
          console.warn('Upsert falhou, tentando insert direto:', upsertError.message);
        }
      }

      if (!savedCustomer) {
        const { data: insertData, error: insertError } = await supabase
          .from('customers')
          .insert([customerPayload])
          .select()
          .maybeSingle();

        if (insertError) {
          console.error('Erro ao inserir cliente no Supabase:', insertError);
          return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
        }
        savedCustomer = insertData;
      }
    }

    return NextResponse.json({
      success: true,
      customer: {
        ...savedCustomer,
        registration_status: customer.registration_status || 'ATIVA',
        cnae: customer.cnae || null,
        total_purchased: 0,
        orders_count: 0,
      },
    });
  } catch (err: any) {
    console.error('Erro no POST /api/customers:', err);
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
