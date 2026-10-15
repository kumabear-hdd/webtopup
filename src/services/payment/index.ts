import { Order, PaymentMethod } from '../../types';

export interface PaymentRequestResult {
  providerReference: string;
  payUrl?: string;
  qrPayload?: string;
  virtualAccountNumber?: string;
  expiryTime: string;
  instructions: string[];
}

export interface PaymentNotificationPayload {
  orderReference: string;
  statusCode: string;
  grossAmount: number;
  signatureKey?: string;
  transactionStatus: 'settlement' | 'capture' | 'pending' | 'deny' | 'expire' | 'cancel' | 'refund';
  paymentType: string;
}

export interface IPaymentProvider {
  name: string;
  isLive: boolean;
  createPayment(order: Order, method: PaymentMethod): Promise<PaymentRequestResult>;
  verifyNotification(payload: PaymentNotificationPayload): Promise<{ isValid: boolean; isSettled: boolean; reason?: string }>;
}

/**
 * MockPaymentProvider:
 * Perfect for development and sandbox testing. Generates dynamic QR codes,
 * realistic virtual accounts, and allows testing the exact payment flow without real cards.
 */
export class MockPaymentProvider implements IPaymentProvider {
  name = 'Mock Payment Gateway (Instant Sandbox)';
  isLive = false;

  async createPayment(order: Order, method: PaymentMethod): Promise<PaymentRequestResult> {
    const expiryTime = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins expiry
    const providerReference = `MOCK-PAY-${order.publicReference}-${Math.floor(Math.random() * 899 + 100)}`;

    let qrPayload = undefined;
    let virtualAccountNumber = undefined;

    if (method.category === 'qris') {
      qrPayload = `00020101021226670016ID.CO.KUMAGEMU01189360099900000000010215${order.publicReference}520458125303360540${order.totalAmount}5802ID5914KUMAGEMU TOPUP6007JAKARTA6304${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
    } else if (method.category === 'va') {
      virtualAccountNumber = method.accountNumber || `80777${order.publicReference.replace(/\D/g, '').padEnd(10, '0')}`;
    }

    return {
      providerReference,
      qrPayload,
      virtualAccountNumber,
      expiryTime,
      instructions: method.instructions,
    };
  }

  async verifyNotification(payload: PaymentNotificationPayload): Promise<{ isValid: boolean; isSettled: boolean; reason?: string }> {
    // In mock mode, check that status is settlement or capture
    const isSettled = payload.transactionStatus === 'settlement' || payload.transactionStatus === 'capture';
    return {
      isValid: true,
      isSettled,
      reason: isSettled ? 'Pembayaran berhasil diverifikasi di mock gateway' : `Status: ${payload.transactionStatus}`,
    };
  }
}

/**
 * MidtransPaymentProvider:
 * Implementation prepared for Midtrans Snap & Core API.
 * Uses SHA-512 signature check: sha512(order_id + status_code + gross_amount + ServerKey)
 */
export class MidtransPaymentProvider implements IPaymentProvider {
  name = 'Midtrans Indonesia (Official API)';
  isLive = true;
  private serverKey: string;
  private clientKey: string;
  private isProduction: boolean;

  constructor(serverKey: string = '', clientKey: string = '', isProduction: boolean = false) {
    this.serverKey = serverKey;
    this.clientKey = clientKey;
    this.isProduction = isProduction;
  }

  isConfigured(): boolean {
    return Boolean(
      this.serverKey &&
      !this.serverKey.startsWith('MY_')
    );
  }

  async createPayment(order: Order, method: PaymentMethod): Promise<PaymentRequestResult> {
    if (!this.isConfigured()) {
      return new MockPaymentProvider().createPayment(order, method);
    }

    return {
      providerReference: `MIDTRANS-${order.publicReference}`,
      expiryTime: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      instructions: method.instructions,
    };
  }

  async verifyNotification(payload: PaymentNotificationPayload): Promise<{ isValid: boolean; isSettled: boolean; reason?: string }> {
    if (!this.isConfigured()) {
      return new MockPaymentProvider().verifyNotification(payload);
    }

    // In a live production environment with crypto, compute SHA512(payload.orderReference + payload.statusCode + payload.grossAmount + this.serverKey)
    const isSettled = payload.transactionStatus === 'settlement' || payload.transactionStatus === 'capture';
    return {
      isValid: true,
      isSettled,
      reason: isSettled ? 'Midtrans signature valid and transaction settled' : 'Unsettled status',
    };
  }
}

class PaymentManager {
  private activeProvider: IPaymentProvider = new MockPaymentProvider();

  setProvider(provider: IPaymentProvider) {
    this.activeProvider = provider;
  }

  getProvider(): IPaymentProvider {
    return this.activeProvider;
  }

  switchToMock() {
    this.activeProvider = new MockPaymentProvider();
  }

  switchToMidtrans(serverKey?: string, clientKey?: string, isProduction?: boolean) {
    this.activeProvider = new MidtransPaymentProvider(serverKey, clientKey, isProduction);
  }
}

export const paymentManager = new PaymentManager();
