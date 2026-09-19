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

export interface ImportSummary {
  totalRows: number;
  newCount: number;
  updateCount: number;
  errorCount: number;
  modifiedFieldsList: string[];
}

// 1. Gera e baixa Modelo Excel oficial (.xlsx) com duas abas (Planilha Exemplo + Instruções) e Validação de Dados
export async function downloadProductExcelTemplate() {
  const sampleData = [
    {
      'Nome *': 'Ração Cães Adultos Frango 15kg',
      'SKU': 'RAC-CAD-15K',
      'Código de Barras': '7891000000012',
      'Unidade *': 'UN',
      'Marca': 'Alta Pets',
      'Preço Custo (R$) *': '85,00',
      'Preço Venda (R$) *': '129,90',
      'Preço Mínimo (R$) *': '115,00',
      'Estoque Atual *': 50,
      'Estoque Mínimo *': 10,
      'Tipo de Comissão': 'PERCENTUAL', // 'PERCENTUAL', 'FIXA', 'SEM_COMISSAO'
      'Valor da Comissão': '3,00',
      'Descrição': 'Ração premium especial para cães adultos.',
    },
    {
      'Nome *': 'Alpiste Selecionado 1kg',
      'SKU': 'ALP-SEL-1KG',
      'Código de Barras': '7891000000050',
      'Unidade *': 'KG',
      'Marca': 'Pássaros',
      'Preço Custo (R$) *': '7,50',
      'Preço Venda (R$) *': '11,90',
      'Preço Mínimo (R$) *': '9,50',
      'Estoque Atual *': 120,
      'Estoque Mínimo *': 20,
      'Tipo de Comissão': 'FIXA',
      'Valor da Comissão': '2,00',
      'Descrição': 'Grãos selecionados para pássaros.',
    },
    {
      'Nome *': 'Areia Higiênica 4kg',
      'SKU': 'ARE-HIG-4KG',
      'Código de Barras': '7891000000088',
      'Unidade *': 'PCT',
      'Marca': 'Gatíssimo',
      'Preço Custo (R$) *': '18,00',
      'Preço Venda (R$) *': '26,50',
      'Preço Mínimo (R$) *': '22,00',
      'Estoque Atual *': 80,
      'Estoque Mínimo *': 15,
      'Tipo de Comissão': 'SEM_COMISSAO',
      'Valor da Comissão': 0,
      'Descrição': 'Areia natural perfumada para felinos.',
    },
  ];

  const instructions = [
    { Campo: 'Nome *', Obrigatório: 'SIM', Descrição: 'Nome comercial do produto (obrigatório).' },
    { Campo: 'SKU', Obrigatório: 'NÃO', Descrição: 'Código interno único do produto para controle de estoque.' },
    { Campo: 'Código de Barras', Obrigatório: 'NÃO', Descrição: 'Código EAN-13 ou identificador de leitor óptico.' },
    { Campo: 'Unidade *', Obrigatório: 'SIM', Descrição: 'Use dropdown: UN, KG, G, L, ML, CX, PCT, FD, DZ, PAR, M, M², M³, SC, RL, MIL, BD.' },
    { Campo: 'Marca', Obrigatório: 'NÃO', Descrição: 'Fabricante ou fornecedor da mercadoria.' },
    { Campo: 'Preço Custo (R$) *', Obrigatório: 'SIM', Descrição: 'Valor de custo / aquisição. Ex: 24,50' },
    { Campo: 'Preço Venda (R$) *', Obrigatório: 'SIM', Descrição: 'Preço de tabela praticado comercialmente. Ex: 36,90' },
    { Campo: 'Preço Mínimo (R$) *', Obrigatório: 'SIM', Descrição: 'Menor preço permitido na negociação sem bloqueio.' },
    { Campo: 'Estoque Atual *', Obrigatório: 'SIM', Descrição: 'Saldo físico inicial do produto em estoque.' },
    { Campo: 'Estoque Mínimo *', Obrigatório: 'SIM', Descrição: 'Nível de alerta para reposição.' },
    { Campo: 'Tipo de Comissão', Obrigatório: 'NÃO', Descrição: 'Use dropdown: PERCENTUAL, FIXA ou SEM_COMISSAO.' },
    { Campo: 'Valor da Comissão', Obrigatório: 'NÃO', Descrição: 'Se PERCENTUAL, informe apenas o número (ex: 3 para 3%). Se FIXA, informe o valor (ex: 5 para R$ 5,00).' },
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
    width: Math.max(header.length + 6, 20),
  }));

  sampleData.forEach((row) => wsData.addRow(row));

  // Validação de Dados Nativa (Dropdowns no Excel)
  // Coluna D: Unidade *
  wsData.dataValidations.add('D2:D5000', {
    type: 'list',
    allowBlank: false,
    formulae: ['"UN,KG,G,L,ML,CX,PCT,FD,DZ,PAR,M,M²,M³,SC,RL,MIL,BD"'],
    showErrorMessage: true,
    errorTitle: 'Unidade Inválida',
    error: 'Selecione uma unidade padronizada da lista suspensa.',
  });

  // Coluna K: Tipo de Comissão
  wsData.dataValidations.add('K2:K5000', {
    type: 'list',
    allowBlank: true,
    formulae: ['"PERCENTUAL,FIXA,SEM_COMISSAO"'],
    showErrorMessage: true,
    errorTitle: 'Tipo de Comissão Inválido',
    error: 'Selecione PERCENTUAL, FIXA ou SEM_COMISSAO.',
  });

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

  wsData.eachRow((row) => {
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
  });

  // 2ª Aba: Instruções
  const wsInst = wb.addWorksheet('Instruções');
  wsInst.columns = [
    { header: 'Campo', key: 'Campo', width: 24 },
    { header: 'Obrigatório', key: 'Obrigatório', width: 14 },
    { header: 'Descrição', key: 'Descrição', width: 68 },
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

// 2. Valida produtos lidos do arquivo com resumo analítico completo
export function validateImportedProducts(
  rows: any[],
  existingProducts: Array<{ id: string; sku: string | null } & Partial<Product>>
): {
  newProducts: Array<Omit<Product, 'id' | 'company_id' | 'created_at' | 'updated_at'>>;
  updateProducts: Array<{ id: string } & Omit<Product, 'id' | 'company_id' | 'created_at' | 'updated_at'>>;
  errors: ImportErrorItem[];
  summary: ImportSummary;
} {
  const newProducts: Array<Omit<Product, 'id' | 'company_id' | 'created_at' | 'updated_at'>> = [];
  const updateProducts: Array<{ id: string } & Omit<Product, 'id' | 'company_id' | 'created_at' | 'updated_at'>> = [];
  const errors: ImportErrorItem[] = [];
  const seenSkus = new Set<string>();

  // Mapa de ID → produto completo para lookup e comparação
  const existingMap = new Map<string, any>();
  existingProducts.forEach((p) => {
    existingMap.set(p.id, p);
    if (p.sku) existingMap.set(p.sku.trim().toLowerCase(), p);
  });

  const modifiedFieldsSet = new Set<string>();

  const parseNum = (raw: any, fallback = 0): number => {
    if (raw == null || raw === '') return fallback;
    const n = Number(String(raw).replace(',', '.'));
    return isNaN(n) ? fallback : n;
  };

  rows.forEach((row, index) => {
    const rowNumber = index + 2;

    const rowId = String(row['ID (não editar)'] || row['ID'] || '').trim();
    const name = String(row['Nome *'] || row['Nome'] || row['nome'] || '').trim();
    const sku = String(row['SKU'] || row['sku'] || '').trim();
    const barcode = String(row['Código de Barras'] || row['Codigo de Barras'] || row['barcode'] || '').trim();
    const unit = String(row['Unidade *'] || row['Unidade'] || row['unit'] || 'UN').trim().toUpperCase();
    const brand = String(row['Marca'] || row['marca'] || '').trim();

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

    const rawCommType = String(row['Tipo de Comissão'] || row['Tipo Comissão'] || '').trim().toUpperCase();
    const rawCommVal = parseNum(row['Valor da Comissão'] ?? row['Valor Comissão'] ?? 0);

    let commissionType: 'NONE' | 'PERCENTAGE' | 'FIXED' = 'NONE';
    if (rawCommType.includes('PERC') || rawCommType === '%') {
      commissionType = 'PERCENTAGE';
    } else if (rawCommType.includes('FIX')) {
      commissionType = 'FIXED';
    }

    const rawStatus = String(row['Status'] || 'ATIVO').trim().toUpperCase();
    const active = rawStatus !== 'INATIVO';

    if (!name) {
      errors.push({ row: rowNumber, field: 'Nome', message: 'Nome do produto é obrigatório.' });
      return;
    }

    // Identificação de produto existente: primeiro por ID, segundo por SKU
    const existing = (rowId && existingMap.get(rowId)) || (sku && existingMap.get(sku.toLowerCase())) || null;
    const isUpdate = existing !== null;

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
      commission_value: commissionType === 'NONE' ? 0 : (isNaN(rawCommVal) ? 0 : rawCommVal),
      active,
      image_url: existing?.image_url || null,
    };

    if (isUpdate && existing.id) {
      // Registrar quais campos estão sendo modificados em relação ao produto existente
      if (existing.unit !== productData.unit) modifiedFieldsSet.add('Unidade');
      if (existing.commission_type !== productData.commission_type) modifiedFieldsSet.add('Tipo de Comissão');
      if (existing.commission_value !== productData.commission_value) modifiedFieldsSet.add('Valor da Comissão');
      if (existing.selling_price !== productData.selling_price) modifiedFieldsSet.add('Preço de Venda');
      if (existing.current_stock !== productData.current_stock) modifiedFieldsSet.add('Estoque');
      if (existing.active !== productData.active) modifiedFieldsSet.add('Status');
      if (existing.brand !== productData.brand) modifiedFieldsSet.add('Marca');

      updateProducts.push({ id: existing.id, ...productData });
      return;
    }

    if (sku) {
      if (seenSkus.has(sku)) {
        errors.push({ row: rowNumber, field: 'SKU', message: `SKU "${sku}" duplicado na própria planilha.`, value: sku });
        return;
      }
      seenSkus.add(sku);
    }

    newProducts.push(productData);
  });

  const summary: ImportSummary = {
    totalRows: rows.length,
    newCount: newProducts.length,
    updateCount: updateProducts.length,
    errorCount: errors.length,
    modifiedFieldsList: Array.from(modifiedFieldsSet),
  };

  return { newProducts, updateProducts, errors, summary };
}

// 3. Exportação de produtos para Excel (.xlsx) ou CSV com Validação de Dados Nativas
function fmtNum(value: number): number | string {
  if (Number.isInteger(value)) return value;
  return value.toFixed(2).replace('.', ',');
}

export async function exportProductsToFile(products: Product[], format: 'xlsx' | 'csv') {
  const exportData = products.map((p) => {
    let commType = 'SEM_COMISSAO';
    if (p.commission_type === 'PERCENTAGE') commType = 'PERCENTUAL';
    else if (p.commission_type === 'FIXED') commType = 'FIXA';

    return {
      'ID (não editar)': p.id,
      'Nome': p.name,
      'SKU': p.sku || '',
      'Código de Barras': p.barcode || '',
      'Unidade': p.unit || 'UN',
      'Marca': p.brand || '',
      'Preço Custo (R$)': fmtNum(p.cost_price),
      'Preço Venda (R$)': fmtNum(p.selling_price),
      'Preço Mínimo (R$)': fmtNum(p.min_price),
      'Estoque Atual': p.current_stock,
      'Estoque Mínimo': p.min_stock,
      'Tipo de Comissão': commType,
      'Valor da Comissão': p.commission_type === 'NONE' ? 0 : (p.commission_value || 0),
      'Status': p.active ? 'ATIVO' : 'INATIVO',
    };
  });

  const wb = new ExcelJS.Workbook();
  wb.creator = 'NegociaPro';
  const ws = wb.addWorksheet('Catálogo de Produtos');

  const columnsDef = [
    { header: 'ID (não editar)', key: 'ID (não editar)', width: 38 },
    { header: 'Nome', key: 'Nome', width: 34 },
    { header: 'SKU', key: 'SKU', width: 16 },
    { header: 'Código de Barras', key: 'Código de Barras', width: 18 },
    { header: 'Unidade', key: 'Unidade', width: 14 },
    { header: 'Marca', key: 'Marca', width: 18 },
    { header: 'Preço Custo (R$)', key: 'Preço Custo (R$)', width: 18 },
    { header: 'Preço Venda (R$)', key: 'Preço Venda (R$)', width: 18 },
    { header: 'Preço Mínimo (R$)', key: 'Preço Mínimo (R$)', width: 18 },
    { header: 'Estoque Atual', key: 'Estoque Atual', width: 15 },
    { header: 'Estoque Mínimo', key: 'Estoque Mínimo', width: 15 },
    { header: 'Tipo de Comissão', key: 'Tipo de Comissão', width: 20 },
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

  // Validação de Dados Nativa (Menus suspensos / dropdowns dentro do Excel)
  const maxRow = Math.max(exportData.length + 500, 2000);

  // Coluna E: Unidade
  ws.dataValidations.add(`E2:E${maxRow}`, {
    type: 'list',
    allowBlank: false,
    formulae: ['"UN,KG,G,L,ML,CX,PCT,FD,DZ,PAR,M,M²,M³,SC,RL,MIL,BD"'],
    showErrorMessage: true,
    errorTitle: 'Unidade Inválida',
    error: 'Selecione uma unidade padronizada da lista suspensa.',
  });

  // Coluna L: Tipo de Comissão
  ws.dataValidations.add(`L2:L${maxRow}`, {
    type: 'list',
    allowBlank: false,
    formulae: ['"PERCENTUAL,FIXA,SEM_COMISSAO"'],
    showErrorMessage: true,
    errorTitle: 'Tipo de Comissão Inválido',
    error: 'Selecione PERCENTUAL, FIXA ou SEM_COMISSAO.',
  });

  // Coluna N: Status
  ws.dataValidations.add(`N2:N${maxRow}`, {
    type: 'list',
    allowBlank: false,
    formulae: ['"ATIVO,INATIVO"'],
    showErrorMessage: true,
    errorTitle: 'Status Inválido',
    error: 'Selecione ATIVO ou INATIVO.',
  });

  // Estilização do cabeçalho
  const headerRow = ws.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' },
    };
  });

  // Centraliza células e padroniza altura
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
