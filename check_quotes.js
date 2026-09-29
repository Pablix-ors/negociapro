const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
let supabaseUrl = 'https://fakytcdlffdulvdmbjut.supabase.co';
let supabaseKey = '';
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.trim().split('=');
  if (k === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = v.join('=');
  if (k === 'SUPABASE_SERVICE_ROLE_KEY' || k === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') {
    if (!supabaseKey || k === 'SUPABASE_SERVICE_ROLE_KEY') supabaseKey = v.join('=');
  }
});

const sb = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: quotes, error } = await sb.from('sales').select('id, sale_number, customer_id, total, status, sold_at, company_id').eq('status', 'QUOTE').order('sold_at', { ascending: false }).limit(10);
  console.log('Recent quotes in Supabase:', quotes, error);
}

run();
