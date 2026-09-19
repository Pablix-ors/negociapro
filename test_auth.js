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

const anonClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testLogin(pass) {
  const { data, error } = await anonClient.auth.signInWithPassword({
    email: 'ivaniokelver@gmail.com',
    password: pass
  });
  console.log('Testing password "' + pass + '":', error ? error.message : 'SUCCESS (User ID: ' + data.user.id + ')');
}

async function run() {
  await testLogin('171001');
}

run();
