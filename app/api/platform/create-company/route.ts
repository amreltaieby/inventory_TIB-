import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const PLATFORM_PASSWORD = '1221223377##Ae1234';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { password, companyName, companyLocation, adminEmail, adminPassword } = await req.json();

    if (password !== PLATFORM_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    if (!companyName || !adminEmail || !adminPassword) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: existingCompany } = await supabaseAdmin
      .from('companies')
      .select('id')
      .ilike('name', companyName)
      .maybeSingle();

    if (existingCompany) {
      return NextResponse.json({ error: 'That company name is already in use. Please choose another.' }, { status: 400 });
    }

    const { data: companyData, error: companyError } = await supabaseAdmin
      .from('companies')
      .insert({ name: companyName })
      .select('id')
      .single();

    if (companyError || !companyData) {
      return NextResponse.json({ error: companyError?.message || 'Failed to create company' }, { status: 400 });
    }

    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
    });

    if (userError || !userData.user) {
      await supabaseAdmin.from('companies').delete().eq('id', companyData.id);
      if (userError?.message?.toLowerCase().includes('already') || userError?.message?.toLowerCase().includes('registered')) {
        return NextResponse.json({ error: 'That email is already in use. Please choose another.' }, { status: 400 });
      }
      return NextResponse.json({ error: userError?.message || 'Failed to create admin account' }, { status: 400 });
    }

    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: userData.user.id,
      email: adminEmail,
      company_id: companyData.id,
      role: 'admin',
      active: true,
    });

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
      await supabaseAdmin.from('companies').delete().eq('id', companyData.id);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}