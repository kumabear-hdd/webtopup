import { z } from 'zod';

export const customerContactSchema = z.object({
  whatsapp: z
    .string()
    .min(9, 'Nomor WhatsApp minimal 9 digit')
    .max(15, 'Nomor WhatsApp maksimal 15 digit')
    .regex(/^(\+62|62|08)[0-9]{7,13}$/, 'Format nomor WhatsApp tidak valid (contoh: 08123456789)'),
  email: z
    .string()
    .email('Format email tidak valid')
    .optional()
    .or(z.literal('')),
});

export const orderCreationSchema = z.object({
  gameId: z.string().min(1, 'Game wajib dipilih'),
  productId: z.string().min(1, 'Produk/nominal wajib dipilih'),
  paymentMethodId: z.string().min(1, 'Metode pembayaran wajib dipilih'),
  targetAccount: z.record(z.string(), z.string()),
  customerContact: customerContactSchema,
});

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function generatePublicReference(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `KG-${dateStr}-${randomChars}`;
}

export const userRegisterSchema = z.object({
  fullName: z.string().min(3, 'Nama lengkap minimal 3 karakter').max(80, 'Nama lengkap maksimal 80 karakter'),
  email: z.string().email('Format email tidak valid').max(120, 'Email maksimal 120 karakter'),
  password: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .regex(/[A-Z]/, 'Password harus memiliki minimal 1 huruf kapital')
    .regex(/[a-z]/, 'Password harus memiliki minimal 1 huruf kecil')
    .regex(/[0-9]/, 'Password harus memiliki minimal 1 angka'),
  phone: z
    .string()
    .min(9, 'Nomor HP minimal 9 digit')
    .max(16, 'Nomor HP maksimal 16 digit')
    .regex(/^(\+62|62|08)[0-9]{7,13}$/, 'Format nomor HP tidak valid (contoh: 08123456789)'),
});

export const userLoginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

export const adminLoginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password administrator wajib diisi'),
});

