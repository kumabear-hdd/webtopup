export type GameCategory = 'all' | 'moba' | 'battle-royale' | 'rpg' | 'fps' | 'sandbox';

export interface GameInputField {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  type: 'text' | 'number' | 'select';
  required: boolean;
  options?: { label: string; value: string }[];
  helperText?: string;
  regexPattern?: string;
}

export interface Game {
  id: string;
  slug: string;
  title: string;
  publisher: string;
  category: GameCategory;
  logoUrl: string;
  bannerUrl: string;
  description: string;
  isActive: boolean;
  isPopular: boolean;
  inputFields: GameInputField[];
  accountCheckSupported: boolean;
  instructions: string;
}

export interface Product {
  id: string;
  gameId: string;
  name: string;
  denomination: string;
  category: 'diamond' | 'pass' | 'membership' | 'uc' | 'points' | 'robux' | 'crystals' | 'token';
  baseCost: number; // IDR supplier cost
  sellingPrice: number; // IDR customer retail price
  supplierSku: string;
  isAvailable: boolean;
  isDemo: boolean;
  badge?: string;
}

export type PaymentCategory = 'qris' | 'ewallet' | 'va' | 'retail';

export interface PaymentMethod {
  id: string;
  code: string;
  name: string;
  category: PaymentCategory;
  feeFlat: number;
  feePercentage: number;
  icon: string;
  processingTime: string;
  instructions: string[];
  accountNumber?: string;
  qrPayload?: string;
}

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAYMENT_PROCESSING'
  | 'PAYMENT_CONFIRMED'
  | 'SUPPLIER_PROCESSING'
  | 'SUCCESS'
  | 'FAILED'
  | 'REFUNDED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'FAILED';
export type SupplierStatus = 'QUEUED' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'MANUAL_REVIEW';

export interface Order {
  id: string;
  publicReference: string; // e.g. KB-20261014-9X3K
  customerContact: {
    whatsapp: string;
    email?: string;
  };
  gameId: string;
  gameTitle: string;
  productId: string;
  productName: string;
  denomination: string;
  targetAccount: Record<string, string>;
  accountNickname?: string;
  baseCost: number;
  subtotal: number;
  paymentFee: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  supplierStatus: SupplierStatus;
  orderStatus: OrderStatus;
  supplierReference?: string;
  supplierSerialNumber?: string; // Serial Number / Voucher Code on success
  supplierError?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  completedAt?: string;
  isTestOrder: boolean;
}

export interface AuditLog {
  id: string;
  action: string;
  actor: string;
  target: string;
  details: string;
  timestamp: string;
}

export interface RevenueReport {
  totalRevenue: number;
  totalProfit: number;
  totalOrders: number;
  successRate: number;
  recentOrdersCount: number;
}

export type UserRole = 'customer' | 'admin' | 'superadmin';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  phone?: string;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: UserProfile;
  message?: string;
  error?: string;
}

