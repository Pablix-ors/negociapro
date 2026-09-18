const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const idx = trimmed.indexOf('=');
  if (idx !== -1) {
    let val = trimmed.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    envVars[trimmed.slice(0, idx).trim()] = val;
  }
}

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);
const COMPANY_ID = '2bcee844-9475-4175-ae47-e0f6f53dbb09'; // Ração mais barato ltda

function parseUnitFromName(name) {
  const upper = name.toUpperCase();
  if (upper.includes('KG')) return 'KG';
  if (upper.includes('12UN') || upper.includes('24UN') || upper.includes('20UN') || upper.includes('10 UN') || upper.includes('20 UNI') || upper.includes('10 UNI')) return 'CX';
  if (upper.includes('LATA')) return 'LT';
  if (upper.includes('SACHE') || upper.includes('COMP')) return 'UN';
  if (upper.includes('500G') || upper.includes('450G') || upper.includes('350G') || upper.includes('100G') || upper.includes('60G') || upper.includes('56G') || upper.includes('45MG') || upper.includes('100 MG') || upper.includes('200 MG') || upper.includes('400MG') || upper.includes('560 MG')) return 'UN';
  return 'UN';
}

async function run() {
  const filePath = 'c:/Users/WviSuporte/Downloads/Produtos (3).xlsx';
  console.log(`Lendo arquivo: ${filePath}...`);
  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json(sheet);

  console.log(`Total de linhas lidas no Excel: ${rawRows.length}`);

  // 1. Extrair categorias únicas
  const categoriesSet = new Set();
  rawRows.forEach((r) => {
    const cat = String(r['Categoria'] || '').trim();
    if (cat) categoriesSet.add(cat);
  });
  const categoriesList = Array.from(categoriesSet);
  console.log(`Categorias encontradas (${categoriesList.length}):`, categoriesList);

  // Criar categorias no Supabase se ainda não existirem
  const categoryMap = {}; // nome -> id
  const { data: existingCats } = await supabase
    .from('product_categories')
    .select('id, name')
    .eq('company_id', COMPANY_ID);

  if (existingCats) {
    existingCats.forEach((c) => {
      categoryMap[c.name.trim().toLowerCase()] = c.id;
    });
  }

  for (const catName of categoriesList) {
    const key = catName.toLowerCase();
    if (!categoryMap[key]) {
      const { data: newCat, error: catErr } = await supabase
        .from('product_categories')
        .insert([{ company_id: COMPANY_ID, name: catName }])
        .select()
        .single();
      if (newCat) {
        categoryMap[key] = newCat.id;
        console.log(`+ Categoria criada: ${catName} (${newCat.id})`);
      } else if (catErr) {
        console.warn(`! Erro ao criar categoria ${catName}:`, catErr.message);
      }
    }
  }

  // 2. Limpar produtos antigos desta empresa se houver
  const { count: initialCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', COMPANY_ID);

  console.log(`Produtos atuais no banco para esta empresa: ${initialCount || 0}`);
  if (initialCount > 0) {
    console.log('Removendo produtos antigos da empresa para reinserção limpa e atualizada...');
    await supabase.from('products').delete().eq('company_id', COMPANY_ID);
  }

  // 3. Montar a lista de produtos formatados
  const formattedProducts = rawRows.map((r, idx) => {
    const name = String(r['Nome*'] || '').trim();
    const catName = String(r['Categoria'] || '').trim();
    const categoryId = catName ? categoryMap[catName.toLowerCase()] || null : null;
    const desc = String(r['Descrição'] || '').trim() || null;
    const rawCost = Number(r['Custo unitário']) || 0;
    let rawSelling = Number(r['Preço unitário*']) || 0;

    // Se o preço de venda for 0 ou menor, adotar o custo ou 0.01 como padrão comercial
    if (rawSelling <= 0) {
      rawSelling = rawCost > 0 ? rawCost : 0;
    }

    const minPrice = rawCost > 0 && rawCost <= rawSelling ? rawCost : rawSelling;
    const currentStock = Number(r['Estoque atual']) || 0;
    const minStock = Number(r['Estoque mínimo']) || 0;
    const sku = String(r['Código'] || r['ID'] || `RAC-${String(idx + 1).padStart(4, '0')}`).trim();
    const unit = parseUnitFromName(name);
    const active = true;

    return {
      company_id: COMPANY_ID,
      category_id: categoryId,
      name,
      sku,
      barcode: null,
      unit,
      brand: catName || null,
      description: desc,
      cost_price: rawCost,
      selling_price: rawSelling,
      min_price: minPrice,
      current_stock: currentStock,
      min_stock: minStock,
      active,
    };
  });

  console.log(`Inserindo ${formattedProducts.length} produtos no Supabase em lotes...`);
  const chunkSize = 100;
  let totalInserted = 0;

  for (let i = 0; i < formattedProducts.length; i += chunkSize) {
    const chunk = formattedProducts.slice(i, i + chunkSize);
    const { data: inserted, error: insertErr } = await supabase
      .from('products')
      .insert(chunk)
      .select('id, name, selling_price, current_stock, unit, brand');

    if (insertErr) {
      console.error(`Erro ao inserir lote ${i / chunkSize + 1}:`, insertErr);
      process.exit(1);
    }
    totalInserted += inserted.length;
    console.log(`Lote ${Math.floor(i / chunkSize) + 1} concluído: ${totalInserted}/${formattedProducts.length} produtos.`);
  }

  // 4. Salvar também em arquivo JSON local para persistência de cache / localStorage da aplicação
  const { data: allDatabaseProducts } = await supabase
    .from('products')
    .select('*')
    .eq('company_id', COMPANY_ID)
    .order('name', { ascending: true });

  const clientProducts = (allDatabaseProducts || []).map((p) => ({
    id: p.id,
    company_id: p.company_id,
    category_id: p.category_id,
    name: p.name,
    sku: p.sku,
    barcode: p.barcode,
    unit: p.unit,
    brand: p.brand,
    description: p.description,
    cost_price: Number(p.cost_price),
    selling_price: Number(p.selling_price),
    min_price: Number(p.min_price),
    current_stock: Number(p.current_stock),
    min_stock: Number(p.min_stock),
    active: p.active,
    image_url: null,
    commission_type: 'NONE',
    commission_value: 0,
    created_at: p.created_at,
    updated_at: p.updated_at,
  }));

  const outJsonPath = path.join(__dirname, '..', 'public', 'racao_mais_barato_products.json');
  fs.writeFileSync(outJsonPath, JSON.stringify(clientProducts, null, 2), 'utf8');
  console.log(`Arquivo de cache para o frontend gerado com sucesso em: ${outJsonPath}`);

  console.log('\n=============================================');
  console.log(`IMPORTAÇÃO CONCLUÍDA COM SUCESSO!`);
  console.log(`Empresa: Ração mais barato ltda (${COMPANY_ID})`);
  console.log(`Total de Produtos cadastrados: ${totalInserted}`);
  console.log('=============================================');
}

run().catch((err) => {
  console.error('Erro geral durante a execução:', err);
  process.exit(1);
});
