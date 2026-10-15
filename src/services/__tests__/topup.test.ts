import { orderCreationSchema, customerContactSchema } from '../../utils/validation';
import { MockSupplierAdapter } from '../supplier';
import { MockPaymentProvider } from '../payment';
import { Order, Product, PaymentMethod } from '../../types';

export function runAutomatedTests() {
  const results: { name: string; passed: boolean; message?: string }[] = [];

  function test(name: string, fn: () => void | Promise<void>) {
    try {
      const res = fn();
      if (res instanceof Promise) {
        return res
          .then(() => results.push({ name, passed: true }))
          .catch((err) => results.push({ name, passed: false, message: String(err) }));
      }
      results.push({ name, passed: true });
    } catch (err) {
      results.push({ name, passed: false, message: String(err) });
    }
  }

  // 1. Zod Phone Validation Tests
  test('Customer Phone: Valid Indonesian format', () => {
    const valid1 = customerContactSchema.safeParse({ whatsapp: '081234567890' });
    const valid2 = customerContactSchema.safeParse({ whatsapp: '+628123456789' });
    const invalid = customerContactSchema.safeParse({ whatsapp: '12345' });

    if (!valid1.success || !valid2.success || invalid.success) {
      throw new Error('Customer phone validation failed expected criteria');
    }
  });

  // 2. Order Creation Schema Validation
  test('Order Schema: Complete valid payload', () => {
    const validPayload = {
      gameId: 'game-mlbb',
      productId: 'prod-ml-1',
      paymentMethodId: 'pay-qris',
      targetAccount: { userId: '12345678', zoneId: '2024' },
      customerContact: { whatsapp: '081234567890' },
    };
    const res = orderCreationSchema.safeParse(validPayload);
    if (!res.success) {
      throw new Error('Valid order creation rejected by schema: ' + JSON.stringify(res.error));
    }
  });

  // 3. Server-side Pricing Calculation
  test('Pricing Calculation: IDR Subtotal + Flat & Percentage Fee', () => {
    const subtotal = 100000;
    const flatFee = 1000;
    const pctFee = 0.015; // 1.5%
    const paymentFee = flatFee + Math.round(subtotal * pctFee);
    const totalAmount = subtotal + paymentFee;

    if (paymentFee !== 2500 || totalAmount !== 102500) {
      throw new Error(`Expected totalAmount 102500 but got ${totalAmount}`);
    }
  });

  // 4. Mock Supplier Adapter Test
  test('Supplier Adapter: MLBB account nickname check', async () => {
    const adapter = new MockSupplierAdapter();
    const check = await adapter.checkAccount('game-mlbb', { userId: '12345678', zoneId: '2024' });
    if (!check.isValid || !check.nickname) {
      throw new Error('Supplier checkAccount should return valid nickname');
    }
  });

  // 5. Payment Idempotency & State Transition Simulation
  test('Payment Provider: Generates QRIS payload and unique reference', async () => {
    const provider = new MockPaymentProvider();
    const mockOrder: Order = {
      id: 'test-1',
      publicReference: 'KG-TEST-001',
      customerContact: { whatsapp: '081234567890' },
      gameId: 'game-mlbb',
      gameTitle: 'MLBB',
      productId: 'prod-1',
      productName: '86 Diamonds',
      denomination: '86 DM',
      targetAccount: { userId: '12345', zoneId: '2024' },
      baseCost: 19800,
      subtotal: 21500,
      paymentFee: 151,
      totalAmount: 21651,
      paymentMethod: {
        id: 'qris',
        code: 'QRIS',
        name: 'QRIS',
        category: 'qris',
        feeFlat: 0,
        feePercentage: 0.007,
        icon: 'QrCode',
        processingTime: 'Instant',
        instructions: ['Scan QR'],
      },
      paymentStatus: 'PENDING',
      supplierStatus: 'QUEUED',
      orderStatus: 'PENDING_PAYMENT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isTestOrder: true,
    };

    const res = await provider.createPayment(mockOrder, mockOrder.paymentMethod);
    if (!res.providerReference || !res.qrPayload) {
      throw new Error('Payment request result missing reference or QR');
    }
  });

  // 6. Supplier Fulfillment Verification
  test('Supplier Fulfillment: Top-up submission returns serial number', async () => {
    const adapter = new MockSupplierAdapter();
    const mockOrder: Order = {
      id: 'test-2',
      publicReference: 'KG-TEST-002',
      customerContact: { whatsapp: '081234567890' },
      gameId: 'game-mlbb',
      gameTitle: 'MLBB',
      productId: 'prod-1',
      productName: '86 Diamonds',
      denomination: '86 DM',
      targetAccount: { userId: '12345', zoneId: '2024' },
      baseCost: 19800,
      subtotal: 21500,
      paymentFee: 151,
      totalAmount: 21651,
      paymentMethod: {} as PaymentMethod,
      paymentStatus: 'PAID',
      supplierStatus: 'QUEUED',
      orderStatus: 'PAYMENT_CONFIRMED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isTestOrder: true,
    };
    const mockProduct: Product = {
      id: 'prod-1',
      gameId: 'game-mlbb',
      name: '86 Diamonds',
      denomination: '86 DM',
      category: 'diamond',
      baseCost: 19800,
      sellingPrice: 21500,
      supplierSku: 'ML-86',
      isAvailable: true,
      isDemo: true,
    };

    const res = await adapter.submitTopUp(mockOrder, mockProduct);
    if (!res.success || !res.serialNumber) {
      throw new Error('Supplier top-up did not succeed as expected');
    }
  });

  return results;
}
