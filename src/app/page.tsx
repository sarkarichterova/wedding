'use client';
import React, { useEffect, useRef, useState } from 'react';

/* =============== Types =============== */
type Lang = 'cs' | 'en';

type AudioObj = { cs?: string | null; en?: string | null };

type GuestItem = {
  id: number;
  number: number;
  name: string;
  relation: { cs: string; en: string };
  about?: { cs?: string; en?: string };
  photoUrl: string | null;
  audioOfficial?: AudioObj | string | null;
  audioFunny?: AudioObj | string | null;
};

type ApiResponse = { items: GuestItem[] };

/* =============== Helpers =============== */
function asAudio(a: unknown): AudioObj {
  if (!a) return {};
  if (typeof a === 'string') return { cs: a, en: a };
  if (typeof a === 'object') {
    const o = a as Record<string, unknown>;
    const cs =
      typeof o['cs'] === 'string'
        ? (o['cs'] as string)
        : typeof o['cz'] === 'string'
        ? (o['cz'] as string)
        : null;
    const en = typeof o['en'] === 'string' ? (o['en'] as string) : null;
    return { ...(cs ? { cs } : {}), ...(en ? { en } : {}) };
  }
  return {};
}

function pickAudio(a: unknown, lang: Lang): string | null {
  const { cs = null, en = null } = asAudio(a);
  return lang === 'cs' ? (cs ?? en) : (en ?? cs);
}

/* =============== Hearts loader (prettier pastel) =============== */
function LoadingHearts() {
  return (
    <div className="py-10 flex items-center justify-center">
      <div className="flex items-center gap-8">
        <Heart delay="0s" />
        <Heart delay=".18s" />
        <Heart delay=".36s" />
      </div>

      {/* scoped styles for the hearts */}
      <style jsx global>{`
        @keyframes heartPulse {
          0%, 100% { transform: translateY(0) scale(0.88); opacity: .85; }
          50%      { transform: translateY(-6px) scale(1.02); opacity: 1;   }
        }
        .heart-svg {
          width: 28px;
          height: 28px;
          animation: heartPulse 1.05s ease-in-out infinite;
          filter: drop-shadow(0 2px 4px rgba(196,93,124,.18));
        }
      `}</style>
    </div>
  );
}

function Heart({ delay }: { delay: string }) {
  return (
    <svg viewBox="0 0 24 24" className="heart-svg" style={{ animationDelay: delay }} aria-hidden>
      {/* soft pastel fill + subtle stroke */}
      <path
        d="M12 21s-6.8-4.2-9.2-7.9C1 9.8 3.2 6 6.7 6c2 0 3.3 1.1 4.1 2.1.8-1 2.1-2.1 4.1-2.1 3.5 0 5.7 3.8 3.9 7.1C18.6 16.8 12 21 12 21z"
        fill="#F5C4D2"
        stroke="#D98BA3"
        strokeWidth="1"
      />
    </svg>
  );
}

/* =============== Player =============== */
function LabeledAudioPlayer({
  src,
  labelCs,
  labelEn,
  lang,
}: {
  src: string | null;
  labelCs: string;
  labelEn: string;
  lang: Lang;
}) {
  const [playing, setPlaying] = useState(false);
  const [dur, setDur] = useState(0);
  const [pos, setPos] = useState(0);
  const [drag, setDrag] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  // Hooks must run every render, even if src is null
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onLoaded = () => setDur(a.duration || 0);
    const onTime = () => !drag && setPos(a.currentTime || 0);
    const onEnd = () => {
      setPlaying(false);
      setPos(0);
    };
    a.addEventListener('loadedmetadata', onLoaded);
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('ended', onEnd);
    return () => {
      a.removeEventListener('loadedmetadata', onLoaded);
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('ended', onEnd);
    };
  }, [drag]);

  if (!src) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-white/70 px-3 py-3 text-sm text-rose-700">
        {lang === 'cs'
          ? 'Pro tento jazyk zatím není audio nahrané.'
          : 'No audio uploaded for this language yet.'}
      </div>
    );
  }

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.play();
      setPlaying(true);
    }
  }
  function fmt(t: number) {
    if (!isFinite(t)) return '0:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60)
      .toString()
      .padStart(2, '0');
    return `${m}:${s}`;
  }
  function posFromClientX(clientX: number) {
    const el = trackRef.current;
    if (!el || !dur) return 0;
    const r = el.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    return pct * dur;
  }
  function startDrag(clientX: number) {
    const t = posFromClientX(clientX);
    setDrag(t);
    if (audioRef.current) audioRef.current.currentTime = t;
  }
  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    startDrag(e.clientX);
    const move = (ev: PointerEvent) => startDrag(ev.clientX);
    const up = (ev: PointerEvent) => {
      startDrag(ev.clientX);
      setDrag(null);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  const shown = drag ?? pos;
  const progress = dur ? Math.min(100, Math.max(0, (shown / dur) * 100)) : 0;

  return (
    <div className="rounded-2xl border border-[var(--brand-200,#fecdd3)] bg-[var(--brand-50,#fff7fb)]/80 px-3 py-3 shadow-sm">
      {/* bigger label for seniors */}
      <div className="mb-2 text-[16px] font-semibold text-rose-700">
        {lang === 'cs' ? labelCs : labelEn}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="grid place-items-center h-10 w-10 rounded-full text-white shadow bg-gradient-to-b from-[#D98BA3] to-[#C45D7C] hover:opacity-95"
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5">
              <path fill="currentColor" d="M7 5h4v14H7V5zm6 0h4v14h-4V5z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5">
              <path fill="currentColor" d="M8 5v14l11-7-11-7z" />
            </svg>
          )}
        </button>

        <div className="flex-1">
          <div
            ref={trackRef}
            className="relative h-4 rounded-full bg-white/80 border border-rose-200 cursor-pointer touch-none"
            onPointerDown={onPointerDown}
            role="slider"
            aria-valuemin={0}
            aria-valuemax={dur || 0}
            aria-valuenow={shown || 0}
          >
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-[#D98BA3] to-[#C45D7C]"
              style={{ width: `${progress}%` }}
            />
            <div
              className="absolute -top-1 h-6 w-6 rounded-full bg-white border border-rose-300 shadow"
              style={{ left: `calc(${progress}% - 12px)` }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between text-[13px] text-rose-700">
            <span>
              {fmt(shown)} / {fmt(dur)}
            </span>
            <button
              onClick={() => {
                if (audioRef.current) audioRef.current.muted = !audioRef.current.muted;
              }}
              aria-label="mute"
              className="hover:text-rose-800"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5">
                <path
                  fill="currentColor"
                  d="M5 10v4h3l4 4V6l-4 4H5zM16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.06c1.48-.74 2.5-2.26 2.5-4.03z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <audio ref={audioRef} src={src} preload="metadata" crossOrigin="anonymous" />
    </div>
  );
}

/* =============== Page =============== */
export default function Home() {
  const [guests, setGuests] = useState<GuestItem[]>([]);
  const [lang, setLang] = useState<Lang>('cs');
  const [open, setOpen] = useState<GuestItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Single loader (typed, normalized)
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/guests', { cache: 'no-store' });
        const j = (await r.json()) as ApiResponse;

        const items: GuestItem[] = (j.items ?? []).map((it) => ({
          ...it,
          audioOfficial: asAudio(it.audioOfficial),
          audioFunny: asAudio(it.audioFunny),
        }));
        setGuests(items);
      } catch {
        setGuests([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Lock background scroll when modal open
  useEffect(() => {
    if (!open) return;
    const { scrollY } = window;
    const html = document.documentElement;
    html.style.overflow = 'hidden';
    html.style.overscrollBehavior = 'none';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    return () => {
      const y = document.body.style.top;
      html.style.overflow = '';
      html.style.overscrollBehavior = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      window.scrollTo(0, -parseInt(y || '0', 10));
    };
  }, [open]);

  return (
    <main className="relative min-h-screen bg-[#fff7f9] text-rose-950">
      {/* Fixed header (title + language) */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/85 backdrop-blur border-b border-rose-200">
        <div className="max-w-screen-sm mx-auto h-[60px] px-4 flex items-center justify-between">
          <h1 className="font-display text-[22px] md:text-2xl text-rose-700">Zuzu &amp; Ethan</h1>
          <div className="flex rounded-full border border-rose-200 overflow-hidden text-sm shadow bg-white/90">
            <button
              onClick={() => setLang('cs')}
              className={`px-3 py-1.5 ${lang === 'cs' ? 'bg-[#C45D7C] text-white' : 'bg-white text-rose-700'}`}
            >
              CZ
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-3 py-1.5 border-l border-rose-200 ${
                lang === 'en' ? 'bg-[#C45D7C] text-white' : 'bg-white text-rose-700'
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </header>

      {/* Content with top spacer so it doesn't hide behind fixed header */}
      <div className="relative z-10 px-4 pb-28 pt-[72px] max-w-screen-sm mx-auto">
        {/* MAIN MENU */}
        {loading ? (
          <LoadingHearts />
        ) : (
          <section className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {guests.length === 0 && (
              <div className="col-span-full rounded-2xl border border-rose-200/70 bg-white/70 p-8 text-center text-rose-700/80">
                {lang === 'cs' ? 'Zatím žádní hosté.' : 'No guests yet.'}
              </div>
            )}

            {guests.map((g) => (
              <button
                key={g.id}
                onClick={() => setOpen(g)}
                className="text-left rounded-[18px] border border-rose-200/70 bg-white/80 backdrop-blur overflow-hidden shadow-[0_10px_28px_rgba(244,114,182,.10)] focus:outline-none focus:ring-2 focus:ring-[#e8b9c8]"
              >
                <div className="relative aspect-square w-full bg-[linear-gradient(180deg,#fff5f7_0%,#ffffff_60%)] overflow-hidden">
                  <div className="absolute top-2 left-2 rounded-full bg-white/95 px-2 py-0.5 text-xs font-semibold text-rose-700 shadow">
                    #{g.number}
                  </div>
                  {g.photoUrl && (
                    <img src={g.photoUrl} alt={g.name} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="p-2">
                  <div className="text-[17px] font-semibold text-rose-900 leading-tight truncate">
                    {g.name}
                  </div>
                  {/* Bigger relation for seniors; up to 3 lines */}
                  <div
                    className="mt-1 text-[16px] text-rose-700 leading-snug"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {lang === 'cs' ? g.relation.cs : g.relation.en}
                  </div>
                </div>
              </button>
            ))}
          </section>
        )}
      </div>

      {/* Detail modal (flicker-free, full-width on phones) */}
      {open && (
        <div className="fixed inset-0 z-50 overscroll-none">
          <div className="fixed inset-0 bg-black/40" />
          <div className="fixed inset-0 pointer-events-none backdrop-blur-sm" />

          <div className="relative z-10 flex h-[100svh] w-full items-end sm:items-center sm:justify-center">
            <div
              className="
                box-border transform-gpu ios-scroll
                w-full h-[100svh] sm:h-auto sm:w-[520px] sm:max-h-[92svh]
                bg-white rounded-t-3xl sm:rounded-3xl
                border border-rose-200/60 shadow-2xl
                overflow-y-auto overflow-x-hidden overscroll-contain
                px-0
                [padding-left:env(safe-area-inset-left,0px)]
                [padding-right:env(safe-area-inset-right,0px)]
                [padding-bottom:env(safe-area-inset-bottom,0px)]
              "
            >
              <div className="sticky top-0 z-10 bg-white border-b border-rose-100 flex items-center justify-between px-6 sm:px-7 py-3">
                <div className="text-lg font-semibold text-rose-700">
                  {lang === 'cs' ? 'Profil hosta' : 'Guest detail'}
                </div>
                <button
                  onClick={() => setOpen(null)}
                  className="rounded-full bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 text-sm font-medium"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className="aspect-square bg-rose-50 overflow-hidden">
                {open.photoUrl && (
                  <img src={open.photoUrl} alt={open.name} className="w-full h-full object-cover" />
                )}
              </div>

              <div className="px-6 sm:px-7 py-4 pb-8">
                <div className="text-xl font-semibold text-rose-900">{open.name}</div>

                {/* Relation — bigger for readability */}
                <div className="mt-0.5 text-[19px] md:text-[20px] text-rose-700">
                  {lang === 'cs' ? open.relation.cs : open.relation.en}
                </div>

                {/* About / “heeeej” — bigger and comfy line height */}
                {(open.about?.cs || open.about?.en) && (
                  <p className="mt-2 text-[17px] leading-[1.55] text-rose-800">
                    {lang === 'cs' ? open.about?.cs : open.about?.en}
                  </p>
                )}

                <div className="my-4" />

                <div className="space-y-4">
                  <LabeledAudioPlayer
                    src={pickAudio(open.audioOfficial, lang)}
                    labelCs="Oficiální intro"
                    labelEn="Official Intro"
                    lang={lang}
                  />
                  <LabeledAudioPlayer
                    src={pickAudio(open.audioFunny, lang)}
                    labelCs="Vtipné intro"
                    labelEn="Funny Intro"
                    lang={lang}
                  />
                </div>

                <div className="mt-6 grid">
                  <button
                    onClick={() => setOpen(null)}
                    className="rounded-full justify-self-center text-white px-6 py-3 text-sm font-semibold shadow bg-gradient-to-b from-[#D98BA3] to-[#C45D7C] hover:opacity-95"
                  >
                    {lang === 'cs' ? 'Zavřít' : 'Close'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}