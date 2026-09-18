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
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*, companies(*)')
    .eq('email', 'ivaniokelver@gmail.com')
    .single();

  console.log('PERFIL DO CLIENTE VINCULADO NO BANCO:');
  console.log('User:', profile?.name, '| Email:', profile?.email);
  console.log('Empresa vinculada:', profile?.companies?.name, '| ID:', profile?.companies?.id);
  console.log('Status da Empresa:', profile?.companies?.status);
}

run();
