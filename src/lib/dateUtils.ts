/**
 * @file dateUtils.ts
 * @description Módulo centralizado e canônico de cálculo de períodos, datas e timezone do NegociaPro.
 * 
 * Regras arquiteturais:
 * 1. O fuso horário de referência para operações de calendário comercial do sistema é configurável
 *    (default: 'America/Sao_Paulo' / fuso horário local do Brasil).
 * 2. As consultas de intervalo retornam { startDate, endDate, startIso, endIso, label }.
 * 3. Todas as verificações de data ("Hoje", "Últimos 7 dias", "Este mês", etc.) operam
 *    com base no momento do sistema, sem nenhuma data fixa hardcoded.
 * 4. As funções de comparação comparam timestamps exatos ou strings no formato YYYY-MM-DD
 *    extraídas respeitando o timezone local para evitar shifts de meia-noite (UTC vs UTC-3).
 */

export type StandardPeriod = 'today' | 'yesterday' | '7d' | '30d' | 'month' | 'last_month' | 'year' | 'all';

export interface DateRange {
  id: StandardPeriod;
  label: string;
  startDate: Date;
  endDate: Date;
  /** YYYY-MM-DD local do início */
  startFormatted: string;
  /** YYYY-MM-DD local do fim */
  endFormatted: string;
  /** ISO string do início do período (00:00:00.000 local) */
  startIso: string;
  /** ISO string do fim do período (23:59:59.999 local) */
  endIso: string;
}

/** Retorna componentes de data [ano, mes(1-12), dia, hora, min, seg] no fuso horário do Brasil/Local */
export function getLocalParts(d: Date = new Date(), timeZone: string = 'America/Sao_Paulo') {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });

  const parts = formatter.formatToParts(d);
  const partMap: Record<string, number> = {};
  for (const p of parts) {
    if (p.type !== 'literal') {
      partMap[p.type] = parseInt(p.value, 10);
    }
  }

  return {
    year: partMap.year ?? d.getFullYear(),
    month: partMap.month ?? d.getMonth() + 1,
    day: partMap.day ?? d.getDate(),
    hour: (partMap.hour === 24 ? 0 : partMap.hour) ?? d.getHours(),
    minute: partMap.minute ?? d.getMinutes(),
    second: partMap.second ?? d.getSeconds(),
  };
}

/** Formata número com 2 dígitos */
function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/**
 * Retorna uma data no formato YYYY-MM-DD correspondente ao horário local do sistema/timezone
 */
export function getLocalDateString(dateInput?: string | Date | null, timeZone: string = 'America/Sao_Paulo'): string {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '';
  const parts = getLocalParts(d, timeZone);
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
}

/**
 * Cria um objeto Date correspondente ao início do dia (00:00:00.000) no horário local
 */
export function startOfDay(year: number, month1Indexed: number, day: number): Date {
  return new Date(year, month1Indexed - 1, day, 0, 0, 0, 0);
}

/**
 * Cria um objeto Date correspondente ao final do dia (23:59:59.999) no horário local
 */
export function endOfDay(year: number, month1Indexed: number, day: number): Date {
  return new Date(year, month1Indexed - 1, day, 23, 59, 59, 999);
}

/**
 * Retorna o número de dias em um determinado mês/ano
 */
export function getDaysInMonth(year: number, month1Indexed: number): number {
  return new Date(year, month1Indexed, 0).getDate();
}

/**
 * Sistema centralizado de cálculo de períodos do NegociaPro.
 * 
 * @param period - Período desejado: 'today' | 'yesterday' | '7d' | '30d' | 'month' | 'last_month' | 'year' | 'all'
 * @param now - Momento atual (default: new Date())
 * @param timeZone - Fuso horário oficial da empresa (default: 'America/Sao_Paulo')
 */
export function getDateRange(
  period: StandardPeriod | string,
  now: Date = new Date(),
  timeZone: string = 'America/Sao_Paulo'
): DateRange {
  const current = getLocalParts(now, timeZone);
  const nowYear = current.year;
  const nowMonth = current.month; // 1-12
  const nowDay = current.day;

  let start: Date;
  let end: Date = endOfDay(nowYear, nowMonth, nowDay);
  let label = 'Período';

  switch (period) {
    case 'today':
    case 'TODAY':
    case 'hoje': {
      start = startOfDay(nowYear, nowMonth, nowDay);
      end = endOfDay(nowYear, nowMonth, nowDay);
      label = 'Hoje';
      break;
    }

    case 'yesterday':
    case 'YESTERDAY':
    case 'ontem': {
      const yDate = new Date(nowYear, nowMonth - 1, nowDay - 1);
      const yParts = getLocalParts(yDate, timeZone);
      start = startOfDay(yParts.year, yParts.month, yParts.day);
      end = endOfDay(yParts.year, yParts.month, yParts.day);
      label = 'Ontem';
      break;
    }

    case '7d':
    case 'WEEK':
    case '7_dias':
    case 'ultimos_7_dias': {
      // 7 dias contando com hoje: hoje - 6 dias
      const past7 = new Date(nowYear, nowMonth - 1, nowDay - 6);
      const pParts = getLocalParts(past7, timeZone);
      start = startOfDay(pParts.year, pParts.month, pParts.day);
      end = endOfDay(nowYear, nowMonth, nowDay);
      label = 'Últimos 7 Dias';
      break;
    }

    case '30d':
    case 'LAST_30_DAYS':
    case '30_dias':
    case 'ultimos_30_dias': {
      // 30 dias contando com hoje: hoje - 29 dias
      const past30 = new Date(nowYear, nowMonth - 1, nowDay - 29);
      const pParts = getLocalParts(past30, timeZone);
      start = startOfDay(pParts.year, pParts.month, pParts.day);
      end = endOfDay(nowYear, nowMonth, nowDay);
      label = 'Últimos 30 Dias';
      break;
    }

    case 'month':
    case 'MONTH':
    case 'mes':
    case 'este_mes': {
      start = startOfDay(nowYear, nowMonth, 1);
      const daysInThisMonth = getDaysInMonth(nowYear, nowMonth);
      end = endOfDay(nowYear, nowMonth, daysInThisMonth);
      label = 'Este Mês';
      break;
    }

    case 'last_month':
    case 'LAST_MONTH':
    case 'mes_passado':
    case 'mes_anterior': {
      const prevMonth = nowMonth === 1 ? 12 : nowMonth - 1;
      const prevYear = nowMonth === 1 ? nowYear - 1 : nowYear;
      const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);
      start = startOfDay(prevYear, prevMonth, 1);
      end = endOfDay(prevYear, prevMonth, daysInPrevMonth);
      label = 'Mês Anterior';
      break;
    }

    case 'year':
    case 'YEAR':
    case 'este_ano':
    case 'ano': {
      start = startOfDay(nowYear, 1, 1);
      end = endOfDay(nowYear, 12, 31);
      label = 'Este Ano';
      break;
    }

    case 'all':
    case 'ALL':
    default: {
      start = new Date(1970, 0, 1, 0, 0, 0, 0);
      end = new Date(2099, 11, 31, 23, 59, 59, 999);
      label = 'Todo Período';
      break;
    }
  }

  const sParts = getLocalParts(start, timeZone);
  const eParts = getLocalParts(end, timeZone);

  const startFormatted = `${sParts.year}-${pad2(sParts.month)}-${pad2(sParts.day)}`;
  const endFormatted = `${eParts.year}-${pad2(eParts.month)}-${pad2(eParts.day)}`;

  return {
    id: (period as StandardPeriod) || 'all',
    label,
    startDate: start,
    endDate: end,
    startFormatted,
    endFormatted,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

/**
 * Cria um DateRange a partir de datas personalizadas (dateStart, dateEnd em YYYY-MM-DD)
 */
export function getCustomDateRange(
  dateStartStr?: string,
  dateEndStr?: string,
  timeZone: string = 'America/Sao_Paulo'
): DateRange {
  if (!dateStartStr && !dateEndStr) {
    return getDateRange('all', new Date(), timeZone);
  }

  const now = new Date();
  const current = getLocalParts(now, timeZone);

  let start: Date;
  let end: Date;

  if (dateStartStr) {
    const [y, m, d] = dateStartStr.split('-').map(Number);
    start = startOfDay(y, m, d);
  } else {
    start = new Date(1970, 0, 1, 0, 0, 0, 0);
  }

  if (dateEndStr) {
    const [y, m, d] = dateEndStr.split('-').map(Number);
    end = endOfDay(y, m, d);
  } else {
    end = endOfDay(current.year, current.month, current.day);
  }

  const sParts = getLocalParts(start, timeZone);
  const eParts = getLocalParts(end, timeZone);

  return {
    id: 'all',
    label: 'Personalizado',
    startDate: start,
    endDate: end,
    startFormatted: `${sParts.year}-${pad2(sParts.month)}-${pad2(sParts.day)}`,
    endFormatted: `${eParts.year}-${pad2(eParts.month)}-${pad2(eParts.day)}`,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

/**
 * Verifica se uma determinada data cai dentro de um intervalo de datas (respeitando timezone local).
 */
export function isDateInRange(
  dateInput: string | Date | null | undefined,
  range: DateRange,
  timeZone: string = 'America/Sao_Paulo'
): boolean {
  if (!dateInput) return false;
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return false;

  // Comparação por timestamp com tolerância
  const t = d.getTime();
  return t >= range.startDate.getTime() && t <= range.endDate.getTime();
}

/**
 * Gera uma lista ordenada de dias (YYYY-MM-DD) contidos no DateRange
 */
export function getDaysInRange(
  range: DateRange,
  timeZone: string = 'America/Sao_Paulo'
): Array<{ dateKey: string; displayDate: string }> {
  const result: Array<{ dateKey: string; displayDate: string }> = [];
  
  // Limitar no máximo a 366 dias para evitar sobrecarga de memória
  const startMs = range.startDate.getTime();
  const endMs = range.endDate.getTime();
  const diffDays = Math.min(366, Math.max(1, Math.ceil((endMs - startMs) / (24 * 3600 * 1000))));

  const iter = new Date(range.startDate);
  for (let i = 0; i < diffDays; i++) {
    const parts = getLocalParts(iter, timeZone);
    const dateKey = `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
    const displayDate = `${pad2(parts.day)}/${pad2(parts.month)}`;
    result.push({ dateKey, displayDate });

    // Avançar 1 dia
    iter.setDate(iter.getDate() + 1);
    if (iter.getTime() > range.endDate.getTime()) break;
  }

  return result;
}
