import React from 'react';
import { Search, Zap, Shield, Clock } from 'lucide-react';
import { HERO_BANNER_URL } from '../data/initialData';

interface HeroProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSelectGameSlug: (slug: string) => void;
}

export const Hero: React.FC<HeroProps> = ({
  searchQuery,
  setSearchQuery,
  onSelectGameSlug,
}) => {
  return (
    <section className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-slate-950 via-slate-900 to-[#070b16] py-12 md:py-16">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-96 w-[700px] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute top-1/2 right-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-violet-400">
              <Zap className="h-3.5 w-3.5 text-cyan-400" />
              <span>PLATFORM TOP UP GAME INDONESIA</span>
              <span className="text-slate-600" aria-hidden="true">·</span>
              <span className="text-slate-400">INSTAN 24/7</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.15]" style={{ textWrap: 'balance' }}>
              Power Up. <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">Play More.</span>
            </h1>

            <p className="max-w-xl text-base text-slate-300 leading-relaxed">
              Top up Mobile Legends, Free Fire, Valorant, Genshin Impact, dan game favorit lainnya. Otomatis masuk dalam hitungan detik dengan metode pembayaran terlengkap di Indonesia.
            </p>

            {/* Instant Search Bar */}
            <div className="relative max-w-lg">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                <Search className="h-5 w-5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari game (Mobile Legends, Valorant, Genshin...)"
                className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 py-3.5 pl-11 pr-4 text-sm text-white placeholder-slate-400 shadow-lg shadow-black/20 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Quick popular tags */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 pt-1">
              <span className="text-slate-500">Populer:</span>
              <button
                onClick={() => onSelectGameSlug('mobile-legends')}
                className="rounded-md bg-slate-800/80 px-2.5 py-1 text-slate-300 hover:bg-violet-600/20 hover:text-violet-300 transition-colors cursor-pointer"
              >
                MLBB
              </button>
              <button
                onClick={() => onSelectGameSlug('free-fire')}
                className="rounded-md bg-slate-800/80 px-2.5 py-1 text-slate-300 hover:bg-violet-600/20 hover:text-violet-300 transition-colors cursor-pointer"
              >
                Free Fire
              </button>
              <button
                onClick={() => onSelectGameSlug('valorant')}
                className="rounded-md bg-slate-800/80 px-2.5 py-1 text-slate-300 hover:bg-violet-600/20 hover:text-violet-300 transition-colors cursor-pointer"
              >
                Valorant
              </button>
              <button
                onClick={() => onSelectGameSlug('genshin-impact')}
                className="rounded-md bg-slate-800/80 px-2.5 py-1 text-slate-300 hover:bg-violet-600/20 hover:text-violet-300 transition-colors cursor-pointer"
              >
                Genshin Impact
              </button>
            </div>
          </div>

          {/* Right Hero Showcase Card */}
          <div className="lg:col-span-5">
            <div className="relative overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-900 shadow-2xl shadow-violet-950/20 group">
              <div className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={HERO_BANNER_URL}
                  alt="Kumagemu Gaming Command Center"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                    <span className="font-semibold text-white">Turnamen & Event Aktif</span>
                    <span className="font-mono text-cyan-400">Status: Buka 24 Jam</span>
                  </div>
                  <p className="text-xs text-slate-400">Layanan pengiriman topup otomatis bekerja tanpa henti setiap hari.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Key Trust Pillars */}
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3 border-t border-slate-800/60 pt-8">
          <div className="flex items-center gap-3.5 rounded-xl border border-slate-800/70 bg-slate-900/50 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Proses Kilat 1-30 Detik</h2>
              <p className="text-xs text-slate-400">Sistem otomatis langsung meneruskan pesanan Anda ke server game.</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 rounded-xl border border-slate-800/70 bg-slate-900/50 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">100% Legal & Bergaransi</h2>
              <p className="text-xs text-slate-400">Jalur resmi publisher tanpa meminta password akun pribadi.</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 rounded-xl border border-slate-800/70 bg-slate-900/50 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Pembayaran Fleksibel</h2>
              <p className="text-xs text-slate-400">QRIS, GoPay, DANA, BCA VA, Mandiri VA, hingga gerai Alfamart.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
