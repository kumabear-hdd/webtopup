import React, { useState } from 'react';
import { Order } from '../types';
import { Search, CheckCircle2, Clock, AlertTriangle, ArrowRight, ExternalLink } from 'lucide-react';
import { formatRupiah } from '../utils/validation';

interface OrderLookupViewProps {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
}

export const OrderLookupView: React.FC<OrderLookupViewProps> = ({
  orders,
  onSelectOrder,
}) => {
  const [searchRef, setSearchRef] = useState('');
  const [searched, setSearched] = useState(false);

  const matchedOrder = orders.find(
    (o) => o.publicReference.trim().toUpperCase() === searchRef.trim().toUpperCase()
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
  };

  const setSampleRef = (ref: string) => {
    setSearchRef(ref);
    setSearched(true);
  };

  return (
    <div className="py-10 md:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto space-y-3 mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Lacak Status Pesanan</h1>
          <p className="text-sm text-slate-400">
            Masukkan nomor referensi transaksi publik Anda (contoh: <span className="font-mono text-cyan-400">KG-20261014-9841</span>) untuk melihat progres top up.
          </p>
        </div>

        {/* Search Input Box */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                <Search className="h-5 w-5" />
              </div>
              <input
                type="text"
                value={searchRef}
                onChange={(e) => setSearchRef(e.target.value)}
                placeholder="Masukkan Nomor Referensi (KG-XXXXXXXX-XXXX)"
                className="w-full rounded-xl border border-slate-700 bg-slate-900/90 py-3.5 pl-11 pr-4 text-sm text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition-all cursor-pointer shadow-lg shadow-violet-950/40"
            >
              Cari
            </button>
          </div>
        </form>

        {/* Quick sample chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400 mb-8">
          <span>Contoh pesanan demo:</span>
          {orders.slice(0, 2).map((o) => (
            <button
              key={o.id}
              onClick={() => setSampleRef(o.publicReference)}
              className="font-mono bg-slate-800 hover:bg-slate-700 text-violet-300 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
            >
              {o.publicReference}
            </button>
          ))}
        </div>

        {/* Result presentation */}
        {searched && (
          <div>
            {matchedOrder ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-xs font-mono text-slate-400">Nomor Referensi</span>
                    <h2 className="text-lg font-bold text-white font-mono">{matchedOrder.publicReference}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Waktu dibuat: {new Date(matchedOrder.createdAt).toLocaleString('id-ID')}
                    </p>
                  </div>

                  <div>
                    {matchedOrder.orderStatus === 'SUCCESS' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 border border-emerald-800 text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Top Up Sukses</span>
                      </span>
                    ) : matchedOrder.orderStatus === 'PENDING_PAYMENT' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-violet-950 border border-violet-800 text-violet-300">
                        <Clock className="h-3.5 w-3.5 animate-pulse" />
                        <span>Menunggu Pembayaran</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-950 border border-amber-800 text-amber-300">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>{matchedOrder.orderStatus}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                    <span className="text-slate-400">Game & Produk:</span>
                    <div className="font-bold text-white text-sm">{matchedOrder.gameTitle}</div>
                    <div className="text-cyan-400 font-semibold">{matchedOrder.productName}</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                    <span className="text-slate-400">Target Akun:</span>
                    <div className="font-mono font-semibold text-white">
                      {Object.entries(matchedOrder.targetAccount)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(' | ')}
                    </div>
                    {matchedOrder.accountNickname && (
                      <div className="text-emerald-400 font-medium">IGN: {matchedOrder.accountNickname}</div>
                    )}
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                    <span className="text-slate-400">Metode Pembayaran:</span>
                    <div className="font-bold text-white">{matchedOrder.paymentMethod.name}</div>
                    <div className="text-slate-400">Status Bayar: {matchedOrder.paymentStatus}</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                    <span className="text-slate-400">Total Transaksi:</span>
                    <div className="font-mono text-base font-bold text-cyan-400">
                      {formatRupiah(matchedOrder.totalAmount)}
                    </div>
                    <div className="text-slate-400">No. WhatsApp: {matchedOrder.customerContact.whatsapp}</div>
                  </div>
                </div>

                {matchedOrder.supplierSerialNumber && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-emerald-800/80 text-xs">
                    <span className="text-slate-400">Bukti Pengiriman Serial Number / SN:</span>
                    <div className="font-mono text-sm font-bold text-emerald-400 mt-1">
                      {matchedOrder.supplierSerialNumber}
                    </div>
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => onSelectOrder(matchedOrder)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition-all cursor-pointer"
                  >
                    <span>Buka Detail & Invoice Lengkap</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-8 text-center text-slate-400">
                <AlertTriangle className="h-10 w-10 text-amber-500/80 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-white">Pesanan Tidak Ditemukan</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Nomor referensi &quot;{searchRef}&quot; belum terdaftar. Pastikan nomor yang dimasukkan sudah benar.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
