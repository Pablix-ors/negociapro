// Formatador de Moeda Brasileira: R$ 1.234,56
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// Formatador de Números Decimais
export function formatNumber(value: number | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined || isNaN(value)) return '0';
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

// Formatador de Datas: 15/09/2026
export function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '-';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return '-';
  }
}

// Formatador com Hora: 15/09/2026 14:30
export function formatDateTime(dateString: string | Date | null | undefined): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '-';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return '-';
  }
}

// Máscara e Formatação de CPF (000.000.000-00)
export function maskCPF(value: string): string {
  const clean = value.replace(/\D/g, '').slice(0, 11);
  return clean
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

// Máscara e Formatação de CNPJ (00.000.000/0000-00)
export function maskCNPJ(value: string): string {
  const clean = value.replace(/\D/g, '').slice(0, 14);
  return clean
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

// Máscara dinâmica para Documento (CPF ou CNPJ)
export function maskDocument(value: string): string {
  const clean = value.replace(/\D/g, '');
  if (clean.length <= 11) {
    return maskCPF(clean);
  }
  return maskCNPJ(clean);
}

// Máscara de Telefone: (64) 99999-9999 ou (64) 3333-3333
export function maskPhone(value: string): string {
  const clean = value.replace(/\D/g, '').slice(0, 11);
  if (clean.length > 10) {
    return clean.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  } else if (clean.length > 5) {
    return clean.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
  } else if (clean.length > 2) {
    return clean.replace(/^(\d{2})(\d{0,5})$/, '($1) $2');
  }
  return clean;
}

// Máscara de CEP: 00000-000
export function maskCEP(value: string): string {
  const clean = value.replace(/\D/g, '').slice(0, 8);
  return clean.replace(/^(\d{5})(\d{1,3})$/, '$1-$2');
}
