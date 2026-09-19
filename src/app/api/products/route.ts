import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fakytcdlffdulvdmbjut.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getAdminClient() {
  return createClient(supabaseUrl, supabaseKey);
}

// GET: Obter produtos de uma empresa
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');

    if (!companyId) {
      return NextResponse.json({ success: false, error: 'company_id é obrigatório' }, { status: 400 });
    }

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('company_id', companyId)
      .order('name', { ascending: true });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, products: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

// POST: Cadastrar ou sincronizar produtos em lote ou individualmente
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { company_id, products, product } = body;

    if (!company_id) {
      return NextResponse.json({ success: false, error: 'company_id é obrigatório' }, { status: 400 });
    }

    const supabase = getAdminClient();

    if (Array.isArray(products) && products.length > 0) {
      const formatted = products.map((p: any) => ({
        company_id,
        name: p.name,
        sku: p.sku || null,
        barcode: p.barcode || null,
        unit: p.unit || 'UN',
        brand: p.brand || null,
        description: p.description || null,
        cost_price: Number(p.cost_price) || 0,
        selling_price: Number(p.selling_price) || 0,
        min_price: Number(p.min_price) || Number(p.selling_price) || 0,
        current_stock: Number(p.current_stock) || 0,
        min_stock: Number(p.min_stock) || 0,
        active: p.active !== false,
      }));

      // Inserção em lotes de 100 para segurança e performance
      const chunkSize = 100;
      const insertedAll: any[] = [];
      for (let i = 0; i < formatted.length; i += chunkSize) {
        const chunk = formatted.slice(i, i + chunkSize);
        const { data, error } = await supabase.from('products').insert(chunk).select();
        if (error) {
          console.error('Erro ao inserir lote de produtos:', error);
          return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }
        if (data) insertedAll.push(...data);
      }

      return NextResponse.json({ success: true, count: insertedAll.length, products: insertedAll });
    } else if (product) {
      const { data, error } = await supabase
        .from('products')
        .insert([{
          company_id,
          name: product.name,
          sku: product.sku || null,
          barcode: product.barcode || null,
          unit: product.unit || 'UN',
          brand: product.brand || null,
          description: product.description || null,
          cost_price: Number(product.cost_price) || 0,
          selling_price: Number(product.selling_price) || 0,
          min_price: Number(product.min_price) || Number(product.selling_price) || 0,
          current_stock: Number(product.current_stock) || 0,
          min_stock: Number(product.min_stock) || 0,
          active: product.active !== false,
        }])
        .select()
        .single();

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, product: data });
    }

    return NextResponse.json({ success: false, error: 'Nenhum produto enviado' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

// PUT: Atualizar produto individual ou em lote no banco de dados Supabase
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { company_id, id, ids, updates, products, ...updateFields } = body;

    if (!company_id) {
      return NextResponse.json({ success: false, error: 'company_id é obrigatório' }, { status: 400 });
    }

    const supabase = getAdminClient();
    const now = new Date().toISOString();

    // 1. Atualização em massa com os mesmos campos para múltiplos IDs (Edição em Massa)
    if (Array.isArray(ids) && ids.length > 0 && updates) {
      const allowedUpdates: Record<string, any> = {
        updated_at: now,
      };
      if (updates.unit !== undefined) allowedUpdates.unit = updates.unit;
      if (updates.commission_type !== undefined) allowedUpdates.commission_type = updates.commission_type;
      if (updates.commission_value !== undefined) allowedUpdates.commission_value = Number(updates.commission_value) || 0;
      if (updates.brand !== undefined) allowedUpdates.brand = updates.brand ? updates.brand.trim() : null;
      if (updates.active !== undefined) allowedUpdates.active = updates.active !== false;
      if (updates.min_stock !== undefined) allowedUpdates.min_stock = Number(updates.min_stock) || 0;
      if (updates.selling_price !== undefined) allowedUpdates.selling_price = Number(updates.selling_price) || 0;
      if (updates.min_price !== undefined) allowedUpdates.min_price = Number(updates.min_price) || 0;

      const { data, error } = await supabase
        .from('products')
        .update(allowedUpdates)
        .in('id', ids)
        .eq('company_id', company_id)
        .select();

      if (error) {
        console.error('Erro no update em lote de produtos:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, count: data?.length || 0, products: data });
    }

    // 2. Atualização em lote com dados individuais (Importação / Sincronização de Planilha)
    if (Array.isArray(products) && products.length > 0) {
      const updatedList: any[] = [];
      for (const p of products) {
        const { id: prodId, ...fields } = p;
        if (!prodId) continue;
        const { data, error } = await supabase
          .from('products')
          .update({ ...fields, updated_at: now })
          .eq('id', prodId)
          .eq('company_id', company_id)
          .select()
          .maybeSingle();

        if (data && !error) updatedList.push(data);
      }

      return NextResponse.json({ success: true, count: updatedList.length, products: updatedList });
    }

    // 3. Atualização de produto único
    if (!id) {
      return NextResponse.json({ success: false, error: 'id ou lista de ids são obrigatórios' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('products')
      .update({
        ...updateFields,
        updated_at: now,
      })
      .eq('id', id)
      .eq('company_id', company_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, product: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

// DELETE: Deletar produto(s)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const idsParam = searchParams.get('ids');
    let companyId = searchParams.get('company_id');

    let idsToDelete: string[] = [];
    if (id) idsToDelete.push(id);
    if (idsParam) idsToDelete.push(...idsParam.split(',').map((x) => x.trim()).filter(Boolean));

    // Também aceita corpo JSON caso a requisição envie { ids: string[], company_id }
    if (idsToDelete.length === 0) {
      try {
        const body = await request.json();
        if (body.ids && Array.isArray(body.ids)) idsToDelete = body.ids;
        if (body.id) idsToDelete.push(body.id);
        if (body.company_id) companyId = body.company_id;
      } catch {}
    }

    if (!companyId || idsToDelete.length === 0) {
      return NextResponse.json({ success: false, error: 'company_id e id(s) são obrigatórios' }, { status: 400 });
    }

    const supabase = getAdminClient();
    const { error } = await supabase
      .from('products')
      .delete()
      .in('id', idsToDelete)
      .eq('company_id', companyId);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: idsToDelete.length });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
