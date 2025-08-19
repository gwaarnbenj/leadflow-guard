import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { url } = await req.json();
  const { data, error } = await supabaseAdmin.from('sites').insert({
    org_id: (await supabaseAdmin.from('organizations').select('id').limit(1).single()).data?.id,
    url
  }).select('id').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ site_id: data!.id });
}
