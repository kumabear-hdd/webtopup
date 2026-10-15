import React from 'react';
import { ShieldCheck, MessageCircle, RefreshCw, AlertCircle, HelpCircle } from 'lucide-react';

interface SupportPolicyModalProps {
  onClose: () => void;
}

export const SupportPolicyModal: React.FC<SupportPolicyModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl my-8 overflow-hidden text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Bantuan & Kebijakan Garansi</h2>
              <p className="text-xs text-slate-400">Jaminan Layanan Resmi Kumagemu</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs text-slate-300 leading-relaxed">
          {/* Important Security Notice */}
          <div className="p-4 rounded-xl bg-violet-950/40 border border-violet-800/80 text-violet-200 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-violet-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-white text-sm">Prinsip Keamanan Akun 100%</h4>
              <p className="mt-1 text-slate-300">
                Kumagemu <strong>TIDAK PERNAH</strong> meminta kata sandi, password, kode OTP, atau verifikasi login akun game Anda. Semua proses top up menggunakan jalur resmi API ID Publisher.
              </p>
            </div>
          </div>

          {/* SLA */}
          <div className="space-y-2">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-cyan-400" />
              <span>Kecepatan Pengiriman (SLA)</span>
            </h3>
            <p>
              99% pesanan selesai otomatis dalam rentang <strong>1 hingga 30 detik</strong> setelah pembayaran terverifikasi oleh payment gateway. Jika terjadi maintenance server game atau gangguan jaringan operator, proses maksimal memakan waktu 1x24 jam.
            </p>
          </div>

          {/* Refund Policy */}
          <div className="space-y-2">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Kebijakan Pengembalian Dana (Refund Policy)</span>
            </h3>
            <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
              <li>
                <strong>Kegagalan Sistem / Stok Kosong:</strong> Jika pembayaran telah terdebit namun supplier gagal melakukan fulfillment dalam 15 menit, Anda berhak mendapatkan pengembalian saldo 100%.
              </li>
              <li>
                <strong>Kesalahan Input Pengguna:</strong> Pastikan Anda menggunakan fitur <em>Periksa Akun</em> sebelum membayar. Kesalahan penulisan ID akun game yang valid milik orang lain yang sudah terlanjur sukses dikirim oleh server game tidak dapat ditarik kembali.
              </li>
              <li>
                <strong>Pembayaran Ganda:</strong> Apabila saldo terpotong dua kali untuk satu kode referensi pesanan yang sama, sistem kami secara otomatis mendeteksi dan mengembalikan kelebihan bayar.
              </li>
            </ul>
          </div>

          {/* Contact Support */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-white text-sm">Customer Support 24/7</h4>
              <p className="text-slate-400 mt-0.5">Tim Kumagemu siap mendampingi kendala Anda setiap saat.</p>
            </div>
            <a
              href="https://wa.me/6281234567890?text=Halo%20Admin%20Kumagemu,%20saya%20memerlukan%20bantuan%20transaksi."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950/40 whitespace-nowrap cursor-pointer transition-all"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Hubungi WhatsApp CS</span>
            </a>
          </div>
        </div>

        <div className="border-t border-slate-800 bg-slate-950/80 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white cursor-pointer"
          >
            Mengerti & Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
