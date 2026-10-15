import React from 'react';
import { ShieldCheck, UserCheck, Search, ReceiptText, HelpCircle } from 'lucide-react';
import { MASCOT_IMAGE_URL } from '../data/initialData';

interface HeaderProps {
  currentView: 'catalog' | 'order-lookup' | 'history' | 'support' | 'admin';
  setCurrentView: (view: 'catalog' | 'order-lookup' | 'history' | 'support' | 'admin') => void;
  isAdminLoggedIn: boolean;
  onOpenAdmin: () => void;
  currentUser?: { fullName: string; email: string } | null;
  onOpenCustomerAuth?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  setCurrentView,
  isAdminLoggedIn,
  onOpenAdmin,
  currentUser,
  onOpenCustomerAuth,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Zone 1: Single text element wordmark with mascot */}
        <button
          onClick={() => setCurrentView('catalog')}
          className="group flex items-center gap-3 text-left whitespace-nowrap shrink-0 transition-opacity hover:opacity-90 cursor-pointer"
        >
          <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-violet-500/40 bg-slate-900 shadow-sm shadow-violet-500/10">
            <img
              src={MASCOT_IMAGE_URL}
              alt="Kumagemu Mascot"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover object-top"
            />
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight text-white flex items-center gap-1">
              <span>Kuma</span>
              <span className="text-violet-400">gemu</span>
            </div>
            <p className="text-[11px] font-medium text-slate-400">Power Up. Play More.</p>
          </div>
        </button>

        {/* Zone 2: 4-5 clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
          <button
            onClick={() => setCurrentView('catalog')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer hover:text-white ${
              currentView === 'catalog' ? 'text-violet-400 font-semibold' : ''
            }`}
          >
            Katalog Game
          </button>
          <button
            onClick={() => setCurrentView('order-lookup')}
            className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer hover:text-white ${
              currentView === 'order-lookup' ? 'text-violet-400 font-semibold' : ''
            }`}
          >
            <Search className="h-4 w-4" />
            <span>Lacak Pesanan</span>
          </button>
          <button
            onClick={() => setCurrentView('history')}
            className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer hover:text-white ${
              currentView === 'history' ? 'text-violet-400 font-semibold' : ''
            }`}
          >
            <ReceiptText className="h-4 w-4" />
            <span>Riwayat Transaksi</span>
          </button>
          <button
            onClick={() => setCurrentView('support')}
            className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer hover:text-white ${
              currentView === 'support' ? 'text-violet-400 font-semibold' : ''
            }`}
          >
            <HelpCircle className="h-4 w-4" />
            <span>Bantuan & Garansi</span>
          </button>
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Customer Auth Button */}
          {onOpenCustomerAuth && (
            <button
              onClick={onOpenCustomerAuth}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                currentUser
                  ? 'bg-slate-900 text-white border border-violet-500/50 hover:bg-slate-800'
                  : 'bg-slate-900 text-slate-300 border border-slate-700/80 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <UserCheck className="h-3.5 w-3.5 text-cyan-400" />
              <span>{currentUser ? currentUser.fullName.split(' ')[0] : 'Masuk / Daftar'}</span>
            </button>
          )}

          {/* Administrator Portal Button */}
          <button
            onClick={onOpenAdmin}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              isAdminLoggedIn
                ? 'bg-violet-600/30 text-violet-300 border border-violet-500/50 hover:bg-violet-600/40'
                : 'bg-slate-900 text-slate-300 border border-slate-700/80 hover:bg-slate-800 hover:text-white hover:border-violet-500/40'
            }`}
          >
            {isAdminLoggedIn ? (
              <>
                <ShieldCheck className="h-3.5 w-3.5 text-violet-400" />
                <span>Panel Admin</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                <span>Admin</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mobile subnavigation bar for small screens */}
      <div className="flex md:hidden border-t border-slate-800/60 bg-slate-950/80 px-4 py-2 overflow-x-auto gap-4 text-xs font-medium text-slate-400">
        <button
          onClick={() => setCurrentView('catalog')}
          className={`whitespace-nowrap shrink-0 ${currentView === 'catalog' ? 'text-violet-400 font-bold' : ''}`}
        >
          Katalog
        </button>
        <button
          onClick={() => setCurrentView('order-lookup')}
          className={`whitespace-nowrap shrink-0 ${currentView === 'order-lookup' ? 'text-violet-400 font-bold' : ''}`}
        >
          Lacak Pesanan
        </button>
        <button
          onClick={() => setCurrentView('history')}
          className={`whitespace-nowrap shrink-0 ${currentView === 'history' ? 'text-violet-400 font-bold' : ''}`}
        >
          Riwayat
        </button>
        <button
          onClick={() => setCurrentView('support')}
          className={`whitespace-nowrap shrink-0 ${currentView === 'support' ? 'text-violet-400 font-bold' : ''}`}
        >
          Bantuan
        </button>
      </div>
    </header>
  );
};
