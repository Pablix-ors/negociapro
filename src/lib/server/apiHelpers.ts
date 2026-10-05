/**
 * Helpers compartilhados pelas rotas de API para reduzir egress do Supabase.
 */

export const DEFAULT_PAGE_SIZE = 200;
export const MAX_PAGE_SIZE = 500;

export interface Pagination {
  page: number;
  pageSize: number;
  from: number;
  /** índice final INCLUSIVO pedindo 1 registro extra para detectar hasMore */
  toWithExtra: number;
}

/** Lê page/pageSize da URL com limites seguros (page>=1, 1<=pageSize<=MAX_PAGE_SIZE). */
export function parsePagination(searchParams: URLSearchParams): Pagination {
  const rawPage = parseInt(searchParams.get('page') || '1', 10);
  const rawSize = parseInt(searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE), 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const pageSize = Number.isFinite(rawSize) && rawSize > 0 ? Math.min(rawSize, MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  return { page, pageSize, from, toWithExtra: from + pageSize };
}

/** Separa o registro extra e devolve metadados de paginação. */
export function paginate<T>(rows: T[] | null | undefined, p: Pagination) {
  const list = rows || [];
  const hasMore = list.length > p.pageSize;
  return {
    rows: hasMore ? list.slice(0, p.pageSize) : list,
    meta: { page: p.page, pageSize: p.pageSize, hasMore },
  };
}

/** Valida o parâmetro updated_since (ISO). Retorna null se ausente/inválido. */
export function parseUpdatedSince(searchParams: URLSearchParams): string | null {
  const v = searchParams.get('updated_since');
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

// ─── Imagens base64 servidas por URL cacheável ──────────────────────────────
// image_url (products) e avatar_url (professionals) guardam base64 no banco.
// Em vez de embutir esse conteúdo nas listagens, retornamos uma URL versionada
// (/api/images?...&v=updated_at) que o navegador baixa uma única vez e mantém em cache.

export type ImageKind = 'product' | 'professional';

export const IMAGE_PROXY_PREFIX = '/api/images?';

export function buildImageProxyUrl(kind: ImageKind, id: string, version?: string | null): string {
  const v = version ? encodeURIComponent(new Date(version).getTime().toString(36)) : '0';
  return `${IMAGE_PROXY_PREFIX}kind=${kind}&id=${encodeURIComponent(id)}&v=${v}`;
}

/** true se o valor é uma URL do proxy (ou seja, a imagem não foi alterada pelo usuário). */
export function isImageProxyUrl(value: unknown): boolean {
  return typeof value === 'string' && value.startsWith(IMAGE_PROXY_PREFIX);
}
