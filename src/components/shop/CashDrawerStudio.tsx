import React, { useState, useMemo } from 'react';
import { useRetail } from '../../context/RetailContext';
import {
  CashDrawerTransaction,
  CashDrawerTransactionType,
  CounterTerminal,
  CounterShift,
} from '../../types';
import {
  Coins,
  DollarSign,
  ArrowDownRight,
  ArrowUpRight,
  Lock,
  Unlock,
  Receipt,
  Printer,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  Minus,
  Calculator,
  RotateCcw,
  Sparkles,
  Download,
  Building,
  KeyRound,
  FileText,
  Banknote,
  Vault,
  Bluetooth,
} from 'lucide-react';
import { PrintZReportModal } from '../common/PrintZReportModal';

const SRI_LANKAN_DENOMINATIONS = [
  { value: 5000, label: 'Rs. 5,000 Note' },
  { value: 1000, label: 'Rs. 1,000 Note' },
  { value: 500, label: 'Rs. 500 Note' },
  { value: 100, label: 'Rs. 100 Note' },
  { value: 50, label: 'Rs. 50 Note' },
  { value: 20, label: 'Rs. 20 Note' },
  { value: 10, label: 'Rs. 10 Coin/Note' },
  { value: 5, label: 'Rs. 5 Coin' },
  { value: 2, label: 'Rs. 2 Coin' },
  { value: 1, label: 'Rs. 1 Coin' },
];

export const CashDrawerStudio: React.FC = () => {
  const {
    currentTenant,
    currentSettings,
    counters,
    counterShifts,
    cashDrawerTransactions,
    currentDrawerCashBalance,
    currentUser,
    currencySymbol = 'Rs.',
    openDayShift,
    closeDayShift,
    recordCashDrawerIn,
    recordCashDrawerOut,
    kickCashDrawer,
    queuePrintJob,
    users,
    hasPermission,
  } = useRetail();

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'JOURNAL' | 'SHIFTS_ZREPORTS' | 'DENOM_TOOL'>('OVERVIEW');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCounterFilter, setSelectedCounterFilter] = useState<string>('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('');

  // Modal States
  const [isDayOpenModalOpen, setIsDayOpenModalOpen] = useState(false);
  const [isDayEndModalOpen, setIsDayEndModalOpen] = useState(false);
  const [isCashInModalOpen, setIsCashInModalOpen] = useState(false);
  const [isCashOutModalOpen, setIsCashOutModalOpen] = useState(false);
  const [activeReceiptModalData, setActiveReceiptModalData] = useState<{ title: string; content: string } | null>(null);
  const [selectedZReportShift, setSelectedZReportShift] = useState<CounterShift | null>(null);
  const [isZReportModalOpen, setIsZReportModalOpen] = useState(false);

  // Day Open Form State
  const [dayOpenForm, setDayOpenForm] = useState({
    counter_id: counters[0]?.id || '',
    cashier_id: currentUser?.id || '',
    cashier_name: currentUser?.full_name || currentUser?.username || 'Cashier',
    opening_float: 5000,
    notes: '',
    denominations: {} as Record<string, number>,
  });

  // Day End Form State
  const [dayEndForm, setDayEndForm] = useState({
    shift_id: '',
    closing_cash_actual: 0,
    cash_withdrawal_amount: 0,
    retained_float_for_next_day: 0,
    withdrawal_notes: 'End of Day deposit to main store vault',
    notes: '',
    closing_denominations: {} as Record<string, number>,
  });

  // Cash In Form State
  const [cashInForm, setCashInForm] = useState({
    counter_id: counters[0]?.id || '',
    amount: 2000,
    category: 'CHANGE_REPLENISH' as any,
    reason: 'Replenish small change notes and coins',
    notes: '',
  });

  // Cash Out Form State
  const [cashOutForm, setCashOutForm] = useState({
    counter_id: counters[0]?.id || '',
    amount: 1500,
    category: 'PETTY_CASH' as any,
    reason: 'Tea, refreshments & shop cleaning supplies',
    notes: '',
  });

  // Standalone Denomination Calculator State
  const [calcDenoms, setCalcDenoms] = useState<Record<string, number>>({});

  const totalCalculatedDenom = useMemo(() => {
    return SRI_LANKAN_DENOMINATIONS.reduce((sum, d) => {
      const count = calcDenoms[String(d.value)] || 0;
      return sum + count * d.value;
    }, 0);
  }, [calcDenoms]);

  // Derived KPI aggregates
  const activeCounters = counters.filter((c) => c.status === 'ONLINE');
  const openShifts = counterShifts.filter((s) => s.status === 'OPEN');

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayTransactions = useMemo(() => {
    return cashDrawerTransactions.filter((tx) => tx.created_at.startsWith(todayStr));
  }, [cashDrawerTransactions, todayStr]);

  const todayTotalDeposits = useMemo(() => {
    return todayTransactions
      .filter((t) => t.type === 'DAY_OPEN_FLOAT' || t.type === 'CASH_IN_DEPOSIT')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [todayTransactions]);

  const todayTotalWithdrawals = useMemo(() => {
    return todayTransactions
      .filter((t) => t.type === 'DAY_END_WITHDRAWAL' || t.type === 'CASH_OUT_PAYOUT')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [todayTransactions]);

  const totalStoreDrawerCash = useMemo(() => {
    return counters.reduce((sum, counter) => {
      const openShift = counterShifts.find((s) => s.counter_id === counter.id && s.status === 'OPEN');
      if (!openShift) return sum + (counter.current_float || 0);

      const shiftTxs = cashDrawerTransactions.filter((t) => t.shift_id === openShift.id);
      const midDayIn = shiftTxs.filter((t) => t.type === 'CASH_IN_DEPOSIT').reduce((s, t) => s + (t.amount || 0), 0);
      const midDayOut = shiftTxs.filter((t) => t.type === 'CASH_OUT_PAYOUT' || t.type === 'DAY_END_WITHDRAWAL').reduce((s, t) => s + (t.amount || 0), 0);

      const expected = (openShift.opening_float || 0) + (openShift.total_cash_sales || 0) + midDayIn - Math.max(midDayOut, openShift.total_payouts || 0) - (openShift.total_refunds || 0);
      return sum + Math.max(0, expected);
    }, 0);
  }, [counters, counterShifts, cashDrawerTransactions]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return cashDrawerTransactions.filter((tx) => {
      const matchesSearch =
        tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.reference_no && tx.reference_no.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (tx.performed_by && tx.performed_by.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (tx.reason && tx.reason.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (tx.counter_name && tx.counter_name.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCounter = selectedCounterFilter === 'ALL' || tx.counter_id === selectedCounterFilter;
      const matchesType = selectedTypeFilter === 'ALL' || tx.type === selectedTypeFilter;
      const matchesDate = !selectedDateFilter || tx.created_at.startsWith(selectedDateFilter);

      return matchesSearch && matchesCounter && matchesType && matchesDate;
    });
  }, [cashDrawerTransactions, searchTerm, selectedCounterFilter, selectedTypeFilter, selectedDateFilter]);

  // Handlers for Day Open
  const handleTriggerDayOpen = (counter?: CounterTerminal) => {
    const targetCounter = counter || counters[0];
    setDayOpenForm({
      counter_id: targetCounter?.id || '',
      cashier_id: currentUser?.id || '',
      cashier_name: currentUser?.full_name || currentUser?.username || 'Cashier',
      opening_float: targetCounter?.current_float || 5000,
      notes: '',
      denominations: {},
    });
    setIsDayOpenModalOpen(true);
  };

  const submitDayOpen = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dayOpenForm.counter_id) {
      alert('Please select a counter terminal.');
      return;
    }
    if (dayOpenForm.opening_float < 0) {
      alert('Opening float cannot be negative.');
      return;
    }

    const counterObj = counters.find((c) => c.id === dayOpenForm.counter_id);
    const cashierObj = users.find((u) => u.id === dayOpenForm.cashier_id);

    openDayShift({
      counter_id: dayOpenForm.counter_id,
      counter_name: counterObj?.name,
      cashier_id: dayOpenForm.cashier_id,
      cashier_name: cashierObj?.full_name || dayOpenForm.cashier_name,
      opening_float: Number(dayOpenForm.opening_float),
      denominations: Object.keys(dayOpenForm.denominations).length > 0 ? dayOpenForm.denominations : undefined,
      notes: dayOpenForm.notes,
    });

    setIsDayOpenModalOpen(false);
    alert(`✅ Day Open Shift successfully initiated for ${counterObj?.name || 'Counter'} with starting cash float of ${currencySymbol} ${dayOpenForm.opening_float.toLocaleString()}!`);
  };

  // Handlers for Day End
  const handleTriggerDayEnd = (shift: CounterShift) => {
    const shiftTxs = cashDrawerTransactions.filter((t) => t.shift_id === shift.id);
    const midDayIn = shiftTxs.filter((t) => t.type === 'CASH_IN_DEPOSIT').reduce((s, t) => s + (t.amount || 0), 0);
    const midDayOut = shiftTxs.filter((t) => t.type === 'CASH_OUT_PAYOUT').reduce((s, t) => s + (t.amount || 0), 0);

    const expectedCash = (shift.opening_float || 0) + (shift.total_cash_sales || 0) + midDayIn - Math.max(midDayOut, shift.total_payouts || 0) - (shift.total_refunds || 0);

    setDayEndForm({
      shift_id: shift.id,
      closing_cash_actual: Math.max(0, expectedCash),
      cash_withdrawal_amount: Math.max(0, expectedCash),
      retained_float_for_next_day: 0,
      withdrawal_notes: `End of day cash withdrawal to vault / bank deposit for ${shift.counter_name}`,
      notes: '',
      closing_denominations: {},
    });
    setIsDayEndModalOpen(true);
  };

  const submitDayEnd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dayEndForm.shift_id) return;

    const res = closeDayShift({
      shift_id: dayEndForm.shift_id,
      closing_cash_actual: Number(dayEndForm.closing_cash_actual),
      closing_denominations: Object.keys(dayEndForm.closing_denominations).length > 0 ? dayEndForm.closing_denominations : undefined,
      cash_withdrawal_amount: Number(dayEndForm.cash_withdrawal_amount),
      retained_float_for_next_day: Number(dayEndForm.retained_float_for_next_day),
      withdrawal_notes: dayEndForm.withdrawal_notes,
      notes: dayEndForm.notes,
    });

    setIsDayEndModalOpen(false);

    // Launch official Z-Report / Shift Printout Modal matching bill printout step
    const targetShift = counterShifts.find((s) => s.id === dayEndForm.shift_id);
    if (targetShift) {
      setSelectedZReportShift({
        ...targetShift,
        status: 'CLOSED',
        closed_at: new Date().toISOString(),
        closing_cash_actual: Number(dayEndForm.closing_cash_actual),
        cash_withdrawal_amount: Number(dayEndForm.cash_withdrawal_amount),
        retained_float_for_next_day: Number(dayEndForm.retained_float_for_next_day),
        notes: dayEndForm.notes,
        z_report_no: res.summary?.zReportNo || targetShift.z_report_no || `Z-${targetShift.id}`,
      });
      setIsZReportModalOpen(true);
    } else if (res.summary) {
      setActiveReceiptModalData({
        title: `Z-Report & Day End Settlement — ${res.summary.counter}`,
        content: `================================================
          WCS RETAIL CLOUD PLATFORM
       DAY END Z-REPORT & VAULT DEPOSIT
================================================
Shop:       ${currentTenant?.shop_name || 'Retail Store'}
Z-Report #: ${res.summary.zReportNo}
Counter:    ${res.summary.counter}
Cashier:    ${res.summary.cashier}
Date:       ${new Date().toLocaleDateString()}
Time:       ${new Date().toLocaleTimeString()}
------------------------------------------------
Opening Float:        Rs. ${(res.summary.openingFloat || 0).toLocaleString()}
Total Sales Revenue:  Rs. ${(res.summary.totalSales || 0).toLocaleString()} (${res.summary.billsCount} bills)
- Cash Bills:         Rs. ${(res.summary.totalCash || 0).toLocaleString()}
- Card Bills:         Rs. ${(res.summary.totalCard || 0).toLocaleString()}
- Credit Bills:       Rs. ${(res.summary.totalCredit || 0).toLocaleString()}
------------------------------------------------
Calculated Expected:  Rs. ${(res.summary.expectedCash || 0).toLocaleString()}
Actual Physical Count:Rs. ${(res.summary.actualCash || 0).toLocaleString()}
Variance (Surplus/Deficit): Rs. ${(res.summary.variance || 0).toLocaleString()}
================================================
DAY END CASH WITHDRAWAL:  Rs. ${(res.summary.withdrawalAmount || 0).toLocaleString()}
RETAINED FLOAT IN DRAWER: Rs. ${(res.summary.retainedFloat || 0).toLocaleString()}
================================================
Signature: ______________________
Supervisor: _____________________
Thank you for using WCS Retail Cloud!`,
      });
    }
  };

  // Submit Cash In
  const submitCashIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (cashInForm.amount <= 0) {
      alert('Please enter a valid deposit amount.');
      return;
    }

    recordCashDrawerIn({
      counter_id: cashInForm.counter_id,
      amount: Number(cashInForm.amount),
      category: cashInForm.category,
      reason: cashInForm.reason,
      notes: cashInForm.notes,
    });

    setIsCashInModalOpen(false);
    alert(`✅ Cash In deposit of ${currencySymbol} ${cashInForm.amount.toLocaleString()} recorded successfully!`);
  };

  // Submit Cash Out
  const submitCashOut = (e: React.FormEvent) => {
    e.preventDefault();
    if (cashOutForm.amount <= 0) {
      alert('Please enter a valid payout amount.');
      return;
    }

    recordCashDrawerOut({
      counter_id: cashOutForm.counter_id,
      amount: Number(cashOutForm.amount),
      category: cashOutForm.category,
      reason: cashOutForm.reason,
      notes: cashOutForm.notes,
    });

    setIsCashOutModalOpen(false);
    alert(`✅ Cash Out payout of ${currencySymbol} ${cashOutForm.amount.toLocaleString()} recorded successfully!`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-950 rounded-2xl p-6 text-white border border-emerald-800/40 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-black text-[10px] tracking-wider uppercase border border-emerald-500/30">
              Cash Drawer Engine & Shift Lifecycle
            </span>
            <span className="text-xs text-slate-400">| Sri Lanka LKR Standard</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-1 flex items-center gap-2.5">
            <Vault className="w-7 h-7 text-emerald-400" />
            <span>Cash Drawer, Day Open & Day End Close</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Formal morning cash deposit floats, mid-day change replenishment, supplier cash disbursements, and end-of-day cash drawer reconciliation with safe withdrawals and automated Z-Reports.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleTriggerDayOpen()}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/40 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Unlock className="w-4 h-4" />
            <span>Day Open (Float Deposit)</span>
          </button>

          <button
            onClick={() => setIsCashInModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Cash In (+)</span>
          </button>

          <button
            onClick={() => setIsCashOutModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-amber-700 hover:bg-amber-600 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" />
            <span>Cash Out (-)</span>
          </button>

          <button
            onClick={() => kickCashDrawer()}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Sends ESC/POS pulse to open physical drawer"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>Kick Drawer</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Cash in Drawers</span>
            <div className="text-xl font-black text-emerald-600 mt-1">
              {currencySymbol} {totalStoreDrawerCash.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-400">Across {counters.length} counter terminals</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Shifts Today</span>
            <div className="text-xl font-black text-slate-900 mt-1">
              {openShifts.length} <span className="text-xs font-normal text-slate-500">/ {counters.length} Open</span>
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold">{activeCounters.length} terminals online</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Today's Cash In / Deposits</span>
            <div className="text-xl font-black text-teal-600 mt-1">
              + {currencySymbol} {todayTotalDeposits.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-400">Day Open floats & replenish</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <ArrowDownRight className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Today's Withdrawals / Drops</span>
            <div className="text-xl font-black text-rose-600 mt-1">
              - {currencySymbol} {todayTotalWithdrawals.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-400">Day End drops & petty payouts</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'OVERVIEW'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Vault className="w-4 h-4" />
          <span>Counter Drawers Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('JOURNAL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'JOURNAL'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Transaction Journal ({cashDrawerTransactions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('SHIFTS_ZREPORTS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'SHIFTS_ZREPORTS'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Shift History & Z-Reports ({counterShifts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('DENOM_TOOL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'DENOM_TOOL'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>LKR Denomination Calculator</span>
        </button>
      </div>

      {/* TAB 1: COUNTER DRAWERS OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {counters.map((counter) => {
              const openShift = counterShifts.find((s) => s.counter_id === counter.id && s.status === 'OPEN');
              const shiftTxs = openShift ? cashDrawerTransactions.filter((t) => t.shift_id === openShift.id) : [];
              const midDayIn = shiftTxs.filter((t) => t.type === 'CASH_IN_DEPOSIT').reduce((s, t) => s + (t.amount || 0), 0);
              const midDayOut = shiftTxs.filter((t) => t.type === 'CASH_OUT_PAYOUT' || t.type === 'DAY_END_WITHDRAWAL').reduce((s, t) => s + (t.amount || 0), 0);

              const currentExpectedCash = openShift
                ? (openShift.opening_float || 0) + (openShift.total_cash_sales || 0) + midDayIn - Math.max(midDayOut, openShift.total_payouts || 0) - (openShift.total_refunds || 0)
                : counter.current_float || 0;

              return (
                <div
                  key={counter.id}
                  className={`bg-white rounded-2xl border transition-all shadow-xs p-5 flex flex-col justify-between ${
                    openShift ? 'border-emerald-200 ring-1 ring-emerald-500/20' : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header: Name & Status */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900">{counter.name}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {counter.counter_code}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500">{counter.location_or_bay || 'Main Store Floor'}</span>
                      </div>

                      {openShift ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Shift Open</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold text-[10px]">
                          Closed
                        </span>
                      )}
                    </div>

                    {/* Cash in Drawer Box */}
                    <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">Current Drawer Balance:</span>
                        <span className="text-base font-black text-emerald-700">
                          {currencySymbol} {Math.max(0, currentExpectedCash).toLocaleString()}
                        </span>
                      </div>

                      {openShift ? (
                        <div className="pt-2 border-t border-slate-200/60 space-y-1 text-[11px] text-slate-600">
                          <div className="flex justify-between">
                            <span>Cashier:</span>
                            <span className="font-semibold text-slate-900">{openShift.cashier_name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Opening Float:</span>
                            <span className="font-medium text-slate-700">{currencySymbol} {openShift.opening_float.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Cash Sales ({openShift.total_bills_count} bills):</span>
                            <span className="font-medium text-emerald-700">+ {currencySymbol} {openShift.total_cash_sales.toLocaleString()}</span>
                          </div>
                          {midDayIn > 0 && (
                            <div className="flex justify-between">
                              <span>Mid-day Deposits:</span>
                              <span className="font-medium text-teal-700">+ {currencySymbol} {midDayIn.toLocaleString()}</span>
                            </div>
                          )}
                          {midDayOut > 0 && (
                            <div className="flex justify-between">
                              <span>Payouts / Cash Out:</span>
                              <span className="font-medium text-rose-700">- {currencySymbol} {midDayOut.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 pt-1">
                          No active shift currently running. Click "Day Open" to start cashiering with a cash deposit.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-4 mt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                    {openShift ? (
                      <>
                        <button
                          onClick={() => handleTriggerDayEnd(openShift)}
                          className="flex-1 py-1.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Day End Close</span>
                        </button>

                        <button
                          onClick={() => {
                            setCashInForm((prev) => ({ ...prev, counter_id: counter.id }));
                            setIsCashInModalOpen(true);
                          }}
                          className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors cursor-pointer"
                          title="Cash In"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setCashOutForm((prev) => ({ ...prev, counter_id: counter.id }));
                            setIsCashOutModalOpen(true);
                          }}
                          className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors cursor-pointer"
                          title="Cash Out"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => kickCashDrawer(counter.id, counter.name)}
                          className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-amber-700 font-semibold text-xs transition-colors cursor-pointer"
                          title="Kick Physical Drawer"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleTriggerDayOpen(counter)}
                          className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Day Open (Float)</span>
                        </button>

                        <button
                          onClick={() => kickCashDrawer(counter.id, counter.name)}
                          className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-amber-700 font-semibold text-xs transition-colors cursor-pointer"
                          title="Kick Physical Drawer"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: TRANSACTION JOURNAL */}
      {activeTab === 'JOURNAL' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search transactions, reference, cashier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Filter by Counter */}
              <select
                value={selectedCounterFilter}
                onChange={(e) => setSelectedCounterFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 cursor-pointer focus:outline-none"
              >
                <option value="ALL">All Counters</option>
                {counters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.counter_code} - {c.name}
                  </option>
                ))}
              </select>

              {/* Filter by Type */}
              <select
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 cursor-pointer focus:outline-none"
              >
                <option value="ALL">All Transaction Types</option>
                <option value="DAY_OPEN_FLOAT">Day Open Float</option>
                <option value="DAY_END_WITHDRAWAL">Day End Withdrawal</option>
                <option value="CASH_IN_DEPOSIT">Cash In Deposit</option>
                <option value="CASH_OUT_PAYOUT">Cash Out Payout</option>
                <option value="MANUAL_DRAWER_KICK">Manual Drawer Kick</option>
              </select>

              {/* Filter by Date */}
              <input
                type="date"
                value={selectedDateFilter}
                onChange={(e) => setSelectedDateFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 cursor-pointer focus:outline-none"
              />

              {selectedDateFilter && (
                <button
                  onClick={() => setSelectedDateFilter('')}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
                >
                  Clear Date
                </button>
              )}
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Tx ID & Ref</th>
                    <th className="py-3 px-4">Date / Time</th>
                    <th className="py-3 px-4">Counter</th>
                    <th className="py-3 px-4">Type & Category</th>
                    <th className="py-3 px-4">Performed By</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4">Reason / Notes</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No cash drawer transactions found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => {
                      const isPositive = tx.type === 'DAY_OPEN_FLOAT' || tx.type === 'CASH_IN_DEPOSIT';
                      const isNegative = tx.type === 'DAY_END_WITHDRAWAL' || tx.type === 'CASH_OUT_PAYOUT';

                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            <div>{tx.id}</div>
                            {tx.reference_no && <span className="text-[10px] text-slate-400">{tx.reference_no}</span>}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            <div>{new Date(tx.created_at).toLocaleDateString()}</div>
                            <span className="text-[10px] text-slate-400">{new Date(tx.created_at).toLocaleTimeString()}</span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            {tx.counter_name || tx.counter_id}
                          </td>
                          <td className="py-3 px-4">
                            {tx.type === 'DAY_OPEN_FLOAT' && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                Day Open Float
                              </span>
                            )}
                            {tx.type === 'DAY_END_WITHDRAWAL' && (
                              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
                                Day End Withdrawal
                              </span>
                            )}
                            {tx.type === 'CASH_IN_DEPOSIT' && (
                              <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold text-[10px]">
                                Cash In (+)
                              </span>
                            )}
                            {tx.type === 'CASH_OUT_PAYOUT' && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                                Cash Out (-)
                              </span>
                            )}
                            {tx.type === 'MANUAL_DRAWER_KICK' && (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                                Drawer Kick
                              </span>
                            )}
                            {tx.category && <div className="text-[10px] text-slate-400 mt-0.5">{tx.category}</div>}
                          </td>
                          <td className="py-3 px-4 text-slate-700 font-medium">
                            <div>{tx.performed_by}</div>
                            <span className="text-[10px] text-slate-400">{tx.performed_by_role}</span>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-sm">
                            {isPositive && (
                              <span className="text-emerald-600">
                                + {currencySymbol} {tx.amount.toLocaleString()}
                              </span>
                            )}
                            {isNegative && (
                              <span className="text-rose-600">
                                - {currencySymbol} {tx.amount.toLocaleString()}
                              </span>
                            )}
                            {!isPositive && !isNegative && (
                              <span className="text-slate-500">
                                {currencySymbol} 0
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                            <div>{tx.reason}</div>
                            {tx.notes && <span className="text-[10px] text-slate-400 italic">{tx.notes}</span>}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => {
                                setActiveReceiptModalData({
                                  title: `Cash Drawer Voucher #${tx.id}`,
                                  content: `================================================
          WCS RETAIL CLOUD PLATFORM
          CASH DRAWER VOUCHER / RECEIPT
================================================
Shop:       ${currentTenant?.shop_name || 'Retail Store'}
Voucher ID: ${tx.id}
Ref No:     ${tx.reference_no || 'N/A'}
Date/Time:  ${new Date(tx.created_at).toLocaleString()}
Counter:    ${tx.counter_name || tx.counter_id}
Type:       ${tx.type}
Category:   ${tx.category || 'N/A'}
------------------------------------------------
AMOUNT:     Rs. ${tx.amount.toLocaleString()}
------------------------------------------------
Reason:     ${tx.reason}
Notes:      ${tx.notes || 'None'}
By:         ${tx.performed_by} (${tx.performed_by_role})
================================================
Authorized Signature: __________________`,
                                });
                              }}
                              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
                            >
                              View Slip
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SHIFT HISTORY & Z-REPORTS */}
      {activeTab === 'SHIFTS_ZREPORTS' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Shift ID & Counter</th>
                    <th className="py-3 px-4">Cashier</th>
                    <th className="py-3 px-4">Opened / Closed</th>
                    <th className="py-3 px-4 text-right">Opening Float</th>
                    <th className="py-3 px-4 text-right">Total Cash Sales</th>
                    <th className="py-3 px-4 text-right">Expected Cash</th>
                    <th className="py-3 px-4 text-right">Actual Count</th>
                    <th className="py-3 px-4 text-right">Variance</th>
                    <th className="py-3 px-4 text-right">Day End Withdrawal</th>
                    <th className="py-3 px-4 text-center">Status / Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {counterShifts.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400">
                        No shift records found.
                      </td>
                    </tr>
                  ) : (
                    counterShifts.map((shift) => (
                      <tr key={shift.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          <div>{shift.id}</div>
                          <span className="text-[10px] text-slate-500 font-sans">{shift.counter_name}</span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {shift.cashier_name}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          <div>Open: {new Date(shift.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          {shift.closed_at ? (
                            <span className="text-[10px] text-slate-500">
                              Close: {new Date(shift.closed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          ) : (
                            <span className="text-[10px] text-emerald-600 font-bold">Currently Open</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-slate-800">
                          {currencySymbol} {shift.opening_float.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-emerald-700">
                          {currencySymbol} {shift.total_cash_sales.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-slate-700">
                          {shift.expected_cash_in_drawer !== undefined
                            ? `${currencySymbol} ${shift.expected_cash_in_drawer.toLocaleString()}`
                            : '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          {shift.closing_cash_actual !== undefined
                            ? `${currencySymbol} ${shift.closing_cash_actual.toLocaleString()}`
                            : '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-bold">
                          {shift.cash_variance !== undefined ? (
                            shift.cash_variance === 0 ? (
                              <span className="text-emerald-600">Rs. 0</span>
                            ) : shift.cash_variance > 0 ? (
                              <span className="text-teal-600">+ Rs. {shift.cash_variance.toLocaleString()}</span>
                            ) : (
                              <span className="text-rose-600">- Rs. {Math.abs(shift.cash_variance).toLocaleString()}</span>
                            )
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-rose-700">
                          {shift.cash_withdrawal_amount !== undefined
                            ? `${currencySymbol} ${shift.cash_withdrawal_amount.toLocaleString()}`
                            : '—'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {shift.status === 'OPEN' ? (
                            <button
                              onClick={() => handleTriggerDayEnd(shift)}
                              className="px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] shadow-xs cursor-pointer"
                            >
                              Day End Close
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedZReportShift(shift);
                                setIsZReportModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-850 border border-amber-300 text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                              title="Print official Z-Report & Shift Audit (Thermal 80mm, 58mm, Bluetooth, Any Printer)"
                            >
                              <Printer className="w-3.5 h-3.5 text-amber-600" />
                              <span>Print Z-Report</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LKR DENOMINATION CALCULATOR */}
      {activeTab === 'DENOM_TOOL' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-600" />
                <span>Sri Lankan Rupee Cash & Coin Denomination Counter</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Count notes and coins accurately for morning Day Open cash float verification or Day End closing physical cash audit.
              </p>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Counted Value</span>
              <div className="text-2xl font-black text-emerald-600">
                {currencySymbol} {totalCalculatedDenom.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Grid of Denominations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {SRI_LANKAN_DENOMINATIONS.map((denom) => {
              const count = calcDenoms[String(denom.value)] || 0;
              const subtotal = count * denom.value;

              return (
                <div key={denom.value} className="bg-slate-50 rounded-2xl border border-slate-200 p-3.5 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-xs text-slate-800">{denom.label}</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                      Rs. {denom.value}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={count || ''}
                      onChange={(e) => {
                        const val = Math.max(0, parseInt(e.target.value) || 0);
                        setCalcDenoms((prev) => ({ ...prev, [String(denom.value)]: val }));
                      }}
                      className="w-full bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center"
                    />
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                    <span>Subtotal:</span>
                    <span className="font-bold text-slate-800">Rs. {subtotal.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setCalcDenoms({})}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Counts</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setDayOpenForm((prev) => ({
                    ...prev,
                    opening_float: totalCalculatedDenom,
                    denominations: { ...calcDenoms },
                  }));
                  setIsDayOpenModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Use for Day Open Float
              </button>

              <button
                onClick={() => {
                  if (openShifts.length === 0) {
                    alert('No open shifts to apply Day End count to.');
                    return;
                  }
                  handleTriggerDayEnd(openShifts[0]);
                  setDayEndForm((prev) => ({
                    ...prev,
                    closing_cash_actual: totalCalculatedDenom,
                    cash_withdrawal_amount: totalCalculatedDenom,
                    closing_denominations: { ...calcDenoms },
                  }));
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Use for Day End Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 1: DAY OPEN (CASH DEPOSIT FLOAT) --- */}
      {isDayOpenModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Morning Cash Float Entry
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1 flex items-center gap-2">
                  <Unlock className="w-5 h-5 text-emerald-600" />
                  <span>Day Open — Start Cashier Shift</span>
                </h3>
              </div>
              <button
                onClick={() => setIsDayOpenModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitDayOpen} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase">Counter Terminal</label>
                  <select
                    value={dayOpenForm.counter_id}
                    onChange={(e) => setDayOpenForm({ ...dayOpenForm, counter_id: e.target.value })}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {counters.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.counter_code} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase">Cashier</label>
                  <select
                    value={dayOpenForm.cashier_id}
                    onChange={(e) => {
                      const user = users.find((u) => u.id === e.target.value);
                      setDayOpenForm({
                        ...dayOpenForm,
                        cashier_id: e.target.value,
                        cashier_name: user?.full_name || 'Cashier',
                      });
                    }}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase">
                  Opening Cash Float Deposit Amount ({currencySymbol})
                </label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    required
                    value={dayOpenForm.opening_float}
                    onChange={(e) => setDayOpenForm({ ...dayOpenForm, opening_float: Number(e.target.value) })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-black text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex gap-1.5 mt-2">
                  {[2000, 5000, 10000, 15000, 20000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDayOpenForm({ ...dayOpenForm, opening_float: preset })}
                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-700 transition-colors cursor-pointer"
                    >
                      Rs. {preset.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase">Notes / Float Verification</label>
                <input
                  type="text"
                  placeholder="e.g. Verified by Store Manager, small change replenished"
                  value={dayOpenForm.notes}
                  onChange={(e) => setDayOpenForm({ ...dayOpenForm, notes: e.target.value })}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDayOpenModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Open Shift & Print Float Slip</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: DAY END (CASH WITHDRAWAL & Z-REPORT) --- */}
      {isDayEndModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                  Shift Closing & Vault Settlement
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-rose-600" />
                  <span>Day End Close & Cash Withdrawal</span>
                </h3>
              </div>
              <button
                onClick={() => setIsDayEndModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitDayEnd} className="space-y-4">
              {/* Actual Physical Cash Counted */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase">
                  Actual Physical Cash Counted in Drawer ({currencySymbol})
                </label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={dayEndForm.closing_cash_actual}
                    onChange={(e) => {
                      const actual = Number(e.target.value);
                      setDayEndForm({
                        ...dayEndForm,
                        closing_cash_actual: actual,
                        cash_withdrawal_amount: Math.max(0, actual - dayEndForm.retained_float_for_next_day),
                      });
                    }}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              {/* Cash Withdrawal to Safe Amount */}
              <div className="p-3.5 bg-rose-50/70 rounded-2xl border border-rose-100 space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-rose-900 uppercase flex items-center justify-between">
                    <span>Day End Cash Withdrawal to Vault / Bank ({currencySymbol})</span>
                    <span className="text-[10px] text-rose-600 font-normal">Cash taken out of shop</span>
                  </label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      required
                      value={dayEndForm.cash_withdrawal_amount}
                      onChange={(e) => {
                        const withdraw = Number(e.target.value);
                        setDayEndForm({
                          ...dayEndForm,
                          cash_withdrawal_amount: withdraw,
                          retained_float_for_next_day: Math.max(0, dayEndForm.closing_cash_actual - withdraw),
                        });
                      }}
                      className="w-full pl-10 pr-4 py-2 bg-white border border-rose-200 rounded-xl text-base font-black text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase flex items-center justify-between">
                    <span>Retained Float Left in Drawer for Tomorrow ({currencySymbol})</span>
                  </label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={dayEndForm.retained_float_for_next_day}
                      onChange={(e) => {
                        const retained = Number(e.target.value);
                        setDayEndForm({
                          ...dayEndForm,
                          retained_float_for_next_day: retained,
                          cash_withdrawal_amount: Math.max(0, dayEndForm.closing_cash_actual - retained),
                        });
                      }}
                      className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase">Withdrawal Purpose / Bank Account</label>
                <input
                  type="text"
                  value={dayEndForm.withdrawal_notes}
                  onChange={(e) => setDayEndForm({ ...dayEndForm, withdrawal_notes: e.target.value })}
                  placeholder="e.g. Deposited into Commercial Bank Account #1029384"
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase">Auditor / Shift Notes</label>
                <input
                  type="text"
                  value={dayEndForm.notes}
                  onChange={(e) => setDayEndForm({ ...dayEndForm, notes: e.target.value })}
                  placeholder="e.g. All bills audited, cashier shift balanced without shortage"
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDayEndModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-900/30 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>Execute Day End Close & Print Z-Report</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: CASH IN (MID-DAY DEPOSIT) --- */}
      {isCashInModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                  Cash Drawer Inflow
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-teal-600" />
                  <span>Cash In / Change Deposit</span>
                </h3>
              </div>
              <button
                onClick={() => setIsCashInModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitCashIn} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase">Counter Terminal</label>
                <select
                  value={cashInForm.counter_id}
                  onChange={(e) => setCashInForm({ ...cashInForm, counter_id: e.target.value })}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none"
                >
                  {counters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.counter_code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase">Deposit Amount ({currencySymbol})</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    min="1"
                    required
                    value={cashInForm.amount}
                    onChange={(e) => setCashInForm({ ...cashInForm, amount: Number(e.target.value) })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-black text-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase">Category</label>
                <select
                  value={cashInForm.category}
                  onChange={(e) => setCashInForm({ ...cashInForm, category: e.target.value as any })}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none"
                >
                  <option value="CHANGE_REPLENISH">Change / Coins Replenishment</option>
                  <option value="FLOAT">Additional Shift Float</option>
                  <option value="PETTY_CASH">Petty Cash Deposit</option>
                  <option value="OTHER">Other Deposit</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase">Reason / Purpose</label>
                <input
                  type="text"
                  required
                  value={cashInForm.reason}
                  onChange={(e) => setCashInForm({ ...cashInForm, reason: e.target.value })}
                  placeholder="e.g. Added Rs. 100 & Rs. 50 change notes"
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCashInModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md shadow-teal-900/30 transition-all cursor-pointer"
                >
                  Record Cash In & Print
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 4: CASH OUT (MID-DAY PAYOUT) --- */}
      {isCashOutModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  Cash Drawer Outflow
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1 flex items-center gap-2">
                  <Minus className="w-5 h-5 text-amber-600" />
                  <span>Cash Out / Payout Voucher</span>
                </h3>
              </div>
              <button
                onClick={() => setIsCashOutModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitCashOut} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase">Counter Terminal</label>
                <select
                  value={cashOutForm.counter_id}
                  onChange={(e) => setCashOutForm({ ...cashOutForm, counter_id: e.target.value })}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none"
                >
                  {counters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.counter_code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase">Payout Amount ({currencySymbol})</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    min="1"
                    required
                    value={cashOutForm.amount}
                    onChange={(e) => setCashOutForm({ ...cashOutForm, amount: Number(e.target.value) })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-black text-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase">Category</label>
                <select
                  value={cashOutForm.category}
                  onChange={(e) => setCashOutForm({ ...cashOutForm, category: e.target.value as any })}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none"
                >
                  <option value="PETTY_CASH">Petty Cash / Refreshments</option>
                  <option value="SUPPLIER_PAYMENT">Supplier Direct Cash Payment</option>
                  <option value="BANK_DROP">Mid-Day Vault / Safe Drop</option>
                  <option value="OWNER_DRAW">Owner / Manager Cash Draw</option>
                  <option value="OTHER">Other Payout</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase">Payee / Reason</label>
                <input
                  type="text"
                  required
                  value={cashOutForm.reason}
                  onChange={(e) => setCashOutForm({ ...cashOutForm, reason: e.target.value })}
                  placeholder="e.g. Paid tea and bakery bill for staff"
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCashOutModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-900/30 transition-all cursor-pointer"
                >
                  Record Cash Out & Print Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 5: RECEIPT / SLIP PREVIEW & REPRINT --- */}
      {activeReceiptModalData && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900">{activeReceiptModalData.title}</h3>
              <button
                onClick={() => setActiveReceiptModalData(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <pre className="p-4 bg-slate-950 text-emerald-400 font-mono text-[11px] rounded-2xl whitespace-pre-wrap leading-relaxed overflow-x-auto shadow-inner">
              {activeReceiptModalData.content}
            </pre>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  queuePrintJob('THERMAL_80', activeReceiptModalData.title, activeReceiptModalData.content);
                  alert('✅ Print job sent to thermal receipt printer!');
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Send to Printer</span>
              </button>

              <button
                onClick={() => setActiveReceiptModalData(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 6: OFFICIAL Z-REPORT & SHIFT AUDIT PRINT MODAL (FOLLOWS BILL PRINTOUT STEP) --- */}
      <PrintZReportModal
        shift={selectedZReportShift}
        tenant={currentTenant}
        settings={currentSettings}
        isOpen={isZReportModalOpen}
        onClose={() => setIsZReportModalOpen(false)}
      />
    </div>
  );
};

export default CashDrawerStudio;
