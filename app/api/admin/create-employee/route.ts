import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyAdmin(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;

  const { data: profile } = await supabaseAdmin.from('profiles').select('role, company_id').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') return null;

  return profile;
}

export async function POST(req: NextRequest) {
  try {
    const adminProfile = await verifyAdmin(req);
    if (!adminProfile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { email, password, fullName, nationalId } = await req.json();

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (userError || !userData.user) {
      return NextResponse.json({ error: userError?.message || 'Failed to create user' }, { status: 400 });
    }

    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: userData.user.id,
      email,
      full_name: fullName,
      national_id: nationalId || null,
      company_id: adminProfile.company_id,
      role: 'employee',
      active: true,
    });

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}