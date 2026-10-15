import React, { useState, useMemo } from 'react';
import { Game, GameCategory } from '../types';
import { ChevronRight, Gamepad2, Sparkles } from 'lucide-react';

interface GameCatalogProps {
  games: Game[];
  searchQuery: string;
  onSelectGame: (game: Game) => void;
}

const CATEGORIES: { label: string; value: GameCategory }[] = [
  { label: 'Semua Game', value: 'all' },
  { label: 'MOBA', value: 'moba' },
  { label: 'Battle Royale', value: 'battle-royale' },
  { label: 'FPS Tactical', value: 'fps' },
  { label: 'RPG & Anime', value: 'rpg' },
  { label: 'Sandbox', value: 'sandbox' },
];

export const GameCatalog: React.FC<GameCatalogProps> = ({
  games,
  searchQuery,
  onSelectGame,
}) => {
  const [activeCategory, setActiveCategory] = useState<GameCategory>('all');

  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      const matchesCategory =
        activeCategory === 'all' || game.category === activeCategory;
      const matchesSearch =
        game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.publisher.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [games, activeCategory, searchQuery]);

  return (
    <section id="katalog" className="py-10 md:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-violet-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>KATALOG RESMI</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
              Pilih Game Favorit Kamu
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Semua produk dijamin 100% legal dan dikirim langsung ke akun Anda.
            </p>
          </div>

          {/* Category Tabs (Segmented control) */}
          <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-900/90 border border-slate-800 rounded-xl max-w-full">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  activeCategory === cat.value
                    ? 'bg-violet-600 text-white shadow-sm shadow-violet-900/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Games Grid */}
        {filteredGames.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
            <Gamepad2 className="mx-auto h-12 w-12 text-slate-600 mb-3" />
            <h3 className="text-base font-semibold text-white">Tidak ada game ditemukan</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
              Coba gunakan kata kunci pencarian lain atau pilih kategori game yang berbeda.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 sm:gap-6">
            {filteredGames.map((game) => (
              <div
                key={game.id}
                onClick={() => game.isActive && onSelectGame(game)}
                className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-slate-900/80 transition-all duration-200 ${
                  game.isActive
                    ? 'border-slate-800 hover:border-violet-500/50 hover:bg-slate-900 hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-950/20 cursor-pointer'
                    : 'border-slate-800/50 opacity-60 cursor-not-allowed'
                }`}
              >
                {/* Artwork Container */}
                <div className="relative aspect-square w-full overflow-hidden bg-slate-950">
                  <img
                    src={game.logoUrl}
                    alt={game.title}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                  {/* Badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                    {game.isPopular ? (
                      <span className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded bg-violet-600 text-white shadow-sm">
                        Populer
                      </span>
                    ) : (
                      <span />
                    )}
                    {!game.isActive && (
                      <span className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Maintenance
                      </span>
                    )}
                  </div>

                  {/* Publisher unboxed text */}
                  <div className="absolute bottom-2.5 left-3 text-[11px] font-medium text-cyan-300">
                    {game.publisher}
                  </div>
                </div>

                {/* Card Info */}
                <div className="flex flex-1 flex-col justify-between p-4">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-violet-300 transition-colors line-clamp-1">
                      {game.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {game.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-400 group-hover:text-white transition-colors">
                      {game.isActive ? 'Top Up Instan' : 'Segera Hadir'}
                    </span>
                    <span className="flex items-center text-violet-400 group-hover:translate-x-0.5 transition-transform">
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
