import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fakytcdlffdulvdmbjut.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getAdminClient() {
  return createClient(supabaseUrl, supabaseKey);
}

// GET: Listar logs de auditoria direto do Supabase
export async function GET() {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('master_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, logs: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

// POST: Registrar novo log de auditoria no Supabase
export async function POST(request: Request) {
  try {
    const logData = await request.json();
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from('master_audit_logs')
      .insert([{
        master_user_id: logData.master_user_id || null,
        master_email: logData.master_email || 'pablixgamezgg@gmail.com',
        company_id: logData.company_id || null,
        company_name: logData.company_name || null,
        action: logData.action,
        description: logData.description,
        ip_address: logData.ip_address || '127.0.0.1',
        user_agent: logData.user_agent || 'Client Browser',
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar log de auditoria no Supabase:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, log: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
