import React from 'react';
import { MASCOT_IMAGE_URL } from '../data/initialData';

interface FooterProps {
  onOpenPolicy: () => void;
  onOpenAdmin: () => void;
  onSelectCategory: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenPolicy,
  onOpenAdmin,
  onSelectCategory,
}) => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/90 text-slate-400 text-xs">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 overflow-hidden rounded-xl border border-violet-500/40 bg-slate-900">
                <img
                  src={MASCOT_IMAGE_URL}
                  alt="Kumagemu Logo"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover object-top"
                />
              </div>
              <div>
                <span className="text-base font-bold text-white tracking-tight">Kumagemu</span>
                <p className="text-[11px] text-slate-400">Power Up. Play More.</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Platform e-commerce top up voucher dan mata uang game resmi terpercaya di Indonesia. Transaksi otomatis 24 jam dengan jaminan keamanan akun tanpa meminta kata sandi.
            </p>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Navigasi Cepat</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={onSelectCategory}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Semua Game Populer
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenPolicy}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Kebijakan Pengembalian Dana
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenPolicy}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Syarat & Ketentuan Layanan
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenAdmin}
                  className="text-violet-400 hover:text-violet-300 transition-colors cursor-pointer"
                >
                  Panel Manajemen Admin
                </button>
              </li>
            </ul>
          </div>

          {/* Payment Badges & Contact */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Metode Pembayaran Resmi
            </h4>
            <p className="text-[11px] text-slate-400">
              Mendukung QRIS, GoPay, OVO, DANA, BCA Virtual Account, Mandiri, BRI, dan Gerai Alfamart di seluruh Indonesia.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="rounded bg-slate-900 border border-slate-800 px-2 py-1 text-[10px] font-mono font-bold text-slate-300">
                QRIS
              </span>
              <span className="rounded bg-slate-900 border border-slate-800 px-2 py-1 text-[10px] font-mono font-bold text-slate-300">
                GOPAY
              </span>
              <span className="rounded bg-slate-900 border border-slate-800 px-2 py-1 text-[10px] font-mono font-bold text-slate-300">
                DANA
              </span>
              <span className="rounded bg-slate-900 border border-slate-800 px-2 py-1 text-[10px] font-mono font-bold text-slate-300">
                BCA VA
              </span>
              <span className="rounded bg-slate-900 border border-slate-800 px-2 py-1 text-[10px] font-mono font-bold text-slate-300">
                MANDIRI VA
              </span>
              <span className="rounded bg-slate-900 border border-slate-800 px-2 py-1 text-[10px] font-mono font-bold text-slate-300">
                ALFAMART
              </span>
            </div>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="mt-8 border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <div>
            © {new Date().getFullYear()} Kumagemu. Seluruh hak cipta dilindungi undang-undang.
          </div>
          <div>
            Dibuat untuk komunitas gamer Indonesia dengan standar keamanan tinggi.
          </div>
        </div>
      </div>
    </footer>
  );
};
