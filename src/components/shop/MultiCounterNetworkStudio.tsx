import React, { useState, useMemo } from 'react';
import { useRetail } from '../../context/RetailContext';
import { CounterTerminal, CounterShift, UserAccount } from '../../types';
import {
  Monitor,
  Tv,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  Printer,
  FileText,
  UserCheck,
  ShieldCheck,
  Laptop,
  ArrowRight,
  Wifi,
  Sparkles,
  Search,
  Lock,
  Unlock,
  KeyRound,
  RotateCcw,
  Check,
  X,
  ExternalLink,
  Receipt,
  Layers,
  HelpCircle,
  BarChart3,
  Coins,
  Building,
  Server,
  Network,
  Cpu,
} from 'lucide-react';

interface MultiCounterNetworkStudioProps {
  onOpenPosWithCounter?: (counterId: string) => void;
}

export const MultiCounterNetworkStudio: React.FC<MultiCounterNetworkStudioProps> = ({
  onOpenPosWithCounter,
}) => {
  const {
    currentTenant,
    counters,
    counterShifts,
    terminalStation,
    setTerminalStation,
    openCounterShift,
    closeCounterShift,
    addCounterTerminal,
    updateCounterTerminal,
    deleteCounterTerminal,
    recordCounterCashDrop,
    users,
    currencySymbol = 'Rs.',
    sales,
    hasPermission,
    queuePrintJob,
  } = useRetail();

  const [activeSubTab, setActiveSubTab] = useState<'MONITOR' | 'GUIDE' | 'SHIFTS' | 'TERMINALS'>('MONITOR');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isAddCounterOpen, setIsAddCounterOpen] = useState(false);
  const [editingCounter, setEditingCounter] = useState<CounterTerminal | null>(null);
  const [isStationConfigOpen, setIsStationConfigOpen] = useState(false);
  
  // Shift open / close modals
  const [shiftOpenCounter, setShiftOpenCounter] = useState<CounterTerminal | null>(null);
  const [openCashierId, setOpenCashierId] = useState<string>('');
  const [openFloatAmount, setOpenFloatAmount] = useState<number>(5000);
  const [openShiftNotes, setOpenShiftNotes] = useState<string>('');

  const [shiftCloseTarget, setShiftCloseTarget] = useState<CounterShift | null>(null);
  const [closingActualCash, setClosingActualCash] = useState<number>(0);
  const [closeShiftNotes, setCloseShiftNotes] = useState<string>('');
  const [lastClosedSummary, setLastClosedSummary] = useState<any | null>(null);

  // Cash drop modal
  const [cashDropCounter, setCashDropCounter] = useState<CounterTerminal | null>(null);
  const [cashDropAmount, setCashDropAmount] = useState<number>(20000);
  const [cashDropReason, setCashDropReason] = useState<string>('Mid-day cash drawer drop to vault');

  // X-Report preview modal
  const [xReportCounter, setXReportCounter] = useState<CounterTerminal | null>(null);

  // New counter form state
  const [counterForm, setCounterForm] = useState({
    name: '',
    counter_code: '',
    location_or_bay: '',
    default_cashier_id: '',
    default_printer_type: '80mm' as '80mm' | '58mm' | 'a4',
    is_locked_to_pos: true,
    ip_or_device_name: '',
    notes: '',
  });

  // Calculate live multi-counter network stats
  const networkStats = useMemo(() => {
    const totalCounters = counters.length;
    const activeCounters = counters.filter((c) => c.status === 'ONLINE' || c.status === 'BILLING').length;
    const totalBills = counters.reduce((sum, c) => sum + (c.total_bills_today || 0), 0);
    const totalRevenue = counters.reduce((sum, c) => sum + (c.total_revenue_today || 0), 0);
    const totalDrawerCash = counters.reduce((sum, c) => sum + (c.current_float || 0), 0);
    const openShiftsCount = counterShifts.filter((s) => s.status === 'OPEN').length;

    return {
      totalCounters,
      activeCounters,
      totalBills,
      totalRevenue,
      totalDrawerCash,
      openShiftsCount,
    };
  }, [counters, counterShifts]);

  // Filtered counters
  const filteredCounters = useMemo(() => {
    return counters.filter(
      (c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.counter_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.current_cashier_name && c.current_cashier_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [counters, searchTerm]);

  // Cashier users
  const cashierUsers = useMemo(() => {
    return users.filter((u) => u.is_active);
  }, [users]);

  // Open Shift Handler
  const handleConfirmOpenShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftOpenCounter) return;
    const selectedCashier = users.find((u) => u.id === openCashierId) || users[0];
    openCounterShift(
      shiftOpenCounter.id,
      selectedCashier.id,
      selectedCashier.full_name,
      Number(openFloatAmount) || 0,
      openShiftNotes
    );
    setShiftOpenCounter(null);
    setOpenShiftNotes('');
  };

  // Close Shift Handler (Z-Report)
  const handleConfirmCloseShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftCloseTarget) return;
    const res = closeCounterShift(shiftCloseTarget.id, Number(closingActualCash) || 0, closeShiftNotes);
    setLastClosedSummary(res.summary);
    setShiftCloseTarget(null);
    setCloseShiftNotes('');
  };

  // Cash Drop Handler
  const handleConfirmCashDrop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashDropCounter || cashDropAmount <= 0) return;
    recordCounterCashDrop(cashDropCounter.id, Number(cashDropAmount), cashDropReason);
    setCashDropCounter(null);
  };

  // Create / Edit counter terminal
  const handleSaveCounter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!counterForm.name.trim()) return;

    if (editingCounter) {
      updateCounterTerminal(editingCounter.id, counterForm);
      setEditingCounter(null);
    } else {
      addCounterTerminal(counterForm);
      setIsAddCounterOpen(false);
    }

    setCounterForm({
      name: '',
      counter_code: '',
      location_or_bay: '',
      default_cashier_id: '',
      default_printer_type: '80mm',
      is_locked_to_pos: true,
      ip_or_device_name: '',
      notes: '',
    });
  };

  const handlePrintXReport = (counter: CounterTerminal) => {
    const shift = counterShifts.find((s) => s.id === counter.current_shift_id && s.status === 'OPEN');
    if (!shift) return;

    queuePrintJob(
      'THERMAL_80',
      `X-Report: ${counter.name}`,
      `MID-SHIFT X-REPORT\nCounter: ${counter.name} (${counter.counter_code})\nCashier: ${shift.cashier_name}\nShift Started: ${new Date(shift.opened_at).toLocaleTimeString()}\nOpening Float: Rs. ${shift.opening_float.toLocaleString()}\nTotal Sales: Rs. ${shift.total_sales_amount.toLocaleString()}\nCash: Rs. ${shift.total_cash_sales.toLocaleString()} | Card: Rs. ${shift.total_card_sales.toLocaleString()} | Credit: Rs. ${shift.total_credit_sales.toLocaleString()}\nBills Count: ${shift.total_bills_count}\nEst. Cash in Drawer: Rs. ${(shift.opening_float + shift.total_cash_sales - shift.total_payouts).toLocaleString()}`
    );
    setXReportCounter(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Device Station Identity Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl border border-indigo-500/20 p-6 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center shrink-0 shadow-inner">
              <Network className="w-7 h-7 text-indigo-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl lg:text-2xl font-black tracking-tight text-white">
                  Multi-Counter & Terminal Network Studio
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  LAN Synchronized
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-1 max-w-2xl">
                Run back-office admin & owner controls on one computer while cashiers issue bills from multiple counter terminals on other computers with synchronized live stock and drawer auditing.
              </p>
            </div>
          </div>

          {/* Current PC Station Identity Pill */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 flex items-center gap-3.5 shadow-md self-stretch lg:self-auto">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              terminalStation.station_type === 'ADMIN_WORKSTATION'
                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                : 'bg-blue-500/20 border border-blue-500/40 text-blue-300'
            }`}>
              {terminalStation.station_type === 'ADMIN_WORKSTATION' ? <Building className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
            </div>
            <div className="min-w-0 pr-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                This Computer Role:
              </div>
              <div className="text-sm font-bold text-white truncate">
                {terminalStation.station_type === 'ADMIN_WORKSTATION' ? '🏢 Owner / Admin Workstation' : `🖥️ ${terminalStation.counter_name || 'Cashier Counter'}`}
              </div>
            </div>
            <button
              onClick={() => setIsStationConfigOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all shadow-sm shrink-0 cursor-pointer"
            >
              Switch Role
            </button>
          </div>
        </div>

        {/* Live Multi-Counter KPI Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
            <div className="text-xs text-slate-400 font-medium">Total Counters</div>
            <div className="text-lg font-black text-white mt-0.5">{networkStats.totalCounters} Terminals</div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
            <div className="text-xs text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Online & Active
            </div>
            <div className="text-lg font-black text-emerald-300 mt-0.5">{networkStats.activeCounters} Counters</div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
            <div className="text-xs text-cyan-400 font-medium">Bills Issued Today</div>
            <div className="text-lg font-black text-cyan-300 mt-0.5">{networkStats.totalBills.toLocaleString()} Bills</div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
            <div className="text-xs text-indigo-300 font-medium">Total Revenue Today</div>
            <div className="text-lg font-black text-indigo-200 mt-0.5">{currencySymbol} {networkStats.totalRevenue.toLocaleString()}</div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
            <div className="text-xs text-amber-400 font-medium">Cash in Drawers</div>
            <div className="text-lg font-black text-amber-300 mt-0.5">{currencySymbol} {networkStats.totalDrawerCash.toLocaleString()}</div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
            <div className="text-xs text-purple-400 font-medium">Open Shifts (Z-Pending)</div>
            <div className="text-lg font-black text-purple-300 mt-0.5">{networkStats.openShiftsCount} Registers</div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('MONITOR')}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'MONITOR'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Tv className="w-4 h-4" />
            Live Counter Monitor ({counters.length})
          </button>
          <button
            onClick={() => setActiveSubTab('GUIDE')}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'GUIDE'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Network className="w-4 h-4" />
            Multi-Computer Setup Guide
          </button>
          <button
            onClick={() => setActiveSubTab('SHIFTS')}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'SHIFTS'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Receipt className="w-4 h-4" />
            Shifts & Z-Reports Log ({counterShifts.length})
          </button>
          <button
            onClick={() => setActiveSubTab('TERMINALS')}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'TERMINALS'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Monitor className="w-4 h-4" />
            Hardware & Terminals
          </button>
        </div>

        {activeSubTab === 'MONITOR' && (
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search counter or cashier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-52 sm:w-64"
              />
            </div>
            <button
              onClick={() => {
                setEditingCounter(null);
                setCounterForm({
                  name: `Counter 0${counters.length + 1} - Checkout`,
                  counter_code: `POS-0${counters.length + 1}`,
                  location_or_bay: 'Front Checkout Line',
                  default_cashier_id: cashierUsers[0]?.id || '',
                  default_printer_type: '80mm',
                  is_locked_to_pos: true,
                  ip_or_device_name: `PC-COUNTER-0${counters.length + 1}`,
                  notes: '',
                });
                setIsAddCounterOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Counter
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: LIVE COUNTER MONITOR GRID                                      */}
      {/* ========================================================================= */}
      {activeSubTab === 'MONITOR' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCounters.map((counter) => {
              const activeShift = counterShifts.find((s) => s.id === counter.current_shift_id && s.status === 'OPEN');
              const isThisDeviceCounter = terminalStation.counter_id === counter.id;

              return (
                <div
                  key={counter.id}
                  className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all shadow-md overflow-hidden flex flex-col justify-between ${
                    counter.status === 'BILLING'
                      ? 'border-emerald-500/60 ring-2 ring-emerald-500/20'
                      : counter.status === 'ONLINE'
                      ? 'border-indigo-500/50'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-inner ${
                          counter.status === 'BILLING'
                            ? 'bg-emerald-500 text-white'
                            : counter.status === 'ONLINE'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-700 text-slate-300'
                        }`}>
                          {counter.counter_code}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base">
                              {counter.name}
                            </h3>
                            {isThisDeviceCounter && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/30">
                                This PC
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                            <span>{counter.location_or_bay || 'Main Store Floor'}</span>
                            <span>•</span>
                            <span className="font-mono text-[11px]">{counter.ip_or_device_name || '127.0.0.1'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 flex items-center gap-1.5 ${
                        counter.status === 'BILLING'
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                          : counter.status === 'ONLINE'
                          ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          counter.status === 'BILLING'
                            ? 'bg-emerald-500 animate-ping'
                            : counter.status === 'ONLINE'
                            ? 'bg-blue-500'
                            : 'bg-slate-400'
                        }`}></span>
                        {counter.status === 'BILLING' ? 'Active Billing' : counter.status === 'ONLINE' ? 'Register Open' : 'Shift Closed'}
                      </span>
                    </div>
                  </div>

                  {/* Card Body Metrics */}
                  <div className="p-5 space-y-4 flex-1">
                    {/* Active Cashier Row */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-indigo-500" />
                        <span className="text-slate-500 dark:text-slate-400">Current Cashier:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {counter.current_cashier_name || 'No Cashier Assigned'}
                        </span>
                      </div>
                      {counter.is_locked_to_pos && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> POS Locked
                        </span>
                      )}
                    </div>

                    {/* Sales Metrics Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
                        <div className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">Today's Revenue</div>
                        <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                          {currencySymbol} {(counter.total_revenue_today || 0).toLocaleString()}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {(counter.total_bills_today || 0)} Bills Completed
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                        <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Drawer Cash Float</div>
                        <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                          {currencySymbol} {(counter.current_float || 0).toLocaleString()}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {activeShift ? `Shift #${activeShift.id.slice(-4)}` : 'No active shift'}
                        </div>
                      </div>
                    </div>

                    {/* Printer & Hardware Config */}
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                      <div className="flex items-center gap-1.5">
                        <Printer className="w-3.5 h-3.5 text-slate-400" />
                        <span>Printer: <strong className="text-slate-700 dark:text-slate-300 uppercase">{counter.default_printer_type || '80mm'} Thermal</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Last Bill: <strong className="text-slate-700 dark:text-slate-300">{counter.last_active ? new Date(counter.last_active).toLocaleTimeString() : 'N/A'}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/70 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    {/* Primary Action Button */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setTerminalStation({
                            station_type: 'COUNTER_POS',
                            counter_id: counter.id,
                            counter_name: counter.name,
                            default_printer_type: counter.default_printer_type,
                          });
                          if (onOpenPosWithCounter) {
                            onOpenPosWithCounter(counter.id);
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        Launch POS
                      </button>

                      {activeShift ? (
                        <>
                          <button
                            onClick={() => {
                              setShiftCloseTarget(activeShift);
                              setClosingActualCash((activeShift.opening_float || 0) + (activeShift.total_cash_sales || 0) - (activeShift.total_payouts || 0));
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-600/10 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-500/30 text-xs font-bold transition-all cursor-pointer"
                            title="Close shift and generate Z-Report audit"
                          >
                            Close Shift (Z-Report)
                          </button>
                          <button
                            onClick={() => {
                              setXReportCounter(counter);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
                            title="Print mid-day X-Report snapshot"
                          >
                            X-Report
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setShiftOpenCounter(counter);
                            setOpenCashierId(counter.default_cashier_id || cashierUsers[0]?.id || '');
                            setOpenFloatAmount(5000);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                        >
                          <Coins className="w-3.5 h-3.5" />
                          Open Shift
                        </button>
                      )}
                    </div>

                    {/* More quick actions */}
                    <div className="flex items-center gap-1">
                      {activeShift && (
                        <button
                          onClick={() => {
                            setCashDropCounter(counter);
                            setCashDropAmount(Math.min(counter.current_float || 10000, 25000));
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-all cursor-pointer"
                          title="Cash Drop to Safe"
                        >
                          <Coins className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setEditingCounter(counter);
                          setCounterForm({
                            name: counter.name,
                            counter_code: counter.counter_code,
                            location_or_bay: counter.location_or_bay || '',
                            default_cashier_id: counter.default_cashier_id || '',
                            default_printer_type: counter.default_printer_type || '80mm',
                            is_locked_to_pos: counter.is_locked_to_pos ?? true,
                            ip_or_device_name: counter.ip_or_device_name || '',
                            notes: counter.notes || '',
                          });
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-all cursor-pointer"
                        title="Edit Terminal Settings"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: MULTI-COMPUTER & LAN DEPLOYMENT ARCHITECTURE GUIDE             */}
      {/* ========================================================================= */}
      {activeSubTab === 'GUIDE' && (
        <div className="space-y-6">
          {/* Visual Architecture Diagram Card */}
          <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-6 lg:p-8 shadow-xl">
            <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
              <div>
                <h2 className="text-lg lg:text-xl font-black text-white flex items-center gap-2.5">
                  <Network className="w-6 h-6 text-indigo-400" />
                  Multi-Terminal Topology & Access Control Architecture
                </h2>
                <p className="text-xs lg:text-sm text-slate-400 mt-1">
                  How one Admin PC coordinates with multiple Cashier Counter workstations over Local Area Network (LAN) or Cloud.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Hub & Counter Model
              </span>
            </div>

            {/* Architecture Visual Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Box 1: Computer 1 (Owner / Admin Workstation) */}
              <div className="lg:col-span-4 bg-gradient-to-b from-indigo-950/80 to-slate-900 border border-indigo-500/40 rounded-2xl p-5 shadow-lg relative">
                <div className="absolute -top-3 left-4 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500 text-white uppercase tracking-wider">
                  Computer 01 (Back Office / Manager Desk)
                </div>
                <div className="flex items-center gap-3 mb-3 mt-1">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/50 flex items-center justify-center text-indigo-300">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Admin & Owner Control Center</h4>
                    <span className="text-[11px] text-indigo-300 font-mono">Role: OWNER / ADMIN</span>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs text-slate-300 border-t border-indigo-900/60 pt-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Real-time Multi-Counter Revenue Monitor</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Cost Prices & Profit Margins (Confidential)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Purchase Orders & Supplier Payables</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Staff Payroll, EPF/ETF & Salaries</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Physical Stock Audits & Gap Adjustments</span>
                  </div>
                </div>
              </div>

              {/* Connecting Sync Bridge */}
              <div className="lg:col-span-4 flex flex-col items-center justify-center text-center p-4 bg-slate-800/40 rounded-2xl border border-slate-700/60">
                <div className="w-12 h-12 rounded-full bg-indigo-600/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 mb-2 animate-pulse">
                  <Wifi className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Live LAN Synchronizer</h4>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                  Whenever a cashier scans a barcode or issues a bill at any counter, stock levels, drawer cash balances, and customer credit ledgers update across all computers in real-time.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">0ms Lag</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300">Auto-Reconcile</span>
                </div>
              </div>

              {/* Box 2: Computers 2, 3, 4 (Counter Billing Terminals) */}
              <div className="lg:col-span-4 space-y-2.5">
                {counters.slice(0, 3).map((c, idx) => (
                  <div key={c.id} className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-3 flex items-center justify-between gap-3 shadow-md">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-bold text-xs">
                        C0{idx + 1}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{c.name}</div>
                        <div className="text-[10px] text-slate-400">Cashier Login (PIN Protected) • Restricted POS Mode</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                      {c.default_printer_type || '80mm'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 4-Step Deployment Setup Guide */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Step 1 */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Connect Computers to Store LAN / Wi-Fi
                </h3>
              </div>
              <p className="text-xs lg:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Connect the Admin computer and all counter PCs / tablets to the same local store network router (via Ethernet Cable or 5GHz Wi-Fi). Open the browser on each counter PC and navigate to the software URL.
              </p>
              <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 font-mono text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Example Address: http://192.168.1.100:3000
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Assign Terminal Identity on Each Computer
                </h3>
              </div>
              <p className="text-xs lg:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                On each computer's browser, click the <strong>"Switch Role"</strong> button in the top bar. Set Computer 1 to <strong>"Owner / Admin Workstation"</strong>, and set Computers 2, 3, 4 to <strong>"Counter 01"</strong>, <strong>"Counter 02"</strong>, etc.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={() => setIsStationConfigOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-all cursor-pointer"
                >
                  Configure Station Identity Now
                </button>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Enforce User Access Controls (RBAC)
                </h3>
              </div>
              <p className="text-xs lg:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Cashiers log in using their own dedicated 4-digit PIN. The system automatically restricts cashiers: they <strong>cannot</strong> view product cost prices, supplier bills, profit margins, staff salaries, or delete invoices.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <span className="px-2.5 py-1 rounded text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  🔒 Cost Prices Hidden from Cashiers
                </span>
                <span className="px-2.5 py-1 rounded text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  🛡️ Void Audit Trails
                </span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                  4
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Thermal Printers & Cash Drawers
                </h3>
              </div>
              <p className="text-xs lg:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Connect each counter's 80mm or 58mm USB / Ethernet receipt printer and RJ11 cash drawer trigger. Receipts printed from each counter will clearly display the specific Counter ID and Cashier Name on the header.
              </p>
              <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Receipt Footer: <em>"Counter: POS-01 | Cashier: Kamal Perera"</em>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: SHIFTS & Z-REPORTS AUDIT LOG                                   */}
      {/* ========================================================================= */}
      {activeSubTab === 'SHIFTS' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-500" />
                Register Shifts & Z-Report Audit Records
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Full chronological ledger of cash drawer opening floats, collections, cash variances, and closed Z-reports.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Shift ID</th>
                  <th className="py-3 px-4">Counter & Cashier</th>
                  <th className="py-3 px-4">Opened / Closed</th>
                  <th className="py-3 px-4 text-right">Opening Float</th>
                  <th className="py-3 px-4 text-right">Total Sales</th>
                  <th className="py-3 px-4 text-right">Cash / Card</th>
                  <th className="py-3 px-4 text-right">Expected Drawer</th>
                  <th className="py-3 px-4 text-right">Actual Counted</th>
                  <th className="py-3 px-4 text-right">Variance</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {counterShifts.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-400">
                      No shift records found. Open a counter shift to begin tracking register drawer auditing.
                    </td>
                  </tr>
                ) : (
                  counterShifts.map((shift) => (
                    <tr key={shift.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {shift.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{shift.counter_name}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{shift.cashier_name}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        <div>Open: {new Date(shift.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        {shift.closed_at && (
                          <div className="text-[11px] text-slate-500">
                            Close: {new Date(shift.closed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium">
                        {currencySymbol} {(shift.opening_float || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-indigo-600 dark:text-indigo-400">
                        {currencySymbol} {(shift.total_sales_amount || 0).toLocaleString()}
                        <div className="text-[10px] text-slate-400 font-normal">({shift.total_bills_count || 0} bills)</div>
                      </td>
                      <td className="py-3.5 px-4 text-right text-[11px]">
                        <div>Cash: {currencySymbol} {(shift.total_cash_sales || 0).toLocaleString()}</div>
                        <div className="text-slate-400">Card: {currencySymbol} {(shift.total_card_sales || 0).toLocaleString()}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-700 dark:text-slate-300">
                        {currencySymbol} {((shift.expected_cash_in_drawer ?? (shift.opening_float + shift.total_cash_sales - shift.total_payouts))).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold">
                        {shift.closing_cash_actual !== undefined
                          ? `${currencySymbol} ${shift.closing_cash_actual.toLocaleString()}`
                          : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold">
                        {shift.cash_variance !== undefined ? (
                          <span
                            className={
                              shift.cash_variance === 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : shift.cash_variance > 0
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }
                          >
                            {shift.cash_variance > 0 ? '+' : ''}
                            {currencySymbol} {shift.cash_variance.toLocaleString()}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            shift.status === 'OPEN'
                              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {shift.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => {
                            queuePrintJob(
                              'THERMAL_80',
                              `Z-Report #${shift.id}`,
                              `Z-REPORT AUDIT\nShift #${shift.id}\nCounter: ${shift.counter_name}\nCashier: ${shift.cashier_name}\nOpened: ${new Date(shift.opened_at).toLocaleString()}\nClosed: ${shift.closed_at ? new Date(shift.closed_at).toLocaleString() : 'OPEN'}\nOpening Float: Rs. ${shift.opening_float.toLocaleString()}\nTotal Sales: Rs. ${shift.total_sales_amount.toLocaleString()} (${shift.total_bills_count} bills)\nCash Collected: Rs. ${shift.total_cash_sales.toLocaleString()}\nCard Collected: Rs. ${shift.total_card_sales.toLocaleString()}\nCredit: Rs. ${shift.total_credit_sales.toLocaleString()}\nExpected in Drawer: Rs. ${shift.expected_cash_in_drawer?.toLocaleString()}\nActual Counted: Rs. ${shift.closing_cash_actual?.toLocaleString()}\nVariance: Rs. ${shift.cash_variance?.toLocaleString()}`
                            );
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                          title="Print Shift Receipt / Z-Report"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: HARDWARE & TERMINALS MANAGEMENT                                */}
      {/* ========================================================================= */}
      {activeSubTab === 'TERMINALS' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-indigo-500" />
                  Registered Counter POS Hardware & Bays
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure billing counters, assign receipt printer sizes, and define POS lock constraints.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingCounter(null);
                  setCounterForm({
                    name: `Counter 0${counters.length + 1} - Checkout`,
                    counter_code: `POS-0${counters.length + 1}`,
                    location_or_bay: 'Front Checkout Line',
                    default_cashier_id: cashierUsers[0]?.id || '',
                    default_printer_type: '80mm',
                    is_locked_to_pos: true,
                    ip_or_device_name: `PC-COUNTER-0${counters.length + 1}`,
                    notes: '',
                  });
                  setIsAddCounterOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add New Terminal
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {counters.map((c) => (
                <div key={c.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                        {c.counter_code}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{c.name}</h4>
                        <div className="text-[11px] text-slate-500">{c.location_or_bay || 'Main Store Floor'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingCounter(c);
                          setCounterForm({
                            name: c.name,
                            counter_code: c.counter_code,
                            location_or_bay: c.location_or_bay || '',
                            default_cashier_id: c.default_cashier_id || '',
                            default_printer_type: c.default_printer_type || '80mm',
                            is_locked_to_pos: c.is_locked_to_pos ?? true,
                            ip_or_device_name: c.ip_or_device_name || '',
                            notes: c.notes || '',
                          });
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {counters.length > 1 && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete counter ${c.name}?`)) {
                              deleteCounterTerminal(c.id);
                            }
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="text-xs space-y-1 text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700/60 pt-2">
                    <div className="flex justify-between">
                      <span>Default Printer:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">{c.default_printer_type || '80mm'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>IP / Hostname:</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">{c.ip_or_device_name || '127.0.0.1'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>POS Lock Restriction:</span>
                      <span className={c.is_locked_to_pos ? 'text-amber-600 font-bold' : 'text-slate-500'}>
                        {c.is_locked_to_pos ? 'Active (Restricted)' : 'Unlocked'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: SWITCH DEVICE STATION ROLE                                       */}
      {/* ========================================================================= */}
      {isStationConfigOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
              <div className="flex items-center gap-2.5">
                <Laptop className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Configure This Computer / Terminal Station
                </h3>
              </div>
              <button
                onClick={() => setIsStationConfigOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Choose the role of this physical device in your retail store network:
              </p>

              {/* Station Option 1: Admin / Owner Workstation */}
              <div
                onClick={() => {
                  setTerminalStation({
                    station_type: 'ADMIN_WORKSTATION',
                    device_label: 'Back Office Workstation',
                    lock_to_pos: false,
                  });
                  setIsStationConfigOpen(false);
                }}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                  terminalStation.station_type === 'ADMIN_WORKSTATION'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    🏢 Owner / Admin Workstation (Back-Office PC)
                    {terminalStation.station_type === 'ADMIN_WORKSTATION' && (
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Full access to store management, stock purchasing, cost prices, staff payroll, supplier balances, and multi-counter monitor.
                  </p>
                </div>
              </div>

              {/* Station Option 2: Dedicated Billing Counter Terminals */}
              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Or Assign as a Billing Counter:
                </div>
                {counters.map((c) => {
                  const isSelected = terminalStation.station_type === 'COUNTER_POS' && terminalStation.counter_id === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        setTerminalStation({
                          station_type: 'COUNTER_POS',
                          counter_id: c.id,
                          counter_name: c.name,
                          device_label: c.name,
                          default_printer_type: c.default_printer_type,
                          lock_to_pos: c.is_locked_to_pos ?? true,
                        });
                        setIsStationConfigOpen(false);
                      }}
                      className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {c.counter_code}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                            {c.name}
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                          </div>
                          <div className="text-[11px] text-slate-500">{c.location_or_bay || 'Main Floor'}</div>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        {c.default_printer_type || '80mm'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: OPEN COUNTER SHIFT (ENTER INITIAL FLOAT)                          */}
      {/* ========================================================================= */}
      {shiftOpenCounter && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-emerald-50/70 dark:bg-emerald-950/40">
              <div className="flex items-center gap-2.5">
                <Coins className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Open Register Shift: {shiftOpenCounter.name}
                </h3>
              </div>
              <button
                onClick={() => setShiftOpenCounter(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmOpenShift} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Assign Cashier for This Shift
                </label>
                <select
                  value={openCashierId}
                  onChange={(e) => setOpenCashierId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
                  required
                >
                  {cashierUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Opening Drawer Cash Float ({currencySymbol})
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={openFloatAmount}
                  onChange={(e) => setOpenFloatAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base font-bold text-slate-900 dark:text-white"
                  placeholder="e.g. 5000"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Physical cash placed in the register drawer for change at the start of shift.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Shift Notes (Optional)
                </label>
                <textarea
                  value={openShiftNotes}
                  onChange={(e) => setOpenShiftNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  placeholder="e.g. Morning rush shift opening cash verified."
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShiftOpenCounter(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Confirm Open Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CLOSE COUNTER SHIFT & Z-REPORT (AUDIT)                            */}
      {/* ========================================================================= */}
      {shiftCloseTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-rose-50/70 dark:bg-rose-950/40">
              <div className="flex items-center gap-2.5">
                <Receipt className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Close Shift & Generate Z-Report: {shiftCloseTarget.counter_name}
                </h3>
              </div>
              <button
                onClick={() => setShiftCloseTarget(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCloseShift} className="p-6 space-y-4">
              {/* Shift Summary Box */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Cashier:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{shiftCloseTarget.cashier_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Opening Float:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{currencySymbol} {shiftCloseTarget.opening_float.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Sales ({shiftCloseTarget.total_bills_count} bills):</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{currencySymbol} {shiftCloseTarget.total_sales_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cash Collected:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{currencySymbol} {shiftCloseTarget.total_cash_sales.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2 font-bold text-sm">
                  <span className="text-slate-700 dark:text-slate-300">Expected Cash in Drawer:</span>
                  <span className="text-slate-900 dark:text-white">
                    {currencySymbol} {(shiftCloseTarget.opening_float + shiftCloseTarget.total_cash_sales - shiftCloseTarget.total_payouts).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Actual Physical Cash Counted in Drawer ({currencySymbol})
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={closingActualCash}
                  onChange={(e) => setClosingActualCash(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-lg font-black text-slate-900 dark:text-white"
                  required
                />
              </div>

              {/* Live Variance Calculation */}
              {(() => {
                const expected = shiftCloseTarget.opening_float + shiftCloseTarget.total_cash_sales - shiftCloseTarget.total_payouts;
                const diff = closingActualCash - expected;
                return (
                  <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                    diff === 0
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 text-emerald-800 dark:text-emerald-300'
                      : diff > 0
                      ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 text-blue-800 dark:text-blue-300'
                      : 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 text-rose-800 dark:text-rose-300'
                  }`}>
                    <span className="font-bold">Drawer Balance Variance:</span>
                    <span className="font-black text-sm">
                      {diff === 0 ? 'Exact Match (0.00)' : `${diff > 0 ? '+ Surplus: ' : '- Shortage: '} ${currencySymbol} ${Math.abs(diff).toLocaleString()}`}
                    </span>
                  </div>
                );
              })()}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Closing Notes & Reason (Optional)
                </label>
                <textarea
                  value={closeShiftNotes}
                  onChange={(e) => setCloseShiftNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  placeholder="e.g. End of shift audit completed and cash locked in safe."
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShiftCloseTarget(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Receipt className="w-4 h-4" />
                  Finalize & Print Z-Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: MID-DAY CASH DROP TO VAULT                                       */}
      {/* ========================================================================= */}
      {cashDropCounter && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-amber-50/70 dark:bg-amber-950/40">
              <div className="flex items-center gap-2.5">
                <Coins className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Cash Drop to Safe: {cashDropCounter.name}
                </h3>
              </div>
              <button
                onClick={() => setCashDropCounter(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCashDrop} className="p-6 space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs flex justify-between">
                <span className="text-slate-500">Current Drawer Balance:</span>
                <span className="font-bold text-slate-900 dark:text-white">{currencySymbol} {(cashDropCounter.current_float || 0).toLocaleString()}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cash Drop Amount to Transfer to Safe ({currencySymbol})
                </label>
                <input
                  type="number"
                  min="100"
                  max={cashDropCounter.current_float || 500000}
                  step="100"
                  value={cashDropAmount}
                  onChange={(e) => setCashDropAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base font-bold text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reason / Authorized Safe
                </label>
                <input
                  type="text"
                  value={cashDropReason}
                  onChange={(e) => setCashDropReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCashDropCounter(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Coins className="w-4 h-4" />
                  Confirm Cash Drop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: ADD / EDIT COUNTER TERMINAL                                      */}
      {/* ========================================================================= */}
      {(isAddCounterOpen || editingCounter) && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
              <div className="flex items-center gap-2.5">
                <Monitor className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {editingCounter ? 'Edit Counter Terminal' : 'Add New Billing Counter'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsAddCounterOpen(false);
                  setEditingCounter(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCounter} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Counter Display Name
                  </label>
                  <input
                    type="text"
                    value={counterForm.name}
                    onChange={(e) => setCounterForm({ ...counterForm, name: e.target.value })}
                    placeholder="e.g. Counter 03 - Bakery & Express"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Counter Code
                  </label>
                  <input
                    type="text"
                    value={counterForm.counter_code}
                    onChange={(e) => setCounterForm({ ...counterForm, counter_code: e.target.value })}
                    placeholder="e.g. POS-03"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Location / Floor Bay
                  </label>
                  <input
                    type="text"
                    value={counterForm.location_or_bay}
                    onChange={(e) => setCounterForm({ ...counterForm, location_or_bay: e.target.value })}
                    placeholder="e.g. Ground Floor Entrance"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Default Receipt Printer
                  </label>
                  <select
                    value={counterForm.default_printer_type}
                    onChange={(e) => setCounterForm({ ...counterForm, default_printer_type: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                  >
                    <option value="80mm">80mm Standard Thermal</option>
                    <option value="58mm">58mm Compact Thermal</option>
                    <option value="a4">A4 Full Page Laser Invoice</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Device Name / Static IP
                  </label>
                  <input
                    type="text"
                    value={counterForm.ip_or_device_name}
                    onChange={(e) => setCounterForm({ ...counterForm, ip_or_device_name: e.target.value })}
                    placeholder="e.g. PC-COUNTER-03 (192.168.1.103)"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Default Assigned Cashier
                  </label>
                  <select
                    value={counterForm.default_cashier_id}
                    onChange={(e) => setCounterForm({ ...counterForm, default_cashier_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="">-- Any Cashier (PIN Login) --</option>
                    {cashierUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <input
                  type="checkbox"
                  id="lock_to_pos_checkbox"
                  checked={counterForm.is_locked_to_pos}
                  onChange={(e) => setCounterForm({ ...counterForm, is_locked_to_pos: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="lock_to_pos_checkbox" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <strong>Lock this station to POS Mode</strong> (Restricts Cashiers from accessing back-office settings, cost prices, and payroll)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddCounterOpen(false);
                    setEditingCounter(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {editingCounter ? 'Save Changes' : 'Create Terminal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: X-REPORT MID-SHIFT PREVIEW & PRINT                               */}
      {/* ========================================================================= */}
      {xReportCounter && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Mid-Day X-Report: {xReportCounter.name}
                </h3>
              </div>
              <button
                onClick={() => setXReportCounter(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 font-mono text-xs text-slate-800 dark:text-slate-200 space-y-2 border border-slate-200 dark:border-slate-700">
                <div className="text-center font-bold pb-2 border-b border-dashed border-slate-300 dark:border-slate-700">
                  *** MID-SHIFT X-REPORT (NO RESET) ***
                </div>
                <div className="flex justify-between">
                  <span>Store:</span>
                  <span>{currentTenant?.shop_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Counter:</span>
                  <span>{xReportCounter.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cashier:</span>
                  <span>{xReportCounter.current_cashier_name || 'Cashier'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Bills Issued:</span>
                  <span>{xReportCounter.total_bills_today || 0}</span>
                </div>
                <div className="flex justify-between border-t border-dashed border-slate-300 dark:border-slate-700 pt-2 font-bold">
                  <span>Total Gross Sales:</span>
                  <span>{currencySymbol} {(xReportCounter.total_revenue_today || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400">
                  <span>Est. Cash in Drawer:</span>
                  <span>{currencySymbol} {(xReportCounter.current_float || 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setXReportCounter(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => handlePrintXReport(xReportCounter)}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  Print X-Report (Thermal)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
