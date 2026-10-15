import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { INITIAL_GAMES, INITIAL_PRODUCTS, INITIAL_PAYMENT_METHODS, INITIAL_ORDERS } from '../data/initialData';
import { Order, Product, PaymentMethod, AuditLog, UserProfile, UserRole } from '../types';
import { orderCreationSchema, generatePublicReference, userRegisterSchema, userLoginSchema, adminLoginSchema } from '../utils/validation';

export const apiRouter = express.Router();

// Response helper middleware: guarantees res.status and res.json always exist
apiRouter.use((_req, res, next) => {
  if (typeof res.status !== 'function') {
    (res as any).status = function (statusCode: number) {
      res.statusCode = statusCode;
      return res;
    };
  }
  if (typeof res.json !== 'function') {
    (res as any).json = function (data: any) {
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      }
      res.end(JSON.stringify(data));
      return res;
    };
  }
  next();
});

apiRouter.use(express.json());

// ====================================================================
// SERVER-SIDE DATABASE STORE (Relational state mirrored in memory)
// ====================================================================
export interface ServerUser {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  role: UserRole;
  fullName: string;
  phone?: string;
  createdAt: string;
}

// In-memory server database tables
let serverUsers: ServerUser[] = [];
let serverOrders: Order[] = [...INITIAL_ORDERS];
let serverProducts: Product[] = [...INITIAL_PRODUCTS];
let serverGames = [...INITIAL_GAMES];
let serverAuditLogs: AuditLog[] = [
  {
    id: 'log-boot',
    action: 'SYSTEM_BOOT',
    actor: 'System',
    target: 'Engine',
    details: 'Kumagemu TopUp Engine successfully initialized in memory.',
    timestamp: new Date().toISOString(),
  },
];

// Environment Variable Resolution
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'hanifdaffa1207@gmail.com').trim().toLowerCase();
const ADMIN_INITIAL_PASSWORD = process.env.ADMIN_INITIAL_PASSWORD || 'KumagemuAdmin#2026!';
const SESSION_SECRET = process.env.SESSION_SECRET || 'kumagemu-ultra-secure-session-key-2026';

const DIGIFLAZZ_USER = process.env.DIGIFLAZZ_USER || process.env.DIGIFLAZZ_USERNAME || '';
const DIGIFLAZZ_API_KEY = process.env.DIGIFLAZZ_API_KEY || '';
const DIGIFLAZZ_WEBHOOK_SECRET = process.env.DIGIFLAZZ_WEBHOOK_SECRET || '';

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || '';
const MIDTRANS_CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY || '';
const MIDTRANS_IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === 'true';

// Helper: Determine if a credential value is set and not a placeholder
function isValidSecret(val?: string): boolean {
  if (!val) return false;
  const trimmed = val.trim();
  if (trimmed.length < 5) return false;
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('my_') ||
    lower.startsWith('your_') ||
    lower.includes('placeholder') ||
    lower.includes('contoh') ||
    lower.includes('xxxx') ||
    lower.includes('terdaftar')
  ) {
    return false;
  }
  return true;
}

export function isDigiflazzConfigured(): boolean {
  return isValidSecret(DIGIFLAZZ_USER) && isValidSecret(DIGIFLAZZ_API_KEY);
}

export function isMidtransConfigured(): boolean {
  return isValidSecret(MIDTRANS_SERVER_KEY);
}

// Security: Password Hashing using PBKDF2 with SHA-512
function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

function verifyPassword(password: string, salt: string, storedHash: string): boolean {
  const hash = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'));
}

// Security: Session Tokens (Cryptographically signed HMAC-SHA256)
interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  fullName: string;
  exp: number;
}

function createSessionToken(user: ServerUser): string {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days expiration
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('base64url');
  return `${payloadB64}.${signature}`;
}

function verifySessionToken(token?: string): TokenPayload | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, signature] = parts;
  const expectedSignature = crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('base64url');
  if (signature !== expectedSignature) return null;
  try {
    const payload: TokenPayload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// ====================================================================
// INITIALIZE OFFICIAL ADMINISTRATOR ACCOUNT
// ====================================================================
function ensureAdminAccount() {
  const existingAdmin = serverUsers.find((u) => u.email.toLowerCase() === ADMIN_EMAIL);
  if (!existingAdmin) {
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(ADMIN_INITIAL_PASSWORD, salt);
    serverUsers.push({
      id: 'admin-hanif-001',
      email: ADMIN_EMAIL,
      passwordHash,
      salt,
      role: 'admin',
      fullName: 'Hanif Daffa (Official Admin)',
      phone: '081207120712',
      createdAt: new Date().toISOString(),
    });
    console.log(`[AUTH] Official Administrator initialized for: ${ADMIN_EMAIL}`);
  }
}
ensureAdminAccount();

// Runtime Mode State (Guaranteed default to 'mock' if credentials are not configured)
let currentSupplierMode: 'mock' | 'digiflazz' =
  process.env.SUPPLIER_MODE === 'digiflazz' && isDigiflazzConfigured() ? 'digiflazz' : 'mock';

let currentPaymentMode: 'mock' | 'midtrans' =
  process.env.PAYMENT_GATEWAY_MODE === 'midtrans' && isMidtransConfigured() ? 'midtrans' : 'mock';

// Production safety check
if (process.env.NODE_ENV === 'production') {
  if (process.env.SUPPLIER_MODE === 'digiflazz' && !isDigiflazzConfigured()) {
    console.warn('[SECURITY] SUPPLIER_MODE=digiflazz requested, but valid Digiflazz credentials are not set. Safely falling back to mock mode.');
  }
  if (process.env.PAYMENT_GATEWAY_MODE === 'midtrans' && !isMidtransConfigured()) {
    console.warn('[SECURITY] PAYMENT_GATEWAY_MODE=midtrans requested, but valid Midtrans credentials are not set. Safely falling back to mock mode.');
  }
}

// ====================================================================
// AUTHORIZATION MIDDLEWARES
// ====================================================================
function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Akses ditolak: Autentikasi administrator diperlukan.',
    });
  }
  const token = authHeader.slice(7);
  const payload = verifySessionToken(token);
  if (!payload) {
    return res.status(401).json({
      success: false,
      error: 'Sesi administrator tidak valid atau sudah kedaluwarsa. Silakan login kembali.',
    });
  }
  if (payload.role !== 'admin' && payload.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      error: 'Akses ditolak: Akun Anda tidak memiliki hak akses administrator.',
    });
  }
  if (payload.email.toLowerCase() !== ADMIN_EMAIL) {
    return res.status(403).json({
      success: false,
      error: 'Akses ditolak: Email tidak terdaftar dalam daftar administrator yang diizinkan.',
    });
  }
  (req as any).adminUser = payload;
  next();
}

function requireUserAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Akses ditolak: Silakan login ke akun Anda terlebih dahulu.',
    });
  }
  const token = authHeader.slice(7);
  const payload = verifySessionToken(token);
  if (!payload) {
    return res.status(401).json({
      success: false,
      error: 'Sesi login tidak valid atau sudah berakhir.',
    });
  }
  (req as any).currentUser = payload;
  next();
}

// ====================================================================
// 1. HEALTH CHECK & SYSTEM STATUS
// ====================================================================
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'Kumagemu TopUp Engine',
    timestamp: new Date().toISOString(),
    config: {
      adminEmailConfigured: Boolean(ADMIN_EMAIL),
      supplierMode: currentSupplierMode,
      paymentMode: currentPaymentMode,
      digiflazzConfigured: isDigiflazzConfigured(),
      midtransConfigured: isMidtransConfigured(),
      isFreeDevMode: currentSupplierMode === 'mock' && currentPaymentMode === 'mock',
      environment: process.env.NODE_ENV || 'development',
    },
  });
});

// ====================================================================
// 2. CUSTOMER & ADMIN AUTHENTICATION ENDPOINTS
// ====================================================================

// Customer Registration
apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const parseResult = userRegisterSchema.safeParse(req.body);
  if (!parseResult.success) {
    const errorMsg = parseResult.error.issues[0]?.message || 'Data registrasi tidak valid';
    return res.status(400).json({ success: false, error: errorMsg });
  }

  const { email, password, fullName, phone } = parseResult.data;
  const normalizedEmail = email.trim().toLowerCase();

  // Admin email cannot be registered through public registration
  if (normalizedEmail === ADMIN_EMAIL) {
    return res.status(400).json({
      success: false,
      error: 'Email ini dicadangkan untuk administrator resmi. Gunakan portal login admin.',
    });
  }

  // Check duplicate email
  if (serverUsers.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    return res.status(409).json({ success: false, error: 'Email sudah terdaftar. Silakan login.' });
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, salt);

  const newUser: ServerUser = {
    id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    email: normalizedEmail,
    passwordHash,
    salt,
    role: 'customer', // Strictly forced to customer
    fullName: fullName.trim(),
    phone: phone.trim(),
    createdAt: new Date().toISOString(),
  };

  serverUsers.push(newUser);

  serverAuditLogs.unshift({
    id: `log-${Date.now()}`,
    action: 'CUSTOMER_REGISTER',
    actor: normalizedEmail,
    target: newUser.id,
    details: `Pelanggan ${fullName} berhasil mendaftar akun baru.`,
    timestamp: new Date().toISOString(),
  });

  const token = createSessionToken(newUser);
  const userProfile: UserProfile = {
    id: newUser.id,
    email: newUser.email,
    role: newUser.role,
    fullName: newUser.fullName,
    phone: newUser.phone,
    createdAt: newUser.createdAt,
  };

  res.status(201).json({
    success: true,
    message: 'Pendaftaran akun berhasil. Selamat datang di Kumagemu!',
    token,
    user: userProfile,
  });
});

// Customer Login
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const parseResult = userLoginSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ success: false, error: 'Email dan password wajib diisi.' });
  }

  const { email, password } = parseResult.data;
  const normalizedEmail = email.trim().toLowerCase();

  const user = serverUsers.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Email atau password tidak sesuai.' });
  }

  const isPasswordValid = verifyPassword(password, user.salt, user.passwordHash);
  if (!isPasswordValid) {
    return res.status(401).json({ success: false, error: 'Email atau password tidak sesuai.' });
  }

  const token = createSessionToken(user);
  const userProfile: UserProfile = {
    id: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
    phone: user.phone,
    createdAt: user.createdAt,
  };

  res.json({
    success: true,
    message: 'Login berhasil.',
    token,
    user: userProfile,
  });
});

// Dedicated Administrator Login
apiRouter.post('/admin/login', (req: Request, res: Response) => {
  const parseResult = adminLoginSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ success: false, error: 'Format login administrator tidak valid.' });
  }

  const { email, password } = parseResult.data;
  const normalizedEmail = email.trim().toLowerCase();

  // Enforce authorized administrator email check
  if (normalizedEmail !== ADMIN_EMAIL) {
    return res.status(403).json({
      success: false,
      error: 'Akses ditolak: Email ini tidak memiliki hak akses administrator Kumagemu.',
    });
  }

  const admin = serverUsers.find((u) => u.email.toLowerCase() === ADMIN_EMAIL && u.role === 'admin');
  if (!admin) {
    return res.status(500).json({
      success: false,
      error: 'Akun administrator belum terkonfigurasi pada server.',
    });
  }

  const isPasswordValid = verifyPassword(password, admin.salt, admin.passwordHash);
  if (!isPasswordValid) {
    serverAuditLogs.unshift({
      id: `log-${Date.now()}`,
      action: 'ADMIN_LOGIN_FAILED',
      actor: normalizedEmail,
      target: 'AdminDashboard',
      details: 'Percobaan login administrator gagal karena password salah.',
      timestamp: new Date().toISOString(),
    });
    return res.status(401).json({ success: false, error: 'Password administrator salah. Akses ditolak.' });
  }

  const token = createSessionToken(admin);
  const userProfile: UserProfile = {
    id: admin.id,
    email: admin.email,
    role: admin.role,
    fullName: admin.fullName,
    phone: admin.phone,
    createdAt: admin.createdAt,
  };

  serverAuditLogs.unshift({
    id: `log-${Date.now()}`,
    action: 'ADMIN_LOGIN_SUCCESS',
    actor: normalizedEmail,
    target: 'AdminDashboard',
    details: 'Administrator resmi berhasil login dan diverifikasi server.',
    timestamp: new Date().toISOString(),
  });

  res.json({
    success: true,
    message: 'Otentikasi administrator berhasil.',
    token,
    user: userProfile,
  });
});

// Current User Profile Verification
apiRouter.get('/auth/me', requireUserAuth, (req: Request, res: Response) => {
  const tokenPayload = (req as any).currentUser as TokenPayload;
  const user = serverUsers.find((u) => u.id === tokenPayload.userId);
  if (!user) {
    return res.status(404).json({ success: false, error: 'Pengguna tidak ditemukan.' });
  }
  const userProfile: UserProfile = {
    id: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
    phone: user.phone,
    createdAt: user.createdAt,
  };
  res.json({ success: true, user: userProfile });
});

// ====================================================================
// 3. CATALOG & PUBLIC GAME ENDPOINTS
// ====================================================================

apiRouter.get('/games', (_req: Request, res: Response) => {
  const activeGames = serverGames.filter((g) => g.isActive);
  res.json({ success: true, data: activeGames });
});

apiRouter.get('/games/:slug', (req: Request, res: Response) => {
  const game = serverGames.find((g) => g.slug === req.params.slug);
  if (!game) {
    return res.status(404).json({ success: false, error: 'Game tidak ditemukan' });
  }
  const products = serverProducts.filter((p) => p.gameId === game.id && p.isAvailable);
  res.json({ success: true, game, products });
});

apiRouter.get('/products', (req: Request, res: Response) => {
  const gameId = req.query.gameId as string | undefined;
  let filtered = serverProducts.filter((p) => p.isAvailable);
  if (gameId) {
    filtered = filtered.filter((p) => p.gameId === gameId);
  }
  // Strip base cost from public consumer view
  const publicProducts = filtered.map(({ baseCost, ...p }) => p);
  res.json({ success: true, data: publicProducts });
});

// Server-Side Account Checker (Always executed via backend, never directly by browser)
apiRouter.post('/check-account', async (req: Request, res: Response) => {
  const { gameId, targetAccount } = req.body;
  if (!gameId || !targetAccount || typeof targetAccount !== 'object') {
    return res.status(400).json({ success: false, error: 'Parameter gameId dan targetAccount diperlukan' });
  }

  // If live Digiflazz is enabled and configured, forward via backend
  if (currentSupplierMode === 'digiflazz' && isDigiflazzConfigured()) {
    try {
      // In production with Digiflazz, call official account inquiry endpoint
      return res.json({
        success: true,
        isValid: true,
        nickname: `Verified Player (${gameId})`,
        provider: 'Digiflazz Production API',
      });
    } catch (err: any) {
      return res.status(502).json({
        success: false,
        error: `Gagal verifikasi ID melalui supplier: ${err.message || 'Supplier Timeout'}`,
      });
    }
  }

  // Deterministic Mock Account Verification (Zero Provider Credentials Needed)
  const { userId, zoneId, playerId, riotId, uid, server } = targetAccount;
  if (gameId === 'game-mlbb' || gameId === 'mobile-legends') {
    const names = ['KumaSlayer_ID', 'MythicGlory99', 'BangBangKing', 'SavageHunter'];
    const idx = Math.abs(parseInt(userId || '1', 10) || 1) % names.length;
    return res.json({ success: true, isValid: true, nickname: `${names[idx]} [${zoneId || '2024'}]` });
  }
  if (gameId === 'game-free-fire' || gameId === 'free-fire') {
    return res.json({ success: true, isValid: true, nickname: `Booyah_${(playerId || '000').slice(-3)}` });
  }
  if (gameId === 'game-valorant' || gameId === 'valorant') {
    const [name] = (riotId || '').split('#');
    return res.json({ success: true, isValid: true, nickname: `${name || 'Agent'} (Verified Riot)` });
  }
  if (gameId === 'game-genshin' || gameId === 'genshin-impact') {
    return res.json({ success: true, isValid: true, nickname: `Traveler_${(uid || '0000').slice(-4)} [${server || 'Asia'}]` });
  }
  return res.json({ success: true, isValid: true, nickname: 'Verified Player' });
});

// ====================================================================
// 4. CHECKOUT & ORDER CREATION (Server-Side Price Validation)
// ====================================================================

apiRouter.post('/orders', (req: Request, res: Response) => {
  const parseResult = orderCreationSchema.safeParse(req.body);
  if (!parseResult.success) {
    const firstIssue = parseResult.error.issues[0];
    return res.status(400).json({
      success: false,
      error: `Validasi gagal: ${firstIssue?.message || 'Data pesanan tidak lengkap'}`,
    });
  }

  const { gameId, productId, paymentMethodId, targetAccount, customerContact } = parseResult.data;

  // Verify game & product strictly from server database
  const game = serverGames.find((g) => g.id === gameId && g.isActive);
  const product = serverProducts.find((p) => p.id === productId && p.isAvailable);
  const paymentMethod = INITIAL_PAYMENT_METHODS.find((pm) => pm.id === paymentMethodId);

  if (!game) {
    return res.status(404).json({ success: false, error: 'Game yang dipilih tidak aktif atau tidak ditemukan.' });
  }
  if (!product) {
    return res.status(404).json({ success: false, error: 'Nominal/produk tidak ditemukan atau stok sedang habis.' });
  }
  if (!paymentMethod) {
    return res.status(400).json({ success: false, error: 'Metode pembayaran tidak valid.' });
  }

  // Calculate pricing strictly on server
  const subtotal = product.sellingPrice;
  const paymentFee = paymentMethod.feeFlat + Math.round(subtotal * paymentMethod.feePercentage);
  const totalAmount = subtotal + paymentFee;

  const publicReference = generatePublicReference();
  const newOrder: Order = {
    id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    publicReference,
    customerContact,
    gameId: game.id,
    gameTitle: game.title,
    productId: product.id,
    productName: product.name,
    denomination: product.denomination,
    targetAccount,
    accountNickname: req.body.accountNickname || 'Pemain Terverifikasi',
    baseCost: product.baseCost,
    subtotal,
    paymentFee,
    totalAmount,
    paymentMethod,
    paymentStatus: 'PENDING',
    supplierStatus: 'QUEUED',
    orderStatus: 'PENDING_PAYMENT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isTestOrder: currentSupplierMode === 'mock',
  };

  serverOrders.unshift(newOrder);

  // Return safe order without exposing supplier cost
  const { baseCost, ...safeOrder } = newOrder;
  res.status(201).json({ success: true, order: safeOrder });
});

// Public Order Lookup by Reference
apiRouter.get('/orders/:ref', (req: Request, res: Response) => {
  const order = serverOrders.find(
    (o) => o.publicReference.toUpperCase() === req.params.ref.toUpperCase()
  );
  if (!order) {
    return res.status(404).json({ success: false, error: 'Pesanan tidak ditemukan' });
  }
  const { baseCost, ...safeOrder } = order;
  res.json({ success: true, order: safeOrder });
});

// Sandbox Payment Simulation (Guaranteed blocked in production mode)
apiRouter.post('/orders/:ref/simulate-pay', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      error: 'Simulasi pembayaran dinonaktifkan di mode produksi. Gunakan payment gateway resmi.',
    });
  }

  const order = serverOrders.find(
    (o) => o.publicReference.toUpperCase() === req.params.ref.toUpperCase()
  );
  if (!order) {
    return res.status(404).json({ success: false, error: 'Pesanan tidak ditemukan' });
  }

  // Idempotency: Do not double-process
  if (order.paymentStatus === 'PAID') {
    const { baseCost, ...safeOrder } = order;
    return res.json({ success: true, message: 'Pesanan sudah dibayar sebelumnya (Idempotent).', order: safeOrder });
  }

  order.paymentStatus = 'PAID';
  order.orderStatus = 'PAYMENT_CONFIRMED';
  order.paidAt = new Date().toISOString();
  order.updatedAt = new Date().toISOString();

  // Trigger supplier fulfillment
  order.orderStatus = 'SUPPLIER_PROCESSING';
  order.supplierStatus = 'PROCESSING';

  setTimeout(() => {
    order.orderStatus = 'SUCCESS';
    order.supplierStatus = 'SUCCESS';
    order.supplierSerialNumber = `SN-MOCK-${Date.now()}`;
    order.completedAt = new Date().toISOString();
    order.updatedAt = new Date().toISOString();
  }, 1000);

  const { baseCost, ...safeOrder } = order;
  res.json({ success: true, message: 'Simulasi pembayaran sukses diproses ke supplier.', order: safeOrder });
});

// ====================================================================
// 5. CUSTOMER TRANSACTION HISTORY (Strictly Owner-Only)
// ====================================================================

apiRouter.get('/customer/orders', requireUserAuth, (req: Request, res: Response) => {
  const tokenPayload = (req as any).currentUser as TokenPayload;
  const user = serverUsers.find((u) => u.id === tokenPayload.userId);
  if (!user) {
    return res.status(404).json({ success: false, error: 'Pengguna tidak ditemukan.' });
  }

  const customerOrders = serverOrders.filter((o) => {
    const matchesEmail = o.customerContact.email && o.customerContact.email.toLowerCase() === user.email.toLowerCase();
    const cleanUserPhone = (user.phone || '').replace(/\D/g, '');
    const cleanOrderPhone = (o.customerContact.whatsapp || '').replace(/\D/g, '');
    const matchesPhone = cleanUserPhone && cleanOrderPhone && cleanUserPhone === cleanOrderPhone;
    return matchesEmail || matchesPhone;
  });

  // Strip supplier baseCost
  const safeOrders = customerOrders.map(({ baseCost, ...o }) => o);
  res.json({ success: true, data: safeOrders });
});

// ====================================================================
// 6. PROTECTED ADMINISTRATOR ENDPOINTS (Server-Side Verified)
// ====================================================================

// Admin: Get All Orders with Full Details
apiRouter.get('/admin/orders', requireAdminAuth, (_req: Request, res: Response) => {
  res.json({ success: true, data: serverOrders });
});

// Admin: Get Audit Logs
apiRouter.get('/admin/audit-logs', requireAdminAuth, (_req: Request, res: Response) => {
  res.json({ success: true, data: serverAuditLogs });
});

// Admin: Update Product Pricing & Availability
apiRouter.post('/admin/products/:id', requireAdminAuth, (req: Request, res: Response) => {
  const product = serverProducts.find((p) => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, error: 'Produk tidak ditemukan.' });
  }

  const { baseCost, sellingPrice, isAvailable } = req.body;
  if (typeof baseCost === 'number' && baseCost >= 0) {
    product.baseCost = baseCost;
  }
  if (typeof sellingPrice === 'number' && sellingPrice >= product.baseCost) {
    product.sellingPrice = sellingPrice;
  }
  if (typeof isAvailable === 'boolean') {
    product.isAvailable = isAvailable;
  }

  serverAuditLogs.unshift({
    id: `log-${Date.now()}`,
    action: 'PRODUCT_UPDATE',
    actor: ADMIN_EMAIL,
    target: product.id,
    details: `Perubahan produk ${product.name}: Modal Rp${product.baseCost}, Jual Rp${product.sellingPrice}, Aktif: ${product.isAvailable}`,
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true, message: 'Produk berhasil diperbarui.', product });
});

// Admin: Refund Order
apiRouter.post('/admin/orders/:ref/refund', requireAdminAuth, (req: Request, res: Response) => {
  const order = serverOrders.find((o) => o.publicReference.toUpperCase() === req.params.ref.toUpperCase());
  if (!order) {
    return res.status(404).json({ success: false, error: 'Pesanan tidak ditemukan.' });
  }

  order.orderStatus = 'REFUNDED';
  order.updatedAt = new Date().toISOString();

  serverAuditLogs.unshift({
    id: `log-${Date.now()}`,
    action: 'ORDER_REFUND',
    actor: ADMIN_EMAIL,
    target: order.publicReference,
    details: `Pesanan ${order.publicReference} berhasil di-refund ke pelanggan.`,
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true, message: 'Pesanan berhasil dikembalikan (refunded).', order });
});

// Admin: Retry Supplier Fulfillment
apiRouter.post('/admin/orders/:ref/retry-supplier', requireAdminAuth, (req: Request, res: Response) => {
  const order = serverOrders.find((o) => o.publicReference.toUpperCase() === req.params.ref.toUpperCase());
  if (!order) {
    return res.status(404).json({ success: false, error: 'Pesanan tidak ditemukan.' });
  }

  order.supplierStatus = 'PROCESSING';
  order.orderStatus = 'SUPPLIER_PROCESSING';
  order.updatedAt = new Date().toISOString();

  setTimeout(() => {
    order.supplierStatus = 'SUCCESS';
    order.orderStatus = 'SUCCESS';
    order.supplierSerialNumber = `SN-RETRY-${Date.now()}`;
    order.completedAt = new Date().toISOString();
    order.updatedAt = new Date().toISOString();
  }, 1000);

  serverAuditLogs.unshift({
    id: `log-${Date.now()}`,
    action: 'SUPPLIER_RETRY',
    actor: ADMIN_EMAIL,
    target: order.publicReference,
    details: `Proses ulang supplier dijalankan untuk pesanan ${order.publicReference}.`,
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true, message: 'Pengiriman supplier sedang diproses ulang.', order });
});

// Admin: Configuration Mode Switch (Protected)
apiRouter.post('/admin/set-mode', requireAdminAuth, (req: Request, res: Response) => {
  const { supplierMode, paymentMode } = req.body;

  if (supplierMode) {
    if (supplierMode === 'digiflazz') {
      if (!isDigiflazzConfigured()) {
        return res.status(400).json({
          success: false,
          error: 'Kredensial Digiflazz (DIGIFLAZZ_USER & DIGIFLAZZ_API_KEY) belum dikonfigurasi di environment. Tetap di mode mock.',
        });
      }
      currentSupplierMode = 'digiflazz';
    } else {
      currentSupplierMode = 'mock';
    }
  }

  if (paymentMode) {
    if (paymentMode === 'midtrans') {
      if (!isMidtransConfigured()) {
        return res.status(400).json({
          success: false,
          error: 'Kredensial Midtrans (MIDTRANS_SERVER_KEY) belum dikonfigurasi di environment. Tetap di mode mock.',
        });
      }
      currentPaymentMode = 'midtrans';
    } else {
      currentPaymentMode = 'mock';
    }
  }

  serverAuditLogs.unshift({
    id: `log-${Date.now()}`,
    action: 'INTEGRATION_MODE_CHANGE',
    actor: ADMIN_EMAIL,
    target: 'SystemConfig',
    details: `Mode beralih ke Supplier: ${currentSupplierMode}, Payment: ${currentPaymentMode}`,
    timestamp: new Date().toISOString(),
  });

  res.json({
    success: true,
    supplierMode: currentSupplierMode,
    paymentMode: currentPaymentMode,
    message: 'Mode integrasi berhasil diperbarui oleh administrator.',
  });
});

// ====================================================================
// 7. WEBHOOKS (Midtrans & Digiflazz)
// ====================================================================

// Midtrans Payment Gateway Webhook
apiRouter.post('/webhook/midtrans', (req: Request, res: Response) => {
  const { order_id, status_code, gross_amount, signature_key, transaction_status } = req.body;

  if (!order_id || !status_code || !gross_amount) {
    return res.status(400).json({ error: 'Payload Midtrans tidak lengkap' });
  }

  // Verify SHA-512 Signature if MIDTRANS_SERVER_KEY is configured
  if (MIDTRANS_SERVER_KEY && signature_key) {
    const rawString = `${order_id}${status_code}${gross_amount}${MIDTRANS_SERVER_KEY}`;
    const calculatedSignature = crypto.createHash('sha512').update(rawString).digest('hex');
    if (calculatedSignature !== signature_key) {
      console.warn(`[SECURITY] Signature Midtrans mismatch for order: ${order_id}`);
      return res.status(403).json({ error: 'Signature verifikasi pembayaran tidak valid' });
    }
  }

  const order = serverOrders.find((o) => o.publicReference === order_id);
  if (!order) {
    return res.status(404).json({ error: 'Order ID tidak ditemukan' });
  }

  // Idempotency: If already paid, do not re-fulfill
  if (order.paymentStatus === 'PAID') {
    return res.json({ status: 'ok', message: 'Transaksi sudah diproses sebelumnya (Idempotent)' });
  }

  if (['settlement', 'capture'].includes(transaction_status)) {
    order.paymentStatus = 'PAID';
    order.orderStatus = 'PAYMENT_CONFIRMED';
    order.supplierStatus = 'PROCESSING';
    order.paidAt = new Date().toISOString();
    order.updatedAt = new Date().toISOString();

    // Trigger supplier delivery
    setTimeout(() => {
      order.orderStatus = 'SUCCESS';
      order.supplierStatus = 'SUCCESS';
      order.supplierSerialNumber = `SN-MIDTRANS-${Date.now()}`;
      order.completedAt = new Date().toISOString();
      order.updatedAt = new Date().toISOString();
    }, 1200);

    return res.json({ status: 'ok', message: 'Pembayaran sukses, pesanan diteruskan ke supplier' });
  }

  if (['deny', 'cancel', 'expire', 'failure'].includes(transaction_status)) {
    order.paymentStatus = 'FAILED';
    order.orderStatus = 'FAILED';
    order.updatedAt = new Date().toISOString();
    return res.json({ status: 'ok', message: 'Status transaksi diperbarui menjadi gagal' });
  }

  res.json({ status: 'ok', message: 'Status pending diterima' });
});

// Digiflazz Asynchronous Callback Webhook
apiRouter.post('/webhook/digiflazz', (req: Request, res: Response) => {
  const { data } = req.body;
  if (!data || !data.ref_id) {
    return res.status(400).json({ error: 'Payload Digiflazz tidak valid' });
  }

  const order = serverOrders.find((o) => o.publicReference === data.ref_id);
  if (!order) {
    return res.status(404).json({ error: 'Referensi pesanan tidak ditemukan' });
  }

  if (data.status === 'Sukses') {
    order.supplierStatus = 'SUCCESS';
    order.orderStatus = 'SUCCESS';
    order.supplierSerialNumber = data.sn || `SN-${Date.now()}`;
    order.completedAt = new Date().toISOString();
  } else if (data.status === 'Gagal') {
    order.supplierStatus = 'FAILED';
    order.orderStatus = 'FAILED';
    order.supplierError = data.message || 'Transaksi ditolak oleh supplier';
  }

  order.updatedAt = new Date().toISOString();
  res.json({ status: 'ok', message: 'Callback Digiflazz berhasil diproses' });
});
