import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
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
