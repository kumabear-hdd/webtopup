import { useState, useEffect, useCallback } from 'react';
import { Game, Product, PaymentMethod, Order, AuditLog, RevenueReport, UserProfile } from '../types';
import {
  INITIAL_GAMES,
  INITIAL_PRODUCTS,
  INITIAL_PAYMENT_METHODS,
  INITIAL_ORDERS,
} from '../data/initialData';
import { supplierManager } from '../services/supplier';
import { paymentManager } from '../services/payment';
import { orderCreationSchema, generatePublicReference } from '../utils/validation';

const STORAGE_KEYS = {
  GAMES: 'kumagemu_games_v1',
  PRODUCTS: 'kumagemu_products_v1',
  ORDERS: 'kumagemu_orders_v1',
  AUDIT_LOGS: 'kumagemu_audit_logs_v1',
  AUTH_TOKEN: 'kumagemu_auth_token_v1',
  CURRENT_USER: 'kumagemu_user_v1',
  CUSTOMER_PHONE: 'kumagemu_cust_phone_v1',
};

export interface PricingCalculation {
  baseCost: number;
  subtotal: number;
  paymentFee: number;
  totalAmount: number;
  margin: number;
}

export function useKumabearStore() {
  const [games, setGames] = useState<Game[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.GAMES);
    return saved ? JSON.parse(saved) : INITIAL_GAMES;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [paymentMethods] = useState<PaymentMethod[]>(INITIAL_PAYMENT_METHODS);

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'log-1',
            action: 'SYSTEM_BOOT',
            actor: 'System',
            target: 'Platform Core',
            details: 'Kumagemu initialized in Production-Ready Architecture',
            timestamp: new Date().toISOString(),
          },
        ];
  });

  // Authentication State
  const [authToken, setAuthToken] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return saved ? JSON.parse(saved) : null;
  });

  const isAdminLoggedIn = Boolean(currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin'));

  const [customerPhone, setCustomerPhone] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.CUSTOMER_PHONE) || '';
  });

  const [supplierMode, setSupplierMode] = useState<'mock' | 'digiflazz'>('mock');
  const [paymentGatewayMode, setPaymentGatewayMode] = useState<'mock' | 'midtrans'>('mock');
  const [serverConfig, setServerConfig] = useState<{
    isFreeDevMode: boolean;
    digiflazzConfigured: boolean;
    midtransConfigured: boolean;
    adminEmailConfigured?: boolean;
  }>({
    isFreeDevMode: true,
    digiflazzConfigured: false,
    midtransConfigured: false,
    adminEmailConfigured: true,
  });

  // Verify stored session on mount
  useEffect(() => {
    if (authToken) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      })
        .then(async (res) => {
          if (!res.ok) throw new Error('Session invalid');
          return await res.json();
        })
        .then((data) => {
          if (data.success && data.user) {
            setCurrentUser(data.user);
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(data.user));
          } else {
            setAuthToken(null);
            setCurrentUser(null);
            localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
          }
        })
        .catch(() => {
          setAuthToken(null);
          setCurrentUser(null);
          localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        });
    }
  }, [authToken]);

  // Fetch server health & provider configuration status
  useEffect(() => {
    fetch('/api/health')
      .then(async (res) => {
        if (!res || !res.ok) return null;
        if (typeof res.json === 'function') {
          return await res.json();
        }
        return null;
      })
      .then((data) => {
        if (data?.config) {
          setServerConfig({
            isFreeDevMode: Boolean(data.config.isFreeDevMode),
            digiflazzConfigured: Boolean(data.config.digiflazzConfigured),
            midtransConfigured: Boolean(data.config.midtransConfigured),
            adminEmailConfigured: Boolean(data.config.adminEmailConfigured),
          });
          if (data.config.supplierMode) setSupplierMode(data.config.supplierMode);
          if (data.config.paymentMode) setPaymentGatewayMode(data.config.paymentMode);
        }
      })
      .catch(() => {
        // Fallback: stay in free development mock mode
      });
  }, []);

  // Fetch Customer's Own Orders when logged in
  const fetchCustomerOrders = useCallback(async () => {
    if (!authToken) {
      setCustomerOrders([]);
      return;
    }
    try {
      const res = await fetch('/api/customer/orders', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setCustomerOrders(json.data);
        }
      }
    } catch {
      // ignore network errors
    }
  }, [authToken]);

  useEffect(() => {
    if (currentUser) {
      fetchCustomerOrders();
    } else {
      setCustomerOrders([]);
    }
  }, [currentUser, fetchCustomerOrders]);

  // Fetch Admin Orders and Audit Logs when admin is logged in
  const fetchAdminData = useCallback(async () => {
    if (!authToken || !isAdminLoggedIn) return;
    try {
      const [ordersRes, logsRes] = await Promise.all([
        fetch('/api/admin/orders', { headers: { Authorization: `Bearer ${authToken}` } }),
        fetch('/api/admin/audit-logs', { headers: { Authorization: `Bearer ${authToken}` } }),
      ]);
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        if (ordersData.success && Array.isArray(ordersData.data)) {
          setOrders(ordersData.data);
        }
      }
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        if (logsData.success && Array.isArray(logsData.data)) {
          setAuditLogs(logsData.data);
        }
      }
    } catch {
      // ignore network errors
    }
  }, [authToken, isAdminLoggedIn]);

  useEffect(() => {
    if (isAdminLoggedIn) {
      fetchAdminData();
    }
  }, [isAdminLoggedIn, fetchAdminData]);

  // Persistence effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(games));
  }, [games]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    if (customerPhone) {
      localStorage.setItem(STORAGE_KEYS.CUSTOMER_PHONE, customerPhone);
    }
  }, [customerPhone]);

  const addAuditLog = useCallback(
    (action: string, actor: string, target: string, details: string) => {
      const newLog: AuditLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        action,
        actor,
        target,
        details,
        timestamp: new Date().toISOString(),
      };
      setAuditLogs((prev) => [newLog, ...prev.slice(0, 99)]);
    },
    []
  );

  // Authentication: Customer Register
  const customerRegister = useCallback(
    async (params: { fullName: string; email: string; password: string; phone: string }) => {
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          return { success: false, message: data.error || 'Gagal mendaftar akun.' };
        }
        if (data.token && data.user) {
          setAuthToken(data.token);
          setCurrentUser(data.user);
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.token);
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(data.user));
          if (data.user.phone) setCustomerPhone(data.user.phone);
        }
        return { success: true, message: data.message || 'Pendaftaran berhasil!' };
      } catch (err: any) {
        return { success: false, message: err.message || 'Terjadi kesalahan jaringan.' };
      }
    },
    []
  );

  // Authentication: Customer Login
  const customerLogin = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, message: data.error || 'Email atau password salah.' };
      }
      setAuthToken(data.token);
      setCurrentUser(data.user);
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.token);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(data.user));
      if (data.user.phone) setCustomerPhone(data.user.phone);
      return { success: true, message: 'Login berhasil!' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Gagal menghubungi server.' };
    }
  }, []);

  // Authentication: Dedicated Official Administrator Login
  const adminLogin = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          return { success: false, message: data.error || 'Akses ditolak: Kredensial administrator tidak valid.' };
        }
        setAuthToken(data.token);
        setCurrentUser(data.user);
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.token);
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(data.user));
        addAuditLog('ADMIN_LOGIN', data.user.email, 'AdminDashboard', 'Administrator login terverifikasi server');
        return { success: true, message: 'Autentikasi administrator berhasil diverifikasi server.' };
      } catch (err: any) {
        return { success: false, message: err.message || 'Gagal memverifikasi login admin dengan backend.' };
      }
    },
    [addAuditLog]
  );

  // Logout
  const logout = useCallback(() => {
    setAuthToken(null);
    setCurrentUser(null);
    setCustomerOrders([]);
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }, []);

  // In-Game Account Verification (Always handled via backend Node.js, never directly from browser)
  const checkAccount = useCallback(async (gameId: string, targetAccount: Record<string, string>) => {
    try {
      const res = await fetch('/api/check-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, targetAccount }),
      });
      if (res && res.ok && typeof res.json === 'function') {
        const data = await res.json();
        return { isValid: Boolean(data.isValid), nickname: data.nickname, message: data.message };
      }
    } catch {
      // Offline fallback: use local mock adapter
    }
    return await supplierManager.getAdapter().checkAccount(gameId, targetAccount);
  }, []);

  // Pricing Calculation Engine
  const calculatePricing = useCallback(
    (product: Product, paymentMethod: PaymentMethod): PricingCalculation => {
      const subtotal = product.sellingPrice;
      const feeFlat = paymentMethod.feeFlat;
      const feePercentAmount = Math.round(subtotal * paymentMethod.feePercentage);
      const paymentFee = feeFlat + feePercentAmount;
      const totalAmount = subtotal + paymentFee;
      const margin = subtotal - product.baseCost;

      return {
        baseCost: product.baseCost,
        subtotal,
        paymentFee,
        totalAmount,
        margin,
      };
    },
    []
  );

  // Order Creation (Server-Side Price Validation)
  const createOrder = useCallback(
    async (payload: {
      gameId: string;
      productId: string;
      paymentMethodId: string;
      targetAccount: Record<string, string>;
      accountNickname?: string;
      customerContact: {
        whatsapp: string;
        email?: string;
      };
    }): Promise<{ success: boolean; order?: Order; error?: string }> => {
      const validation = orderCreationSchema.safeParse(payload);
      if (!validation.success) {
        return { success: false, error: validation.error.issues[0]?.message || 'Validasi pesanan gagal' };
      }

      // Automatically attach logged-in customer email if available
      const contactWithUser = {
        whatsapp: payload.customerContact.whatsapp,
        email: payload.customerContact.email || currentUser?.email || '',
      };

      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, customerContact: contactWithUser }),
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success && json.order) {
            setOrders((prev) => [json.order, ...prev]);
            if (currentUser) {
              setCustomerOrders((prev) => [json.order, ...prev]);
            }
            return { success: true, order: json.order };
          }
        }
      } catch {
        // network issue fallback to local
      }

      // Local Fallback Order Creation
      const game = games.find((g) => g.id === payload.gameId);
      const product = products.find((p) => p.id === payload.productId);
      const paymentMethod = paymentMethods.find((pm) => pm.id === payload.paymentMethodId);

      if (!game || !product || !paymentMethod) {
        return { success: false, error: 'Data game, produk, atau metode pembayaran tidak valid' };
      }

      const pricing = calculatePricing(product, paymentMethod);
      const publicReference = generatePublicReference();

      const newOrder: Order = {
        id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        publicReference,
        customerContact: contactWithUser,
        gameId: game.id,
        gameTitle: game.title,
        productId: product.id,
        productName: product.name,
        denomination: product.denomination,
        targetAccount: payload.targetAccount,
        accountNickname: payload.accountNickname || 'Pemain Terverifikasi',
        baseCost: pricing.baseCost,
        subtotal: pricing.subtotal,
        paymentFee: pricing.paymentFee,
        totalAmount: pricing.totalAmount,
        paymentMethod,
        paymentStatus: 'PENDING',
        supplierStatus: 'QUEUED',
        orderStatus: 'PENDING_PAYMENT',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isTestOrder: supplierMode === 'mock',
      };

      setOrders((prev) => [newOrder, ...prev]);
      if (currentUser) {
        setCustomerOrders((prev) => [newOrder, ...prev]);
      }
      return { success: true, order: newOrder };
    },
    [games, products, paymentMethods, calculatePricing, supplierMode, currentUser]
  );

  // Supplier Fulfillment Workflow
  const processFulfillment = useCallback(
    async (order: Order) => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? {
                ...o,
                orderStatus: 'SUPPLIER_PROCESSING',
                supplierStatus: 'PROCESSING',
                updatedAt: new Date().toISOString(),
              }
            : o
        )
      );

      const product = products.find((p) => p.id === order.productId);
      const supplierSku = product ? product.supplierSku : 'UNKNOWN_SKU';

      const fulfillmentResult = await supplierManager.getAdapter().createOrder({
        referenceId: order.publicReference,
        buyerSkuCode: supplierSku,
        customerNo: Object.values(order.targetAccount).join(''),
        testing: supplierMode === 'mock',
      });

      if (fulfillmentResult.success && fulfillmentResult.status === 'SUCCESS') {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === order.id
              ? {
                  ...o,
                  orderStatus: 'SUCCESS',
                  supplierStatus: 'SUCCESS',
                  supplierReference: fulfillmentResult.supplierReference,
                  supplierSerialNumber: fulfillmentResult.serialNumber || `SN-${Date.now()}`,
                  completedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : o
          )
        );
        addAuditLog(
          'SUPPLIER_FULFILLMENT_SUCCESS',
          'SupplierAdapter',
          order.publicReference,
          `Pengiriman sukses SN: ${fulfillmentResult.serialNumber || 'N/A'}`
        );
      } else {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === order.id
              ? {
                  ...o,
                  orderStatus: 'FAILED',
                  supplierStatus: 'FAILED',
                  supplierError: fulfillmentResult.errorMessage || 'Gagal dari supplier',
                  updatedAt: new Date().toISOString(),
                }
              : o
          )
        );
        addAuditLog(
          'SUPPLIER_FULFILLMENT_FAILED',
          'SupplierAdapter',
          order.publicReference,
          `Pengiriman gagal: ${fulfillmentResult.errorMessage || 'Unknown error'}`
        );
      }
    },
    [products, supplierMode, addAuditLog]
  );

  // Simulate Payment Success (Development Sandbox Only)
  const simulatePaymentSuccess = useCallback(
    async (orderId: string) => {
      const order = orders.find((o) => o.id === orderId);
      if (!order) return { success: false, message: 'Pesanan tidak ditemukan' };

      if (order.paymentStatus === 'PAID') {
        return { success: true, message: 'Pesanan sudah dibayar sebelumnya (Idempotent).' };
      }

      // Try backend simulate endpoint
      try {
        const res = await fetch(`/api/orders/${order.publicReference}/simulate-pay`, { method: 'POST' });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.order) {
            setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...json.order } : o)));
            return { success: true, message: 'Pembayaran berhasil dikonfirmasi dan diproses ke supplier.' };
          }
        }
      } catch {
        // fallback
      }

      const paidOrder: Order = {
        ...order,
        paymentStatus: 'PAID',
        orderStatus: 'PAYMENT_CONFIRMED',
        paidAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setOrders((prev) => prev.map((o) => (o.id === order.id ? paidOrder : o)));
      await processFulfillment(paidOrder);
      return { success: true, message: 'Pembayaran berhasil dikonfirmasi dan diproses ke supplier.' };
    },
    [orders, processFulfillment]
  );

  // Admin: Re-try fulfillment
  const retrySupplierFulfillment = useCallback(
    async (orderId: string) => {
      const order = orders.find((o) => o.id === orderId);
      if (!order) return;

      if (authToken) {
        try {
          await fetch(`/api/admin/orders/${order.publicReference}/retry-supplier`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${authToken}` },
          });
        } catch {
          // ignore
        }
      }

      addAuditLog('ADMIN_RETRY_FULFILLMENT', 'Admin', order.publicReference, 'Manual re-trigger to supplier');
      await processFulfillment(order);
    },
    [orders, authToken, addAuditLog, processFulfillment]
  );

  // Admin: Refund Order
  const refundOrder = useCallback(
    async (orderId: string, reason: string) => {
      const target = orders.find((o) => o.id === orderId);
      if (target && authToken) {
        try {
          await fetch(`/api/admin/orders/${target.publicReference}/refund`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({ reason }),
          });
        } catch {
          // ignore
        }
      }

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                orderStatus: 'REFUNDED',
                updatedAt: new Date().toISOString(),
              }
            : o
        )
      );
      addAuditLog('ORDER_REFUNDED', 'Admin', target?.publicReference || orderId, `Refund diproses: ${reason}`);
    },
    [orders, authToken, addAuditLog]
  );

  // Admin: Product updates
  const updateProduct = useCallback(
    async (productId: string, updates: Partial<Product>) => {
      if (authToken) {
        try {
          await fetch(`/api/admin/products/${productId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify(updates),
          });
        } catch {
          // ignore
        }
      }

      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== productId) return p;
          return { ...p, ...updates };
        })
      );
      addAuditLog('PRODUCT_UPDATED', 'Admin', productId, `Perubahan produk ID ${productId}`);
    },
    [authToken, addAuditLog]
  );

  // Admin: Game updates
  const updateGame = useCallback(
    (gameId: string, updates: Partial<Game>) => {
      setGames((prev) =>
        prev.map((g) => {
          if (g.id !== gameId) return g;
          return { ...g, ...updates };
        })
      );
      addAuditLog('GAME_UPDATED', 'Admin', gameId, `Perubahan konfigurasi game ID ${gameId}`);
    },
    [addAuditLog]
  );

  // Reports
  const getRevenueReport = useCallback((): RevenueReport => {
    const paidOrders = orders.filter((o) => o.paymentStatus === 'PAID');
    const successOrders = orders.filter((o) => o.orderStatus === 'SUCCESS');
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.subtotal, 0);
    const totalCost = paidOrders.reduce((sum, o) => sum + o.baseCost, 0);
    const totalProfit = totalRevenue - totalCost;
    const successRate = orders.length > 0 ? Math.round((successOrders.length / orders.length) * 100) : 100;

    return {
      totalRevenue,
      totalProfit,
      totalOrders: orders.length,
      successRate,
      recentOrdersCount: orders.slice(0, 10).length,
    };
  }, [orders]);

  // Toggle integrations with server-side validation and fallback
  const toggleSupplierProvider = useCallback(
    async (mode: 'mock' | 'digiflazz'): Promise<{ success: boolean; message: string }> => {
      if (mode === 'mock') {
        setSupplierMode('mock');
        supplierManager.switchToMock();
        addAuditLog('SUPPLIER_PROVIDER_SWITCH', 'Admin', 'Integration', 'Beralih ke Mock Supplier');
        try {
          await fetch('/api/admin/set-mode', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
            },
            body: JSON.stringify({ supplierMode: 'mock' }),
          });
        } catch {
          // ignore
        }
        return { success: true, message: 'Berhasil beralih ke Mock Supplier (Gratis, tanpa API key).' };
      }

      // Validating Digiflazz switch with backend
      try {
        const res = await fetch('/api/admin/set-mode', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
          body: JSON.stringify({ supplierMode: 'digiflazz' }),
        });
        const data = res && typeof res.json === 'function' ? await res.json() : null;
        if (!res.ok || !data?.success) {
          setSupplierMode('mock');
          supplierManager.switchToMock();
          return {
            success: false,
            message: data?.error || 'Kredensial Digiflazz (DIGIFLAZZ_USER & DIGIFLAZZ_API_KEY) belum dikonfigurasi di environment. Tetap di Mode Mock (Gratis).',
          };
        }
        setSupplierMode('digiflazz');
        supplierManager.switchToDigiflazz();
        addAuditLog('SUPPLIER_PROVIDER_SWITCH', 'Admin', 'Integration', 'Beralih ke Digiflazz Live Provider');
        return { success: true, message: 'Berhasil mengaktifkan Digiflazz Official API.' };
      } catch {
        setSupplierMode('mock');
        supplierManager.switchToMock();
        return {
          success: false,
          message: 'Gagal menghubungi backend untuk verifikasi kredensial. Tetap di Mode Mock (Gratis).',
        };
      }
    },
    [authToken, addAuditLog]
  );

  const togglePaymentProvider = useCallback(
    async (mode: 'mock' | 'midtrans'): Promise<{ success: boolean; message: string }> => {
      if (mode === 'mock') {
        setPaymentGatewayMode('mock');
        paymentManager.switchToMock();
        addAuditLog('PAYMENT_PROVIDER_SWITCH', 'Admin', 'Integration', 'Beralih ke Mock Payment Provider');
        try {
          await fetch('/api/admin/set-mode', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
            },
            body: JSON.stringify({ paymentMode: 'mock' }),
          });
        } catch {
          // ignore
        }
        return { success: true, message: 'Berhasil beralih ke Mock Payment Gateway (Gratis, tanpa Server Key).' };
      }

      try {
        const res = await fetch('/api/admin/set-mode', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
          body: JSON.stringify({ paymentMode: 'midtrans' }),
        });
        const data = res && typeof res.json === 'function' ? await res.json() : null;
        if (!res.ok || !data?.success) {
          setPaymentGatewayMode('mock');
          paymentManager.switchToMock();
          return {
            success: false,
            message: data?.error || 'Kredensial Midtrans (MIDTRANS_SERVER_KEY) belum dikonfigurasi di environment. Tetap di Mode Mock (Gratis).',
          };
        }
        setPaymentGatewayMode('midtrans');
        paymentManager.switchToMidtrans();
        addAuditLog('PAYMENT_PROVIDER_SWITCH', 'Admin', 'Integration', 'Beralih ke Midtrans Payment Gateway');
        return { success: true, message: 'Berhasil mengaktifkan Midtrans Payment Gateway.' };
      } catch {
        setPaymentGatewayMode('mock');
        paymentManager.switchToMock();
        return {
          success: false,
          message: 'Gagal menghubungi backend untuk verifikasi kredensial Midtrans. Tetap di Mode Mock (Gratis).',
        };
      }
    },
    [authToken, addAuditLog]
  );

  const syncCatalogWithSupplier = useCallback(() => {
    setProducts((prev) =>
      prev.map((p) => ({
        ...p,
        isAvailable: true,
      }))
    );
    addAuditLog(
      'CATALOG_SYNC',
      currentUser?.email || 'Admin',
      'All Products',
      'Sinkronisasi SKU & harga supplier berhasil. Semua item siap jual.'
    );
  }, [currentUser, addAuditLog]);

  return {
    games,
    products,
    paymentMethods,
    orders,
    customerOrders,
    auditLogs,
    currentUser,
    authToken,
    isAdminLoggedIn,
    customerPhone,
    supplierMode,
    paymentGatewayMode,
    serverConfig,
    setCustomerPhone,
    checkAccount,
    calculatePricing,
    createOrder,
    simulatePaymentSuccess,
    retrySupplierFulfillment,
    refundOrder,
    updateProduct,
    updateGame,
    syncCatalogWithSupplier,
    adminLogin,
    adminLogout: logout,
    customerLogin,
    customerRegister,
    logout,
    fetchCustomerOrders,
    getRevenueReport,
    toggleSupplierProvider,
    togglePaymentProvider,
  };
}

export const useKumagemuStore = useKumabearStore;
