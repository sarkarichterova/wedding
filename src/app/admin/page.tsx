"use client";
import { useState } from "react";

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [form, setForm] = useState({
    id: "",
    number: "",
    name: "",
    relation_cs: "",
    relation_en: "",
    about_cs: "",
    about_en: "",
  });

  const [photo, setPhoto] = useState<File | null>(null);

  // NEW: bilingual audio files
  const [a1cs, setA1cs] = useState<File | null>(null); // official CZ
  const [a1en, setA1en] = useState<File | null>(null); // official EN
  const [a2cs, setA2cs] = useState<File | null>(null); // funny CZ
  const [a2en, setA2en] = useState<File | null>(null); // funny EN

  const [status, setStatus] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("Uploading...");

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => v && fd.append(k, v as string));

    if (photo) fd.append("photo", photo);

    // post bilingual audio; API must support these field names
    if (a1cs) fd.append("audio_official_cs", a1cs);
    if (a1en) fd.append("audio_official_en", a1en);
    if (a2cs) fd.append("audio_funny_cs", a2cs);
    if (a2en) fd.append("audio_funny_en", a2en);

    const res = await fetch("/api/admin/guest", {
      method: "POST",
      headers: { "x-admin-secret": secret },
      body: fd,
    });

    const text = await res.text();
    try {
      const json = JSON.parse(text);
      setStatus(
        res.ok
          ? `Saved (id: ${json.id})`
          : `Error ${res.status}: ${json.error || text} ${
              json.step ? `(step: ${json.step})` : ""
            }`
      );
    } catch {
      setStatus(`Error ${res.status}: ${text}`);
    }
  }

  return (
    <main className="max-w-md mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-semibold text-rose-700">Admin — Upload Guest</h1>

      <label className="block text-sm">
        <div>Admin Secret</div>
        <input
          type="password"
          className="border rounded p-2 w-full"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
        />
      </label>

      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            ID (blank = create)
            <input
              className="border rounded p-2 w-full"
              value={form.id}
              onChange={(e) => setForm({ ...form, id: e.target.value })}
            />
          </label>
          <label className="text-sm">
            Number*
            <input
              required
              className="border rounded p-2 w-full"
              value={form.number}
              onChange={(e) => setForm({ ...form, number: e.target.value })}
            />
          </label>
        </div>

        <label className="text-sm">
          Name*
          <input
            required
            className="border rounded p-2 w-full"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            Relation (CZ)*
            <input
              required
              className="border rounded p-2 w-full"
              value={form.relation_cs}
              onChange={(e) => setForm({ ...form, relation_cs: e.target.value })}
            />
          </label>
          <label className="text-sm">
            Relation (EN)*
            <input
              required
              className="border rounded p-2 w-full"
              value={form.relation_en}
              onChange={(e) => setForm({ ...form, relation_en: e.target.value })}
            />
          </label>
        </div>

        <label className="text-sm">
          About (CZ)
          <textarea
            className="border rounded p-2 w-full"
            rows={2}
            value={form.about_cs}
            onChange={(e) => setForm({ ...form, about_cs: e.target.value })}
          />
        </label>
        <label className="text-sm">
          About (EN)
          <textarea
            className="border rounded p-2 w-full"
            rows={2}
            value={form.about_en}
            onChange={(e) => setForm({ ...form, about_en: e.target.value })}
          />
        </label>

        <div className="grid gap-2">
          <label className="text-sm">
            Photo
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            />
          </label>

          {/* --- Official intro (CZ/EN) --- */}
          <div className="mt-2 rounded-lg border border-rose-200/70 bg-white/60 p-3">
            <div className="text-sm font-semibold text-rose-700 mb-2">
              Official Intro — audio
            </div>
            <label className="text-sm block">
              Czech (MP3)
              <input
                type="file"
                accept="audio/mpeg"
                onChange={(e) => setA1cs(e.target.files?.[0] ?? null)}
              />
            </label>
            <label className="text-sm block mt-2">
              English (MP3)
              <input
                type="file"
                accept="audio/mpeg"
                onChange={(e) => setA1en(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          {/* --- Funny intro (CZ/EN) --- */}
          <div className="rounded-lg border border-rose-200/70 bg-white/60 p-3">
            <div className="text-sm font-semibold text-rose-700 mb-2">
              Funny Intro — audio
            </div>
            <label className="text-sm block">
              Czech (MP3)
              <input
                type="file"
                accept="audio/mpeg"
                onChange={(e) => setA2cs(e.target.files?.[0] ?? null)}
              />
            </label>
            <label className="text-sm block mt-2">
              English (MP3)
              <input
                type="file"
                accept="audio/mpeg"
                onChange={(e) => setA2en(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
        </div>

        <button
          className="rounded-full px-4 py-2 text-white font-semibold shadow bg-gradient-to-b from-[#D98BA3] to-[#C45D7C] hover:opacity-95"
        >
          Save
        </button>
      </form>

      <p className="text-sm text-slate-600">{status}</p>
      <p className="text-[11px] text-slate-500">
        Tip: export voice MP3 mono 48–64 kbps for tiny files.
      </p>
    </main>
  );
}