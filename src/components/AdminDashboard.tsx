import React, { useState } from 'react';
import { Game, Product, Order, AuditLog, RevenueReport } from '../types';
import {
  ShieldAlert,
  Lock,
  LogOut,
  TrendingUp,
  DollarSign,
  PackageCheck,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  RotateCcw,
  AlertTriangle,
  Play,
  Activity,
  Layers,
  Settings,
  Database,
  ExternalLink,
} from 'lucide-react';
import { formatRupiah } from '../utils/validation';
import { runAutomatedTests } from '../services/__tests__/topup.test';

interface AdminDashboardProps {
  isAdminLoggedIn: boolean;
  onLogin: (email: string, pass: string) => Promise<{ success: boolean; message: string }>;
  onLogout: () => void;
  games: Game[];
  products: Product[];
  orders: Order[];
  auditLogs: AuditLog[];
  revenueReport: RevenueReport;
  onUpdateProduct: (productId: string, updates: Partial<Product>) => void;
  onUpdateGame: (gameId: string, updates: Partial<Game>) => void;
  onRetryFulfillment: (orderId: string) => Promise<void>;
  onRefundOrder: (orderId: string, reason: string) => void;
  onSyncCatalog: () => void;
  supplierMode: 'mock' | 'digiflazz';
  paymentGatewayMode: 'mock' | 'midtrans';
  onToggleSupplier: (mode: 'mock' | 'digiflazz') => Promise<{ success: boolean; message: string }> | void;
  onTogglePayment: (mode: 'mock' | 'midtrans') => Promise<{ success: boolean; message: string }> | void;
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isAdminLoggedIn,
  onLogin,
  onLogout,
  games,
  products,
  orders,
  auditLogs,
  revenueReport,
  onUpdateProduct,
  onUpdateGame,
  onRetryFulfillment,
  onRefundOrder,
  onSyncCatalog,
  supplierMode,
  paymentGatewayMode,
  onToggleSupplier,
  onTogglePayment,
  onClose,
}) => {
  const [adminEmail, setAdminEmail] = useState('hanifdaffa1207@gmail.com');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginErrorText, setLoginErrorText] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'games' | 'integrations' | 'audit' | 'tests'>('orders');

  // Order filters
  const [orderSearch, setOrderSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

  // Product price edit modal state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editBaseCost, setEditBaseCost] = useState<number>(0);
  const [editSellingPrice, setEditSellingPrice] = useState<number>(0);

  // Test runner results
  const [testResults, setTestResults] = useState<{ name: string; passed: boolean; message?: string }[] | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);

  // Integration notice state
  const [integrationNotice, setIntegrationNotice] = useState<{ text: string; isError: boolean } | null>(null);

  const handleToggleSupplier = async (mode: 'mock' | 'digiflazz') => {
    const res = await onToggleSupplier(mode);
    if (res) {
      setIntegrationNotice({ text: res.message, isError: !res.success });
    }
  };

  const handleTogglePayment = async (mode: 'mock' | 'midtrans') => {
    const res = await onTogglePayment(mode);
    if (res) {
      setIntegrationNotice({ text: res.message, isError: !res.success });
    }
  };

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErrorText('');
    setIsLoggingIn(true);
    try {
      const res = await onLogin(adminEmail, adminPassword);
      if (!res.success) {
        setLoginErrorText(res.message || 'Login administrator gagal.');
      } else {
        setAdminPassword('');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Run automated test suite
  const handleRunTests = async () => {
    setIsRunningTests(true);
    try {
      const results = await runAutomatedTests();
      setTestResults(results);
    } catch {
      // test execution error handled
    } finally {
      setIsRunningTests(false);
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.publicReference.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerContact.whatsapp.includes(orderSearch) ||
      o.gameTitle.toLowerCase().includes(orderSearch.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || o.orderStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // If not logged in, show secure login prompt
  if (!isAdminLoggedIn) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl text-slate-100">
          <div className="flex flex-col items-center text-center space-y-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
              <Lock className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-white">Administrator Portal</h2>
            <p className="text-xs text-slate-400">
              Akses khusus administrator Kumagemu yang terverifikasi server.
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300">Email Administrator</label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => {
                  setAdminEmail(e.target.value);
                  setLoginErrorText('');
                }}
                placeholder="hanifdaffa1207@gmail.com"
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Email resmi terdaftar: <span className="text-violet-400 font-mono">hanifdaffa1207@gmail.com</span>
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Password Administrator</label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => {
                  setAdminPassword(e.target.value);
                  setLoginErrorText('');
                }}
                placeholder="Masukkan password admin"
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
                autoFocus
              />
            </div>

            {loginErrorText && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
                {loginErrorText}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isLoggingIn}
                className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white text-xs font-bold transition-all shadow-md shadow-violet-950/50 cursor-pointer"
              >
                {isLoggingIn ? 'Memverifikasi...' : 'Masuk Administrator'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2 sm:p-4 overflow-y-auto backdrop-blur-sm">
      <div className="relative w-full max-w-6xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl my-4 overflow-hidden flex flex-col max-h-[92vh] text-slate-100">
        {/* Admin Top Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white font-bold">
              KG
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Kumagemu Admin Console</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Authenticated
                </span>
              </div>
              <p className="text-xs text-slate-400">Manajemen Transaksi, Katalog & Integrasi Provider</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 text-xs font-semibold text-rose-300 hover:bg-rose-950/40 hover:border-rose-800 transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Keluar</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 sm:p-6 bg-slate-950/40 border-b border-slate-800 shrink-0">
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Total Omset (Gross)</span>
              <DollarSign className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-lg font-bold text-white font-mono mt-1">
              {formatRupiah(revenueReport.totalRevenue)}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Estimasi Keuntungan</span>
              <TrendingUp className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="text-lg font-bold text-cyan-400 font-mono mt-1">
              {formatRupiah(revenueReport.totalProfit)}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Total Pesanan</span>
              <PackageCheck className="h-4 w-4 text-violet-400" />
            </div>
            <div className="text-lg font-bold text-white font-mono mt-1">
              {revenueReport.totalOrders} Transaksi
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Success Rate</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-lg font-bold text-emerald-400 font-mono mt-1">
              {revenueReport.successRate}%
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-6 gap-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'orders'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Daftar Pesanan ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'products'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Kelola Produk & Margin ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('games')}
            className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'games'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Kelola Game ({games.length})
          </button>
          <button
            onClick={() => setActiveTab('integrations')}
            className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'integrations'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Integrasi Provider (Supplier & Payment)
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'audit'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Audit Logs ({auditLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('tests')}
            className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'tests'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Automated Tests
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {/* Controls */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-80">
                  <Search className="h-4 w-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Cari Ref, WA, atau Game..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs text-slate-400">Filter Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="ALL">Semua Status</option>
                    <option value="PENDING_PAYMENT">Menunggu Bayar</option>
                    <option value="PAYMENT_CONFIRMED">Bayar Terkonfirmasi</option>
                    <option value="SUPPLIER_PROCESSING">Proses Supplier</option>
                    <option value="SUCCESS">Sukses</option>
                    <option value="FAILED">Gagal</option>
                    <option value="REFUNDED">Refund</option>
                  </select>
                </div>
              </div>

              {/* Orders Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-mono">
                    <tr>
                      <th className="py-3 px-4">Ref ID</th>
                      <th className="py-3 px-4">Game & Produk</th>
                      <th className="py-3 px-4">Akun Target</th>
                      <th className="py-3 px-4">Total & Fee</th>
                      <th className="py-3 px-4">Status Pesanan</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">
                          Tidak ada pesanan yang sesuai filter.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-900/60 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-white">
                            {ord.publicReference}
                            <div className="text-[10px] text-slate-500 font-sans">
                              {ord.customerContact.whatsapp}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-white">{ord.gameTitle}</div>
                            <div className="text-[11px] text-cyan-400">{ord.productName}</div>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px]">
                            {Object.entries(ord.targetAccount)
                              .map(([k, v]) => `${k}:${v}`)
                              .join(' ')}
                            {ord.accountNickname && (
                              <div className="text-emerald-400 font-sans text-[10px]">
                                {ord.accountNickname}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono tabular-nums">
                            <div className="font-bold text-white">{formatRupiah(ord.totalAmount)}</div>
                            <div className="text-[10px] text-slate-500">
                              Fee: {formatRupiah(ord.paymentFee)}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                ord.orderStatus === 'SUCCESS'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : ord.orderStatus === 'PENDING_PAYMENT'
                                  ? 'bg-violet-950 text-violet-300 border border-violet-800'
                                  : ord.orderStatus === 'REFUNDED'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                  : 'bg-rose-950 text-rose-300 border border-rose-800'
                              }`}
                            >
                              {ord.orderStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                            <button
                              onClick={() => setSelectedOrderDetails(ord)}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold cursor-pointer"
                            >
                              Detail
                            </button>
                            {ord.orderStatus === 'FAILED' && (
                              <button
                                onClick={() => onRetryFulfillment(ord.id)}
                                className="px-2.5 py-1 rounded bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-semibold cursor-pointer"
                                title="Kirim ulang ke supplier"
                              >
                                Retry
                              </button>
                            )}
                            {ord.paymentStatus === 'PAID' && ord.orderStatus !== 'REFUNDED' && (
                              <button
                                onClick={() => {
                                  const reason = prompt('Masukkan alasan refund:', 'Permintaan pembeli / kendala sistem');
                                  if (reason) onRefundOrder(ord.id, reason);
                                }}
                                className="px-2.5 py-1 rounded bg-amber-950 border border-amber-800 text-amber-300 hover:bg-amber-900 text-[11px] font-semibold cursor-pointer"
                              >
                                Refund
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Order Detail Modal Drawer */}
              {selectedOrderDetails && (
                <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4">
                  <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-2xl">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                      <h3 className="font-bold text-white text-base">
                        Detail Pesanan {selectedOrderDetails.publicReference}
                      </h3>
                      <button
                        onClick={() => setSelectedOrderDetails(null)}
                        className="text-slate-400 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400">Game:</span>
                        <div className="font-bold text-white">{selectedOrderDetails.gameTitle}</div>
                      </div>
                      <div>
                        <span className="text-slate-400">Produk:</span>
                        <div className="font-bold text-cyan-400">{selectedOrderDetails.productName}</div>
                      </div>
                      <div>
                        <span className="text-slate-400">Modal Supplier:</span>
                        <div className="font-mono text-white">{formatRupiah(selectedOrderDetails.baseCost)}</div>
                      </div>
                      <div>
                        <span className="text-slate-400">Total Tagihan:</span>
                        <div className="font-mono font-bold text-emerald-400">
                          {formatRupiah(selectedOrderDetails.totalAmount)}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400">Metode Bayar:</span>
                        <div className="text-white">{selectedOrderDetails.paymentMethod.name}</div>
                      </div>
                      <div>
                        <span className="text-slate-400">WhatsApp:</span>
                        <div className="font-mono text-white">{selectedOrderDetails.customerContact.whatsapp}</div>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400">Serial Number (SN) Supplier:</span>
                        <div className="font-mono bg-slate-950 p-2 rounded border border-slate-800 text-emerald-400 mt-1">
                          {selectedOrderDetails.supplierSerialNumber || 'Belum tersedia / dalam proses'}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => setSelectedOrderDetails(null)}
                        className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold"
                      >
                        Tutup
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PRODUCTS & MARGIN */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-xs text-slate-400">
                  Kelola modal supplier, harga jual konsumen, dan persentase keuntungan tiap SKU game.
                </p>
                <button
                  onClick={onSyncCatalog}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Sinkronisasi SKU Supplier</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-mono">
                    <tr>
                      <th className="py-3 px-4">Nama Produk & SKU</th>
                      <th className="py-3 px-4">Game</th>
                      <th className="py-3 px-4">Modal Supplier</th>
                      <th className="py-3 px-4">Harga Jual</th>
                      <th className="py-3 px-4">Margin Untung</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {products.map((p) => {
                      const matchedGame = games.find((g) => g.id === p.gameId);
                      const margin = p.sellingPrice - p.baseCost;
                      const marginPct = p.baseCost > 0 ? ((margin / p.baseCost) * 100).toFixed(1) : '0';

                      return (
                        <tr key={p.id} className="hover:bg-slate-900/60 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-white">{p.name}</div>
                            <div className="font-mono text-[10px] text-slate-400">{p.supplierSku}</div>
                          </td>
                          <td className="py-3 px-4 text-slate-300">{matchedGame?.title || p.gameId}</td>
                          <td className="py-3 px-4 font-mono tabular-nums text-slate-400">
                            {formatRupiah(p.baseCost)}
                          </td>
                          <td className="py-3 px-4 font-mono tabular-nums font-bold text-white">
                            {formatRupiah(p.sellingPrice)}
                          </td>
                          <td className="py-3 px-4 font-mono tabular-nums text-emerald-400 font-semibold">
                            +{formatRupiah(margin)} ({marginPct}%)
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => onUpdateProduct(p.id, { isAvailable: !p.isAvailable })}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                                p.isAvailable
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : 'bg-rose-950 text-rose-400 border border-rose-800'
                              }`}
                            >
                              {p.isAvailable ? 'Tersedia' : 'Nonaktif'}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                setEditingProduct(p);
                                setEditBaseCost(p.baseCost);
                                setEditSellingPrice(p.sellingPrice);
                              }}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold cursor-pointer"
                            >
                              Ubah Harga
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Edit Price Modal */}
              {editingProduct && (
                <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4">
                  <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-2xl">
                    <h3 className="font-bold text-white text-base">
                      Ubah Harga {editingProduct.name}
                    </h3>

                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-slate-400">Modal Supplier (IDR)</label>
                        <input
                          type="number"
                          value={editBaseCost}
                          onChange={(e) => setEditBaseCost(Number(e.target.value))}
                          className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-slate-400">Harga Jual Konsumen (IDR)</label>
                        <input
                          type="number"
                          value={editSellingPrice}
                          onChange={(e) => setEditSellingPrice(Number(e.target.value))}
                          className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white font-mono"
                        />
                      </div>

                      <div className="p-3 bg-slate-950 rounded-lg text-xs space-y-1">
                        <div className="text-slate-400">Proyeksi Keuntungan:</div>
                        <div className="font-mono font-bold text-emerald-400 text-sm">
                          {formatRupiah(editSellingPrice - editBaseCost)}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => setEditingProduct(null)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-semibold text-slate-300"
                      >
                        Batal
                      </button>
                      <button
                        onClick={() => {
                          onUpdateProduct(editingProduct.id, {
                            baseCost: editBaseCost,
                            sellingPrice: editSellingPrice,
                          });
                          setEditingProduct(null);
                        }}
                        className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white"
                      >
                        Simpan
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GAMES */}
          {activeTab === 'games' && (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-mono">
                    <tr>
                      <th className="py-3 px-4">Game</th>
                      <th className="py-3 px-4">Publisher</th>
                      <th className="py-3 px-4">Kategori</th>
                      <th className="py-3 px-4">Input Fields</th>
                      <th className="py-3 px-4">Cek Akun In-Game</th>
                      <th className="py-3 px-4 text-right">Status Aktif</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {games.map((g) => (
                      <tr key={g.id} className="hover:bg-slate-900/60 transition-colors">
                        <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                          <img src={g.logoUrl} alt={g.title} className="h-6 w-6 rounded object-cover" />
                          <span>{g.title}</span>
                        </td>
                        <td className="py-3 px-4">{g.publisher}</td>
                        <td className="py-3 px-4 uppercase font-mono text-[10px] text-cyan-400">
                          {g.category}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                          {g.inputFields.map((f) => f.name).join(', ')}
                        </td>
                        <td className="py-3 px-4">
                          {g.accountCheckSupported ? (
                            <span className="text-emerald-400 font-semibold">Tersedia</span>
                          ) : (
                            <span className="text-slate-500">Manual</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => onUpdateGame(g.id, { isActive: !g.isActive })}
                            className={`px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer ${
                              g.isActive
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {g.isActive ? 'Aktif' : 'Nonaktif'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: INTEGRATIONS */}
          {activeTab === 'integrations' && (
            <div className="space-y-6">
              {/* Free Development Sandbox Status Alert */}
              <div className="rounded-xl border border-cyan-800/60 bg-cyan-950/30 p-4 text-xs text-cyan-200 flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 shrink-0 mt-0.5">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-white text-sm">Mode Preview / Development Gratis Aktif (100% Mock)</div>
                  <p className="text-slate-300">
                    Aplikasi Kumagemu secara default berjalan dalam <strong>Mock Mode</strong> tanpa membutuhkan API key Digiflazz maupun Midtrans. Semua fitur katalog game, validasi nickname in-game, alur checkout, QRIS dinamis, dan Virtual Account disimulasikan secara lokal di backend Node.js tanpa memanggil provider eksternal.
                  </p>
                </div>
              </div>

              {integrationNotice && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
                    integrationNotice.isError
                      ? 'bg-amber-950/40 border-amber-700/60 text-amber-200'
                      : 'bg-emerald-950/40 border-emerald-700/60 text-emerald-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{integrationNotice.text}</span>
                  </div>
                  <button
                    onClick={() => setIntegrationNotice(null)}
                    className="ml-3 text-slate-400 hover:text-white cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Supplier Integration Card */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
                        <Layers className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm">Supplier Adapter</h3>
                        <p className="text-xs text-slate-400">Penyedia stok & otomatisasi serial number</p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        supplierMode === 'mock'
                          ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}
                    >
                      {supplierMode === 'mock' ? 'Mock Mode (Gratis)' : 'Live Digiflazz'}
                    </span>
                  </div>

                  <div className="space-y-3 pt-2 text-xs">
                    <div
                      onClick={() => handleToggleSupplier('mock')}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                        supplierMode === 'mock'
                          ? 'bg-violet-950/20 border-violet-700/50'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>Mock Supplier (Sandbox/Demo)</span>
                          <span className="text-[10px] bg-emerald-900/60 text-emerald-300 px-1.5 py-0.2 rounded font-normal">Default Gratis</span>
                        </div>
                        <div className="text-slate-400">Tidak membutuhkan API key, pengiriman instan aman</div>
                      </div>
                      <input
                        type="radio"
                        checked={supplierMode === 'mock'}
                        onChange={() => handleToggleSupplier('mock')}
                        className="h-4 w-4 text-violet-600 cursor-pointer"
                      />
                    </div>

                    <div
                      onClick={() => handleToggleSupplier('digiflazz')}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                        supplierMode === 'digiflazz'
                          ? 'bg-violet-950/20 border-violet-700/50'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-white">Digiflazz API (Indonesia Official)</div>
                        <div className="text-slate-400">Hanya aktif jika DIGIFLAZZ_USERNAME & DIGIFLAZZ_API_KEY diset di backend</div>
                      </div>
                      <input
                        type="radio"
                        checked={supplierMode === 'digiflazz'}
                        onChange={() => handleToggleSupplier('digiflazz')}
                        className="h-4 w-4 text-violet-600 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Gateway Integration Card */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
                        <DollarSign className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm">Payment Gateway</h3>
                        <p className="text-xs text-slate-400">Pemrosesan transaksi QRIS, E-Wallet & VA</p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        paymentGatewayMode === 'mock'
                          ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}
                    >
                      {paymentGatewayMode === 'mock' ? 'Mock Mode (Gratis)' : 'Live Midtrans'}
                    </span>
                  </div>

                  <div className="space-y-3 pt-2 text-xs">
                    <div
                      onClick={() => handleTogglePayment('mock')}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                        paymentGatewayMode === 'mock'
                          ? 'bg-cyan-950/20 border-cyan-700/50'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>Mock Payment Provider</span>
                          <span className="text-[10px] bg-emerald-900/60 text-emerald-300 px-1.5 py-0.2 rounded font-normal">Default Gratis</span>
                        </div>
                        <div className="text-slate-400">Simulasi bayar instan langsung di antarmuka invoice</div>
                      </div>
                      <input
                        type="radio"
                        checked={paymentGatewayMode === 'mock'}
                        onChange={() => handleTogglePayment('mock')}
                        className="h-4 w-4 text-violet-600 cursor-pointer"
                      />
                    </div>

                    <div
                      onClick={() => handleTogglePayment('midtrans')}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                        paymentGatewayMode === 'midtrans'
                          ? 'bg-cyan-950/20 border-cyan-700/50'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-white">Midtrans Payment (Snap & Core API)</div>
                        <div className="text-slate-400">Hanya aktif jika MIDTRANS_SERVER_KEY diset di backend</div>
                      </div>
                      <input
                        type="radio"
                        checked={paymentGatewayMode === 'midtrans'}
                        onChange={() => handleTogglePayment('midtrans')}
                        className="h-4 w-4 text-violet-600 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-mono">
                    <tr>
                      <th className="py-3 px-4">Waktu</th>
                      <th className="py-3 px-4">Aksi</th>
                      <th className="py-3 px-4">Aktor</th>
                      <th className="py-3 px-4">Target</th>
                      <th className="py-3 px-4">Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300 font-mono text-[11px]">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-900/60 transition-colors">
                        <td className="py-2.5 px-4 text-slate-400 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString('id-ID')}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-violet-400 whitespace-nowrap">
                          {log.action}
                        </td>
                        <td className="py-2.5 px-4 text-cyan-300 whitespace-nowrap">{log.actor}</td>
                        <td className="py-2.5 px-4 text-slate-300 whitespace-nowrap">{log.target}</td>
                        <td className="py-2.5 px-4 text-slate-400 font-sans">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: AUTOMATED TESTS */}
          {activeTab === 'tests' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                <div>
                  <h3 className="font-bold text-white text-sm">Suite Pengujian Otomatis</h3>
                  <p className="text-xs text-slate-400">
                    Memverifikasi validasi Zod, perhitungan harga rupiah, alur state machine, dan idempotensi payment.
                  </p>
                </div>
                <button
                  onClick={handleRunTests}
                  disabled={isRunningTests}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <Play className={`h-3.5 w-3.5 ${isRunningTests ? 'animate-spin' : ''}`} />
                  <span>{isRunningTests ? 'Menjalankan Tes...' : 'Jalankan Pengujian'}</span>
                </button>
              </div>

              {testResults && (
                <div className="space-y-2">
                  {testResults.map((t, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                        t.passed
                          ? 'bg-emerald-950/30 border-emerald-800 text-emerald-300'
                          : 'bg-rose-950/30 border-rose-800 text-rose-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {t.passed ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-rose-400" />
                        )}
                        <span className="font-semibold text-white">{t.name}</span>
                      </div>
                      <span className="font-mono font-bold">
                        {t.passed ? 'PASSED' : `FAILED: ${t.message}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
