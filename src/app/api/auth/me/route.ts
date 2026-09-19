import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fakytcdlffdulvdmbjut.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getAdminClient() {
  return createClient(supabaseUrl, supabaseKey);
}

// GET: Reconcilia perfil do usuário e empresa do banco de dados oficial
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');

    if (!userId && !email) {
      return NextResponse.json({ success: false, message: 'Identificador do usuário ausente' }, { status: 400 });
    }

    const supabase = getAdminClient();
    let profile = null;

    if (userId) {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      profile = data;
    }

    if (!profile && email) {
      const cleanEmail = email.trim().toLowerCase();
      const { data } = await supabase.from('profiles').select('*').eq('email', cleanEmail).maybeSingle();
      profile = data;
    }

    if (!profile) {
      return NextResponse.json({ success: false, message: 'Perfil não encontrado' }, { status: 404 });
    }

    let company = null;
    if (profile.company_id) {
      const { data: comp } = await supabase.from('companies').select('*').eq('id', profile.company_id).maybeSingle();
      company = comp;
    }

    return NextResponse.json({
      success: true,
      user: {
        id: profile.id,
        company_id: profile.company_id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        phone: profile.phone,
        avatar_url: profile.avatar_url,
        active: profile.active ?? true,
      },
      company: company,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

// POST: Atualiza perfil do usuário ou dados da empresa no Supabase
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, userId, email, profileData, companyId, companyData } = body;

    const supabase = getAdminClient();

    if (action === 'update_profile' || profileData) {
      if (!userId && !email) {
        return NextResponse.json({ success: false, message: 'Identificador do usuário ausente' }, { status: 400 });
      }

      const updatePayload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (profileData?.name !== undefined) updatePayload.name = profileData.name.trim();
      if (profileData?.phone !== undefined) updatePayload.phone = profileData.phone ? profileData.phone.trim() : null;
      if (profileData?.avatar_url !== undefined) updatePayload.avatar_url = profileData.avatar_url;

      let updatedProfile = null;

      // 1. Atualizar tabela profiles por ID se fornecido
      if (userId) {
        const { data, error } = await supabase
          .from('profiles')
          .update(updatePayload)
          .eq('id', userId)
          .select('*')
          .maybeSingle();

        if (error) {
          console.error('Erro ao atualizar profiles por ID:', error);
        } else if (data) {
          updatedProfile = data;
        }
      }

      // 2. Atualizar por email se não atualizou por ID
      if (!updatedProfile && email) {
        const cleanEmail = email.trim().toLowerCase();
        const { data, error } = await supabase
          .from('profiles')
          .update(updatePayload)
          .eq('email', cleanEmail)
          .select('*')
          .maybeSingle();

        if (error) {
          console.error('Erro ao atualizar profiles por email:', error);
        } else if (data) {
          updatedProfile = data;
        }
      }

      // 3. Atualizar metadados no Supabase Auth (auth.users)
      const targetUserId = updatedProfile?.id || userId;
      if (targetUserId && profileData?.name) {
        try {
          await supabase.auth.admin.updateUserById(targetUserId, {
            user_metadata: {
              full_name: profileData.name.trim(),
              name: profileData.name.trim(),
            },
          });
        } catch (authErr: any) {
          console.warn('Aviso ao sincronizar user_metadata auth.users:', authErr?.message);
        }
      }

      // 4. Sincronizar nome na tabela professionals se houver registro vinculado
      const targetEmail = (updatedProfile?.email || email || '').trim().toLowerCase();
      if (targetEmail && profileData?.name) {
        try {
          await supabase
            .from('professionals')
            .update({
              name: profileData.name.trim(),
              ...(profileData.phone !== undefined ? { phone: profileData.phone?.trim() || null } : {}),
              updated_at: new Date().toISOString(),
            })
            .eq('email', targetEmail);
        } catch (profErr: any) {
          console.warn('Aviso ao sincronizar professionals:', profErr?.message);
        }
      }

      // 5. Se ainda não recuperou, buscar novamente
      if (!updatedProfile) {
        const query = userId
          ? supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
          : supabase.from('profiles').select('*').eq('email', targetEmail).maybeSingle();
        const { data } = await query;
        updatedProfile = data;
      }

      const finalUser = updatedProfile
        ? {
            id: updatedProfile.id,
            company_id: updatedProfile.company_id,
            name: updatedProfile.name,
            email: updatedProfile.email,
            role: updatedProfile.role,
            phone: updatedProfile.phone,
            avatar_url: updatedProfile.avatar_url,
            active: updatedProfile.active ?? true,
          }
        : {
            id: userId,
            email: email,
            name: profileData?.name,
            phone: profileData?.phone,
          };

      return NextResponse.json({
        success: true,
        user: finalUser,
      });
    }

    if (action === 'update_company' || companyData) {
      if (!companyId) {
        return NextResponse.json({ success: false, message: 'Identificador da empresa ausente' }, { status: 400 });
      }

      const updatePayload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      const allowedFields = [
        'name', 'trade_name', 'cnpj', 'state_registration', 'municipal_registration',
        'email', 'phone', 'whatsapp', 'website', 'logo_url', 'zip_code', 'street',
        'number', 'complement', 'neighborhood', 'city', 'state'
      ];
      for (const f of allowedFields) {
        if (companyData[f] !== undefined) {
          updatePayload[f] = companyData[f];
        }
      }

      const { data: updatedCompany, error: compErr } = await supabase
        .from('companies')
        .update(updatePayload)
        .eq('id', companyId)
        .select('*')
        .maybeSingle();

      if (compErr) {
        console.error('Erro ao atualizar empresa:', compErr);
        return NextResponse.json({ success: false, message: compErr.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        company: updatedCompany,
      });
    }

    return NextResponse.json({ success: false, message: 'Ação não informada' }, { status: 400 });
  } catch (err: any) {
    console.error('Erro no POST /api/auth/me:', err);
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
