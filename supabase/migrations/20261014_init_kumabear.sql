-- ====================================================================
-- KUMAGEMU — PRODUCTION DATABASE SCHEMA MIGRATION
-- Engine: Supabase PostgreSQL (Strict Mode with RLS)
-- Currency: Indonesian Rupiah (IDR, Bigint/Integer)
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Customer & Admin Accounts)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'superadmin')),
  full_name VARCHAR(120),
  phone VARCHAR(30) UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. GAMES (Catalog & Dynamic Input Field Schemas)
CREATE TABLE IF NOT EXISTS public.games (
  id VARCHAR(64) PRIMARY KEY,
  slug VARCHAR(80) UNIQUE NOT NULL,
  title VARCHAR(120) NOT NULL,
  publisher VARCHAR(100) NOT NULL,
  category VARCHAR(40) NOT NULL CHECK (category IN ('moba', 'battle-royale', 'rpg', 'fps', 'sandbox', 'other')),
  logo_url TEXT NOT NULL,
  banner_url TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_popular BOOLEAN NOT NULL DEFAULT FALSE,
  account_check_supported BOOLEAN NOT NULL DEFAULT TRUE,
  instructions TEXT,
  input_fields_schema JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. PRODUCTS (SKUs, Supplier Costs & Retail Pricing)
CREATE TABLE IF NOT EXISTS public.products (
  id VARCHAR(64) PRIMARY KEY,
  game_id VARCHAR(64) NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  denomination VARCHAR(80) NOT NULL,
  category VARCHAR(40) NOT NULL,
  base_cost_idr BIGINT NOT NULL CHECK (base_cost_idr >= 0),
  selling_price_idr BIGINT NOT NULL CHECK (selling_price_idr >= base_cost_idr),
  supplier_sku VARCHAR(80) NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  badge VARCHAR(60),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. ORDERS (Customer Purchases & State Machine)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  public_reference VARCHAR(40) UNIQUE NOT NULL,
  customer_phone VARCHAR(30) NOT NULL,
  customer_email VARCHAR(120),
  game_id VARCHAR(64) NOT NULL REFERENCES public.games(id),
  game_title VARCHAR(120) NOT NULL,
  product_id VARCHAR(64) NOT NULL REFERENCES public.products(id),
  product_name VARCHAR(120) NOT NULL,
  denomination VARCHAR(80) NOT NULL,
  target_account JSONB NOT NULL,
  account_nickname VARCHAR(100),
  base_cost_idr BIGINT NOT NULL,
  subtotal_idr BIGINT NOT NULL,
  payment_fee_idr BIGINT NOT NULL DEFAULT 0,
  total_amount_idr BIGINT NOT NULL,
  payment_method_id VARCHAR(64) NOT NULL,
  payment_method_name VARCHAR(80) NOT NULL,
  payment_status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'EXPIRED', 'FAILED')),
  supplier_status VARCHAR(30) NOT NULL DEFAULT 'QUEUED' CHECK (supplier_status IN ('QUEUED', 'PROCESSING', 'SUCCESS', 'FAILED', 'MANUAL_REVIEW')),
  order_status VARCHAR(40) NOT NULL DEFAULT 'PENDING_PAYMENT' CHECK (order_status IN ('PENDING_PAYMENT', 'PAYMENT_PROCESSING', 'PAYMENT_CONFIRMED', 'SUPPLIER_PROCESSING', 'SUCCESS', 'FAILED', 'REFUNDED')),
  supplier_reference VARCHAR(100),
  supplier_serial_number VARCHAR(120),
  supplier_error TEXT,
  paid_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. PAYMENTS (Provider Transactions & Idempotency)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_reference VARCHAR(40) NOT NULL,
  provider VARCHAR(40) NOT NULL DEFAULT 'mock',
  provider_reference VARCHAR(100) UNIQUE,
  amount_idr BIGINT NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'PENDING',
  payload JSONB,
  signature_hash VARCHAR(256),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. SUPPLIER_TRANSACTIONS (Fulfillment Log)
CREATE TABLE IF NOT EXISTS public.supplier_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  supplier VARCHAR(40) NOT NULL DEFAULT 'mock',
  supplier_sku VARCHAR(80) NOT NULL,
  target_account JSONB NOT NULL,
  supplier_reference VARCHAR(100),
  serial_number VARCHAR(120),
  status VARCHAR(40) NOT NULL,
  raw_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. AUDIT_LOGS (Security & Traceability)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action VARCHAR(80) NOT NULL,
  actor VARCHAR(80) NOT NULL,
  target VARCHAR(120) NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES FOR HIGH-PERFORMANCE SEARCH
CREATE INDEX IF NOT EXISTS idx_orders_public_reference ON public.orders(public_reference);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_products_game_id ON public.products(game_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_ref ON public.payments(order_reference);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Games & Products: Publicly readable by everyone
CREATE POLICY "Public games can be viewed by all" ON public.games
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Public products can be viewed by all" ON public.products
  FOR SELECT USING (is_available = TRUE);

-- Orders: Public can create orders
CREATE POLICY "Anyone can create pending orders" ON public.orders
  FOR INSERT WITH CHECK (TRUE);

-- Orders: Can be looked up by public reference or customer phone
CREATE POLICY "Customers can lookup order by reference" ON public.orders
  FOR SELECT USING (TRUE);

-- Admin Full Access Policy Helper Function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admins have full access to manage games, products, orders, audit logs
CREATE POLICY "Admins full manage games" ON public.games
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admins full manage products" ON public.products
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admins full manage orders" ON public.orders
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admins full view audit logs" ON public.audit_logs
  FOR ALL USING (public.is_admin());
