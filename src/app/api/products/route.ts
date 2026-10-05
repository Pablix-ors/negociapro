import { NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  parsePagination,
  paginate,
  parseUpdatedSince,
  buildImageProxyUrl,
  isImageProxyUrl,
} from '@/lib/server/apiHelpers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fakytcdlffdulvdmbjut.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getAdminClient() {
  return createClient(supabaseUrl, supabaseKey);
}

// EGRESS: colunas explícitas, SEM image_url (base64). A imagem é servida por /api/images
// com cache imutável; aqui retornamos apenas a URL versionada quando o produto tem imagem.
const PRODUCT_COLS = 'id, company_id, category_id, name, sku, barcode, unit, brand, description, cost_price, selling_price, min_price, current_stock, min_stock, commission_type, commission_value, active, created_at, updated_at';

type ProductRow = { id: string; updated_at?: string | null; [k: string]: unknown };

/** Anexa image_url (URL do proxy) aos produtos que possuem imagem, sem baixar o base64. */
async function attachImageUrls(supabase: SupabaseClient, companyId: string, rows: ProductRow[]) {
  if (rows.length === 0) return rows;
  const { data: withImage } = await supabase
    .from('products')
    .select('id')
    .eq('company_id', companyId)
    .not('image_url', 'is', null)
    .neq('image_url', '');
  const ids = new Set((withImage || []).map((r: { id: string }) => r.id));
  return rows.map((p) => ({
    ...p,
    image_url: ids.has(p.id) ? buildImageProxyUrl('product', p.id, p.updated_at) : null,
  }));
}

/** Remove image_url quando é a URL do proxy (imagem não alterada) para nunca sobrescrever o base64. */
function sanitizeImageField<T extends Record<string, unknown>>(fields: T): T {
  if (isImageProxyUrl(fields.image_url)) {
    const copy = { ...fields };
    delete copy.image_url;
    return copy;
  }
  return fields;
}

// GET: Obter produtos de uma empresa (paginado: page/pageSize; incremental: updated_since; fields=ids)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');

    if (!companyId) {
      return NextResponse.json({ success: false, error: 'company_id é obrigatório' }, { status: 400 });
    }

    const supabase = getAdminClient();
    const p = parsePagination(searchParams);
    const serverTime = new Date().toISOString();
    const idsOnly = searchParams.get('fields') === 'ids';

    if (idsOnly) {
      // Lista leve só com ids (usada para detectar exclusões feitas em outro dispositivo)
      const { data, error } = await supabase
        .from('products')
        .select('id')
        .eq('company_id', companyId)
        .order('id', { ascending: true })
        .range(p.from, p.toWithExtra);
      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      const { rows, meta } = paginate(data, p);
      return NextResponse.json({ success: true, ids: rows.map((r) => r.id), ...meta, server_time: serverTime });
    }

    let query = supabase.from('products').select(PRODUCT_COLS).eq('company_id', companyId);
    const updatedSince = parseUpdatedSince(searchParams);
    if (updatedSince) query = query.gte('updated_at', updatedSince);

    const { data, error } = await query
      .order('name', { ascending: true })
      .order('id', { ascending: true })
      .range(p.from, p.toWithExtra);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const { rows, meta } = paginate(data as ProductRow[] | null, p);
    const products = await attachImageUrls(supabase, companyId, rows);
    return NextResponse.json({ success: true, products, ...meta, server_time: serverTime });
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
        const { data, error } = await supabase.from('products').insert(chunk).select(PRODUCT_COLS);
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
          // Antes estes campos eram descartados no cadastro individual (imagem/comissão não eram salvas)
          ...(product.image_url && !isImageProxyUrl(product.image_url) ? { image_url: product.image_url } : {}),
          ...(product.commission_type ? { commission_type: product.commission_type } : {}),
          ...(product.commission_value !== undefined ? { commission_value: Number(product.commission_value) || 0 } : {}),
        }])
        .select(PRODUCT_COLS)
        .single();

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      // Mantém no cliente a imagem recém-enviada (evita sumir da tela após o insert)
      return NextResponse.json({
        success: true,
        product: { ...data, image_url: product.image_url && !isImageProxyUrl(product.image_url) ? product.image_url : null },
      });
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
        .select('id');

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
        const { id: prodId, ...rawFields } = p;
        if (!prodId) continue;
        const fields = sanitizeImageField(rawFields);
        const { data, error } = await supabase
          .from('products')
          .update({ ...fields, updated_at: now })
          .eq('id', prodId)
          .eq('company_id', company_id)
          .select('id')
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
        ...sanitizeImageField(updateFields),
        updated_at: now,
      })
      .eq('id', id)
      .eq('company_id', company_id)
      .select(PRODUCT_COLS)
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
