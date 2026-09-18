import React, { useState, useEffect, useMemo } from 'react';
import { useRetail } from '../../context/RetailContext';
import { Product, Customer } from '../../types';
import {
  Sun,
  AlertTriangle,
  Package,
  Users,
  DollarSign,
  TrendingDown,
  CheckCircle2,
  X,
  Printer,
  FileSpreadsheet,
  Phone,
  MessageSquare,
  ArrowRight,
  RefreshCw,
  Sliders,
  Volume2,
  VolumeX,
  CreditCard,
  Truck,
  Sparkles,
  ChevronRight,
  Search,
  Check,
  Building2,
  Clock,
  ExternalLink,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface DailyOpeningBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
  onOpenPos?: () => void;
}

export const DailyOpeningBriefingModal: React.FC<DailyOpeningBriefingModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onOpenPos,
}) => {
  const {
    currentTenant,
    currentTenantId,
    products,
    customers,
    categories,
    adjustStock,
    recordCustomerPayment,
    t,
  } = useRetail();

  const [activeTab, setActiveTab] = useState<'overview' | 'low_stock' | 'customer_credit' | 'settings'>('overview');
  const [stockFilter, setStockFilter] = useState<'all' | 'out_of_stock' | 'low_stock'>('all');
  const [creditFilter, setCreditFilter] = useState<'all' | 'exceeded_limit' | 'high_balance'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Settings in localStorage
  const autoOpenKey = `WCS_DAILY_BRIEFING_AUTO_OPEN_${currentTenantId}`;
  const soundKey = `WCS_DAILY_BRIEFING_SOUND_${currentTenantId}`;
  
  const [autoOpenDaily, setAutoOpenDaily] = useState<boolean>(() => {
    return localStorage.getItem(autoOpenKey) !== 'false';
  });
  
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem(soundKey) !== 'false';
  });

  // Quick Restock State
  const [quickRestockProduct, setQuickRestockProduct] = useState<Product | null>(null);
  const [quickRestockQty, setQuickRestockQty] = useState<number>(10);
  const [quickRestockReason, setQuickRestockReason] = useState('Morning Daily Restock from Warehouse');

  // Quick Payment Settlement State
  const [settleCustomer, setSettleCustomer] = useState<Customer | null>(null);
  const [settleAmount, setSettleAmount] = useState<number>(0);
  const [settleMethod, setSettleMethod] = useState<'CASH' | 'CARD' | 'BANK_TRANSFER'>('CASH');
  const [settleNote, setSettleNote] = useState('Morning Cash Payment Settlement');

  // Notification / Toast inside modal
  const [modalToast, setModalToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setModalToast(msg);
    setTimeout(() => setModalToast(null), 3000);
  };

  const currencySymbol = currentTenant?.currency_symbol || 'Rs.';

  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.12); // A5
      osc.frequency.setValueAtTime(1174.66, now + 0.24); // D6
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.45);
    } catch {
      // AudioContext might require user gesture on first load
    }
  };

  useEffect(() => {
    if (isOpen && soundEnabled) {
      playChime();
    }
  }, [isOpen, soundEnabled]);

  // Derived Datasets
  const safeProducts = useMemo(() => products || [], [products]);
  const safeCustomers = useMemo(() => customers || [], [customers]);

  // Low Stock Items: stock_quantity <= reorder_level
  const lowStockProducts = useMemo(() => {
    return safeProducts.filter((p) => p.stock_quantity <= (p.reorder_level ?? 10));
  }, [safeProducts]);

  const outOfStockProducts = useMemo(() => {
    return safeProducts.filter((p) => p.stock_quantity <= 0);
  }, [safeProducts]);

  // Customer Credit / Debtors: balance > 0
  const debtorCustomers = useMemo(() => {
    return safeCustomers
      .filter((c) => (c.current_balance || 0) > 0)
      .sort((a, b) => (b.current_balance || 0) - (a.current_balance || 0));
  }, [safeCustomers]);

  const exceededLimitCustomers = useMemo(() => {
    return debtorCustomers.filter((c) => (c.current_balance || 0) > (c.credit_limit || 50000));
  }, [debtorCustomers]);

  const totalOutstandingReceivables = useMemo(() => {
    return debtorCustomers.reduce((sum, c) => sum + (c.current_balance || 0), 0);
  }, [debtorCustomers]);

  const totalReplenishmentEstCost = useMemo(() => {
    return lowStockProducts.reduce((sum, p) => {
      const targetQty = (p.reorder_level || 10) * 2;
      const neededQty = Math.max(0, targetQty - p.stock_quantity);
      return sum + neededQty * (p.cost_price || 0);
    }, 0);
  }, [lowStockProducts]);

  // Filtered Low Stock
  const filteredLowStock = useMemo(() => {
    return lowStockProducts.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (stockFilter === 'out_of_stock') {
        return p.stock_quantity <= 0;
      }
      if (stockFilter === 'low_stock') {
        return p.stock_quantity > 0 && p.stock_quantity <= (p.reorder_level ?? 10);
      }
      return true;
    });
  }, [lowStockProducts, searchQuery, stockFilter]);

  // Filtered Debtors
  const filteredDebtors = useMemo(() => {
    return debtorCustomers.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.phone && c.phone.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.address && c.address.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (creditFilter === 'exceeded_limit') {
        return (c.current_balance || 0) > (c.credit_limit || 50000);
      }
      if (creditFilter === 'high_balance') {
        return (c.current_balance || 0) >= 10000;
      }
      return true;
    });
  }, [debtorCustomers, searchQuery, creditFilter]);

  // Handle Quick Restock Submission
  const handleQuickRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickRestockProduct || quickRestockQty <= 0) return;

    const newStock = quickRestockProduct.stock_quantity + Number(quickRestockQty);
    adjustStock(quickRestockProduct.id, newStock, quickRestockReason);

    showToast(`Restocked ${quickRestockProduct.name} to ${newStock} ${quickRestockProduct.unit || 'units'}`);
    setQuickRestockProduct(null);
    setQuickRestockQty(10);
  };

  // Handle Quick Settlement Submission
  const handleSettlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleCustomer || settleAmount <= 0) return;

    recordCustomerPayment({
      customer_id: settleCustomer.id,
      customer_name: settleCustomer.name,
      amount: Number(settleAmount),
      payment_method: settleMethod,
      notes: settleNote,
    });

    showToast(`Payment of ${currencySymbol} ${settleAmount.toLocaleString()} recorded for ${settleCustomer.name}`);
    setSettleCustomer(null);
    setSettleAmount(0);
  };

  // WhatsApp Message Generator
  const handleSendWhatsAppReminder = (customer: Customer) => {
    const phoneClean = (customer.phone || '').replace(/[^0-9]/g, '');
    let formattedPhone = phoneClean;
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '94' + formattedPhone.slice(1);
    } else if (formattedPhone.startsWith('7') && formattedPhone.length === 9) {
      formattedPhone = '94' + formattedPhone;
    }

    const shopName = currentTenant?.shop_name || 'Our Store';
    const amount = (customer.current_balance || 0).toLocaleString();
    const dateStr = new Date().toLocaleDateString('en-GB');

    const message = `*Statement Reminder - ${shopName}*\n\nDear ${customer.name},\n\nThis is a friendly reminder that your outstanding account balance at *${shopName}* is *${currencySymbol} ${amount}* as of ${dateStr}.\n\nPlease settle this amount at your earliest convenience or make a bank transfer.\n\nThank you for your valued business!\n_${shopName} Team_`;

    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Export Daily Morning Briefing to Excel
  const handleExportBriefingExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      const dateStr = new Date().toLocaleDateString('en-CA');

      // Sheet 1: Low Stock Items
      const lowStockData = lowStockProducts.map((p) => ({
        'SKU / Code': p.sku,
        'Barcode': p.barcode || '',
        'Product Name': p.name,
        'Category': categories.find((c) => c.id === p.category_id)?.name || 'General',
        'Current Stock': p.stock_quantity,
        'Unit': p.unit || 'pcs',
        'Reorder Level': p.reorder_level ?? 10,
        'Shortage Qty': Math.max(0, (p.reorder_level ?? 10) - p.stock_quantity),
        'Cost Price': p.cost_price,
        'Selling Price': p.selling_price,
        'Status': p.stock_quantity <= 0 ? 'OUT OF STOCK' : 'LOW STOCK',
      }));

      const wsLowStock = XLSX.utils.json_to_sheet(lowStockData);
      XLSX.utils.book_append_sheet(wb, wsLowStock, 'Low Stock Alerts');

      // Sheet 2: Customer Debtors
      const debtorData = debtorCustomers.map((c) => ({
        'Customer Name': c.name,
        'Phone': c.phone,
        'Address': c.address || '',
        'Outstanding Balance (Rs)': c.current_balance || 0,
        'Credit Limit (Rs)': c.credit_limit || 50000,
        'Limit Status': (c.current_balance || 0) > (c.credit_limit || 50000) ? 'EXCEEDED LIMIT' : 'NORMAL DEBT',
        'Loyalty Points': c.loyalty_points || 0,
      }));

      const wsDebtors = XLSX.utils.json_to_sheet(debtorData);
      XLSX.utils.book_append_sheet(wb, wsDebtors, 'Customer Debtor Balances');

      XLSX.writeFile(wb, `Daily_Briefing_${currentTenant?.shop_name.replace(/\s+/g, '_')}_${dateStr}.xlsx`);
      showToast('Downloaded Daily Opening Briefing Excel workbook!');
    } catch (err) {
      console.error(err);
      showToast('Error exporting to Excel');
    }
  };

  // Print Daily Briefing Report Sheet
  const handlePrintBriefing = () => {
    const dateStr = new Date().toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Daily Store Opening Briefing - ${currentTenant?.shop_name}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 25px; color: #1e293b; }
          .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px; }
          .shop-title { font-size: 22px; font-weight: bold; margin: 0; color: #0f172a; }
          .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
          .date { font-size: 12px; font-weight: bold; color: #4338ca; margin-top: 6px; }
          .kpi-row { display: flex; justify-content: space-around; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 20px; }
          .kpi-box { text-align: center; }
          .kpi-val { font-size: 18px; font-weight: bold; }
          .kpi-label { font-size: 11px; color: #64748b; text-transform: uppercase; }
          h3 { font-size: 14px; margin-top: 20px; margin-bottom: 8px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px; }
          th, td { border: 1px solid #e2e8f0; padding: 6px 8px; text-align: left; }
          th { background: #f1f5f9; font-weight: bold; color: #334155; }
          .text-right { text-align: right; }
          .badge-red { color: #e11d48; font-weight: bold; }
          .badge-orange { color: #ea580c; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="shop-title">${currentTenant?.shop_name || 'Store'}</h1>
          <div class="subtitle">${currentTenant?.company_name || ''} • ${currentTenant?.address || ''} • Phone: ${currentTenant?.phone || ''}</div>
          <div class="date">☀️ DAILY STORE OPENING BRIEFING & HEALTH REPORT — ${dateStr}</div>
        </div>

        <div class="kpi-row">
          <div class="kpi-box">
            <div class="kpi-val" style="color: #e11d48;">${lowStockProducts.length} Items</div>
            <div class="kpi-label">Low Stock Alerts</div>
          </div>
          <div class="kpi-box">
            <div class="kpi-val" style="color: #dc2626;">${outOfStockProducts.length} Items</div>
            <div class="kpi-label">Out of Stock (0 Qty)</div>
          </div>
          <div class="kpi-box">
            <div class="kpi-val" style="color: #d97706;">${debtorCustomers.length} Customers</div>
            <div class="kpi-label">Active Debtors</div>
          </div>
          <div class="kpi-box">
            <div class="kpi-val" style="color: #059669;">${currencySymbol} ${totalOutstandingReceivables.toLocaleString()}</div>
            <div class="kpi-label">Total Outstanding Debt</div>
          </div>
        </div>

        <h3>📦 1. Low Stock & Reorder Checklist (${lowStockProducts.length} Items)</h3>
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Product Name</th>
              <th>Category</th>
              <th class="text-right">Current Stock</th>
              <th class="text-right">Reorder Level</th>
              <th class="text-right">Cost (${currencySymbol})</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${lowStockProducts
              .map(
                (p) => `
              <tr>
                <td><strong>${p.sku}</strong></td>
                <td>${p.name}</td>
                <td>${categories.find((c) => c.id === p.category_id)?.name || 'General'}</td>
                <td class="text-right ${p.stock_quantity <= 0 ? 'badge-red' : 'badge-orange'}">${p.stock_quantity} ${p.unit || 'pcs'}</td>
                <td class="text-right">${p.reorder_level ?? 10}</td>
                <td class="text-right">${(p.cost_price || 0).toLocaleString()}</td>
                <td class="${p.stock_quantity <= 0 ? 'badge-red' : 'badge-orange'}">${p.stock_quantity <= 0 ? 'OUT OF STOCK' : 'LOW STOCK'}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <h3>👥 2. Customer Credit Balances (${debtorCustomers.length} Accounts)</h3>
        <table>
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Contact Phone</th>
              <th>Address</th>
              <th class="text-right">Outstanding Balance (${currencySymbol})</th>
              <th class="text-right">Credit Limit (${currencySymbol})</th>
              <th>Credit Status</th>
            </tr>
          </thead>
          <tbody>
            ${debtorCustomers
              .map(
                (c) => `
              <tr>
                <td><strong>${c.name}</strong></td>
                <td>${c.phone || '-'}</td>
                <td>${c.address || '-'}</td>
                <td class="text-right badge-orange" style="font-weight: bold;">${(c.current_balance || 0).toLocaleString()}</td>
                <td class="text-right">${(c.credit_limit || 50000).toLocaleString()}</td>
                <td>${(c.current_balance || 0) > (c.credit_limit || 50000) ? '<span class="badge-red">EXCEEDED LIMIT</span>' : 'Active Balance'}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <div class="footer">
          Generated automatically by WCS Retail Cloud Platform • Store Opening Checklist • Confirmed by Store Manager / Cashier: ____________________
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  };

  // Toggle settings
  const handleToggleAutoOpen = (val: boolean) => {
    setAutoOpenDaily(val);
    localStorage.setItem(autoOpenKey, val ? 'true' : 'false');
    showToast(val ? 'Daily opening briefing enabled on system startup' : 'Auto-display disabled');
  };

  const handleToggleSound = (val: boolean) => {
    setSoundEnabled(val);
    localStorage.setItem(soundKey, val ? 'true' : 'false');
    showToast(val ? 'Daily alert sound chime enabled' : 'Sound chime muted');
  };

  const todayFormatted = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl text-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-amber-600/30 via-indigo-900/60 to-purple-950/60 border-b border-slate-800 p-5 sm:p-6 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-2xl shadow-inner shrink-0">
                <Sun className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded-md uppercase tracking-wider border border-amber-500/30">
                    Daily System Opening Briefing
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {todayFormatted}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
                  <span>{currentTenant?.shop_name || 'Store'}</span>
                  <span className="text-xs font-normal text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700">
                    {currentTenant?.business_type.replace('_', ' ')}
                  </span>
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Automated daily store health monitor: <strong className="text-rose-400">{lowStockProducts.length} low stock items</strong> & <strong className="text-amber-400">{debtorCustomers.length} customer credit accounts</strong> requiring attention today.
                </p>
              </div>
            </div>

            {/* Quick Header Actions */}
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={handlePrintBriefing}
                title="Print Store Opening Checklist"
                className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" />
              </button>

              <button
                onClick={handleExportBriefingExcel}
                title="Download Excel Workbook"
                className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 hover:text-emerald-400 transition-all cursor-pointer shadow-xs"
              >
                <FileSpreadsheet className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleToggleSound(!soundEnabled)}
                title={soundEnabled ? 'Mute alert chime' : 'Enable alert chime'}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 hover:text-amber-400 transition-all cursor-pointer shadow-xs"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
              </button>

              <button
                onClick={onClose}
                className="p-2.5 bg-slate-800 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-500/40 rounded-xl text-slate-400 hover:text-rose-300 transition-all cursor-pointer shadow-xs"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 4 Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            {/* Card 1: Low Stock */}
            <div
              onClick={() => {
                setActiveTab('low_stock');
                setStockFilter('all');
              }}
              className="bg-slate-900/90 border border-rose-500/30 p-3 rounded-2xl hover:border-rose-400 transition-all cursor-pointer group shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-rose-300">Low Stock Reorders</span>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-xl font-black text-rose-400 mt-1">
                {lowStockProducts.length} <span className="text-xs text-rose-300/80 font-normal">items</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {outOfStockProducts.length} items completely out of stock
              </div>
            </div>

            {/* Card 2: Out of Stock Critical */}
            <div
              onClick={() => {
                setActiveTab('low_stock');
                setStockFilter('out_of_stock');
              }}
              className="bg-slate-900/90 border border-crimson-500/30 p-3 rounded-2xl hover:border-rose-400 transition-all cursor-pointer group shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-red-300">Out of Stock (0 Qty)</span>
                <Package className="w-3.5 h-3.5 text-red-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-xl font-black text-red-400 mt-1">
                {outOfStockProducts.length} <span className="text-xs text-red-300/80 font-normal">items</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Est Restock: {currencySymbol} {totalReplenishmentEstCost.toLocaleString()}
              </div>
            </div>

            {/* Card 3: Outstanding Customer Credit */}
            <div
              onClick={() => {
                setActiveTab('customer_credit');
                setCreditFilter('all');
              }}
              className="bg-slate-900/90 border border-amber-500/30 p-3 rounded-2xl hover:border-amber-400 transition-all cursor-pointer group shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-amber-300">Customer Credit (Debt)</span>
                <Users className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-xl font-black text-amber-400 mt-1">
                {currencySymbol} {totalOutstandingReceivables.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Across {debtorCustomers.length} active customer accounts
              </div>
            </div>

            {/* Card 4: Over Credit Limit */}
            <div
              onClick={() => {
                setActiveTab('customer_credit');
                setCreditFilter('exceeded_limit');
              }}
              className="bg-slate-900/90 border border-orange-500/30 p-3 rounded-2xl hover:border-orange-400 transition-all cursor-pointer group shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-orange-300">Exceeded Credit Limit</span>
                <TrendingDown className="w-3.5 h-3.5 text-orange-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-xl font-black text-orange-400 mt-1">
                {exceededLimitCustomers.length} <span className="text-xs text-orange-300/80 font-normal">customers</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                High collection priority accounts
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-900/90 border-b border-slate-800 px-6 py-2.5 flex items-center justify-between gap-4 overflow-x-auto shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Morning Executive Summary</span>
            </button>

            <button
              onClick={() => setActiveTab('low_stock')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'low_stock'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Package className="w-3.5 h-3.5 text-rose-300" />
              <span>Low Stock Alerts ({lowStockProducts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('customer_credit')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'customer_credit'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-amber-300" />
              <span>Customer Account Balances ({debtorCustomers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'settings'
                  ? 'bg-slate-800 text-slate-100 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Automation Preferences</span>
            </button>
          </div>

          {/* Mini Search if in Stock or Credit tab */}
          {(activeTab === 'low_stock' || activeTab === 'customer_credit') && (
            <div className="relative w-48 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={activeTab === 'low_stock' ? 'Filter products, SKU...' : 'Filter customer name, phone...'}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}
        </div>

        {/* Modal Toast / Feedback Notification */}
        {modalToast && (
          <div className="bg-emerald-950/90 border-b border-emerald-500/40 px-6 py-2 text-xs font-bold text-emerald-300 flex items-center justify-between animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{modalToast}</span>
            </div>
            <button onClick={() => setModalToast(null)} className="text-emerald-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: EXECUTIVE SUMMARY */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Daily Action Plan Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left Panel: Top Critical Low Stock */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-rose-500/20 text-rose-400 rounded-lg">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-rose-300">
                          Priority Low Stock Items
                        </h3>
                        <p className="text-[11px] text-slate-400">Items requiring immediate reordering today</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveTab('low_stock')}
                      className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>View all ({lowStockProducts.length})</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  {lowStockProducts.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto opacity-70" />
                      <p className="text-xs text-slate-400">All inventory stocks are above reorder levels!</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-800/60 text-xs">
                      {lowStockProducts.slice(0, 5).map((p) => (
                        <div key={p.id} className="py-2.5 flex items-center justify-between hover:bg-slate-900/50 px-2 rounded-xl transition-colors">
                          <div>
                            <div className="font-bold text-slate-200">{p.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              SKU: {p.sku} • Cost: {currencySymbol} {p.cost_price}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <span className={`font-bold font-mono px-2 py-0.5 rounded text-[11px] ${
                                p.stock_quantity <= 0 ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                              }`}>
                                {p.stock_quantity} {p.unit || 'pcs'}
                              </span>
                              <div className="text-[9px] text-slate-500 mt-0.5">Min: {p.reorder_level ?? 10}</div>
                            </div>

                            <button
                              onClick={() => {
                                setQuickRestockProduct(p);
                                setQuickRestockQty((p.reorder_level ?? 10) * 2 - p.stock_quantity > 0 ? (p.reorder_level ?? 10) * 2 - p.stock_quantity : 10);
                              }}
                              className="p-1.5 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-lg transition-all cursor-pointer"
                              title="Quick restock count"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {lowStockProducts.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">Estimated Reorder Cost:</span>
                      <span className="text-xs font-black text-rose-400 font-mono">
                        {currencySymbol} {totalReplenishmentEstCost.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Right Panel: Top Customer Debtors */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                          Highest Outstanding Debtors
                        </h3>
                        <p className="text-[11px] text-slate-400">Customer balances requiring follow-up</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveTab('customer_credit')}
                      className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>View all ({debtorCustomers.length})</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  {debtorCustomers.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto opacity-70" />
                      <p className="text-xs text-slate-400">Zero customer debt! All credit ledgers are clear.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-800/60 text-xs">
                      {debtorCustomers.slice(0, 5).map((c) => (
                        <div key={c.id} className="py-2.5 flex items-center justify-between hover:bg-slate-900/50 px-2 rounded-xl transition-colors">
                          <div>
                            <div className="font-bold text-slate-200 flex items-center gap-1.5">
                              <span>{c.name}</span>
                              {(c.current_balance || 0) > (c.credit_limit || 50000) && (
                                <span className="px-1.5 py-0.2 bg-red-950 text-red-400 border border-red-800 text-[9px] rounded font-bold">
                                  Over Limit
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {c.phone || 'No Phone'} • Limit: {currencySymbol} {(c.credit_limit || 50000).toLocaleString()}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <span className="font-bold font-mono text-amber-400 text-xs">
                                {currencySymbol} {(c.current_balance || 0).toLocaleString()}
                              </span>
                            </div>

                            <button
                              onClick={() => handleSendWhatsAppReminder(c)}
                              className="p-1.5 bg-emerald-950/80 hover:bg-emerald-800 border border-emerald-700/60 text-emerald-300 rounded-lg transition-all cursor-pointer"
                              title="Send WhatsApp payment reminder"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                setSettleCustomer(c);
                                setSettleAmount(c.current_balance || 0);
                              }}
                              className="p-1.5 bg-slate-800 hover:bg-amber-600 text-slate-300 hover:text-white rounded-lg transition-all cursor-pointer"
                              title="Record cash settlement"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {debtorCustomers.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">Total Credit Receivables:</span>
                      <span className="text-xs font-black text-amber-400 font-mono">
                        {currencySymbol} {totalOutstandingReceivables.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Jump Buttons */}
              <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-purple-950/60 border border-indigo-500/20 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-indigo-400" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">Ready to start today's sales?</h4>
                    <p className="text-[11px] text-slate-400">Launch POS terminal or jump directly to stock replenishment.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {onOpenPos && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenPos();
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-all"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Launch POS Billing Screen</span>
                    </button>
                  )}

                  {onNavigateTab && (
                    <button
                      onClick={() => {
                        onClose();
                        onNavigateTab('PRODUCTS');
                      }}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <span>Go to Inventory</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LOW STOCK & REORDER STUDIO */}
          {activeTab === 'low_stock' && (
            <div className="space-y-4">
              {/* Filter Pills */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setStockFilter('all')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      stockFilter === 'all'
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    All Low Stock ({lowStockProducts.length})
                  </button>
                  <button
                    onClick={() => setStockFilter('out_of_stock')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      stockFilter === 'out_of_stock'
                        ? 'bg-red-700 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Out of Stock (0 Qty) ({outOfStockProducts.length})
                  </button>
                  <button
                    onClick={() => setStockFilter('low_stock')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      stockFilter === 'low_stock'
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Below Reorder Level ({lowStockProducts.length - outOfStockProducts.length})
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {onNavigateTab && (
                    <button
                      onClick={() => {
                        onClose();
                        onNavigateTab('SUPPLIERS');
                      }}
                      className="px-3 py-1.5 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-200 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Create Purchase Order</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Table */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="p-3">Product / SKU</th>
                      <th className="p-3">Category</th>
                      <th className="p-3 text-center">Current Stock</th>
                      <th className="p-3 text-center">Reorder Min</th>
                      <th className="p-3 text-right">Cost Price</th>
                      <th className="p-3 text-right">Selling Price</th>
                      <th className="p-3 text-center">Quick Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredLowStock.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500">
                          No low stock items found matching your filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredLowStock.map((p) => {
                        const isZero = p.stock_quantity <= 0;
                        const cat = categories.find((c) => c.id === p.category_id);
                        return (
                          <tr key={p.id} className="hover:bg-slate-900/60 transition-colors">
                            <td className="p-3">
                              <div className="font-bold text-slate-200">{p.name}</div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                SKU: {p.sku} {p.barcode ? `• Barcode: ${p.barcode}` : ''}
                              </div>
                            </td>
                            <td className="p-3 text-slate-400">
                              <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px]">
                                {cat?.name || 'General'}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span
                                className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs inline-block ${
                                  isZero
                                    ? 'bg-red-950 text-red-400 border border-red-800 animate-pulse'
                                    : 'bg-rose-950 text-rose-400 border border-rose-800'
                                }`}
                              >
                                {p.stock_quantity} {p.unit || 'pcs'}
                              </span>
                            </td>
                            <td className="p-3 text-center text-slate-400 font-mono">
                              {p.reorder_level ?? 10} {p.unit || 'pcs'}
                            </td>
                            <td className="p-3 text-right font-mono text-slate-300">
                              {currencySymbol} {(p.cost_price || 0).toLocaleString()}
                            </td>
                            <td className="p-3 text-right font-mono text-emerald-400 font-bold">
                              {currencySymbol} {(p.selling_price || 0).toLocaleString()}
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setQuickRestockProduct(p);
                                    setQuickRestockQty((p.reorder_level ?? 10) * 2 - p.stock_quantity > 0 ? (p.reorder_level ?? 10) * 2 - p.stock_quantity : 10);
                                  }}
                                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                                >
                                  <RefreshCw className="w-3 h-3" />
                                  <span>Restock</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOMER ACCOUNT BALANCES */}
          {activeTab === 'customer_credit' && (
            <div className="space-y-4">
              {/* Filter Pills */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCreditFilter('all')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      creditFilter === 'all'
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    All Customer Debtors ({debtorCustomers.length})
                  </button>
                  <button
                    onClick={() => setCreditFilter('exceeded_limit')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      creditFilter === 'exceeded_limit'
                        ? 'bg-red-700 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Exceeded Limit ({exceededLimitCustomers.length})
                  </button>
                  <button
                    onClick={() => setCreditFilter('high_balance')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      creditFilter === 'high_balance'
                        ? 'bg-orange-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    High Balance (&gt; {currencySymbol} 10,000)
                  </button>
                </div>

                <div className="text-xs text-slate-300 font-mono">
                  Total Receivables: <strong className="text-amber-400 font-bold">{currencySymbol} {totalOutstandingReceivables.toLocaleString()}</strong>
                </div>
              </div>

              {/* Table */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="p-3">Customer Name</th>
                      <th className="p-3">Phone & Address</th>
                      <th className="p-3 text-right">Outstanding Debt</th>
                      <th className="p-3 text-right">Credit Limit</th>
                      <th className="p-3 text-center">Limit Usage</th>
                      <th className="p-3 text-center">Quick Settlement & Reminder</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredDebtors.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500">
                          No customer credit records match your filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredDebtors.map((c) => {
                        const balance = c.current_balance || 0;
                        const limit = c.credit_limit || 50000;
                        const isOver = balance > limit;
                        const pct = Math.min(100, Math.round((balance / limit) * 100));

                        return (
                          <tr key={c.id} className="hover:bg-slate-900/60 transition-colors">
                            <td className="p-3">
                              <div className="font-bold text-slate-200">{c.name}</div>
                              <div className="text-[10px] text-slate-500 font-mono">ID: {c.id}</div>
                            </td>
                            <td className="p-3 text-slate-400">
                              <div className="font-mono text-slate-300 flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-500" />
                                <span>{c.phone || 'No phone'}</span>
                              </div>
                              {c.address && <div className="text-[10px] text-slate-500 truncate max-w-xs">{c.address}</div>}
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-amber-400 text-sm">
                              {currencySymbol} {balance.toLocaleString()}
                            </td>
                            <td className="p-3 text-right font-mono text-slate-400">
                              {currencySymbol} {limit.toLocaleString()}
                            </td>
                            <td className="p-3 text-center">
                              <div className="w-24 mx-auto space-y-1">
                                <div className="flex items-center justify-between text-[9px] font-mono">
                                  <span className={isOver ? 'text-red-400 font-bold' : 'text-slate-400'}>{pct}%</span>
                                  {isOver && <span className="text-red-400 font-bold">OVER</span>}
                                </div>
                                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${isOver ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleSendWhatsAppReminder(c)}
                                  className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-800 border border-emerald-700/60 text-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                                  title="Send WhatsApp payment reminder"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                  <span>WhatsApp</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setSettleCustomer(c);
                                    setSettleAmount(balance);
                                  }}
                                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                                  title="Record payment settlement"
                                >
                                  <DollarSign className="w-3 h-3" />
                                  <span>Settle</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: AUTOMATION & PREFERENCES */}
          {activeTab === 'settings' && (
            <div className="max-w-xl mx-auto space-y-6 bg-slate-950/60 border border-slate-800 rounded-2xl p-6">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  Daily Opening Automation & Health Briefing Settings
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Configure when and how the automated daily low stock and customer balance alerts appear.
                </p>
              </div>

              <div className="space-y-4 divide-y divide-slate-800/80 text-xs">
                {/* Setting 1: Auto Open Daily */}
                <div className="pt-3 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-slate-200">Automatically display every day at system launch</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      When enabled, this briefing will appear automatically the first time the shop opens each calendar day.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={autoOpenDaily}
                      onChange={(e) => handleToggleAutoOpen(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {/* Setting 2: Alert Sound Chime */}
                <div className="pt-3 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-slate-200">Play pleasant audio chime on startup</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Synthesizes a soft morning greeting chime when low stock or debt alerts require attention.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={soundEnabled}
                      onChange={(e) => handleToggleSound(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Bar */}
        <div className="bg-slate-950 border-t border-slate-800 p-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Daily health check complete for <strong>{currentTenant?.shop_name}</strong></span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
            >
              <span>Acknowledge & Start Store Operations</span>
            </button>
          </div>
        </div>

      </div>

      {/* QUICK RESTOCK MODAL */}
      {quickRestockProduct && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-indigo-300 flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                <span>Quick Stock Restock</span>
              </h3>
              <button onClick={() => setQuickRestockProduct(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
              <div className="font-bold text-slate-200">{quickRestockProduct.name}</div>
              <div className="text-slate-400">
                Current Stock: <strong className="text-rose-400 font-mono">{quickRestockProduct.stock_quantity} {quickRestockProduct.unit || 'pcs'}</strong> • Reorder Min: <strong className="text-slate-300">{quickRestockProduct.reorder_level ?? 10}</strong>
              </div>
            </div>

            <form onSubmit={handleQuickRestockSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Quantity Received / Added ({quickRestockProduct.unit || 'pcs'}): *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={quickRestockQty}
                  onChange={(e) => setQuickRestockQty(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-base font-bold text-emerald-400 font-mono text-center focus:border-indigo-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  New total stock will become: <strong className="text-emerald-400 font-mono">{quickRestockProduct.stock_quantity + Number(quickRestockQty)}</strong>
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Restock Reason / Source:</label>
                <input
                  type="text"
                  value={quickRestockReason}
                  onChange={(e) => setQuickRestockReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQuickRestockProduct(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Apply Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK SETTLEMENT PAYMENT MODAL */}
      {settleCustomer && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-amber-300 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span>Record Debt Settlement</span>
              </h3>
              <button onClick={() => setSettleCustomer(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
              <div className="font-bold text-slate-200">{settleCustomer.name}</div>
              <div className="text-slate-400">
                Outstanding Balance: <strong className="text-amber-400 font-mono">{currencySymbol} {(settleCustomer.current_balance || 0).toLocaleString()}</strong>
              </div>
            </div>

            <form onSubmit={handleSettlePaymentSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Payment Amount Received ({currencySymbol}): *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  min="1"
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-base font-bold text-emerald-400 font-mono text-center focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Payment Method:</label>
                <select
                  value={settleMethod}
                  onChange={(e) => setSettleMethod(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                >
                  <option value="CASH">Cash in Hand</option>
                  <option value="CARD">Debit / Credit Card</option>
                  <option value="BANK_TRANSFER">Bank Online Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Settlement Reference Note:</label>
                <input
                  type="text"
                  value={settleNote}
                  onChange={(e) => setSettleNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSettleCustomer(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
