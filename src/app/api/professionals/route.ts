import { NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { parsePagination, paginate, buildImageProxyUrl, isImageProxyUrl } from '@/lib/server/apiHelpers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fakytcdlffdulvdmbjut.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getAdminClient() {
  return createClient(supabaseUrl, supabaseKey);
}

// EGRESS: avatar_url guarda base64 (até ~3MB nos registros antigos). Nunca embutir na listagem:
// devolvemos uma URL versionada de /api/images, que o navegador baixa uma vez e mantém em cache.
const PROFESSIONAL_COLS = 'id, company_id, name, document, phone, email, role_title, active, notes, created_at, updated_at';

type ProfRow = { id: string; updated_at?: string | null; [k: string]: unknown };

async function attachAvatarUrls(supabase: SupabaseClient, companyId: string, rows: ProfRow[]) {
  if (rows.length === 0) return rows;
  const { data: withAvatar } = await supabase
    .from('professionals')
    .select('id')
    .eq('company_id', companyId)
    .not('avatar_url', 'is', null)
    .neq('avatar_url', '');
  const ids = new Set((withAvatar || []).map((r: { id: string }) => r.id));
  return rows.map((p) => ({
    ...p,
    avatar_url: ids.has(p.id) ? buildImageProxyUrl('professional', p.id, p.updated_at) : null,
  }));
}

// GET: Listar profissionais de uma empresa (paginado: page/pageSize)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');

    if (!companyId) {
      return NextResponse.json({ success: false, error: 'company_id é obrigatório' }, { status: 400 });
    }

    const supabase = getAdminClient();
    const p = parsePagination(searchParams);
    const { data, error } = await supabase
      .from('professionals')
      .select(PROFESSIONAL_COLS)
      .eq('company_id', companyId)
      .order('name', { ascending: true })
      .order('id', { ascending: true })
      .range(p.from, p.toWithExtra);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const { rows, meta } = paginate(data as ProfRow[] | null, p);
    const professionals = await attachAvatarUrls(supabase, companyId, rows);
    return NextResponse.json({ success: true, professionals, ...meta });
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
    const avatarUnchanged = isImageProxyUrl(professional.avatar_url);
    const profPayload: Record<string, unknown> = {
      company_id,
      name: professional.name,
      document: professional.document || null,
      phone: professional.phone || null,
      email: professional.email || null,
      role_title: professional.role_title || 'Vendedor / Consultor',
      active: professional.active !== false,
      notes: professional.notes || null,
      updated_at: new Date().toISOString(),
    };
    // URL do proxy = avatar não alterado → não tocar na coluna (preserva o avatar existente)
    if (!avatarUnchanged) profPayload.avatar_url = professional.avatar_url || null;

    // Resposta sem o base64: mantém o avatar que o cliente já tem em mãos
    const withClientAvatar = (row: Record<string, unknown> | null) =>
      row ? { ...row, avatar_url: professional.avatar_url || null } : row;

    if (professional.id && !professional.id.startsWith('prof-')) {
      const { data, error } = await supabase
        .from('professionals')
        .update(profPayload)
        .eq('id', professional.id)
        .eq('company_id', company_id)
        .select(PROFESSIONAL_COLS)
        .single();

      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, professional: withClientAvatar(data) });
    } else {
      const { data, error } = await supabase
        .from('professionals')
        .insert([profPayload])
        .select(PROFESSIONAL_COLS)
        .single();

      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, professional: withClientAvatar(data) });
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
