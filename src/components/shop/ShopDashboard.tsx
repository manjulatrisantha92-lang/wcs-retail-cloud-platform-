import React, { useState, useMemo } from 'react';
import { useRetail } from '../../context/RetailContext';
import { ShopMessagesModal } from '../common/ShopMessagesModal';
import {
  Store,
  DollarSign,
  ShoppingCart,
  Users,
  AlertTriangle,
  CreditCard,
  Barcode,
  Package,
  PlusCircle,
  Receipt,
  ArrowRight,
  TrendingUp,
  Scale,
  Wrench,
  UtensilsCrossed,
  Pill,
  Warehouse,
  Printer,
  Calendar,
  Bell,
  MessageSquare,
  CheckCircle2,
  Sparkles,
  Columns2,
  LayoutGrid,
  Activity,
  Layers,
  ArrowUpRight,
  Clock,
  Car,
  PieChart,
  BarChart3,
  Vault,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  Zap,
  KeyRound,
} from 'lucide-react';
import { RenewLicenseKeyModal } from './RenewLicenseKeyModal';

interface ShopDashboardProps {
  onOpenPos: () => void;
  setActiveTab: (tab: string) => void;
}

type DashboardMode = 'DUAL' | 'SALES_PULSE' | 'OPERATIONS_MATRIX';
type TimeRange = 'TODAY' | '7_DAYS' | '30_DAYS' | 'ALL';

export const ShopDashboard: React.FC<ShopDashboardProps> = ({ onOpenPos, setActiveTab }) => {
  const {
    currentTenant,
    currentTenantId,
    currentLicense,
    currentSettings,
    sales,
    products,
    customers,
    batches,
    expenses,
    stockAdjustments,
    repairJobs,
    vehicleServiceRecords,
    tenantMessages,
    unreadTenantMessagesCount,
  } = useRetail();

  const [dashboardMode, setDashboardMode] = useState<DashboardMode>('DUAL');
  const [timeRange, setTimeRange] = useState<TimeRange>('ALL');
  const [isMessagesModalOpen, setIsMessagesModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);

  const currencySymbol = currentTenant?.currency_symbol || 'Rs.';

  const safeSales = sales || [];
  const safeProducts = products || [];
  const safeCustomers = customers || [];
  const safeBatches = batches || safeProducts.flatMap((p) => p.batches || []);
  const safeExpenses = expenses || [];
  const safeAdjustments = stockAdjustments || [];
  const safeRepairs = repairJobs || [];
  const safeVehicleServices = vehicleServiceRecords || [];
  const safeMessages = tenantMessages || [];

  // Filter sales by time range
  const filteredSales = useMemo(() => {
    if (timeRange === 'ALL') return safeSales;
    const now = new Date();
    return safeSales.filter((s) => {
      const saleDate = new Date(s.created_at);
      if (timeRange === 'TODAY') {
        return (
          saleDate.getDate() === now.getDate() &&
          saleDate.getMonth() === now.getMonth() &&
          saleDate.getFullYear() === now.getFullYear()
        );
      } else if (timeRange === '7_DAYS') {
        const diffDays = (now.getTime() - saleDate.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 7;
      } else if (timeRange === '30_DAYS') {
        const diffDays = (now.getTime() - saleDate.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 30;
      }
      return true;
    });
  }, [safeSales, timeRange]);

  // Financial Metrics
  const totalSalesRevenue = useMemo(
    () => filteredSales.reduce((acc, s) => acc + (s.grand_total || 0), 0),
    [filteredSales]
  );

  const totalDiscountGiven = useMemo(
    () => filteredSales.reduce((acc, s) => acc + (s.discount_amount || 0), 0),
    [filteredSales]
  );

  const averageBasketValue = useMemo(
    () => (filteredSales.length > 0 ? Math.round(totalSalesRevenue / filteredSales.length) : 0),
    [filteredSales, totalSalesRevenue]
  );

  const paymentBreakdown = useMemo(() => {
    const map: Record<string, number> = { CASH: 0, CARD: 0, QR: 0, CREDIT: 0, OTHER: 0 };
    filteredSales.forEach((s) => {
      const method = (s.payment_method || 'CASH').toUpperCase();
      if (method in map) {
        map[method] += s.grand_total || 0;
      } else {
        map.OTHER += s.grand_total || 0;
      }
    });
    return map;
  }, [filteredSales]);

  // Total Outstanding Udalu Credit
  const totalOutstandingCredit = useMemo(
    () => safeCustomers.reduce((acc, c) => acc + (c.current_balance || 0), 0),
    [safeCustomers]
  );

  // Total Inventory Stock Asset Valuation
  const inventoryMetrics = useMemo(() => {
    let totalValueCost = 0;
    let totalValueRetail = 0;
    let totalItemsCount = 0;

    safeProducts.forEach((p) => {
      const qty = p.stock_quantity || 0;
      totalItemsCount += qty;
      totalValueCost += (p.cost_price || p.price * 0.7) * qty;
      totalValueRetail += p.price * qty;
    });

    return {
      totalValueCost: Math.round(totalValueCost),
      totalValueRetail: Math.round(totalValueRetail),
      potentialGrossMargin: Math.round(totalValueRetail - totalValueCost),
      totalItemsCount,
    };
  }, [safeProducts]);

  // Low Stock and Expiry Horizons
  const lowStockProducts = useMemo(
    () => safeProducts.filter((p) => (p.stock_quantity || 0) <= (p.reorder_level || 0)),
    [safeProducts]
  );

  const expiringBatches = useMemo(() => {
    return safeBatches.filter((b) => {
      if (!b?.expiry_date) return false;
      const daysLeft = Math.ceil((new Date(b.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return daysLeft <= 45;
    });
  }, [safeBatches]);

  // Top Selling Products in filtered sales
  const topSellingProducts = useMemo(() => {
    const countMap: Record<string, { name: string; qty: number; total: number; unit: string }> = {};
    filteredSales.forEach((s) => {
      (s.items || []).forEach((item) => {
        if (!countMap[item.product_id]) {
          countMap[item.product_id] = {
            name: item.name,
            qty: 0,
            total: 0,
            unit: item.unit || 'pcs',
          };
        }
        countMap[item.product_id].qty += item.quantity || 1;
        countMap[item.product_id].total += item.total_price || (item.unit_price * (item.quantity || 1));
      });
    });

    return Object.values(countMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [filteredSales]);

  // Operational Jobs summary
  const activeRepairJobsCount = useMemo(
    () => safeRepairs.filter((j) => j.status !== 'DELIVERED' && j.status !== 'CANCELLED').length,
    [safeRepairs]
  );

  const activeVehicleServicesCount = useMemo(
    () => safeVehicleServices.filter((v) => v.status !== 'COMPLETED' && v.status !== 'DELIVERED').length,
    [safeVehicleServices]
  );

  const enabledMods = currentSettings?.enabled_modules;
  const latestMessage = safeMessages[0];

  // License Expiry Status (Trigger alert when expiring in 07 days or already expired)
  const licenseValidUntilDate = useMemo(() => {
    return currentLicense?.valid_until ? new Date(currentLicense.valid_until) : null;
  }, [currentLicense?.valid_until]);

  const daysUntilLicenseExpiry = useMemo(() => {
    if (!licenseValidUntilDate) return null;
    const now = new Date();
    return Math.ceil((licenseValidUntilDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }, [licenseValidUntilDate]);

  const isLicenseNearExpiry = daysUntilLicenseExpiry !== null && daysUntilLicenseExpiry <= 7;
  const isLicenseExpired = (daysUntilLicenseExpiry !== null && daysUntilLicenseExpiry <= 0) || currentLicense?.status === 'EXPIRED';
  const showLicenseExpiryAlert = isLicenseNearExpiry || isLicenseExpired;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Welcome Hero Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white border border-indigo-800/40 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 bg-indigo-500/30 text-indigo-200 text-[10px] font-bold rounded-md uppercase border border-indigo-400/30">
                {currentTenant?.business_type.replace('_', ' ')}
              </span>
              <span className="text-slate-400 text-xs font-mono">Tenant ID: {currentTenant?.tenant_id}</span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold px-2 py-0.5 bg-emerald-950/70 border border-emerald-500/30 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Live Feed Synchronized</span>
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight">{currentTenant?.shop_name}</h1>
            <p className="text-xs text-slate-300 max-w-xl">
              {currentTenant?.company_name} • {currentTenant?.address}
            </p>
          </div>

          {/* Quick POS Launch Button */}
          <button
            onClick={onOpenPos}
            className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-950/50 flex items-center gap-2.5 transition-all active:scale-98 shrink-0 cursor-pointer"
          >
            <CreditCard className="w-5 h-5" />
            <span>OPEN POS BILLING DESK</span>
          </button>
        </div>

        {/* Global Key Metrics Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
          <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Revenue (Turnover)</span>
            <div className="text-xl font-black text-emerald-400 mt-1">
              {currencySymbol} {(totalSalesRevenue || 0).toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">{filteredSales.length} Completed Invoices</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Outstanding Credit</span>
            <div className="text-xl font-black text-amber-400 mt-1">
              {currencySymbol} {(totalOutstandingCredit || 0).toLocaleString()}
            </div>
            <span className="text-[10px] text-amber-300/80 mt-0.5 block">{safeCustomers.length} Registered Accounts</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Stock Asset Valuation</span>
            <div className="text-xl font-black text-indigo-300 mt-1">
              {currencySymbol} {inventoryMetrics.totalValueRetail.toLocaleString()}
            </div>
            <span className="text-[10px] text-indigo-300/80 mt-0.5 block">{safeProducts.length} Items ({inventoryMetrics.totalItemsCount.toLocaleString()} units)</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Low Stock Alerts</span>
            <div className="text-xl font-black text-rose-400 mt-1">{lowStockProducts.length} Items</div>
            <span className="text-[10px] text-rose-300/80 mt-0.5 block">Below Reorder Level</span>
          </div>
        </div>
      </div>

      {/* 07-Day Key Expiration / Expired Warning Alert Banner */}
      {showLicenseExpiryAlert && (
        <div
          className={`rounded-2xl p-5 border transition-all shadow-lg animate-in fade-in flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            isLicenseExpired
              ? 'bg-gradient-to-r from-rose-950 via-rose-900 to-red-950 border-rose-500/50 text-rose-100 shadow-rose-950/40'
              : 'bg-gradient-to-r from-amber-950 via-amber-900 to-orange-950 border-amber-500/50 text-amber-100 shadow-amber-950/40'
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`p-3.5 rounded-2xl border shrink-0 ${
                isLicenseExpired
                  ? 'bg-rose-600 text-white border-rose-400 shadow-lg animate-pulse'
                  : 'bg-gradient-to-br from-amber-500 to-orange-500 text-slate-950 border-amber-300 shadow-lg'
              }`}
            >
              {isLicenseExpired ? <ShieldAlert className="w-7 h-7" /> : <KeyRound className="w-7 h-7" />}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase border ${
                    isLicenseExpired
                      ? 'bg-rose-500/30 text-rose-200 border-rose-400/40'
                      : 'bg-amber-400/20 text-amber-200 border-amber-400/40'
                  }`}
                >
                  {isLicenseExpired ? '⚠️ Subscription Expired' : `⚠️ Expiring in ${daysUntilLicenseExpiry} Day${daysUntilLicenseExpiry === 1 ? '' : 's'}`}
                </span>
                {currentLicense?.license_key && (
                  <span className="text-xs font-mono opacity-80 bg-black/30 px-2 py-0.5 rounded border border-white/10">
                    Key: {currentLicense.license_key}
                  </span>
                )}
                <span className="text-[11px] opacity-75 font-semibold">
                  Package: {currentLicense?.package_tier || 'PROFESSIONAL'}
                </span>
              </div>

              <h3 className="text-base font-black text-white flex items-center gap-2">
                {isLicenseExpired
                  ? 'Store Software License Key Has Expired'
                  : `License Expiry Warning: Only ${daysUntilLicenseExpiry} Day${daysUntilLicenseExpiry === 1 ? '' : 's'} Remaining`}
              </h3>

              <p className="text-xs text-slate-200 max-w-2xl leading-relaxed">
                {isLicenseExpired
                  ? `Your store license key expired ${Math.abs(daysUntilLicenseExpiry || 0)} day${Math.abs(daysUntilLicenseExpiry || 0) === 1 ? '' : 's'} ago on ${licenseValidUntilDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}. Please apply a valid renewal key (01M, 03M, 06M, 12M) immediately to prevent billing terminal lockout and service disruption.`
                  : `Your store software license key will expire on ${licenseValidUntilDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} (${daysUntilLicenseExpiry} day${daysUntilLicenseExpiry === 1 ? '' : 's'} remaining). Please renew your license key to ensure uninterrupted cloud POS operation.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
            <button
              type="button"
              onClick={() => setIsRenewModalOpen(true)}
              className={`px-5 py-3 rounded-xl font-black text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xl active:scale-95 ${
                isLicenseExpired
                  ? 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white shadow-rose-950/60 border border-rose-400/40'
                  : 'bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 shadow-amber-950/60 border border-amber-300/60'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>Renew License Key Now</span>
            </button>
          </div>
        </div>
      )}

      {/* DOUBLE DASHBOARD CONTROL BAR (UI/UX) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Double Dashboard Mode Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mr-1">
            <LayoutGrid className="w-4 h-4 text-indigo-600" />
            <span>Dashboard Layout:</span>
          </span>

          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setDashboardMode('DUAL')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                dashboardMode === 'DUAL'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Columns2 className="w-3.5 h-3.5" />
              <span>Double Dashboard (Dual Split)</span>
            </button>

            <button
              type="button"
              onClick={() => setDashboardMode('SALES_PULSE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                dashboardMode === 'SALES_PULSE'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Desk 1: Sales & Cash Pulse</span>
            </button>

            <button
              type="button"
              onClick={() => setDashboardMode('OPERATIONS_MATRIX')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                dashboardMode === 'OPERATIONS_MATRIX'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Desk 2: Inventory & Operations</span>
            </button>
          </div>
        </div>

        {/* Timeframe Filter Buttons */}
        <div className="flex items-center gap-1.5 self-start md:self-auto">
          <span className="text-[11px] font-semibold text-slate-500 mr-1">Period:</span>
          {(['TODAY', '7_DAYS', '30_DAYS', 'ALL'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                timeRange === range
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {range === 'TODAY' && 'Today'}
              {range === '7_DAYS' && '7 Days'}
              {range === '30_DAYS' && '30 Days'}
              {range === 'ALL' && 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* Headquarter Broadcast Notification Banner */}
      {safeMessages.length > 0 && (
        <div
          className={`rounded-2xl p-4 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
            unreadTenantMessagesCount > 0
              ? 'bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 border-indigo-200 text-indigo-950'
              : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-start sm:items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border shrink-0 ${
                unreadTenantMessagesCount > 0
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm animate-pulse'
                  : 'bg-indigo-50 text-indigo-600 border-indigo-200'
              }`}
            >
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-xs">WCS Super Admin Headquarters Notice:</span>
                {unreadTenantMessagesCount > 0 && (
                  <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-bold rounded-full animate-bounce">
                    {unreadTenantMessagesCount} Unread Message{unreadTenantMessagesCount > 1 ? 's' : ''}
                  </span>
                )}
                {latestMessage?.priority === 'URGENT' && (
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-bold rounded-full">
                    URGENT ACTION
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-0.5 font-medium line-clamp-1">
                {latestMessage ? latestMessage.title : 'Official announcements and direct instructions from WCS HQ.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              onClick={() => setIsMessagesModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>View Headquarter Messages ({safeMessages.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Quick Navigation Action Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => setActiveTab('SALES')}
          className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-500 shadow-xs hover:shadow transition-all text-left group cursor-pointer"
        >
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl w-fit group-hover:scale-110 transition-transform">
            <Receipt className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-xs text-slate-900 mt-2.5">Sales & Invoices</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">Bills, returns & receipts</p>
        </button>

        <button
          onClick={() => setActiveTab('PRODUCTS')}
          className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 shadow-xs hover:shadow transition-all text-left group cursor-pointer"
        >
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl w-fit group-hover:scale-110 transition-transform">
            <Package className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-xs text-slate-900 mt-2.5">Stock & Inventory</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">Add items & pricing</p>
        </button>

        <button
          onClick={() => setActiveTab('FINANCE')}
          className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-teal-500 shadow-xs hover:shadow transition-all text-left group cursor-pointer"
        >
          <div className="p-2 bg-teal-50 text-teal-600 rounded-xl w-fit group-hover:scale-110 transition-transform">
            <DollarSign className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-xs text-slate-900 mt-2.5">Expenses & Payroll</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">Cash book & salary</p>
        </button>

        <button
          onClick={() => setActiveTab('CREDIT')}
          className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-amber-500 shadow-xs hover:shadow transition-all text-left group cursor-pointer"
        >
          <div className="p-2 bg-amber-50 text-amber-600 rounded-xl w-fit group-hover:scale-110 transition-transform">
            <Users className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-xs text-slate-900 mt-2.5">Customer Credit</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">Credit balance & pay</p>
        </button>

        <button
          onClick={() => setActiveTab('REPORTS')}
          className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-purple-500 shadow-xs hover:shadow transition-all text-left group cursor-pointer"
        >
          <div className="p-2 bg-purple-50 text-purple-600 rounded-xl w-fit group-hover:scale-110 transition-transform">
            <TrendingUp className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-xs text-slate-900 mt-2.5">Reports & Margins</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">Z-Reports & analysis</p>
        </button>
      </div>

      {/* DUAL DASHBOARD UI PANELS CONTAINER */}
      <div
        className={`grid gap-6 ${
          dashboardMode === 'DUAL'
            ? 'grid-cols-1 lg:grid-cols-2'
            : 'grid-cols-1'
        }`}
      >
        {/* ========================================================================= */}
        {/* DASHBOARD 1: SALES & CASH FLOW PULSE (DESK 1) */}
        {/* ========================================================================= */}
        {(dashboardMode === 'DUAL' || dashboardMode === 'SALES_PULSE') && (
          <div className="bg-white rounded-2xl border-2 border-indigo-200/80 shadow-sm overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-indigo-50 to-slate-50 border-b border-indigo-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <span>DESK 1: Sales & Cash Financials</span>
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-md">
                      Live Pulse
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">Revenue velocity, settlement breakdown & billing ledger</p>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('SALES')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Full History</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Financial Mini KPI Cards */}
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-slate-50/50 border-b border-slate-100">
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Selected Revenue</span>
                <span className="text-base font-black text-slate-900 mt-0.5 block">
                  {currencySymbol} {totalSalesRevenue.toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold">{filteredSales.length} Transactions</span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Average Ticket Size</span>
                <span className="text-base font-black text-slate-900 mt-0.5 block">
                  {currencySymbol} {averageBasketValue.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500">Per Customer Invoice</span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Discounts Granted</span>
                <span className="text-base font-black text-amber-600 mt-0.5 block">
                  {currencySymbol} {totalDiscountGiven.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500">Promotions / POS Reductions</span>
              </div>
            </div>

            {/* Payment Method Channels Breakdown */}
            <div className="p-4 border-b border-slate-100 space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <PieChart className="w-3.5 h-3.5 text-indigo-600" />
                <span>Settlement Channels Breakdown</span>
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase block">Cash in Drawer</span>
                  <span className="font-black text-emerald-950 text-sm mt-0.5 block">
                    {currencySymbol} {paymentBreakdown.CASH.toLocaleString()}
                  </span>
                </div>

                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl">
                  <span className="text-[10px] text-blue-800 font-bold uppercase block">Card (POS Terminal)</span>
                  <span className="font-black text-blue-950 text-sm mt-0.5 block">
                    {currencySymbol} {paymentBreakdown.CARD.toLocaleString()}
                  </span>
                </div>

                <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-xl">
                  <span className="text-[10px] text-purple-800 font-bold uppercase block">LANKAQR / Bank App</span>
                  <span className="font-black text-purple-950 text-sm mt-0.5 block">
                    {currencySymbol} {paymentBreakdown.QR.toLocaleString()}
                  </span>
                </div>

                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                  <span className="text-[10px] text-amber-800 font-bold uppercase block">Customer Credit</span>
                  <span className="font-black text-amber-950 text-sm mt-0.5 block">
                    {currencySymbol} {paymentBreakdown.CREDIT.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Sales Ledger */}
            <div className="flex-1 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Real-Time Invoices Feed</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Latest 5 Bills</span>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                {filteredSales.length === 0 ? (
                  <div className="p-6 text-center text-slate-400">
                    No sales recorded for this timeframe.
                  </div>
                ) : (
                  filteredSales.slice(0, 5).map((s) => (
                    <div key={s.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-indigo-600 text-xs">{s.invoice_no}</span>
                          <span className="font-bold text-slate-900">{s.customer_name}</span>
                          <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-600 uppercase">
                            {s.payment_method}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {s.items.length} items
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-black text-slate-900 text-sm">
                          {currencySymbol} {(s.grand_total || 0).toLocaleString()}
                        </span>
                        {s.discount_amount ? (
                          <div className="text-[9px] text-emerald-600">Saved {currencySymbol}{s.discount_amount}</div>
                        ) : null}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Top Selling Products preview */}
              {topSellingProducts.length > 0 && (
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide block mb-2">
                    🔥 Top Performing Products
                  </span>
                  <div className="space-y-1.5">
                    {topSellingProducts.slice(0, 3).map((tp, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-xs">
                        <span className="font-medium text-slate-800 truncate max-w-[180px]">{tp.name}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-slate-500 font-mono text-[11px]">{tp.qty} {tp.unit}</span>
                          <span className="font-bold text-slate-900 font-mono">{currencySymbol}{tp.total.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* DASHBOARD 2: INVENTORY HEALTH & OPERATIONS MATRIX (DESK 2) */}
        {/* ========================================================================= */}
        {(dashboardMode === 'DUAL' || dashboardMode === 'OPERATIONS_MATRIX') && (
          <div className="bg-white rounded-2xl border-2 border-purple-200/80 shadow-sm overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-purple-50 to-slate-50 border-b border-purple-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-600 text-white rounded-xl shadow-xs">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <span>DESK 2: Inventory & Operations</span>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-md">
                      Asset Matrix
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">Stock reorder levels, shelf-life expiry & service tickets</p>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('PRODUCTS')}
                className="text-xs text-purple-600 hover:text-purple-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Stock Master</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Inventory Asset Mini KPI Cards */}
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-slate-50/50 border-b border-slate-100">
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Cost Valuation</span>
                <span className="text-base font-black text-slate-900 mt-0.5 block">
                  {currencySymbol} {inventoryMetrics.totalValueCost.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500">Purchase Capital</span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Projected Margin</span>
                <span className="text-base font-black text-purple-700 mt-0.5 block">
                  {currencySymbol} {inventoryMetrics.potentialGrossMargin.toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold">Gross Profit Potential</span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Stock Audits & Gaps</span>
                <span className="text-base font-black text-rose-600 mt-0.5 block">
                  {safeAdjustments.length} Audits
                </span>
                <span className="text-[10px] text-slate-500">Shrinkage Reconciled</span>
              </div>
            </div>

            {/* Low Stock Reorder Warning Panel */}
            <div className="p-4 border-b border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Low Stock Reorder Alerts ({lowStockProducts.length})</span>
                </span>
                <button
                  onClick={() => setActiveTab('PRODUCTS')}
                  className="text-[11px] text-indigo-600 font-bold hover:underline cursor-pointer"
                >
                  Restock All
                </button>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs max-h-48 overflow-y-auto">
                {lowStockProducts.length === 0 ? (
                  <div className="p-4 text-center text-slate-400">All inventory items are above reorder threshold!</div>
                ) : (
                  lowStockProducts.slice(0, 5).map((p) => (
                    <div key={p.id} className="p-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div>
                        <h5 className="font-bold text-slate-900">{p.name}</h5>
                        <span className="text-[10px] text-slate-400 font-mono">SKU: {p.sku} • Brand: {p.brand || 'Standard'}</span>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                          {p.stock_quantity} {p.unit}
                        </span>
                        <div className="text-[9px] text-slate-400 mt-0.5">Min: {p.reorder_level}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Batch Expiry & Service Workshop Operations */}
            <div className="flex-1 p-4 space-y-3">
              {/* Batch Expiry Countdown */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    <span>Batch Expiry Horizon ({expiringBatches.length})</span>
                  </span>
                  <button
                    onClick={() => setActiveTab('BATCH_EXPIRY')}
                    className="text-[11px] text-amber-700 font-bold hover:underline cursor-pointer"
                  >
                    View Batches
                  </button>
                </div>

                <div className="space-y-1.5 text-xs">
                  {expiringBatches.length === 0 ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>No stock batches expiring within the next 45 days.</span>
                    </div>
                  ) : (
                    expiringBatches.slice(0, 3).map((b, idx) => {
                      const daysLeft = Math.ceil((new Date(b.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                      return (
                        <div key={idx} className="p-2 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-900 block font-mono text-[11px]">Batch: {b.batch_number}</span>
                            <span className="text-[10px] text-slate-500">Exp: {b.expiry_date}</span>
                          </div>
                          <span className="px-2 py-0.5 bg-amber-200 text-amber-900 font-bold text-[10px] rounded-md">
                            {daysLeft > 0 ? `${daysLeft} days left` : 'Expired'}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Specialized Workshop / Service Desk Summary if enabled */}
              {(activeRepairJobsCount > 0 || activeVehicleServicesCount > 0) && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide block mb-2">
                    🛠️ Active Service & Workshop Dispatches
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {activeRepairJobsCount > 0 && (
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-800 block text-[11px]">Device Repairs</span>
                          <span className="text-[10px] text-slate-400">In Technician Queue</span>
                        </div>
                        <span className="font-black text-indigo-600 text-sm">{activeRepairJobsCount}</span>
                      </div>
                    )}
                    {activeVehicleServicesCount > 0 && (
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-800 block text-[11px]">Vehicle Job Cards</span>
                          <span className="text-[10px] text-slate-400">In Bay Service</span>
                        </div>
                        <span className="font-black text-orange-600 text-sm">{activeVehicleServicesCount}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Active Specialized Business Archetype Modules */}
      {enabledMods && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Store className="w-4 h-4 text-indigo-600" />
            Specialized Active Business Modules for this Shop
          </h3>

          <div className="flex flex-wrap gap-2">
            {enabledMods.grocery_weight && (
              <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-emerald-600" />
                Grocery KG & Weighing Scales
              </span>
            )}
            {enabledMods.vehicle_parts && (
              <span className="px-3 py-1.5 bg-orange-50 text-orange-800 border border-orange-200 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-orange-600" />
                Motor Parts OEM & Vehicle Model Search
              </span>
            )}
            {enabledMods.restaurant_kot && (
              <span className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                <UtensilsCrossed className="w-3.5 h-3.5 text-amber-600" />
                Restaurant Dine-In KOT & Kitchen Printing
              </span>
            )}
            {enabledMods.pharmacy_batch && (
              <span className="px-3 py-1.5 bg-sky-50 text-sky-800 border border-sky-200 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                <Pill className="w-3.5 h-3.5 text-sky-600" />
                Pharmacy Batch & NMRA/CDDA Drug Expiry
              </span>
            )}
            {enabledMods.wholesale_credit && (
              <span className="px-3 py-1.5 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                <Warehouse className="w-3.5 h-3.5 text-indigo-600" />
                Wholesale Bulk Pricing & Credit Ledger
              </span>
            )}
            {enabledMods.barcode_studio && (
              <span className="px-3 py-1.5 bg-purple-50 text-purple-800 border border-purple-200 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                <Barcode className="w-3.5 h-3.5 text-purple-600" />
                Thermal Barcode Generator (1-Column)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Headquarter Direct Messages & Notices Modal */}
      <ShopMessagesModal
        isOpen={isMessagesModalOpen}
        onClose={() => setIsMessagesModalOpen(false)}
      />

      {/* Direct License Key Renewal Modal */}
      {isRenewModalOpen && (
        <RenewLicenseKeyModal
          isOpen={isRenewModalOpen}
          onClose={() => setIsRenewModalOpen(false)}
        />
      )}
    </div>
  );
};
