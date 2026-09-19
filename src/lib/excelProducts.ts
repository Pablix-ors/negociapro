import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { Product } from '@/types/database';

export interface ProductExcelRow {
  Nome: string;
  SKU?: string;
  'Código de Barras'?: string;
  Unidade?: string;
  Marca?: string;
  'Preço Custo': number;
  'Preço Venda': number;
  'Preço Mínimo': number;
  'Estoque Atual': number;
  'Estoque Mínimo': number;
  'Tipo Comissão'?: string;
  'Valor Comissão'?: number;
  Descrição?: string;
}

export interface ImportErrorItem {
  row: number;
  field: string;
  message: string;
  value?: any;
}

// Helper para disparar download de Blob no navegador
function saveBlobFile(buffer: ArrayBuffer | Uint8Array, filename: string, mimeType: string) {
  const blob = new Blob([buffer as any], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 1. Gera e baixa Modelo Excel oficial (.xlsx) com duas abas (Planilha Exemplo + Instruções)
export async function downloadProductExcelTemplate() {
  const sampleData = [
    {
      'Nome *': 'Cimento CP II 50kg',
      'SKU': 'MAT-CIM-50',
      'Código de Barras': '7891000000012',
      'Unidade *': 'SC',
      'Marca': 'Votoran',
      'Preço Custo (R$) *': '24,00',
      'Preço Venda (R$) *': '36,90',
      'Preço Mínimo (R$) *': '31,00',
      'Estoque Atual *': 200,
      'Estoque Mínimo *': 50,
      'Tipo de Comissão': 'PERCENTUAL', // 'SEM COMISSAO', 'PERCENTUAL', 'FIXO'
      'Valor da Comissão': '5,00',
      'Descrição': 'Cimento Portland composto de alta resistência.',
    },
    {
      'Nome *': 'Furadeira de Impacto 1/2" 750W',
      'SKU': 'FER-FUR-750',
      'Código de Barras': '7891000000050',
      'Unidade *': 'UN',
      'Marca': 'Bosch',
      'Preço Custo (R$) *': '260,00',
      'Preço Venda (R$) *': '389,00',
      'Preço Mínimo (R$) *': '340,00',
      'Estoque Atual *': 40,
      'Estoque Mínimo *': 10,
      'Tipo de Comissão': 'FIXO',
      'Valor da Comissão': '25,00',
      'Descrição': 'Furadeira profissional 220V com mandril.',
    },
    {
      'Nome *': 'Areia Lavada Média',
      'SKU': 'MAT-ARE-MED',
      'Código de Barras': '',
      'Unidade *': 'M³',
      'Marca': 'Porto Areia',
      'Preço Custo (R$) *': '85,00',
      'Preço Venda (R$) *': '145,00',
      'Preço Mínimo (R$) *': '120,00',
      'Estoque Atual *': 60,
      'Estoque Mínimo *': 15,
      'Tipo de Comissão': 'SEM COMISSAO',
      'Valor da Comissão': 0,
      'Descrição': 'Areia limpa para concretagem e reboco.',
    },
  ];

  const instructions = [
    { Campo: 'Nome *', Obrigatório: 'SIM', Descrição: 'Nome do produto ou serviço ofertado.' },
    { Campo: 'SKU', Obrigatório: 'NÃO', Descrição: 'Código interno único da empresa para controle de estoque.' },
    { Campo: 'Código de Barras', Obrigatório: 'NÃO', Descrição: 'Código EAN-13 ou identificador de leitor.' },
    { Campo: 'Unidade *', Obrigatório: 'SIM', Descrição: 'Exemplos: UN, SC, KG, M, M², M³, CX, RL, LATA, BR, MIL.' },
    { Campo: 'Marca', Obrigatório: 'NÃO', Descrição: 'Fabricante ou fornecedor do produto.' },
    { Campo: 'Preço Custo (R$) *', Obrigatório: 'SIM', Descrição: 'Valor de aquisição / custo mercadoria. Ex: 24,50' },
    { Campo: 'Preço Venda (R$) *', Obrigatório: 'SIM', Descrição: 'Preço de tabela praticado comercialmente. Ex: 36,90' },
    { Campo: 'Preço Mínimo (R$) *', Obrigatório: 'SIM', Descrição: 'Menor preço permitido na negociação sem bloqueio.' },
    { Campo: 'Estoque Atual *', Obrigatório: 'SIM', Descrição: 'Saldo físico inicial do produto em estoque.' },
    { Campo: 'Estoque Mínimo *', Obrigatório: 'SIM', Descrição: 'Alerta de estoque crítico quando atingir este nível.' },
    { Campo: 'Tipo de Comissão', Obrigatório: 'NÃO', Descrição: 'Opções válidas: "SEM COMISSAO", "PERCENTUAL" ou "FIXO".' },
    { Campo: 'Valor da Comissão', Obrigatório: 'NÃO', Descrição: 'Se PERCENTUAL, digite % (ex: 5). Se FIXO, digite R$ (ex: 10).' },
    { Campo: 'Descrição', Obrigatório: 'NÃO', Descrição: 'Observações, especificações técnicas ou instruções.' },
  ];

  const wb = new ExcelJS.Workbook();
  wb.creator = 'NegociaPro';

  // 1ª Aba: Produtos Exemplo
  const wsData = wb.addWorksheet('Produtos Exemplo');
  const sampleHeaders = Object.keys(sampleData[0]);
  wsData.columns = sampleHeaders.map((header) => ({
    header,
    key: header,
    width: Math.max(header.length + 5, 18),
  }));

  sampleData.forEach((row) => wsData.addRow(row));

  // Estilização do cabeçalho
  const headerRow1 = wsData.getRow(1);
  headerRow1.height = 28;
  headerRow1.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' },
    };
  });

  // Centraliza todas as células (cabeçalho e dados)
  wsData.eachRow((row) => {
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
  });

  // 2ª Aba: Instruções
  const wsInst = wb.addWorksheet('Instruções');
  const instHeaders = Object.keys(instructions[0]);
  wsInst.columns = [
    { header: 'Campo', key: 'Campo', width: 24 },
    { header: 'Obrigatório', key: 'Obrigatório', width: 14 },
    { header: 'Descrição', key: 'Descrição', width: 65 },
  ];

  instructions.forEach((row) => wsInst.addRow(row));

  const headerRow2 = wsInst.getRow(1);
  headerRow2.height = 28;
  headerRow2.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' },
    };
  });

  wsInst.eachRow((row, rowNumber) => {
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      // Descrição alinha à esquerda para leitura confortável, demais centralizados
      if (rowNumber > 1 && colNumber === 3) {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }
    });
  });

  const buffer = await wb.xlsx.writeBuffer();
  saveBlobFile(
    buffer,
    'modelo_importacao_produtos_negociapro.xlsx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
}

// 2. Valida produtos lidos do arquivo
// existingProducts: lista de produtos já cadastrados com id + sku para detectar edições
export function validateImportedProducts(
  rows: any[],
  existingProducts: Array<{ id: string; sku: string | null }>
): {
  newProducts: Array<Omit<Product, 'id' | 'company_id' | 'created_at' | 'updated_at'>>;
  updateProducts: Array<{ id: string } & Omit<Product, 'id' | 'company_id' | 'created_at' | 'updated_at'>>;
  errors: ImportErrorItem[];
} {
  const newProducts: Array<Omit<Product, 'id' | 'company_id' | 'created_at' | 'updated_at'>> = [];
  const updateProducts: Array<{ id: string } & Omit<Product, 'id' | 'company_id' | 'created_at' | 'updated_at'>> = [];
  const errors: ImportErrorItem[] = [];
  const seenSkus = new Set<string>();

  // Mapa de ID → produto para lookup direto (mais confiável que SKU)
  const existingIdMap = new Map<string, string>();
  existingProducts.forEach((p) => existingIdMap.set(p.id, p.id));

  // Mapa de SKU → id para fallback
  const existingSkuMap = new Map<string, string>();
  existingProducts.forEach((p) => { if (p.sku) existingSkuMap.set(p.sku, p.id); });

  /**
   * Converte valor do Excel para número, aceitando tanto
   * ponto (exportações antigas) quanto vírgula (exportações novas em pt-BR).
   */
  const parseNum = (raw: any, fallback = 0): number => {
    if (raw == null || raw === '') return fallback;
    const n = Number(String(raw).replace(',', '.'));
    return isNaN(n) ? fallback : n;
  };

  rows.forEach((row, index) => {
    const rowNumber = index + 2; // Linha 1 é o cabeçalho

    // Suporta tanto o modelo de importação (com *) quanto o arquivo exportado (sem *)
    // ID do produto (coluna gerada pela exportação — identificação mais confiável)
    const rowId = String(row['ID (não editar)'] || row['ID'] || '').trim();
    const name = String(
      row['Nome *'] || row['Nome'] || row['nome'] || ''
    ).trim();
    const sku = String(row['SKU'] || row['sku'] || '').trim();
    const barcode = String(
      row['Código de Barras'] || row['Codigo de Barras'] || row['barcode'] || ''
    ).trim();
    const unit = String(
      row['Unidade *'] || row['Unidade'] || row['unit'] || 'UN'
    ).trim().toUpperCase();
    const brand = String(row['Marca'] || row['marca'] || '').trim();

    // Preços — aceita colunas com * (modelo) e sem * (exportado)
    // parseNum aceita tanto ponto (export antigo) quanto vírgula (export pt-BR)
    const rawCost  = row['Preço Custo (R$) *']  ?? row['Preço Custo (R$)']  ?? row['Preço Custo']  ?? row['cost_price']  ?? 0;
    const rawSell  = row['Preço Venda (R$) *']  ?? row['Preço Venda (R$)']  ?? row['Preço Venda']  ?? row['selling_price'] ?? 0;
    const rawMin   = row['Preço Mínimo (R$) *'] ?? row['Preço Mínimo (R$)'] ?? row['Preço Mínimo'] ?? row['min_price'];
    const rawStock = row['Estoque Atual *']      ?? row['Estoque Atual']     ?? row['current_stock'] ?? 0;
    const rawMin2  = row['Estoque Mínimo *']     ?? row['Estoque Mínimo']    ?? row['min_stock']     ?? 0;

    const costPrice    = parseNum(rawCost);
    const sellingPrice = parseNum(rawSell);
    const currentStock = parseNum(rawStock);
    const minStock     = parseNum(rawMin2);
    const minPrice     = rawMin != null ? parseNum(rawMin, sellingPrice) : sellingPrice;

    const rawCommType = String(
      row['Tipo de Comissão'] || row['Tipo Comissão'] || ''
    ).trim().toUpperCase();
    const rawCommVal = parseNum(row['Valor da Comissão'] ?? row['Valor Comissão'] ?? 0);

    let commissionType: 'NONE' | 'PERCENTAGE' | 'FIXED' = 'NONE';
    if (rawCommType.includes('PERC') || rawCommType === '%') {
      commissionType = 'PERCENTAGE';
    } else if (rawCommType.includes('FIX')) {
      commissionType = 'FIXED';
    }

    // Status (coluna exportada)
    const rawStatus = String(row['Status'] || 'ATIVO').trim().toUpperCase();
    const active = rawStatus !== 'INATIVO';

    // Validações básicas (comuns a novos e atualizações)
    if (!name) {
      errors.push({ row: rowNumber, field: 'Nome', message: 'Nome do produto é obrigatório.' });
      return;
    }

    // Detecta se é uma atualização:
    // 1º prioridade: ID direto (coluna 'ID (não editar)' gerada na exportação)
    // 2º prioridade: SKU correspondente
    const existingIdByRow = rowId && existingIdMap.has(rowId) ? rowId : null;
    const existingIdBySku = sku !== '' && existingSkuMap.has(sku) ? existingSkuMap.get(sku)! : null;
    const resolvedExistingId = existingIdByRow || existingIdBySku || null;
    const isUpdate = resolvedExistingId !== null;

    // Para NOVOS produtos, preço de venda > 0 é obrigatório
    // Para ATUALIZAÇÕES, permite preço 0 (o produto já existe no sistema)
    if (!isUpdate && (isNaN(sellingPrice) || sellingPrice <= 0)) {
      errors.push({ row: rowNumber, field: 'Preço Venda', message: 'Preço de venda deve ser maior que zero.', value: sellingPrice });
      return;
    }

    if (!isNaN(minPrice) && minPrice > sellingPrice && sellingPrice > 0) {
      errors.push({ row: rowNumber, field: 'Preço Mínimo', message: 'Preço mínimo não pode superar o preço de venda.', value: minPrice });
      return;
    }

    const productData = {
      name,
      sku: sku || null,
      barcode: barcode || null,
      unit: unit || 'UN',
      brand: brand || null,
      description: String(row['Descrição'] || row['Descricao'] || '').trim() || null,
      cost_price: isNaN(costPrice) ? 0 : costPrice,
      selling_price: isNaN(sellingPrice) ? 0 : sellingPrice,
      min_price: !isNaN(minPrice) ? minPrice : sellingPrice,
      current_stock: isNaN(currentStock) ? 0 : currentStock,
      min_stock: isNaN(minStock) ? 0 : minStock,
      commission_type: commissionType,
      commission_value: isNaN(rawCommVal) ? 0 : rawCommVal,
      active,
      image_url: null,
    };

    // Se o ID ou SKU já existe no sistema → é uma atualização
    if (isUpdate && resolvedExistingId) {
      updateProducts.push({ id: resolvedExistingId, ...productData });
      return;
    }

    // SKU duplicado dentro da própria planilha
    if (sku) {
      if (seenSkus.has(sku)) {
        errors.push({ row: rowNumber, field: 'SKU', message: `SKU "${sku}" duplicado na própria planilha.`, value: sku });
        return;
      }
      seenSkus.add(sku);
    }

    newProducts.push(productData);
  });

  return { newProducts, updateProducts, errors };
}

// 3. Exportação de produtos para Excel (.xlsx) ou CSV
/**
 * Formata número para o padrão brasileiro:
 * - Inteiros (sem casa decimal): exporta como número puro  → 8, 10, 100
 * - Decimais: usa vírgula como separador decimal           → 8,88  29,91
 * Isso permite que o Excel (configurado em pt-BR) reconheça como número
 * e aceite fórmulas normalmente.
 */
function fmtNum(value: number): number | string {
  if (Number.isInteger(value)) return value; // inteiro puro → Excel trata como número
  // Decimal → string com vírgula (separador BR)
  return value.toFixed(2).replace('.', ',');
}

export async function exportProductsToFile(products: Product[], format: 'xlsx' | 'csv') {
  const exportData = products.map((p) => ({
    'ID (não editar)': p.id, // usado na reimportação para garantir match correto
    'Nome': p.name,
    'SKU': p.sku || '',
    'Código de Barras': p.barcode || '',
    'Unidade': p.unit,
    'Marca': p.brand || '',
    'Preço Custo (R$)': fmtNum(p.cost_price),
    'Preço Venda (R$)': fmtNum(p.selling_price),
    'Preço Mínimo (R$)': fmtNum(p.min_price),
    'Estoque Atual': p.current_stock,
    'Estoque Mínimo': p.min_stock,
    'Tipo de Comissão': p.commission_type === 'PERCENTAGE' ? 'PERCENTUAL' : p.commission_type === 'FIXED' ? 'FIXO' : 'SEM COMISSAO',
    'Valor da Comissão': fmtNum(p.commission_value || 0),
    'Status': p.active ? 'ATIVO' : 'INATIVO',
  }));

  const wb = new ExcelJS.Workbook();
  wb.creator = 'NegociaPro';
  const ws = wb.addWorksheet('Catálogo de Produtos');

  const columnsDef = [
    { header: 'ID (não editar)', key: 'ID (não editar)', width: 38 },
    { header: 'Nome', key: 'Nome', width: 32 },
    { header: 'SKU', key: 'SKU', width: 16 },
    { header: 'Código de Barras', key: 'Código de Barras', width: 18 },
    { header: 'Unidade', key: 'Unidade', width: 12 },
    { header: 'Marca', key: 'Marca', width: 18 },
    { header: 'Preço Custo (R$)', key: 'Preço Custo (R$)', width: 18 },
    { header: 'Preço Venda (R$)', key: 'Preço Venda (R$)', width: 18 },
    { header: 'Preço Mínimo (R$)', key: 'Preço Mínimo (R$)', width: 18 },
    { header: 'Estoque Atual', key: 'Estoque Atual', width: 15 },
    { header: 'Estoque Mínimo', key: 'Estoque Mínimo', width: 15 },
    { header: 'Tipo de Comissão', key: 'Tipo de Comissão', width: 18 },
    { header: 'Valor da Comissão', key: 'Valor da Comissão', width: 18 },
    { header: 'Status', key: 'Status', width: 14 },
  ];

  ws.columns = columnsDef;

  // Garante que ID, SKU e Código de Barras fiquem no formato texto
  ['ID (não editar)', 'SKU', 'Código de Barras'].forEach((key) => {
    const col = ws.getColumn(key);
    if (col) col.numFmt = '@';
  });

  exportData.forEach((row) => ws.addRow(row));

  // Estilização do cabeçalho
  const headerRow = ws.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' }, // Slate-800
    };
  });

  // Centraliza absolutamente todas as células de todas as linhas (cabeçalho e dados)
  ws.eachRow((row) => {
    if (row.number > 1) {
      row.height = 22;
    }
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
  });

  if (format === 'xlsx') {
    const buffer = await wb.xlsx.writeBuffer();
    saveBlobFile(
      buffer,
      'produtos_negociapro.xlsx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
  } else {
    const buffer = await wb.csv.writeBuffer();
    saveBlobFile(
      buffer,
      'produtos_negociapro.csv',
      'text/csv;charset=utf-8;'
    );
  }
}
