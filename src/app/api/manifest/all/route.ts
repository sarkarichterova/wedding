import { NextResponse } from 'next/server';
import { supabasePublic } from '@/lib/supabasePublic';

export async function GET() {
  const { data } = await supabasePublic
    .from('guests')
    .select('photo_path, audio_official_path, audio_funny_path');

  const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public`;
  const urls: string[] = [];
  (data ?? []).forEach((r) => {
    if (r.photo_path) urls.push(`${base}/photos/${r.photo_path}`);
    if (r.audio_official_path) urls.push(`${base}/audio-official/${r.audio_official_path}`);
    if (r.audio_funny_path) urls.push(`${base}/audio-funny/${r.audio_funny_path}`);
  });

  return NextResponse.json({ urls });
}