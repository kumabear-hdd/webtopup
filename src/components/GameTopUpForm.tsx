import React, { useState, useMemo } from 'react';
import { Game, Product, PaymentMethod } from '../types';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  QrCode,
  Smartphone,
  Wallet,
  Building2,
  Building,
  Store,
  CreditCard,
} from 'lucide-react';
import { formatRupiah } from '../utils/validation';

interface GameTopUpFormProps {
  game: Game;
  products: Product[];
  paymentMethods: PaymentMethod[];
  onBack: () => void;
  onSubmitOrder: (payload: {
    gameId: string;
    productId: string;
    paymentMethodId: string;
    targetAccount: Record<string, string>;
    accountNickname?: string;
    customerContact: { whatsapp: string; email?: string };
  }) => Promise<void>;
  onCheckAccount: (
    gameId: string,
    targetAccount: Record<string, string>
  ) => Promise<{ isValid: boolean; nickname?: string; message?: string }>;
  calculatePricing: (
    productId: string,
    paymentMethodId: string
  ) => { subtotal: number; paymentFee: number; totalAmount: number } | null;
}

const getPaymentIcon = (iconName: string) => {
  switch (iconName) {
    case 'QrCode':
      return <QrCode className="h-5 w-5" />;
    case 'Smartphone':
      return <Smartphone className="h-5 w-5" />;
    case 'Wallet':
      return <Wallet className="h-5 w-5" />;
    case 'Building2':
      return <Building2 className="h-5 w-5" />;
    case 'Building':
      return <Building className="h-5 w-5" />;
    case 'Store':
      return <Store className="h-5 w-5" />;
    default:
      return <CreditCard className="h-5 w-5" />;
  }
};

export const GameTopUpForm: React.FC<GameTopUpFormProps> = ({
  game,
  products,
  paymentMethods,
  onBack,
  onSubmitOrder,
  onCheckAccount,
  calculatePricing,
}) => {
  // Step 1: Target account fields
  const [targetAccount, setTargetAccount] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    game.inputFields.forEach((f) => {
      if (f.type === 'select' && f.options && f.options.length > 0) {
        initial[f.id] = f.options[0].value;
      } else {
        initial[f.id] = '';
      }
    });
    return initial;
  });

  const [isCheckingAccount, setIsCheckingAccount] = useState(false);
  const [accountNickname, setAccountNickname] = useState<string | null>(null);
  const [accountCheckError, setAccountCheckError] = useState<string | null>(null);

  // Step 2: Product selection
  const gameProducts = useMemo(() => {
    return products.filter((p) => p.gameId === game.id && p.isAvailable);
  }, [products, game.id]);

  const [selectedProductId, setSelectedProductId] = useState<string>(() => {
    return gameProducts.length > 0 ? gameProducts[0].id : '';
  });

  // Step 3: Payment method selection
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>(() => {
    return paymentMethods.length > 0 ? paymentMethods[0].id : '';
  });

  // Step 4: Contact
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pricing calculation
  const currentPricing = useMemo(() => {
    if (!selectedProductId || !selectedPaymentMethodId) return null;
    return calculatePricing(selectedProductId, selectedPaymentMethodId);
  }, [selectedProductId, selectedPaymentMethodId, calculatePricing]);

  const selectedProduct = gameProducts.find((p) => p.id === selectedProductId);
  const selectedPaymentMethod = paymentMethods.find((m) => m.id === selectedPaymentMethodId);

  // Handle Account verification check
  const handleVerifyAccount = async () => {
    // Validate that inputs are not empty
    for (const field of game.inputFields) {
      if (field.required && !targetAccount[field.id]?.trim()) {
        setAccountCheckError(`Mohon isi ${field.label} terlebih dahulu`);
        setAccountNickname(null);
        return;
      }
    }

    setIsCheckingAccount(true);
    setAccountCheckError(null);
    setAccountNickname(null);

    try {
      const result = await onCheckAccount(game.id, targetAccount);
      if (result.isValid && result.nickname) {
        setAccountNickname(result.nickname);
      } else {
        setAccountCheckError(result.message || 'Akun tidak ditemukan. Periksa kembali ID Anda.');
      }
    } catch {
      setAccountCheckError('Gagal memeriksa akun. Coba beberapa saat lagi.');
    } finally {
      setIsCheckingAccount(false);
    }
  };

  // Submit Order
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validate account fields
    for (const field of game.inputFields) {
      if (field.required && !targetAccount[field.id]?.trim()) {
        setFormError(`Harap isi ${field.label} Anda.`);
        return;
      }
    }

    if (!selectedProductId) {
      setFormError('Harap pilih nominal top up.');
      return;
    }

    if (!selectedPaymentMethodId) {
      setFormError('Harap pilih metode pembayaran.');
      return;
    }

    if (!whatsapp.trim()) {
      setFormError('Nomor WhatsApp wajib diisi untuk bukti transaksi.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitOrder({
        gameId: game.id,
        productId: selectedProductId,
        paymentMethodId: selectedPaymentMethodId,
        targetAccount,
        accountNickname: accountNickname || undefined,
        customerContact: {
          whatsapp: whatsapp.trim(),
          email: email.trim() || undefined,
        },
      });
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Terjadi kesalahan saat membuat pesanan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-8 md:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Back navigation */}
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Katalog Game</span>
        </button>

        {/* Top Game Hero Card */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 p-6 md:p-8 mb-8 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-violet-500/30 bg-slate-950 shadow-md">
              <img
                src={game.logoUrl}
                alt={game.title}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                {game.publisher}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{game.title}</h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                {game.instructions}
              </p>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Steps Column */}
          <div className="lg:col-span-8 space-y-8">
            {/* STEP 1: Akun Game */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4 mb-6">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600 text-white font-bold text-xs">
                  1
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Masukkan Data Akun</h2>
                  <p className="text-xs text-slate-400">Pastikan ID dan server sesuai dengan profil game Anda</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {game.inputFields.map((field) => (
                  <div key={field.id} className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span>{field.label} {field.required && <span className="text-rose-400">*</span>}</span>
                      {field.helperText && (
                        <span className="text-[11px] text-slate-400">{field.helperText}</span>
                      )}
                    </label>

                    {field.type === 'select' ? (
                      <select
                        value={targetAccount[field.id] || ''}
                        onChange={(e) => {
                          setTargetAccount({ ...targetAccount, [field.id]: e.target.value });
                          setAccountNickname(null);
                        }}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
                      >
                        {field.options?.map((opt) => (
                          <option key={opt.value} value={opt.value} className="bg-slate-900">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        value={targetAccount[field.id] || ''}
                        onChange={(e) => {
                          setTargetAccount({ ...targetAccount, [field.id]: e.target.value });
                          setAccountNickname(null);
                        }}
                        placeholder={field.placeholder}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Account verification button */}
              {game.accountCheckSupported && (
                <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleVerifyAccount}
                    disabled={isCheckingAccount}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 border border-slate-700 hover:border-violet-500/60 text-slate-200 hover:text-white transition-all cursor-pointer disabled:opacity-60"
                  >
                    {isCheckingAccount ? 'Memeriksa ke server game...' : 'Periksa Akun / Validasi ID'}
                  </button>

                  {accountNickname && (
                    <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-3 py-1.5 rounded-lg">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>Nickname: <strong className="font-semibold text-white">{accountNickname}</strong></span>
                    </div>
                  )}

                  {accountCheckError && (
                    <div className="flex items-center gap-2 text-xs font-medium text-rose-400 bg-rose-950/40 border border-rose-800/60 px-3 py-1.5 rounded-lg">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{accountCheckError}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* STEP 2: Pilih Nominal Top Up */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4 mb-6">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600 text-white font-bold text-xs">
                  2
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Pilih Nominal Top Up</h2>
                  <p className="text-xs text-slate-400">Pilih paket atau item yang ingin Anda beli</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {gameProducts.map((product) => {
                  const isSelected = selectedProductId === product.id;
                  return (
                    <div
                      key={product.id}
                      onClick={() => setSelectedProductId(product.id)}
                      className={`relative flex flex-col justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-violet-500 bg-violet-950/30 shadow-md shadow-violet-900/20'
                          : 'border-slate-800 bg-slate-950 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      {product.badge && (
                        <div className="absolute -top-2 right-2">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
                            {product.badge}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="text-xs font-semibold text-slate-200 line-clamp-2">
                          {product.name}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {product.denomination}
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-800/70 flex items-center justify-between">
                        <span className="text-xs font-bold text-cyan-400 font-mono tabular-nums">
                          {formatRupiah(product.sellingPrice)}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="h-4 w-4 text-violet-400 shrink-0" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* STEP 3: Pilih Metode Pembayaran */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4 mb-6">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600 text-white font-bold text-xs">
                  3
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Pilih Metode Pembayaran</h2>
                  <p className="text-xs text-slate-400">Biaya admin terhitung transparan tanpa biaya tersembunyi</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {paymentMethods.map((method) => {
                  const isSelected = selectedPaymentMethodId === method.id;
                  const feeInfo =
                    method.feeFlat > 0
                      ? `+${formatRupiah(method.feeFlat)}`
                      : method.feePercentage > 0
                      ? `+${(method.feePercentage * 100).toFixed(1)}%`
                      : 'Bebas Biaya';

                  return (
                    <div
                      key={method.id}
                      onClick={() => setSelectedPaymentMethodId(method.id)}
                      className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-violet-500 bg-violet-950/30 shadow-md shadow-violet-900/20'
                          : 'border-slate-800 bg-slate-950 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-300'}`}>
                          {getPaymentIcon(method.icon)}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">{method.name}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span>{method.processingTime}</span>
                            <span aria-hidden="true">·</span>
                            <span className="text-cyan-400 font-mono">{feeInfo}</span>
                          </div>
                        </div>
                      </div>

                      {isSelected ? (
                        <CheckCircle2 className="h-5 w-5 text-violet-400 shrink-0" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border border-slate-700" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* STEP 4: Kontak Pembeli */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4 mb-6">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600 text-white font-bold text-xs">
                  4
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Kontak & Bukti Pembelian</h2>
                  <p className="text-xs text-slate-400">Bukti pembayaran dan status serial number akan dikirimkan</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Nomor WhatsApp <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400">Nomor aktif untuk pelacakan transaksi & invoice</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Email <span className="text-slate-400 font-normal">(Opsional)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email.kamu@gmail.com"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400">Salinan invoice transaksi dikirim via email</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Purchase Summary Column (Right) */}
          <div className="lg:col-span-4 sticky top-20">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-5">
              <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
                Ringkasan Transaksi
              </h3>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400">Game</span>
                  <span className="font-semibold text-white">{game.title}</span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400">Item Produk</span>
                  <span className="font-semibold text-white">
                    {selectedProduct ? selectedProduct.name : '-'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400">Metode Bayar</span>
                  <span className="font-semibold text-white">
                    {selectedPaymentMethod ? selectedPaymentMethod.name : '-'}
                  </span>
                </div>

                {accountNickname && (
                  <div className="flex justify-between items-center py-1 bg-violet-950/20 px-2 rounded">
                    <span className="text-violet-300">IGN Terverifikasi</span>
                    <span className="font-bold text-white">{accountNickname}</span>
                  </div>
                )}

                <div className="border-t border-slate-800 pt-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Harga Item</span>
                    <span className="font-mono tabular-nums text-slate-200">
                      {currentPricing ? formatRupiah(currentPricing.subtotal) : 'Rp 0'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Biaya Transaksi</span>
                    <span className="font-mono tabular-nums text-slate-200">
                      {currentPricing ? formatRupiah(currentPricing.paymentFee) : 'Rp 0'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm font-bold pt-2 border-t border-slate-800 text-white">
                    <span>Total Pembayaran</span>
                    <span className="text-base text-cyan-400 font-mono tabular-nums">
                      {currentPricing ? formatRupiah(currentPricing.totalAmount) : 'Rp 0'}
                    </span>
                  </div>
                </div>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !selectedProductId || !selectedPaymentMethodId}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-violet-900/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Memproses Pesanan...' : 'Beli Sekarang'}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 text-center">
                <HelpCircle className="h-3.5 w-3.5" />
                <span>Transaksi dijamin 100% aman dan bergaransi</span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
