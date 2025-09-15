import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type GuestRow = {
  id: number;
  number: number;
  name: string;
  relation_cs: string;
  relation_en: string;
  about_cs: string | null;
  about_en: string | null;
  photo_path: string | null;
  audio_official_cs_path: string | null;
  audio_official_en_path: string | null;
  audio_funny_cs_path: string | null;
  audio_funny_en_path: string | null;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

const pub = (bucket: string, path?: string | null) =>
  path ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${encodeURIComponent(path)}` : null;

export async function GET() {
  const { data, error } = await supabase
    .from('guests')
    .select('id,number,name,relation_cs,relation_en,about_cs,about_en,photo_path,audio_official_cs_path,audio_official_en_path,audio_funny_cs_path,audio_funny_en_path')
    .order('number', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as GuestRow[];
  const items = rows.map((g) => ({
    id: g.id,
    number: g.number,
    name: g.name,
    relation: { cs: g.relation_cs, en: g.relation_en },
    about: { cs: g.about_cs ?? undefined, en: g.about_en ?? undefined },
    photoUrl: pub('photos', g.photo_path),
    audioOfficial: { cs: pub('audio-official', g.audio_official_cs_path), en: pub('audio-official', g.audio_official_en_path) },
    audioFunny:    { cs: pub('audio-funny',    g.audio_funny_cs_path),    en: pub('audio-funny',    g.audio_funny_en_path)    },
  }));

  return NextResponse.json({ items });
}