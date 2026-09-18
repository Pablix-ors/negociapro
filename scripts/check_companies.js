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

async function check() {
  console.log('--- COMPANIES ---');
  const { data: companies, error: compErr } = await supabase.from('companies').select('*');
  if (compErr) console.error(compErr);
  else console.log(JSON.stringify(companies, null, 2));

  console.log('--- PRODUCT CATEGORIES ---');
  const { data: cats, error: catErr } = await supabase.from('product_categories').select('*');
  if (catErr) console.error(catErr);
  else console.log(`Total categories: ${cats ? cats.length : 0}`);
}

check();
