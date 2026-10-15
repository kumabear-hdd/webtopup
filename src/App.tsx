/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useKumabearStore } from './store/useStore';
import { Game, Order } from './types';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { GameCatalog } from './components/GameCatalog';
import { GameTopUpForm } from './components/GameTopUpForm';
import { OrderInvoiceModal } from './components/OrderInvoiceModal';
import { OrderLookupView } from './components/OrderLookupView';
import { CustomerHistoryView } from './components/CustomerHistoryView';
import { AdminDashboard } from './components/AdminDashboard';
import { SupportPolicyModal } from './components/SupportPolicyModal';
import { CustomerAuthModal } from './components/CustomerAuthModal';
import { Footer } from './components/Footer';

export default function App() {
  const store = useKumabearStore();

  const [currentView, setCurrentView] = useState<'catalog' | 'order-lookup' | 'history' | 'support' | 'admin'>('catalog');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [activeInvoiceOrder, setActiveInvoiceOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isCustomerAuthModalOpen, setIsCustomerAuthModalOpen] = useState(false);

  // Handle select game from catalog or hero quick pills
  const handleSelectGame = (game: Game) => {
    setSelectedGame(game);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectGameSlug = (slug: string) => {
    const matched = store.games.find((g) => g.slug === slug);
    if (matched) {
      setSelectedGame(matched);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle Order Submit from GameTopUpForm
  const handleOrderSubmit = async (payload: {
    gameId: string;
    productId: string;
    paymentMethodId: string;
    targetAccount: Record<string, string>;
    accountNickname?: string;
    customerContact: { whatsapp: string; email?: string };
  }) => {
    const res = await store.createOrder(payload);
    if (res.success && res.order) {
      setActiveInvoiceOrder(res.order);
    } else {
      throw new Error(res.error || 'Gagal membuat pesanan');
    }
  };

  // Sync active invoice when order state updates in store
  const currentInvoiceOrder = activeInvoiceOrder
    ? store.orders.find((o) => o.id === activeInvoiceOrder.id) || activeInvoiceOrder
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#060913] text-slate-100 font-sans selection:bg-violet-600 selection:text-white">
      {/* Header with Top Bar Contract */}
      <Header
        currentView={currentView}
        setCurrentView={(view) => {
          setCurrentView(view);
          setSelectedGame(null);
          if (view === 'support') {
            setIsSupportModalOpen(true);
          }
        }}
        isAdminLoggedIn={store.isAdminLoggedIn}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
        currentUser={store.currentUser}
        onOpenCustomerAuth={() => setIsCustomerAuthModalOpen(true)}
      />

      {/* Main Content Areas */}
      <main className="flex-1">
        {selectedGame ? (
          // Product Detail Page / Game Top Up Workflow
          <GameTopUpForm
            game={selectedGame}
            products={store.products}
            paymentMethods={store.paymentMethods}
            onBack={() => setSelectedGame(null)}
            onSubmitOrder={handleOrderSubmit}
            onCheckAccount={store.checkAccount}
            calculatePricing={store.calculatePricing}
          />
        ) : currentView === 'catalog' ? (
          // Storefront Homepage: Hero + Game Catalog
          <>
            <Hero
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onSelectGameSlug={handleSelectGameSlug}
            />
            <GameCatalog
              games={store.games}
              searchQuery={searchQuery}
              onSelectGame={handleSelectGame}
            />
          </>
        ) : currentView === 'order-lookup' ? (
          // Order Lookup Page
          <OrderLookupView
            orders={store.orders}
            onSelectOrder={(order) => setActiveInvoiceOrder(order)}
          />
        ) : currentView === 'history' ? (
          // Customer Transaction History
          <CustomerHistoryView
            orders={store.orders}
            customerOrders={store.customerOrders}
            games={store.games}
            customerPhone={store.customerPhone}
            currentUser={store.currentUser}
            onOpenAuth={() => setIsCustomerAuthModalOpen(true)}
            onSetCustomerPhone={store.setCustomerPhone}
            onSelectOrder={(order) => setActiveInvoiceOrder(order)}
            onSelectGame={handleSelectGame}
          />
        ) : null}
      </main>

      {/* Order Checkout & Invoice Modal */}
      {currentInvoiceOrder && (
        <OrderInvoiceModal
          order={currentInvoiceOrder}
          onClose={() => setActiveInvoiceOrder(null)}
          onSimulatePay={store.simulatePaymentSuccess}
        />
      )}

      {/* Customer Authentication Modal (Login / Register) */}
      <CustomerAuthModal
        isOpen={isCustomerAuthModalOpen}
        onClose={() => setIsCustomerAuthModalOpen(false)}
        currentUser={store.currentUser}
        onLogin={store.customerLogin}
        onRegister={store.customerRegister}
        onLogout={store.logout}
      />

      {/* Support & Refund Policy Modal */}
      {isSupportModalOpen && (
        <SupportPolicyModal
          onClose={() => {
            setIsSupportModalOpen(false);
            if (currentView === 'support') setCurrentView('catalog');
          }}
        />
      )}

      {/* Admin Dashboard Console Modal */}
      {isAdminModalOpen && (
        <AdminDashboard
          isAdminLoggedIn={store.isAdminLoggedIn}
          onLogin={store.adminLogin}
          onLogout={store.adminLogout}
          games={store.games}
          products={store.products}
          orders={store.orders}
          auditLogs={store.auditLogs}
          revenueReport={store.getRevenueReport()}
          onUpdateProduct={store.updateProduct}
          onUpdateGame={store.updateGame}
          onRetryFulfillment={store.retrySupplierFulfillment}
          onRefundOrder={store.refundOrder}
          onSyncCatalog={store.syncCatalogWithSupplier}
          supplierMode={store.supplierMode}
          paymentGatewayMode={store.paymentGatewayMode}
          onToggleSupplier={store.toggleSupplierProvider}
          onTogglePayment={store.togglePaymentProvider}
          onClose={() => setIsAdminModalOpen(false)}
        />
      )}

      {/* Footer */}
      <Footer
        onOpenPolicy={() => setIsSupportModalOpen(true)}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
        onSelectCategory={() => {
          setSelectedGame(null);
          setCurrentView('catalog');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
}
