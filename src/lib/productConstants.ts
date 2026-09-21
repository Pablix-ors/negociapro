export interface StandardUnit {
  value: string;
  label: string;
  category?: string;
}

export const STANDARD_UNITS: StandardUnit[] = [
  { value: 'UN', label: 'UN — Unidade' },
  { value: 'KG', label: 'KG — Quilograma' },
  { value: 'G', label: 'G — Grama' },
  { value: 'L', label: 'L — Litro' },
  { value: 'ML', label: 'ML — Mililitro' },
  { value: 'CX', label: 'CX — Caixa' },
  { value: 'PCT', label: 'PCT — Pacote' },
  { value: 'FD', label: 'FD — Fardo' },
  { value: 'DZ', label: 'DZ — Dúzia' },
  { value: 'PAR', label: 'PAR — Par' },
  { value: 'M', label: 'M — Metro' },
  { value: 'M²', label: 'M² — Metro quadrado' },
  { value: 'M³', label: 'M³ — Metro cúbico' },
  { value: 'SC', label: 'SC — Saco' },
  { value: 'RL', label: 'RL — Rolo' },
  { value: 'MIL', label: 'MIL — Milheiro' },
  { value: 'BD', label: 'BD — Balde' },
];

export const COMMISSION_TYPES = [
  { value: 'NONE', label: 'Sem comissão', excelValue: 'SEM_COMISSAO', badge: 'Sem comissão' },
  { value: 'PERCENTAGE', label: 'Percentual (%)', excelValue: 'PERCENTUAL', badge: 'Percentual' },
  { value: 'FIXED', label: 'Valor fixo (R$)', excelValue: 'FIXA', badge: 'Valor fixo' },
] as const;

export type StandardCommissionType = 'NONE' | 'PERCENTAGE' | 'FIXED';

/**
 * Normaliza o tipo de comissão vindo de textos variados (Excel ou digitação)
 */
export function normalizeCommissionType(raw: any): StandardCommissionType {
  if (!raw) return 'NONE';
  const clean = String(raw).trim().toUpperCase().replace(/[\s_-]/g, '');
  if (clean.includes('PERC') || clean === '%') return 'PERCENTAGE';
  if (clean.includes('FIX') || clean.includes('VALOR') || clean === 'R$') return 'FIXED';
  return 'NONE';
}

/**
 * Retorna o valor de comissão formatado para exibição rápida
 */
export function formatCommissionDisplay(type: StandardCommissionType, value: number): string {
  if (type === 'NONE' || !value) return 'Sem comissão';
  if (type === 'PERCENTAGE') return `${value}%`;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

/**
 * Normaliza unidade para maiúsculas e remove caracteres indesejados
 */
export function normalizeUnit(raw: any): string {
  if (!raw) return 'UN';
  const clean = String(raw).trim().toUpperCase();
  const match = STANDARD_UNITS.find((u) => u.value === clean);
  return match ? match.value : clean || 'UN';
}
