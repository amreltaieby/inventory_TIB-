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

    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

    const { data: targetProfile } = await supabaseAdmin.from('profiles').select('company_id').eq('id', userId).single();
    if (!targetProfile || targetProfile.company_id !== adminProfile.company_id) {
      return NextResponse.json({ error: 'Not authorized to remove this user' }, { status: 403 });
    }

    const { data: txCheck } = await supabaseAdmin.from('transactions').select('id').eq('user_id', userId).limit(1);

    if (txCheck && txCheck.length > 0) {
      await supabaseAdmin.from('profiles').update({ active: false }).eq('id', userId);
      return NextResponse.json({ success: true, deactivatedOnly: true });
    }

    await supabaseAdmin.from('profiles').delete().eq('id', userId);
    await supabaseAdmin.auth.admin.deleteUser(userId);

    return NextResponse.json({ success: true, deactivatedOnly: false });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}