const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  const k = parts[0]?.trim();
  const v = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
  if (k) env[k] = v;
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error(error);
    return;
  }
  const found = data.users.find(u => u.email && u.email.toLowerCase().includes('ivanio'));
  console.log('USER_FOUND:', JSON.stringify(found, null, 2));

  if (found) {
    const { data: prof } = await supabase.from('profiles').select('*').eq('email', found.email);
    console.log('PROFILE_FOUND:', JSON.stringify(prof, null, 2));
  }
}

check();
