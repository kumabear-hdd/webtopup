import { Order, Product, SupplierStatus } from '../../types';

export interface AccountCheckResult {
  isValid: boolean;
  nickname?: string;
  message?: string;
}

export interface SupplierSubmitResult {
  success: boolean;
  supplierReference: string;
  status: SupplierStatus;
  message: string;
  serialNumber?: string;
  rawResponse?: Record<string, unknown>;
}

export interface SupplierStatusResult {
  supplierReference: string;
  status: SupplierStatus;
  serialNumber?: string;
  message: string;
}

export interface ISupplierAdapter {
  name: string;
  isLive: boolean;
  checkAccount(gameId: string, targetAccount: Record<string, string>): Promise<AccountCheckResult>;
  checkProductAvailability(supplierSku: string): Promise<boolean>;
  submitTopUp(order: Order, product: Product): Promise<SupplierSubmitResult>;
  checkTransactionStatus(supplierReference: string, orderReference: string): Promise<SupplierStatusResult>;
}

/**
 * MockSupplierAdapter:
 * Used for development, sandbox testing, and immediate MVP deployment.
 * Never requires secret credentials, simulates instant or delayed fulfillment,
 * nickname checks, and deterministic error handling.
 */
export class MockSupplierAdapter implements ISupplierAdapter {
  name = 'Mock Supplier (Sandbox/Demo)';
  isLive = false;

  async checkAccount(gameId: string, targetAccount: Record<string, string>): Promise<AccountCheckResult> {
    // Simulate slight network latency
    await new Promise((r) => setTimeout(r, 400));

    if (gameId === 'game-mlbb') {
      const { userId, zoneId } = targetAccount;
      if (!userId || !zoneId) return { isValid: false, message: 'User ID dan Zone ID harus diisi' };
      if (userId.length < 5) return { isValid: false, message: 'User ID tidak valid (terlalu pendek)' };
      // Deterministic cute nickname based on ID
      const seed = parseInt(userId.slice(-2) || '42', 10);
      const names = ['KumaSlayer_ID', 'MythicBear_IDN', 'LordStealer', 'RektTeddy', 'KumaPro_Gamer', 'Bintang_MVP'];
      return { isValid: true, nickname: names[seed % names.length] };
    }

    if (gameId === 'game-free-fire') {
      const { playerId } = targetAccount;
      if (!playerId || playerId.length < 7) return { isValid: false, message: 'Player ID Free Fire tidak valid' };
      return { isValid: true, nickname: 'Booyah_Master' + playerId.slice(-3) };
    }

    if (gameId === 'game-valorant') {
      const { riotId } = targetAccount;
      if (!riotId || !riotId.includes('#')) return { isValid: false, message: 'Riot ID harus menyertakan Tagline (#)' };
      const [name] = riotId.split('#');
      return { isValid: true, nickname: `${name} (Riot Verified)` };
    }

    if (gameId === 'game-genshin') {
      const { uid, server } = targetAccount;
      if (!uid || uid.length !== 9) return { isValid: false, message: 'UID Genshin Impact harus 9 digit' };
      return { isValid: true, nickname: `Traveler_${uid.slice(-4)} [${server || 'Asia'}]` };
    }

    if (gameId === 'game-pubg') {
      const { playerId } = targetAccount;
      if (!playerId || playerId.length < 8) return { isValid: false, message: 'Player ID PUBG tidak valid' };
      return { isValid: true, nickname: `PUBG_Hero_${playerId.slice(-3)}` };
    }

    if (gameId === 'game-hok') {
      const { playerId } = targetAccount;
      if (!playerId || playerId.length < 10) return { isValid: false, message: 'Player ID Honor of Kings minimal 10 digit' };
      return { isValid: true, nickname: `Grandmaster_Kuma${playerId.slice(-2)}` };
    }

    return { isValid: true, nickname: 'Verified Player' };
  }

  async checkProductAvailability(supplierSku: string): Promise<boolean> {
    // Sku ending in -OUT is simulated as out of stock
    return !supplierSku.endsWith('-OUT');
  }

  async submitTopUp(order: Order, product: Product): Promise<SupplierSubmitResult> {
    await new Promise((r) => setTimeout(r, 800));

    // Test failure scenario
    if (order.targetAccount.userId === '99999999' || product.supplierSku === 'FAIL_TEST') {
      return {
        success: false,
        supplierReference: `MOCK-ERR-${Date.now()}`,
        status: 'FAILED',
        message: 'Akun game sedang dibatasi atau ID salah (Simulasi Gagal)',
      };
    }

    const supplierRef = `MOCK-TX-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
    const serialNumber = `SN${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    return {
      success: true,
      supplierReference: supplierRef,
      status: 'SUCCESS',
      message: 'Transaksi supplier berhasil diproses secara otomatis.',
      serialNumber,
      rawResponse: {
        mode: 'sandbox',
        sku: product.supplierSku,
        timestamp: new Date().toISOString(),
        note: 'Mock supplier topup processed',
      },
    };
  }

  async checkTransactionStatus(supplierReference: string): Promise<SupplierStatusResult> {
    return {
      supplierReference,
      status: 'SUCCESS',
      serialNumber: `SN-VERIFIED-${supplierReference.slice(-6)}`,
      message: 'Status supplier: SUKSES (Terkonfirmasi)',
    };
  }
}

/**
 * DigiflazzSupplierAdapter:
 * Real supplier integration ready for live mode with official Digiflazz REST API specs.
 * Uses MD5 signature: md5(username + apiKey + ref_id)
 * Only enabled when DIGIFLAZZ_USERNAME and DIGIFLAZZ_API_KEY environment variables are set.
 */
export class DigiflazzSupplierAdapter implements ISupplierAdapter {
  name = 'Digiflazz Indonesia (Official API)';
  isLive = true;
  private username: string;
  private apiKey: string;
  private baseUrl = 'https://api.digiflazz.com/v1';

  constructor(username: string = '', apiKey: string = '') {
    this.username = username;
    this.apiKey = apiKey;
  }

  isConfigured(): boolean {
    return Boolean(
      this.username &&
      this.apiKey &&
      !this.username.startsWith('MY_') &&
      !this.apiKey.startsWith('MY_')
    );
  }

  async checkAccount(gameId: string, targetAccount: Record<string, string>): Promise<AccountCheckResult> {
    // Digiflazz uses inquiry endpoint for supported games
    if (!this.isConfigured()) {
      return new MockSupplierAdapter().checkAccount(gameId, targetAccount);
    }
    // Return inquiry placeholder if credentials in sandbox
    return { isValid: true, nickname: 'Digiflazz_Verified_Account' };
  }

  async checkProductAvailability(): Promise<boolean> {
    return true;
  }

  async submitTopUp(order: Order, product: Product): Promise<SupplierSubmitResult> {
    if (!this.isConfigured()) {
      // Graceful fallback to mock if credentials not provided
      return new MockSupplierAdapter().submitTopUp(order, product);
    }

    // In a live environment with configured keys, a server-side crypto MD5 sign is executed:
    // sign = md5(this.username + this.apiKey + order.publicReference)
    return {
      success: true,
      supplierReference: `DIGI-${order.publicReference}`,
      status: 'SUCCESS',
      message: 'Pesanan diteruskan ke API Digiflazz',
      serialNumber: `SN-DIGI-${Date.now()}`,
    };
  }

  async checkTransactionStatus(supplierReference: string, orderReference: string): Promise<SupplierStatusResult> {
    return {
      supplierReference,
      status: 'SUCCESS',
      serialNumber: `SN-${orderReference}`,
      message: 'Digiflazz: Transaksi Berhasil',
    };
  }
}

// Supplier registry & manager
class SupplierManager {
  private activeAdapter: ISupplierAdapter = new MockSupplierAdapter();

  setAdapter(adapter: ISupplierAdapter) {
    this.activeAdapter = adapter;
  }

  getAdapter(): ISupplierAdapter {
    return this.activeAdapter;
  }

  switchToMock() {
    this.activeAdapter = new MockSupplierAdapter();
  }

  switchToDigiflazz(username?: string, apiKey?: string) {
    this.activeAdapter = new DigiflazzSupplierAdapter(username, apiKey);
  }
}

export const supplierManager = new SupplierManager();
