const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const idx = trimmed.indexOf('=');
  if (idx !== -1) {
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    envVars[key] = val;
  }
}

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

async function inspectData() {
  const companyId = '2bcee844-9475-4175-ae47-e0f6f53dbb09';

  const { data: sales, error: sErr } = await supabase.from('sales').select('*').eq('company_id', companyId);
  const { data: customers, error: cErr } = await supabase.from('customers').select('*').eq('company_id', companyId);
  const { data: products, error: pErr } = await supabase.from('products').select('*').eq('company_id', companyId);
  const { data: profs, error: prErr } = await supabase.from('professionals').select('*').eq('company_id', companyId);

  console.log('Dados no Supabase para a empresa Ração mais barato:');
  console.log('Vendas:', sales?.length, sErr?.message || '');
  console.log('Clientes:', customers?.length, cErr?.message || '');
  console.log('Produtos:', products?.length, pErr?.message || '');
  console.log('Profissionais:', profs?.length, prErr?.message || '');
}

inspectData();
