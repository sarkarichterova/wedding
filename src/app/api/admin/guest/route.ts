import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const config = { api: { bodyParser: false } };

type GuestPatch = {
  photo_path?: string;
  audio_official_cs_path?: string;
  audio_official_en_path?: string;
  audio_funny_cs_path?: string;
  audio_funny_en_path?: string;
  updated_at?: string;
};

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

function json(status: number, body: unknown) {
  return NextResponse.json(body, { status });
}

export async function POST(req: Request) {
  try {
    const secret = req.headers.get('x-admin-secret') || '';
    if (secret !== process.env.ADMIN_SECRET) return json(401, { error: 'Unauthorized: bad x-admin-secret' });
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)
      return json(500, { error: 'Missing Supabase env' });

    const s = svc();
    const form = await req.formData();

    const id = form.get('id') ? Number(form.get('id')) : undefined;
    const number = Number(form.get('number') || '');
    const name = String(form.get('name') || '');
    const relation_cs = String(form.get('relation_cs') || '');
    const relation_en = String(form.get('relation_en') || '');
    const about_cs = (form.get('about_cs') ?? '') as string | null;
    const about_en = (form.get('about_en') ?? '') as string | null;

    if (!number || !name || !relation_cs || !relation_en) {
      return json(400, { error: 'Missing required fields', got: { number, name, relation_cs, relation_en } });
    }

    let guestId = id;
    if (!guestId) {
      const { data, error } = await s
        .from('guests')
        .insert([{ number, name, relation_cs, relation_en, about_cs, about_en }])
        .select('id')
        .single();
      if (error) return json(500, { step: 'insert', error: error.message });
      guestId = data!.id;
    } else {
      const { error } = await s
        .from('guests')
        .update({ number, name, relation_cs, relation_en, about_cs, about_en, updated_at: new Date().toISOString() })
        .eq('id', guestId);
      if (error) return json(500, { step: 'update', error: error.message });
    }

    const getFile = (name: string) => (form.get(name) as File) || null;
    const mimeExt = (f: File | null, fallback: string) => {
      const t = f?.type || '';
      if (t.includes('png')) return 'png';
      if (t.includes('webp')) return 'webp';
      if (t.includes('jpeg') || t.includes('jpg')) return 'jpg';
      if (t.includes('mpeg') || t.includes('mp3')) return 'mp3';
      if (t.includes('wav')) return 'wav';
      return fallback;
    };
    async function upload(field: string, bucket: string, path: string) {
      const f = getFile(field);
      if (!f || f.size === 0) return undefined;
      const { error } = await s.storage.from(bucket).upload(path, f, { upsert: true, contentType: f.type || undefined });
      if (error) throw new Error(`[storage ${bucket}] ${error.message}`);
      return path;
    }

    const photo = getFile('photo');
    const patch: GuestPatch = {};

    if (photo && photo.size > 0) {
      patch.photo_path = await upload('photo', 'photos', `${guestId}.${mimeExt(photo, 'jpg')}`);
    }

    const a1cs = getFile('audio_official_cs');
    const a1en = getFile('audio_official_en');
    const a2cs = getFile('audio_funny_cs');
    const a2en = getFile('audio_funny_en');

    if (a1cs && a1cs.size > 0) patch.audio_official_cs_path = await upload('audio_official_cs', 'audio-official', `${guestId}_cs.${mimeExt(a1cs, 'mp3')}`);
    if (a1en && a1en.size > 0) patch.audio_official_en_path = await upload('audio_official_en', 'audio-official', `${guestId}_en.${mimeExt(a1en, 'mp3')}`);
    if (a2cs && a2cs.size > 0) patch.audio_funny_cs_path    = await upload('audio_funny_cs',    'audio-funny',   `${guestId}_cs.${mimeExt(a2cs, 'mp3')}`);
    if (a2en && a2en.size > 0) patch.audio_funny_en_path    = await upload('audio_funny_en',    'audio-funny',   `${guestId}_en.${mimeExt(a2en, 'mp3')}`);

    if (Object.keys(patch).length) {
      patch.updated_at = new Date().toISOString();
      const { error } = await s.from('guests').update(patch).eq('id', guestId!);
      if (error) return json(500, { step: 'update-paths', error: error.message });
    }

    return json(200, { ok: true, id: guestId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json(500, { error: msg });
  }
}