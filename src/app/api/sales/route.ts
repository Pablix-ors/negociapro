import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fakytcdlffdulvdmbjut.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getAdminClient() {
  return createClient(supabaseUrl, supabaseKey);
}

// GET: Listar vendas de uma empresa com itens, cliente e profissional
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');

    if (!companyId) {
      return NextResponse.json({ success: false, error: 'company_id é obrigatório' }, { status: 400 });
    }

    const supabase = getAdminClient();

    // 1. Buscar vendas
    const { data: sales, error: salesErr } = await supabase
      .from('sales')
      .select('*, customer:customers(*), professional:professionals(*), seller:profiles(*)')
      .eq('company_id', companyId)
      .order('sold_at', { ascending: false });

    if (salesErr) {
      return NextResponse.json({ success: false, error: salesErr.message }, { status: 500 });
    }

    if (!sales || sales.length === 0) {
      return NextResponse.json({ success: true, sales: [] });
    }

    // 2. Buscar itens dessas vendas
    const saleIds = sales.map((s) => s.id);
    const { data: items, error: itemsErr } = await supabase
      .from('sale_items')
      .select('*, product:products(*)')
      .in('sale_id', saleIds);

    const itemsBySaleId: Record<string, any[]> = {};
    (items || []).forEach((item) => {
      if (!itemsBySaleId[item.sale_id]) {
        itemsBySaleId[item.sale_id] = [];
      }
      itemsBySaleId[item.sale_id].push(item);
    });

    const populatedSales = sales.map((s) => ({
      ...s,
      items: itemsBySaleId[s.id] || [],
    }));

    return NextResponse.json({ success: true, sales: populatedSales });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

// POST: Criar nova venda no banco de dados real com itens e histórico
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { company_id, sale, items } = body;

    if (!company_id || !sale || !Array.isArray(items)) {
      return NextResponse.json({ success: false, error: 'Dados incompletos para registrar venda' }, { status: 400 });
    }

    const supabase = getAdminClient();

    // 1. Inserir a venda
    const salePayload: any = {
      company_id,
      customer_id: sale.customer_id,
      seller_id: sale.seller_id || null,
      professional_id: sale.professional_id || null,
      status: sale.status || 'COMPLETED',
      subtotal: Number(sale.subtotal) || 0,
      discount: Number(sale.discount) || 0,
      total: Number(sale.total) || 0,
      commission_total: Number(sale.commission_total) || 0,
      payment_method_id: sale.payment_method_id || null,
      notes: sale.notes || null,
      sold_at: sale.sold_at || new Date().toISOString(),
    };

    if (sale.sale_number) {
      salePayload.sale_number = sale.sale_number;
    }

    const { data: createdSale, error: saleErr } = await supabase
      .from('sales')
      .insert([salePayload])
      .select('*, customer:customers(*), professional:professionals(*)')
      .single();

    if (saleErr) {
      console.error('Erro ao salvar venda no Supabase:', saleErr);
      return NextResponse.json({ success: false, error: saleErr.message }, { status: 500 });
    }

    // 2. Inserir itens da venda
    if (items.length > 0) {
      const itemsPayload = items.map((it: any) => ({
        sale_id: createdSale.id,
        company_id,
        product_id: it.product_id,
        quantity: Number(it.quantity) || 1,
        unit_price: Number(it.unit_price) || 0,
        discount: Number(it.discount) || 0,
        total: Number(it.total) || 0,
        commission_type_snapshot: it.commission_type_snapshot || 'NONE',
        commission_value_snapshot: Number(it.commission_value_snapshot) || 0,
        commission_amount: Number(it.commission_amount) || 0,
      }));

      const { data: insertedItems, error: itemsErr } = await supabase
        .from('sale_items')
        .insert(itemsPayload)
        .select('*, product:products(*)');

      if (itemsErr) {
        console.warn('Aviso ao salvar itens da venda:', itemsErr);
      }

      createdSale.items = insertedItems || [];
    }

    return NextResponse.json({ success: true, sale: createdSale });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

// PATCH: Cancelar venda
export async function PATCH(request: Request) {
  try {
    const { id, company_id, status } = await request.json();
    if (!id || !company_id) {
      return NextResponse.json({ success: false, error: 'id e company_id são obrigatórios' }, { status: 400 });
    }

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('sales')
      .update({ status: status || 'CANCELLED', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('company_id', company_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, sale: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
