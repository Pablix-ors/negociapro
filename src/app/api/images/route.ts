import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fakytcdlffdulvdmbjut.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const SOURCES = {
  product: { table: 'products', column: 'image_url' },
  professional: { table: 'professionals', column: 'avatar_url' },
} as const;

/**
 * GET /api/images?kind=product|professional&id=<uuid>&v=<versão>
 *
 * Serve UMA imagem base64 armazenada no banco como arquivo binário com cache
 * imutável. A URL é versionada pelo updated_at do registro (parâmetro v), então o
 * navegador/CDN baixa cada imagem apenas uma vez por versão, em vez de recebê-la
 * embutida em toda listagem JSON.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get('kind') as keyof typeof SOURCES | null;
  const id = searchParams.get('id');

  if (!kind || !(kind in SOURCES) || !id) {
    return new Response('Parâmetros inválidos', { status: 400 });
  }

  const { table, column } = SOURCES[kind];
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase.from(table).select(column).eq('id', id).maybeSingle();

  if (error) return new Response('Erro ao carregar imagem', { status: 500 });

  const raw = (data as Record<string, string | null> | null)?.[column];
  if (!raw) {
    return new Response('Imagem não encontrada', {
      status: 404,
      headers: { 'Cache-Control': 'public, max-age=300' },
    });
  }

  // URLs externas (http/https) apenas redirecionam
  if (/^https?:\/\//i.test(raw)) {
    return Response.redirect(raw, 302);
  }

  const match = raw.match(/^data:([^;,]+)?(;base64)?,([\s\S]*)$/);
  if (!match) return new Response('Formato de imagem inválido', { status: 415 });

  const mime = match[1] || 'application/octet-stream';
  if (!mime.startsWith('image/')) return new Response('Formato de imagem inválido', { status: 415 });

  let body: Uint8Array;
  if (match[2]) {
    const bin = atob(match[3]);
    body = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) body[i] = bin.charCodeAt(i);
  } else {
    body = new TextEncoder().encode(decodeURIComponent(match[3]));
  }

  return new Response(body as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': mime,
      'Content-Length': String(body.byteLength),
      // Versionada por ?v= → pode ser cacheada indefinidamente
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
