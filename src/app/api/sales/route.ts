import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { parsePagination, paginate, parseUpdatedSince } from '@/lib/server/apiHelpers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hqulqmxgrgjbsllquqeu.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getAdminClient() {
  return createClient(supabaseUrl, supabaseKey);
}

// EGRESS: colunas explícitas nos joins. NUNCA incluir avatar_url (profiles/professionals)
// nem image_url (products): são armazenados como base64 (até vários MB) e eram
// replicados em CADA venda / CADA item a cada sincronização, gerando dezenas de GB de egress.
const CUSTOMER_COLS = 'id, company_id, type, name, trade_name, document, state_registration, municipal_registration, email, phone, whatsapp, contact_person, zip_code, street, number, complement, neighborhood, city, state, active';
const PROFESSIONAL_COLS = 'id, company_id, name, document, phone, email, role_title, active';
const SELLER_COLS = 'id, name, email, role';
const PRODUCT_COLS = 'id, company_id, name, sku, barcode, unit, brand, cost_price, selling_price, min_price, current_stock, min_stock, commission_type, commission_value, active';
const SALE_SELECT = `*, customer:customers(${CUSTOMER_COLS}), professional:professionals(${PROFESSIONAL_COLS})`;
const SALE_ITEM_SELECT = `*, product:products(${PRODUCT_COLS})`;

// GET: Listar vendas de uma empresa com itens, cliente e profissional
// Paginado (page/pageSize), incremental (updated_since) e modo leve (fields=ids → id, sale_number, status).
// Busca por id/sale_id/customer_id continua funcionando normalmente.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');
    const customerId = searchParams.get('customer_id');
    const saleId = searchParams.get('id') || searchParams.get('sale_id');

    if (!companyId) {
      return NextResponse.json({ success: false, error: 'company_id é obrigatório' }, { status: 400 });
    }

    const supabase = getAdminClient();
    const p = parsePagination(searchParams);
    const serverTime = new Date().toISOString();
    const noStore = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    };

    if (searchParams.get('fields') === 'ids') {
      // Lista mínima usada para reconciliar exclusões e pendências de sincronização
      const { data, error } = await supabase
        .from('sales')
        .select('id, sale_number, status')
        .eq('company_id', companyId)
        .order('id', { ascending: true })
        .range(p.from, p.toWithExtra);
      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      const { rows, meta } = paginate(data, p);
      return NextResponse.json({ success: true, sales: rows, ...meta, server_time: serverTime }, { headers: noStore });
    }

    // Construir query de vendas
    let query = supabase
      .from('sales')
      .select(`${SALE_SELECT}, seller:profiles(${SELLER_COLS})`)
      .eq('company_id', companyId);

    if (saleId) {
      query = query.eq('id', saleId);
    }

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    const updatedSince = parseUpdatedSince(searchParams);
    if (updatedSince) {
      query = query.gte('updated_at', updatedSince);
    }

    const { data: rawSales, error: salesErr } = await query
      .order('sold_at', { ascending: false })
      .order('id', { ascending: true })
      .range(p.from, p.toWithExtra);

    if (salesErr) {
      return NextResponse.json({ success: false, error: salesErr.message }, { status: 500 });
    }

    const { rows: sales, meta } = paginate(rawSales, p);

    if (sales.length === 0) {
      return NextResponse.json({ success: true, sales: [], ...meta, server_time: serverTime }, { headers: noStore });
    }

    // Itens em lotes de 50 vendas (URL curta) e paginando de 1000 em 1000 (limite padrão do PostgREST)
    const saleIds = sales.map((s) => s.id);
    const items: any[] = [];
    for (let i = 0; i < saleIds.length; i += 50) {
      const chunk = saleIds.slice(i, i + 50);
      for (let from = 0; ; from += 1000) {
        const { data: part, error: itemsErr } = await supabase
          .from('sale_items')
          .select(SALE_ITEM_SELECT)
          .in('sale_id', chunk)
          .order('id', { ascending: true })
          .range(from, from + 999);
        if (itemsErr || !part) break;
        items.push(...part);
        if (part.length < 1000) break;
      }
    }

    const itemsBySaleId: Record<string, any[]> = {};
    items.forEach((item) => {
      if (!itemsBySaleId[item.sale_id]) {
        itemsBySaleId[item.sale_id] = [];
      }
      itemsBySaleId[item.sale_id].push(item);
    });

    const populatedSales = sales.map((s) => ({
      ...s,
      items: itemsBySaleId[s.id] || [],
    }));

    return NextResponse.json({ success: true, sales: populatedSales, ...meta, server_time: serverTime }, { headers: noStore });

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
      // Campos adicionados para suporte a orçamentos (QUOTE) e parcelamentos
      payment_method_name: sale.payment_method_name || null,
      payment_type: sale.payment_type || 'A_VISTA',
      installments_count: Number(sale.installments_count) || 1,
      installments_plan: sale.installments_plan || null,
      converted_from_quote_id: sale.converted_from_quote_id || null,
      notes: sale.notes || null,
      sold_at: sale.sold_at || new Date().toISOString(),
    };

    if (sale.sale_number) {
      salePayload.sale_number = sale.sale_number;
    }

    const { data: createdSale, error: saleErr } = await supabase
      .from('sales')
      .insert([salePayload])
      .select(SALE_SELECT)
      .single();

    if (saleErr) {
      console.error('Erro ao salvar venda no Supabase:', saleErr);
      return NextResponse.json({ success: false, error: saleErr.message }, { status: 500 });
    }

    // 2. Inserir itens da venda
    if (items.length > 0) {
      const itemsPayloadWithCommission = items.map((it: any) => ({
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

      const { data: insertedWithComm, error: commErr } = await supabase
        .from('sale_items')
        .insert(itemsPayloadWithCommission)
        .select(SALE_ITEM_SELECT);

      if (commErr) {
        console.warn('Aviso: falha ao salvar itens com colunas de comissão, tentando com colunas base:', commErr.message);

        // Fallback para tabela de itens que não tenha colunas de comissão ainda migradas
        const itemsPayloadBase = items.map((it: any) => ({
          sale_id: createdSale.id,
          company_id,
          product_id: it.product_id,
          quantity: Number(it.quantity) || 1,
          unit_price: Number(it.unit_price) || 0,
          discount: Number(it.discount) || 0,
          total: Number(it.total) || 0,
        }));

        const { data: insertedBase, error: baseErr } = await supabase
          .from('sale_items')
          .insert(itemsPayloadBase)
          .select(SALE_ITEM_SELECT);

        if (baseErr) {
          console.error('Erro ao salvar itens da venda (base):', baseErr.message);
          // Se falhou no banco, repassar os itens originais da requisição para não esvaziar a venda
          createdSale.items = items;
        } else {
          // Reincorporar os campos de comissão aos itens salvos para não perder no client
          createdSale.items = (insertedBase || []).map((bItem: any, idx: number) => ({
            ...bItem,
            commission_type_snapshot: items[idx]?.commission_type_snapshot || 'NONE',
            commission_value_snapshot: Number(items[idx]?.commission_value_snapshot) || 0,
            commission_amount: Number(items[idx]?.commission_amount) || 0,
          }));
        }
      } else {
        createdSale.items = insertedWithComm || items;
      }
    } else {
      createdSale.items = [];
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
      .select('id, status, updated_at')
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, sale: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

// PUT: Editar venda existente (Apenas ADMIN ou GERENTE com permissão)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { company_id, sale_id, sale, items, requester_role, requester_name, requester_id } = body;

    if (!company_id || !sale_id || !sale) {
      return NextResponse.json({ success: false, error: 'company_id, sale_id e sale são obrigatórios' }, { status: 400 });
    }

    // Validação estrita de permissão no backend
    const isAuthorized = requester_role === 'ADMIN' || requester_role === 'GERENTE';
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Apenas Administradores ou Gerentes possuem permissão para editar vendas finalizadas.' },
        { status: 403 }
      );
    }

    const supabase = getAdminClient();

    // 1. Atualizar registro da venda
    const updatePayload: any = {
      customer_id: sale.customer_id || null,
      professional_id: sale.professional_id || null,
      subtotal: Number(sale.subtotal) || 0,
      discount: Number(sale.discount) || 0,
      total: Number(sale.total) || 0,
      commission_total: Number(sale.commission_total) || 0,
      payment_method_name: sale.payment_method_name || null,
      payment_type: sale.payment_type || 'A_VISTA',
      installments_count: Number(sale.installments_count) || 1,
      installments_plan: sale.installments_plan || null,
      notes: sale.notes || null,
      updated_at: new Date().toISOString(),
    };

    if (sale.status) {
      updatePayload.status = sale.status;
    }

    const { data: updatedSale, error: updateErr } = await supabase
      .from('sales')
      .update(updatePayload)
      .eq('id', sale_id)
      .eq('company_id', company_id)
      .select(SALE_SELECT)
      .single();

    if (updateErr) {
      console.error('Erro ao atualizar venda no Supabase:', updateErr.message);
      return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
    }

    // 2. Atualizar itens se fornecidos
    if (Array.isArray(items)) {
      // Deletar itens antigos
      await supabase.from('sale_items').delete().eq('sale_id', sale_id);

      if (items.length > 0) {
        const itemsPayload = items.map((it: any) => ({
          sale_id,
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

        const { data: insertedItems } = await supabase
          .from('sale_items')
          .insert(itemsPayload)
          .select(SALE_ITEM_SELECT);

        updatedSale.items = insertedItems || items;
      } else {
        updatedSale.items = [];
      }
    }

    return NextResponse.json({ success: true, sale: updatedSale });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

// DELETE: Excluir venda definitivamente (e seus itens vinculados)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const saleNumber = searchParams.get('sale_number');
    const companyId = searchParams.get('company_id');

    if (!companyId || (!id && !saleNumber)) {
      return NextResponse.json({ success: false, error: 'company_id e (id ou sale_number) são obrigatórios' }, { status: 400 });
    }

    const supabase = getAdminClient();

    // 1. Identificar ID da venda
    let targetSaleId = id;
    if (!targetSaleId && saleNumber) {
      const { data: found } = await supabase
        .from('sales')
        .select('id')
        .eq('company_id', companyId)
        .eq('sale_number', Number(saleNumber))
        .single();
      if (found?.id) {
        targetSaleId = found.id;
      }
    }

    if (targetSaleId) {
      // 2. Excluir itens vinculados primeiro
      await supabase.from('sale_items').delete().eq('sale_id', targetSaleId);
      // 3. Excluir a venda
      const { error: delErr } = await supabase
        .from('sales')
        .delete()
        .eq('id', targetSaleId)
        .eq('company_id', companyId);

      if (delErr) {
        return NextResponse.json({ success: false, error: delErr.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

