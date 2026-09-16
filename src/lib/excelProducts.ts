import * as XLSX from 'xlsx';
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

// 1. Gera e baixa Modelo Excel oficial (.xlsx) com duas abas (Planilha Exemplo + Instruções)
export function downloadProductExcelTemplate() {
  const sampleData = [
    {
      'Nome *': 'Cimento CP II 50kg',
      'SKU': 'MAT-CIM-50',
      'Código de Barras': '7891000000012',
      'Unidade *': 'SC',
      'Marca': 'Votoran',
      'Preço Custo (R$) *': 24.0,
      'Preço Venda (R$) *': 36.9,
      'Preço Mínimo (R$) *': 31.0,
      'Estoque Atual *': 200,
      'Estoque Mínimo *': 50,
      'Tipo de Comissão': 'PERCENTUAL', // 'SEM COMISSAO', 'PERCENTUAL', 'FIXO'
      'Valor da Comissão': 5.0,
      'Descrição': 'Cimento Portland composto de alta resistência.',
    },
    {
      'Nome *': 'Furadeira de Impacto 1/2" 750W',
      'SKU': 'FER-FUR-750',
      'Código de Barras': '7891000000050',
      'Unidade *': 'UN',
      'Marca': 'Bosch',
      'Preço Custo (R$) *': 260.0,
      'Preço Venda (R$) *': 389.0,
      'Preço Mínimo (R$) *': 340.0,
      'Estoque Atual *': 40,
      'Estoque Mínimo *': 10,
      'Tipo de Comissão': 'FIXO',
      'Valor da Comissão': 25.0,
      'Descrição': 'Furadeira profissional 220V com mandril.',
    },
    {
      'Nome *': 'Areia Lavada Média',
      'SKU': 'MAT-ARE-MED',
      'Código de Barras': '',
      'Unidade *': 'M³',
      'Marca': 'Porto Areia',
      'Preço Custo (R$) *': 85.0,
      'Preço Venda (R$) *': 145.0,
      'Preço Mínimo (R$) *': 120.0,
      'Estoque Atual *': 60,
      'Estoque Mínimo *': 15,
      'Tipo de Comissão': 'SEM COMISSAO',
      'Valor da Comissão': 0.0,
      'Descrição': 'Areia limpa para concretagem e reboco.',
    },
  ];

  const instructions = [
    { Campo: 'Nome *', Obrigatório: 'SIM', Descrição: 'Nome do produto ou serviço ofertado.' },
    { Campo: 'SKU', Obrigatório: 'NÃO', Descrição: 'Código interno único da empresa para controle de estoque.' },
    { Campo: 'Código de Barras', Obrigatório: 'NÃO', Descrição: 'Código EAN-13 ou identificador de leitor.' },
    { Campo: 'Unidade *', Obrigatório: 'SIM', Descrição: 'Exemplos: UN, SC, KG, M, M², M³, CX, RL, LATA, BR, MIL.' },
    { Campo: 'Marca', Obrigatório: 'NÃO', Descrição: 'Fabricante ou fornecedor do produto.' },
    { Campo: 'Preço Custo (R$) *', Obrigatório: 'SIM', Descrição: 'Valor de aquisição / custo mercadoria. Ex: 24.50' },
    { Campo: 'Preço Venda (R$) *', Obrigatório: 'SIM', Descrição: 'Preço de tabela praticado comercialmente. Ex: 36.90' },
    { Campo: 'Preço Mínimo (R$) *', Obrigatório: 'SIM', Descrição: 'Menor preço permitido na negociação sem bloqueio.' },
    { Campo: 'Estoque Atual *', Obrigatório: 'SIM', Descrição: 'Saldo físico inicial do produto em estoque.' },
    { Campo: 'Estoque Mínimo *', Obrigatório: 'SIM', Descrição: 'Alerta de estoque crítico quando atingir este nível.' },
    { Campo: 'Tipo de Comissão', Obrigatório: 'NÃO', Descrição: 'Opções válidas: "SEM COMISSAO", "PERCENTUAL" ou "FIXO".' },
    { Campo: 'Valor da Comissão', Obrigatório: 'NÃO', Descrição: 'Se PERCENTUAL, digite % (ex: 5). Se FIXO, digite R$ (ex: 10).' },
    { Campo: 'Descrição', Obrigatório: 'NÃO', Descrição: 'Observações, especificações técnicas ou instruções.' },
  ];

  const wb = XLSX.utils.book_new();
  const wsData = XLSX.utils.json_to_sheet(sampleData);
  const wsInst = XLSX.utils.json_to_sheet(instructions);

  XLSX.utils.book_append_sheet(wb, wsData, 'Produtos Exemplo');
  XLSX.utils.book_append_sheet(wb, wsInst, 'Instruções');

  XLSX.writeFile(wb, 'modelo_importacao_produtos_negociapro.xlsx');
}

// 2. Valida produtos lidos do arquivo
export function validateImportedProducts(rows: any[], existingSkus: string[]): {
  validProducts: Array<Omit<Product, 'id' | 'company_id' | 'created_at' | 'updated_at'>>;
  errors: ImportErrorItem[];
} {
  const validProducts: Array<Omit<Product, 'id' | 'company_id' | 'created_at' | 'updated_at'>> = [];
  const errors: ImportErrorItem[] = [];
  const seenSkus = new Set<string>();

  rows.forEach((row, index) => {
    const rowNumber = index + 2; // Linha 1 é o cabeçalho
    const name = String(row['Nome *'] || row['Nome'] || row['nome'] || '').trim();
    const sku = String(row['SKU'] || row['sku'] || '').trim();
    const barcode = String(row['Código de Barras'] || row['Codigo de Barras'] || row['barcode'] || '').trim();
    const unit = String(row['Unidade *'] || row['Unidade'] || row['unit'] || 'UN').trim().toUpperCase();
    const brand = String(row['Marca'] || row['marca'] || '').trim();

    const costPrice = Number(row['Preço Custo (R$) *'] || row['Preço Custo'] || row['cost_price'] || 0);
    const sellingPrice = Number(row['Preço Venda (R$) *'] || row['Preço Venda'] || row['selling_price'] || 0);
    const minPrice = Number(row['Preço Mínimo (R$) *'] || row['Preço Mínimo'] || row['min_price'] || sellingPrice);
    const currentStock = Number(row['Estoque Atual *'] || row['Estoque Atual'] || row['current_stock'] || 0);
    const minStock = Number(row['Estoque Mínimo *'] || row['Estoque Mínimo'] || row['min_stock'] || 0);

    const rawCommType = String(row['Tipo de Comissão'] || row['Tipo Comissão'] || '').trim().toUpperCase();
    const rawCommVal = Number(row['Valor da Comissão'] || row['Valor Comissão'] || 0);

    let commissionType: 'NONE' | 'PERCENTAGE' | 'FIXED' = 'NONE';
    if (rawCommType.includes('PERC') || rawCommType === '%') {
      commissionType = 'PERCENTAGE';
    } else if (rawCommType.includes('FIX')) {
      commissionType = 'FIXED';
    }

    // Validações
    if (!name) {
      errors.push({ row: rowNumber, field: 'Nome', message: 'Nome do produto é obrigatório.' });
      return;
    }

    if (isNaN(sellingPrice) || sellingPrice <= 0) {
      errors.push({ row: rowNumber, field: 'Preço Venda', message: 'Preço de venda deve ser maior que zero.', value: sellingPrice });
      return;
    }

    if (isNaN(minPrice) || minPrice > sellingPrice) {
      errors.push({ row: rowNumber, field: 'Preço Mínimo', message: 'Preço mínimo não pode superar o preço de venda.', value: minPrice });
      return;
    }

    if (sku) {
      if (seenSkus.has(sku)) {
        errors.push({ row: rowNumber, field: 'SKU', message: `SKU "${sku}" duplicado na própria planilha.`, value: sku });
        return;
      }
      if (existingSkus.includes(sku)) {
        errors.push({ row: rowNumber, field: 'SKU', message: `SKU "${sku}" já cadastrado no sistema.`, value: sku });
        return;
      }
      seenSkus.add(sku);
    }

    validProducts.push({
      name,
      sku: sku || null,
      barcode: barcode || null,
      unit: unit || 'UN',
      brand: brand || null,
      description: String(row['Descrição'] || row['Descricao'] || '').trim() || null,
      cost_price: isNaN(costPrice) ? 0 : costPrice,
      selling_price: sellingPrice,
      min_price: minPrice || sellingPrice,
      current_stock: isNaN(currentStock) ? 0 : currentStock,
      min_stock: isNaN(minStock) ? 0 : minStock,
      commission_type: commissionType,
      commission_value: isNaN(rawCommVal) ? 0 : rawCommVal,
      active: true,
      image_url: null,
    });
  });

  return { validProducts, errors };
}

// 3. Exportação de produtos para Excel (.xlsx) ou CSV
export function exportProductsToFile(products: Product[], format: 'xlsx' | 'csv') {
  const exportData = products.map((p) => ({
    'Nome': p.name,
    'SKU': p.sku || '',
    'Código de Barras': p.barcode || '',
    'Unidade': p.unit,
    'Marca': p.brand || '',
    'Preço Custo (R$)': p.cost_price.toFixed(2),
    'Preço Venda (R$)': p.selling_price.toFixed(2),
    'Preço Mínimo (R$)': p.min_price.toFixed(2),
    'Estoque Atual': p.current_stock,
    'Estoque Mínimo': p.min_stock,
    'Tipo de Comissão': p.commission_type === 'PERCENTAGE' ? 'PERCENTUAL' : p.commission_type === 'FIXED' ? 'FIXO' : 'SEM COMISSAO',
    'Valor da Comissão': p.commission_value || 0,
    'Status': p.active ? 'ATIVO' : 'INATIVO',
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportData);
  XLSX.utils.book_append_sheet(wb, ws, 'Catálogo de Produtos');

  if (format === 'xlsx') {
    XLSX.writeFile(wb, 'produtos_negociapro.xlsx');
  } else {
    XLSX.writeFile(wb, 'produtos_negociapro.csv');
  }
}
