import { NextRequest, NextResponse } from 'next/server';

const PLATFORM_PASSWORD = '1221223377##Ae1234';

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  if (password === PLATFORM_PASSWORD) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false }, { status: 401 });
}