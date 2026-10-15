import React, { useState } from 'react';
import { Order, Game, UserProfile } from '../types';
import { ReceiptText, Search, ExternalLink, Calendar, Gamepad2, UserCheck, ShieldCheck, LogIn } from 'lucide-react';
import { formatRupiah } from '../utils/validation';

interface CustomerHistoryViewProps {
  orders: Order[];
  customerOrders?: Order[];
  games: Game[];
  customerPhone: string;
  currentUser?: UserProfile | null;
  onOpenAuth?: () => void;
  onSetCustomerPhone: (phone: string) => void;
  onSelectOrder: (order: Order) => void;
  onSelectGame: (game: Game) => void;
}

export const CustomerHistoryView: React.FC<CustomerHistoryViewProps> = ({
  orders,
  customerOrders = [],
  games,
  customerPhone,
  currentUser,
  onOpenAuth,
  onSetCustomerPhone,
  onSelectOrder,
  onSelectGame,
}) => {
  const [phoneInput, setPhoneInput] = useState(customerPhone || '');
  const [activeFilterPhone, setActiveFilterPhone] = useState(customerPhone || '');

  // If user is authenticated, use their verified orders from server
  const activeOrders = currentUser ? customerOrders : orders;

  const filteredOrders = activeOrders.filter((o) => {
    if (currentUser) return true; // Already filtered server-side
    if (!activeFilterPhone.trim()) return true;
    const cleanFilter = activeFilterPhone.replace(/\D/g, '');
    const cleanCust = o.customerContact.whatsapp.replace(/\D/g, '');
    return cleanCust.includes(cleanFilter) || cleanFilter.includes(cleanCust);
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveFilterPhone(phoneInput.trim());
    onSetCustomerPhone(phoneInput.trim());
  };

  return (
    <div className="py-10 md:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto space-y-3 mb-8">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-400">
            <ReceiptText className="h-4 w-4" />
            <span>TRANSAKSI PELANGGAN</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Riwayat Pembelian</h1>
          <p className="text-sm text-slate-400">
            Pantau status pesanan dan rincian transaksi top up game resmi Kumagemu Anda.
          </p>
        </div>

        {/* Auth status banner */}
        {currentUser ? (
          <div className="mb-8 rounded-2xl border border-emerald-800/60 bg-emerald-950/20 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-200">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600/30 text-emerald-400 border border-emerald-500/40">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Akun Terverifikasi: {currentUser.fullName}</p>
                <p className="text-[11px] text-slate-400">{currentUser.email} • {currentUser.phone || 'Nomor HP belum diisi'}</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
              Riwayat Terenkripsi
            </span>
          </div>
        ) : (
          <div className="mb-8 rounded-2xl border border-cyan-800/60 bg-cyan-950/20 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-200">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-600/30 text-cyan-400 border border-cyan-500/40">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Ingin Riwayat Transaksi Tersimpan Otomatis?</p>
                <p className="text-xs text-slate-400">
                  Masuk atau buat akun pelanggan Kumagemu gratis agar seluruh pesanan Anda dapat diakses kapan saja dengan aman.
                </p>
              </div>
            </div>
            {onOpenAuth && (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition-all shadow-md shadow-violet-950/50 whitespace-nowrap cursor-pointer"
              >
                <LogIn className="h-4 w-4" />
                <span>Masuk / Daftar Akun</span>
              </button>
            )}
          </div>
        )}

        {/* Filter Input (For guests searching by phone) */}
        {!currentUser && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 mb-8 shadow-lg">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="Masukkan Nomor WhatsApp saat checkout (contoh: 081234567890)"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition-all cursor-pointer shadow-md shadow-violet-950/40 whitespace-nowrap"
              >
                Cari Riwayat
              </button>
              {activeFilterPhone && (
                <button
                  type="button"
                  onClick={() => {
                    setPhoneInput('');
                    setActiveFilterPhone('');
                    onSetCustomerPhone('');
                  }}
                  className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all cursor-pointer whitespace-nowrap"
                >
                  Tampilkan Semua
                </button>
              )}
            </form>
          </div>
        )}

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
            <Gamepad2 className="mx-auto h-12 w-12 text-slate-600 mb-3" />
            <h3 className="text-base font-semibold text-white">Belum ada riwayat transaksi</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
              {currentUser
                ? 'Belum ada transaksi pada akun Anda. Pilih game favorit dan lakukan top up sekarang!'
                : activeFilterPhone
                ? `Tidak ditemukan pesanan dengan nomor WhatsApp "${activeFilterPhone}".`
                : 'Lakukan top up pertama Anda sekarang untuk menikmati bonus dan promo menarik!'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const matchedGame = games.find((g) => g.id === order.gameId);
              return (
                <div
                  key={order.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 shrink-0 rounded-xl bg-slate-950 border border-violet-500/30 overflow-hidden">
                      {matchedGame?.logoUrl ? (
                        <img
                          src={matchedGame.logoUrl}
                          alt={order.gameTitle}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-violet-400 font-bold">
                          KG
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-bold text-white">{order.gameTitle}</h2>
                        <span className="text-xs text-slate-500 font-mono">({order.publicReference})</span>
                      </div>
                      <div className="text-xs font-semibold text-cyan-400 mt-0.5">
                        {order.productName} ({order.denomination})
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {new Date(order.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{order.paymentMethod.name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 pt-3 md:pt-0 border-slate-800 gap-2">
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Total Transaksi</div>
                      <div className="font-mono text-base font-bold text-white">
                        {formatRupiah(order.totalAmount)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          order.orderStatus === 'SUCCESS'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : order.orderStatus === 'PENDING_PAYMENT'
                            ? 'bg-violet-950 text-violet-300 border border-violet-800'
                            : order.orderStatus === 'REFUNDED'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {order.orderStatus === 'SUCCESS'
                          ? 'Sukses'
                          : order.orderStatus === 'PENDING_PAYMENT'
                          ? 'Belum Bayar'
                          : order.orderStatus === 'REFUNDED'
                          ? 'Dikembalikan (Refunded)'
                          : order.orderStatus}
                      </span>

                      <button
                        onClick={() => onSelectOrder(order)}
                        className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span>Lihat Invoice</span>
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
