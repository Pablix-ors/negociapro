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

async function run() {
  const companyId = '2bcee844-9475-4175-ae47-e0f6f53dbb09';
  console.log('Testing insert for company:', companyId);

  const testItem = {
    company_id: companyId,
    name: 'PRODUTO TESTE VERIFICACAO',
    selling_price: 15.5,
    cost_price: 10.0,
    min_price: 12.0,
    current_stock: 5,
    min_stock: 1,
    unit: 'UN',
    brand: 'TESTE'
  };

  const { data, error } = await supabase.from('products').insert([testItem]).select().single();
  if (error) {
    console.error('Insert error:', error);
  } else {
    console.log('Insert success, ID:', data.id);
    const { error: delErr } = await supabase.from('products').delete().eq('id', data.id);
    if (delErr) console.error('Delete error:', delErr);
    else console.log('Cleaned up test item successfully.');
  }

  const { count, error: countErr } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('company_id', companyId);
  console.log('Current product count in Supabase for this company:', count);
}

run();
