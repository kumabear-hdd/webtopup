import React, { useState, useEffect } from 'react';
import { Order } from '../types';
import {
  CheckCircle2,
  Clock,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
  MessageCircle,
  Printer,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { formatRupiah } from '../utils/validation';

interface OrderInvoiceModalProps {
  order: Order;
  onClose: () => void;
  onSimulatePay: (publicRef: string) => Promise<{ success: boolean; message?: string }>;
}

export const OrderInvoiceModal: React.FC<OrderInvoiceModalProps> = ({
  order,
  onClose,
  onSimulatePay,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationMessage, setSimulationMessage] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 mins

  // Countdown timer for pending payments
  useEffect(() => {
    if (order.orderStatus !== 'PENDING_PAYMENT') return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [order.orderStatus]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulatePayment = async () => {
    setIsSimulating(true);
    setSimulationMessage(null);
    try {
      const res = await onSimulatePay(order.publicReference);
      setSimulationMessage(res.message || 'Pembayaran berhasil dikonfirmasi!');
    } catch {
      setSimulationMessage('Gagal memproses simulasi pembayaran');
    } finally {
      setIsSimulating(false);
    }
  };

  // State Stepper indicators
  const getStepStatus = (step: number) => {
    switch (order.orderStatus) {
      case 'PENDING_PAYMENT':
        return step === 1 ? 'current' : 'upcoming';
      case 'PAYMENT_CONFIRMED':
        return step <= 2 ? 'completed' : 'upcoming';
      case 'SUPPLIER_PROCESSING':
        return step <= 2 ? 'completed' : step === 3 ? 'current' : 'upcoming';
      case 'SUCCESS':
        return 'completed';
      case 'FAILED':
      case 'REFUNDED':
        return step <= 2 ? 'completed' : 'failed';
      default:
        return 'upcoming';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl my-8 overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/70 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Invoice & Status Pesanan</h2>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 font-mono">
                <span>Ref: {order.publicReference}</span>
                <button
                  onClick={() => copyToClipboard(order.publicReference)}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Salin Referensi"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* State Machine Progress Stepper */}
        <div className="px-6 py-5 bg-slate-950/40 border-b border-slate-800">
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            {/* Step 1 */}
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-xs mb-1.5 transition-colors ${
                  getStepStatus(1) === 'completed'
                    ? 'bg-emerald-600 text-white'
                    : getStepStatus(1) === 'current'
                    ? 'bg-violet-600 text-white ring-4 ring-violet-600/20'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {getStepStatus(1) === 'completed' ? <Check className="h-4 w-4" /> : '1'}
              </div>
              <span className="font-semibold text-slate-200">Menunggu Bayar</span>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-xs mb-1.5 transition-colors ${
                  getStepStatus(2) === 'completed'
                    ? 'bg-emerald-600 text-white'
                    : getStepStatus(2) === 'current'
                    ? 'bg-violet-600 text-white ring-4 ring-violet-600/20'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {getStepStatus(2) === 'completed' ? <Check className="h-4 w-4" /> : '2'}
              </div>
              <span className="font-semibold text-slate-200">Verifikasi Bayar</span>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-xs mb-1.5 transition-colors ${
                  getStepStatus(3) === 'completed'
                    ? 'bg-emerald-600 text-white'
                    : getStepStatus(3) === 'current'
                    ? 'bg-amber-600 text-white animate-pulse'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {getStepStatus(3) === 'completed' ? <Check className="h-4 w-4" /> : '3'}
              </div>
              <span className="font-semibold text-slate-200">Kirim Produk</span>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-xs mb-1.5 transition-colors ${
                  order.orderStatus === 'SUCCESS'
                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-600/20'
                    : order.orderStatus === 'FAILED'
                    ? 'bg-rose-600 text-white'
                    : order.orderStatus === 'REFUNDED'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {order.orderStatus === 'SUCCESS' ? (
                  <Check className="h-4 w-4" />
                ) : order.orderStatus === 'FAILED' ? (
                  '!'
                ) : (
                  '4'
                )}
              </div>
              <span className="font-semibold text-slate-200">
                {order.orderStatus === 'SUCCESS'
                  ? 'Selesai'
                  : order.orderStatus === 'FAILED'
                  ? 'Gagal'
                  : order.orderStatus === 'REFUNDED'
                  ? 'Refund'
                  : 'Selesai'}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Status Alert Banner */}
          {order.orderStatus === 'SUCCESS' && (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-200 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-white">Pesanan Berhasil Diselesaikan!</h4>
                <p className="text-xs text-emerald-300 mt-1">
                  Item telah berhasil dikirimkan ke akun game Anda. Terima kasih telah mempercayai Kumagemu!
                </p>
                {order.supplierSerialNumber && (
                  <div className="mt-2 text-xs font-mono bg-emerald-900/40 p-2 rounded border border-emerald-800">
                    Serial Number / SN: <strong>{order.supplierSerialNumber}</strong>
                  </div>
                )}
              </div>
            </div>
          )}

          {order.orderStatus === 'PENDING_PAYMENT' && (
            <div className="p-4 rounded-xl bg-violet-950/40 border border-violet-800/80 text-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-violet-300">
                  <Clock className="h-4 w-4 text-cyan-400 animate-pulse" />
                  <span>Selesaikan Pembayaran Dalam:</span>
                </div>
                <div className="font-mono text-base font-bold text-white bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
                  {timeFormatted}
                </div>
              </div>

              {/* Dynamic QRIS or VA Presentation */}
              {order.paymentMethod.category === 'qris' ? (
                <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl text-slate-950 my-3">
                  <div className="text-xs font-bold tracking-wider mb-2 text-slate-700">
                    QRIS RESMI KUMAGEMU
                  </div>
                  {/* QR Presentation */}
                  <div className="relative p-2 bg-white rounded-lg border-2 border-slate-900">
                    <svg className="w-48 h-48" viewBox="0 0 100 100">
                      {/* Stylized high contrast QR code pattern */}
                      <rect width="100" height="100" fill="white" />
                      <path
                        d="M10 10h25v25h-25zM15 15h15v15h-15zM65 10h25v25h-25zM70 15h15v15h-15zM10 65h25v25h-25zM15 70h15v15h-15zM45 10h10v10h-10zM40 30h20v10h-20zM10 45h10v20h-10zM45 45h10v10h-10zM60 45h15v10h-15zM80 45h10v25h-10zM35 60h25v10h-25zM45 75h10v15h-10zM65 65h10v10h-10zM75 80h15v10h-15zM25 40h10v10h-10z"
                        fill="#0A0E1A"
                      />
                      <rect x="42" y="42" width="16" height="16" rx="3" fill="#8B5CF6" />
                      <circle cx="50" cy="50" r="4" fill="white" />
                    </svg>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-2 text-center font-medium">
                    Scan menggunakan GoPay, OVO, DANA, BCA, ShopeePay, atau m-Banking Anda
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 my-3">
                  <div className="text-xs text-slate-400">Nomor Virtual Account / Kode Bayar:</div>
                  <div className="flex items-center justify-between bg-slate-900 p-3 rounded-lg border border-slate-700">
                    <span className="font-mono text-base font-bold text-cyan-400">
                      {order.paymentMethod.accountNumber || '807779899123456'}
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(order.paymentMethod.accountNumber || '807779899123456')
                      }
                      className="px-3 py-1 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded cursor-pointer"
                    >
                      {copied ? 'Tersalin' : 'Salin'}
                    </button>
                  </div>
                </div>
              )}

              {/* Sandbox Instant Simulation Button (Development Sandbox Only) */}
              {order.isTestOrder && (
                <div className="mt-4 pt-3 border-t border-slate-800/80 rounded-xl bg-slate-950/60 p-3.5 border border-cyan-800/30">
                  <div className="flex items-center justify-between text-[11px] font-bold text-cyan-400 mb-2">
                    <span>🛠️ Uji Coba Sandbox Mode</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                      Non-Produksi
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSimulatePayment}
                    disabled={isSimulating}
                    className="w-full py-2.5 px-4 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/50 text-cyan-100 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
                    <span>
                      {isSimulating
                        ? 'Memverifikasi Webhook & Pengiriman Supplier...'
                        : '⚡ Simulasi Webhook Bayar Sukses'}
                    </span>
                  </button>
                  <p className="text-[10px] text-slate-400 text-center mt-1.5">
                    Hanya aktif pada pesanan uji coba untuk memverifikasi lifecycle pesanan tanpa transaksi riil.
                  </p>
                  {simulationMessage && (
                    <p className="text-xs text-emerald-400 text-center mt-2 font-medium">
                      {simulationMessage}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Transaction Summary Details */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3 text-xs">
            <h5 className="font-bold text-white border-b border-slate-800 pb-2">Rincian Pesanan</h5>

            <div className="grid grid-cols-2 gap-2">
              <span className="text-slate-400">Game:</span>
              <span className="font-semibold text-white text-right">{order.gameTitle}</span>

              <span className="text-slate-400">Item Produk:</span>
              <span className="font-semibold text-white text-right">{order.productName}</span>

              <span className="text-slate-400">Data Akun:</span>
              <span className="font-semibold text-white text-right font-mono">
                {Object.entries(order.targetAccount)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(' | ')}
              </span>

              {order.accountNickname && (
                <>
                  <span className="text-slate-400">In-Game Nickname:</span>
                  <span className="font-bold text-cyan-400 text-right">{order.accountNickname}</span>
                </>
              )}

              <span className="text-slate-400">Metode Bayar:</span>
              <span className="font-semibold text-white text-right">{order.paymentMethod.name}</span>

              <span className="text-slate-400">Nomor WhatsApp:</span>
              <span className="font-semibold text-white text-right font-mono">
                {order.customerContact.whatsapp}
              </span>

              <span className="text-slate-400">Waktu Transaksi:</span>
              <span className="font-semibold text-white text-right">
                {new Date(order.createdAt).toLocaleString('id-ID')}
              </span>
            </div>

            <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-sm font-bold">
              <span className="text-white">Total Tagihan</span>
              <span className="text-cyan-400 font-mono tabular-nums">
                {formatRupiah(order.totalAmount)}
              </span>
            </div>
          </div>

          {/* Instructions Accordion */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-xs space-y-2">
            <div className="font-bold text-slate-300">Petunjuk Pembayaran:</div>
            <ol className="list-decimal list-inside space-y-1 text-slate-400">
              {order.paymentMethod.instructions.map((inst, idx) => (
                <li key={idx}>{inst}</li>
              ))}
            </ol>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 bg-slate-950/80 px-6 py-4">
          <a
            href={`https://wa.me/6281234567890?text=Halo%20Kumagemu,%20saya%20ingin%20menanyakan%20status%20pesanan%20dengan%20ref:%20${order.publicReference}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Butuh Bantuan? Hubungi CS WhatsApp</span>
          </a>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Cetak Bukti</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
