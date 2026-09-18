import React, { useState, useEffect } from 'react';
import { RetailProvider, useRetail } from './context/RetailContext';
import { LicenseRiskBanner } from './components/common/LicenseRiskBanner';
import { RemoteLockScreen } from './components/common/RemoteLockScreen';
import { RemoteAlertModal } from './components/common/RemoteAlertModal';
import { TopNavbar } from './components/common/TopNavbar';
import { SuperAdminDashboard } from './components/superadmin/SuperAdminDashboard';
import { SuperAdminLoginModal } from './components/superadmin/SuperAdminLoginModal';
import { SuperAdminPasswordModal } from './components/superadmin/SuperAdminPasswordModal';
import { ShopDashboard } from './components/shop/ShopDashboard';
import { ProductManager } from './components/shop/ProductManager';
import { CustomFieldsStudio } from './components/shop/CustomFieldsStudio';
import { BarcodeLabelStudio } from './components/shop/BarcodeLabelStudio';
import { CustomerCreditManager } from './components/shop/CustomerCreditManager';
import { SupplierPurchasesManager } from './components/shop/SupplierPurchasesManager';
import { ExpiryBatchManager } from './components/shop/ExpiryBatchManager';
import { FinanceExpensesManager } from './components/shop/FinanceExpensesManager';
import { ReportsManager } from './components/shop/ReportsManager';
import { ShopSettingsStudio } from './components/shop/ShopSettingsStudio';
import { UserManager } from './components/shop/UserManager';
import { CategoryManager } from './components/shop/CategoryManager';
import { ExcelDataStudio } from './components/shop/ExcelDataStudio';
import { SalesManager } from './components/shop/SalesManager';
import { PromotionsManager } from './components/shop/PromotionsManager';
import { RepairJobsManager } from './components/shop/RepairJobsManager';
import { VehicleServiceManager } from './components/shop/VehicleServiceManager';
import { StaffSalariesManager } from './components/shop/StaffSalariesManager';
import { StockAdjustmentManager } from './components/shop/StockAdjustmentManager';
import { PosTerminal } from './components/pos/PosTerminal';
import { MultiTenantAuthGate } from './components/auth/MultiTenantAuthGate';
import { DailyOpeningBriefingModal } from './components/common/DailyOpeningBriefingModal';
import { MultiCounterNetworkStudio } from './components/shop/MultiCounterNetworkStudio';
import { CashDrawerStudio } from './components/shop/CashDrawerStudio';
import { ShopUrgentMessageBanner } from './components/common/ShopUrgentMessageBanner';
import { ShopMessagesModal } from './components/common/ShopMessagesModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';

import {
  LayoutDashboard,
  Receipt,
  Package,
  Layers,
  Barcode,
  FormInput,
  Users,
  Truck,
  Calendar,
  Wallet,
  TrendingUp,
  Settings,
  ShieldCheck,
  CreditCard,
  ChevronRight,
  Megaphone,
  Wrench,
  Car,
  Scale,
  FileSpreadsheet,
  Lock,
  Network,
  Vault,
} from 'lucide-react';

const MainAppLayout: React.FC = () => {
  const { 
    isSuperAdminMode, 
    isSuperAdminAuthenticated, 
    currentTenantId,
    setCurrentTenantId, 
    currentTenant, 
    currentUser,
    authSession,
    t 
  } = useRetail();

  const [activeTab, setActiveTab] = useState<string>('DASHBOARD');
  const [isPosOpen, setIsPosOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const [isDailyBriefingOpen, setIsDailyBriefingOpen] = useState<boolean>(false);
  const [isShopMessagesOpen, setIsShopMessagesOpen] = useState<boolean>(false);

  const isOwnerOrAdmin =
    isSuperAdminMode ||
    currentUser?.role === 'OWNER' ||
    currentUser?.role === 'ADMIN' ||
    currentUser?.role === 'SUPER_ADMIN';

  // Automatically display low stock and customer account balance alert modal on daily system open
  useEffect(() => {
    if (!currentTenantId || currentTenantId === 'SUPER_ADMIN' || !authSession) return;

    const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    const lastSeenKey = `WCS_DAILY_BRIEFING_LAST_SHOWN_${currentTenantId}`;
    const autoOpenKey = `WCS_DAILY_BRIEFING_AUTO_OPEN_${currentTenantId}`;

    const autoOpen = localStorage.getItem(autoOpenKey) !== 'false';
    const lastSeen = localStorage.getItem(lastSeenKey);

    // If auto-open is enabled and not already shown today in this browser session
    if (autoOpen && lastSeen !== todayStr) {
      const timer = setTimeout(() => {
        setIsDailyBriefingOpen(true);
        localStorage.setItem(lastSeenKey, todayStr);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [currentTenantId, authSession]);

  // Automatically restrict non-admin/owner users to allowed operations
  useEffect(() => {
    if (!authSession || isSuperAdminMode || isOwnerOrAdmin) return;
    const allowedTabsForStaff = [
      'SALES',
      'PRODUCTS',
      'CATEGORIES',
      'BARCODE_STUDIO',
      'CREDIT',
      'FINANCE',
      'CASH_DRAWER',
    ];
    if (!allowedTabsForStaff.includes(activeTab)) {
      setActiveTab('SALES');
    }
  }, [authSession, isSuperAdminMode, isOwnerOrAdmin, activeTab]);

  // If user is completely unauthenticated / logged out
  if (!authSession) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
        <RemoteLockScreen />
        <MultiTenantAuthGate
          isOpen={true}
          onPostLoginAction={(destination) => {
            if (destination === 'POS') {
              setIsPosOpen(true);
            } else if (destination === 'SALES') {
              setIsPosOpen(false);
              setActiveTab('SALES');
            } else if (destination === 'PRODUCTS') {
              setIsPosOpen(false);
              setActiveTab('PRODUCTS');
            } else {
              setIsPosOpen(false);
              setActiveTab('DASHBOARD');
            }
          }}
        />
      </div>
    );
  }

  // If in Cashier POS Terminal Mode
  if (isPosOpen) {
    return (
      <ErrorBoundary fallbackTitle="POS Terminal Interrupted">
        <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
          <RemoteLockScreen />
          <LicenseRiskBanner />
          <PosTerminal onClosePos={() => setIsPosOpen(false)} />
        </div>
      </ErrorBoundary>
    );
  }

  const isPhoneOrComputer = currentTenant?.business_type === 'phone_shop' || currentTenant?.business_type === 'computer_shop';
  const isVehicleService = currentTenant?.business_type === 'vehicle_service';

  // Navigation Items for Shop Workspace
  // Admin & Owner have Full Access. Other users have access only to Sales, Returns, Bill Reprint, Products, Categories, Barcodes, Customer Pay, Expenses/Payouts, Cash Balance & Day End Reports.
  const allOwnerAdminNavItems = [
    { id: 'DASHBOARD', label: t.dashboard || 'Dashboard', icon: LayoutDashboard },
    { id: 'SALES', label: t.sales || 'Sales & Returns / Reprint', icon: Receipt },
    ...(isPhoneOrComputer
      ? [{ id: 'REPAIR_JOBS', label: 'Device Repair Jobs', icon: Wrench }]
      : []),
    ...(isVehicleService
      ? [{ id: 'VEHICLE_SERVICE', label: 'Vehicle Service Station', icon: Car }]
      : []),
    { id: 'PROMOTIONS', label: 'Promotions & WhatsApp', icon: Megaphone },
    { id: 'PRODUCTS', label: t.products || 'Products & Stock', icon: Package },
    { id: 'CATEGORIES', label: t.categories || 'Categories', icon: Layers },
    { id: 'BARCODE_STUDIO', label: t.barcodeStudio || 'Barcode Studio', icon: Barcode },
    { id: 'CUSTOM_FIELDS', label: t.customFields || 'Custom Fields', icon: FormInput },
    { id: 'CREDIT', label: t.customers || 'Credit Ledger', icon: Users },
    { id: 'SUPPLIERS', label: t.suppliers || 'Suppliers & PO', icon: Truck },
    { id: 'BATCH_EXPIRY', label: t.expiryBatches || 'Batch & Expiry', icon: Calendar },
    { id: 'STOCK_ADJUST', label: 'Stock Gap & Discrepancies', icon: Scale },
    { id: 'CASH_DRAWER', label: 'Cash Drawer & Day Shifts', icon: Vault },
    { id: 'STAFF_SALARIES', label: 'Staff Salaries & Payroll', icon: Users },
    { id: 'FINANCE', label: t.expenses || 'Expenses & Payouts', icon: Wallet },
    { id: 'REPORTS', label: t.reports || 'Reports', icon: TrendingUp },
    { id: 'EXCEL_STUDIO', label: 'Excel Import / Export', icon: FileSpreadsheet },
    { id: 'COUNTERS_NETWORK', label: 'Multi-Counters & Network', icon: Network },
    { id: 'SETTINGS', label: t.settings || 'Shop & Receipts', icon: Settings },
    { id: 'USERS', label: t.users || 'Staff & Roles', icon: ShieldCheck },
  ];

  const staffNavItems = [
    { id: 'SALES', label: t.sales || 'Sales, Returns & Reprint', icon: Receipt },
    { id: 'PRODUCTS', label: 'Products (Add/Remove)', icon: Package },
    { id: 'CATEGORIES', label: 'Categories (Create/Remove)', icon: Layers },
    { id: 'BARCODE_STUDIO', label: 'Barcode Generate & Print', icon: Barcode },
    { id: 'CREDIT', label: 'Customer Add & Balance Pay', icon: Users },
    { id: 'FINANCE', label: 'Expenses & Payout Add', icon: Wallet },
    { id: 'CASH_DRAWER', label: 'Cash Balance & Day End Reports', icon: Vault },
  ];

  const navItems = isOwnerOrAdmin ? allOwnerAdminNavItems : staffNavItems;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      {/* Remote Terminal Screen Lock & Hardware Restriction */}
      <RemoteLockScreen />

      {/* Remote Alert Broadcast Popup */}
      <RemoteAlertModal />

      {/* License Warning & Suspension Blocker */}
      <LicenseRiskBanner />

      {/* Urgent Super Admin Broadcast Notice Banner */}
      {!isSuperAdminMode && (
        <ShopUrgentMessageBanner onOpenMessagesModal={() => setIsShopMessagesOpen(true)} />
      )}

      {/* Top Global Navigation Bar */}
      <TopNavbar
        activeView={activeTab}
        setActiveView={setActiveTab}
        onOpenPos={() => setIsPosOpen(true)}
      />

      {/* Main Workspace Area */}
      {isSuperAdminMode ? (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
          {isSuperAdminAuthenticated ? (
            <SuperAdminDashboard />
          ) : (
            <div className="max-w-md mx-auto my-12 bg-slate-900 border border-slate-800 rounded-3xl p-8 text-slate-100 shadow-2xl text-center space-y-5 animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 bg-purple-950/80 border border-purple-500/40 rounded-2xl mx-auto flex items-center justify-center text-purple-400 shadow-inner">
                <ShieldCheck className="w-8 h-8 text-purple-300" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-100 tracking-tight">
                  Super Admin HQ Protected
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Master password authentication is required to access platform administration and multi-tenant license controls.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Enter Super Admin Password</span>
                </button>

                <button
                  onClick={() => setCurrentTenantId('SHOP001')}
                  className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
                >
                  Switch to Customer Retail Store
                </button>
              </div>
            </div>
          )}
        </main>
      ) : (
        <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col md:flex-row gap-6">
          {/* Left Sidebar Menu */}
          <aside className="w-full md:w-60 shrink-0 space-y-4">
            {/* Quick POS Trigger Card */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-4 text-white shadow-md space-y-2">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                <span className="font-extrabold text-xs uppercase tracking-wider">{t.openPos || 'POS Terminal'}</span>
              </div>
              <p className="text-[11px] text-emerald-100 leading-tight">
                Barcode scan, scale weights, IMEI/warranty, table tokens & receipt printing
              </p>
              <button
                onClick={() => setIsPosOpen(true)}
                className="w-full py-2 bg-white text-emerald-900 font-bold rounded-xl text-xs shadow-xs hover:bg-emerald-50 transition-colors flex items-center justify-center gap-1 mt-1 cursor-pointer"
              >
                <span>Launch POS Screen</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Sidebar Navigation Links */}
            <nav className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs space-y-0.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Right Main Content Panel */}
          <main className="flex-1 min-w-0">
            {activeTab === 'DASHBOARD' && (
              <ShopDashboard
                onOpenPos={() => setIsPosOpen(true)}
                setActiveTab={setActiveTab}
              />
            )}
            {activeTab === 'SALES' && (
              <SalesManager onOpenPos={() => setIsPosOpen(true)} />
            )}
            {activeTab === 'REPAIR_JOBS' && <RepairJobsManager />}
            {activeTab === 'VEHICLE_SERVICE' && <VehicleServiceManager />}
            {activeTab === 'PROMOTIONS' && <PromotionsManager />}
            {activeTab === 'PRODUCTS' && (
              <ProductManager
                onOpenBarcodeStudio={() => setActiveTab('BARCODE_STUDIO')}
                onOpenCategoryStudio={() => setActiveTab('CATEGORIES')}
              />
            )}
            {activeTab === 'CATEGORIES' && <CategoryManager />}
            {activeTab === 'BARCODE_STUDIO' && <BarcodeLabelStudio />}
            {activeTab === 'CUSTOM_FIELDS' && <CustomFieldsStudio />}
            {activeTab === 'CREDIT' && <CustomerCreditManager />}
            {activeTab === 'SUPPLIERS' && <SupplierPurchasesManager />}
            {activeTab === 'BATCH_EXPIRY' && <ExpiryBatchManager />}
            {activeTab === 'STOCK_ADJUST' && <StockAdjustmentManager />}
            {activeTab === 'CASH_DRAWER' && <CashDrawerStudio />}
            {activeTab === 'STAFF_SALARIES' && <StaffSalariesManager />}
            {activeTab === 'FINANCE' && <FinanceExpensesManager />}
            {activeTab === 'REPORTS' && <ReportsManager />}
            {activeTab === 'EXCEL_STUDIO' && <ExcelDataStudio />}
            {activeTab === 'COUNTERS_NETWORK' && (
              <MultiCounterNetworkStudio onOpenPosWithCounter={() => setIsPosOpen(true)} />
            )}
            {activeTab === 'SETTINGS' && <ShopSettingsStudio />}
            {activeTab === 'USERS' && <UserManager />}
          </main>
        </div>
      )}

      {/* Daily Opening Briefing Modal */}
      <DailyOpeningBriefingModal
        isOpen={isDailyBriefingOpen}
        onClose={() => setIsDailyBriefingOpen(false)}
        onNavigateTab={(tab) => setActiveTab(tab)}
        onOpenPos={() => setIsPosOpen(true)}
      />

      {/* Headquarter Direct Messages & Notices Modal for Shop Users */}
      <ShopMessagesModal
        isOpen={isShopMessagesOpen}
        onClose={() => setIsShopMessagesOpen(false)}
      />

      {/* Super Admin Login Modal */}
      <SuperAdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onOpenPasswordStudio={() => setIsPasswordModalOpen(true)}
      />

      {/* Super Admin Password Studio Modal */}
      <SuperAdminPasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <ErrorBoundary>
      <RetailProvider>
        <MainAppLayout />
      </RetailProvider>
    </ErrorBoundary>
  );
}

export default App;
