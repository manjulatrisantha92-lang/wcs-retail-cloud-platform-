import React, { useState } from 'react';
import { useRetail } from '../../context/RetailContext';
import { Expense, Payout } from '../../types';
import {
  Plus,
  Search,
  Receipt,
  Wallet,
  CheckCircle2,
  X,
  Printer,
  Share2,
  Trash2,
  ArrowUpRight,
  Eye,
  AlertTriangle,
  ArrowDownRight,
  FileSpreadsheet,
} from 'lucide-react';
import { ExcelDataStudio } from './ExcelDataStudio';

export const FinanceExpensesManager: React.FC = () => {
  const {
    expenses,
    payouts,
    currentTenant,
    currentUser,
    t,
    addExpense,
    deleteExpense,
    recordPayout,
    deletePayout,
    queuePrintJob,
  } = useRetail();

  const safeExpenses = expenses || [];
  const safePayouts = payouts || [];

  // Active Tab: EXPENSES, PAYOUTS
  const [activeTab, setActiveTab] = useState<'EXPENSES' | 'PAYOUTS'>('EXPENSES');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [payoutCategoryFilter, setPayoutCategoryFilter] = useState<string>('ALL');

  // Modals
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddPayoutOpen, setIsAddPayoutOpen] = useState(false);
  const [isExcelStudioOpen, setIsExcelStudioOpen] = useState(false);
  const [viewingPayout, setViewingPayout] = useState<Payout | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Expense Form State
  const [expenseCategory, setExpenseCategory] = useState('Electricity / CEB Bill');
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expensePaymentMode, setExpensePaymentMode] = useState<'CASH' | 'BANK_TRANSFER' | 'CARD'>('CASH');
  const [expenseDescription, setExpenseDescription] = useState('');

  // Payout Form State
  const [payoutPayeeName, setPayoutPayeeName] = useState('');
  const [payoutAmount, setPayoutAmount] = useState<number>(1500);
  const [payoutCategory, setPayoutCategory] = useState<Payout['category']>('DELIVERY_TRANSPORT');
  const [payoutSource, setPayoutSource] = useState<Payout['source']>('CASH_DRAWER');
  const [payoutMethod, setPayoutMethod] = useState<Payout['payment_method']>('CASH');
  const [payoutReferenceNo, setPayoutReferenceNo] = useState('');
  const [payoutNotes, setPayoutNotes] = useState('');
  const [payoutAuthorizedBy, setPayoutAuthorizedBy] = useState(currentUser?.full_name || 'Manager');

  const currencySymbol = currentTenant?.currency_symbol || 'Rs.';

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Add Expense
  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseAmount <= 0 || !expenseDescription.trim()) {
      showToast('Please enter a valid amount and description.', 'error');
      return;
    }

    addExpense({
      category: expenseCategory,
      amount: Number(expenseAmount),
      payment_method: expensePaymentMode as any,
      payment_mode: expensePaymentMode as any,
      description: expenseDescription.trim(),
      date: new Date().toISOString().slice(0, 10),
    });

    setExpenseAmount(0);
    setExpenseDescription('');
    setIsAddExpenseOpen(false);
    showToast('Operating expense recorded successfully!');
  };

  // Add Payout
  const handleCreatePayout = (e: React.FormEvent) => {
    e.preventDefault();
    if (payoutAmount <= 0 || !payoutPayeeName.trim()) {
      showToast('Please enter a valid amount and payee name.', 'error');
      return;
    }

    const createdPayout = recordPayout({
      payee_name: payoutPayeeName.trim(),
      amount: Number(payoutAmount),
      category: payoutCategory,
      source: payoutSource,
      payment_method: payoutMethod,
      reference_no: payoutReferenceNo.trim() || undefined,
      notes: payoutNotes.trim() || undefined,
    });

    setPayoutPayeeName('');
    setPayoutAmount(1500);
    setPayoutNotes('');
    setPayoutReferenceNo('');
    setIsAddPayoutOpen(false);
    showToast(`Cash payout ${createdPayout.payout_no} of ${currencySymbol} ${(createdPayout.amount || 0).toLocaleString()} recorded!`);
  };

  // Print Payout Voucher
  const handlePrintPayout = (p: Payout) => {
    queuePrintJob(
      'THERMAL_80',
      `Cash Payout #${p.payout_no}`,
      `PAYOUT VOUCHER: ${p.payout_no}\nPayee: ${p.payee_name}\nAmount: Rs. ${p.amount}\nCategory: ${p.category}\nAuthorized: ${p.authorized_by}`
    );
    showToast(`Print job sent for payout ${p.payout_no}`);
  };

  // WhatsApp Share Payout
  const handleSharePayoutWhatsApp = (p: Payout) => {
    const msg =
      `*CASH PAYOUT VOUCHER*\n` +
      `*${currentTenant?.shop_name}*\n` +
      `--------------------------------\n` +
      `*Voucher No:* ${p.payout_no}\n` +
      `*Date:* ${new Date(p.created_at).toLocaleDateString()}\n` +
      `*Payee:* ${p.payee_name}\n` +
      `*Amount Paid:* Rs. ${(p.amount || 0).toLocaleString()}\n` +
      `*Category:* ${p.category}\n` +
      `*Cash Source:* ${p.source}\n` +
      `*Payment Method:* ${p.payment_method}\n` +
      (p.reference_no ? `*Ref No:* ${p.reference_no}\n` : '') +
      (p.notes ? `*Notes:* ${p.notes}\n` : '') +
      `*Authorized By:* ${p.authorized_by}\n` +
      `--------------------------------\n` +
      `Cash withdrawal confirmed.`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const totalExpenses = safeExpenses.reduce((acc, ex) => acc + (ex.amount || 0), 0);
  const totalPayouts = safePayouts.reduce((acc, p) => acc + (p.amount || 0), 0);
  const totalDrawerCashPayouts = safePayouts
    .filter((p) => p.source === 'CASH_DRAWER' && p.payment_method === 'CASH')
    .reduce((acc, p) => acc + (p.amount || 0), 0);
  const totalFinanceOutflow = totalExpenses + totalPayouts;

  const q = (searchQuery || '').toLowerCase();

  const filteredExpenses = safeExpenses.filter(
    (ex) =>
      (ex.category || '').toLowerCase().includes(q) ||
      (ex.description || '').toLowerCase().includes(q)
  );

  const filteredPayouts = safePayouts.filter((p) => {
    const matchQ =
      (p.payout_no || '').toLowerCase().includes(q) ||
      (p.payee_name || '').toLowerCase().includes(q) ||
      (p.notes && p.notes.toLowerCase().includes(q)) ||
      (p.reference_no && p.reference_no.toLowerCase().includes(q));
    const matchCat = payoutCategoryFilter === 'ALL' || p.category === payoutCategoryFilter;
    return matchQ && matchCat;
  });

  return (
    <div className="space-y-6 pb-12" id="finance-expenses-container">
      {/* Toast Feedback */}
      {toastMsg && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-top-3 ${
            toastMsg.type === 'error'
              ? 'bg-rose-900 text-white border border-rose-700'
              : 'bg-emerald-900 text-white border border-emerald-700'
          }`}
        >
          {toastMsg.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-rose-300" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-md uppercase tracking-wider">
              {t.expenses || 'Expenses'} &amp; {t.payouts || 'Cash Payouts'}
            </span>
            <span className="text-slate-400 text-xs">• {currentTenant?.shop_name}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            {t.expenses || 'Expenses'} &amp; {t.payouts || 'Cash Payouts'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            Track daily operating expenses (rent, electricity, utilities, maintenance, packaging) and drawer cash payouts (petty cash, transport, tea &amp; refreshments).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExcelStudioOpen(true)}
            className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel Import / Export</span>
          </button>

          {activeTab === 'EXPENSES' && (
            <button
              id="btn-record-expense"
              onClick={() => setIsAddExpenseOpen(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addExpense || 'Record Expense'}</span>
            </button>
          )}

          {activeTab === 'PAYOUTS' && (
            <button
              id="btn-record-payout"
              onClick={() => setIsAddPayoutOpen(true)}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>{t.recordPayout || 'Record Payout'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase">{t.operatingExpenses || 'Operating Expenses'}</span>
            <Receipt className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {currencySymbol} {(totalExpenses || 0).toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {safeExpenses.length} operating entries
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-rose-200 bg-rose-50/20 shadow-xs">
          <div className="flex items-center justify-between text-rose-600 mb-1">
            <span className="text-[10px] font-bold uppercase">{t.payouts || 'Cash Payouts'}</span>
            <ArrowUpRight className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600">
            {currencySymbol} {(totalPayouts || 0).toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {safePayouts.length} drawer payouts recorded
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase">Total Outflow</span>
            <ArrowDownRight className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {currencySymbol} {(totalFinanceOutflow || 0).toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Combined operating costs &amp; payouts
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-amber-200 bg-amber-50/20 shadow-xs">
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-[10px] font-bold uppercase">Drawer Cash Impact</span>
            <Wallet className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700">
            {currencySymbol} {(totalDrawerCashPayouts || 0).toLocaleString()}
          </div>
          <span className="text-[11px] text-amber-800 font-medium mt-1 block">
            Petty cash paid from POS till
          </span>
        </div>
      </div>

      {/* Main Tabs Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-4 pt-3 gap-2 overflow-x-auto">
          <button
            id="tab-operating-expenses"
            onClick={() => setActiveTab('EXPENSES')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'EXPENSES'
                ? 'bg-white text-indigo-600 border-t-2 border-indigo-600 shadow-xs -mb-[1px]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>{t.operatingExpenses || 'Operating Expenses'} ({safeExpenses.length})</span>
          </button>

          <button
            id="tab-drawer-payouts"
            onClick={() => setActiveTab('PAYOUTS')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'PAYOUTS'
                ? 'bg-white text-rose-600 border-t-2 border-rose-600 shadow-xs -mb-[1px]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>{t.payouts || 'Cash Payouts'} ({safePayouts.length})</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, category, or remarks..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          {activeTab === 'PAYOUTS' && (
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-[11px] overflow-x-auto">
              {['ALL', 'TEA_SNACKS', 'DELIVERY_TRANSPORT', 'REPAIR_MAINTENANCE', 'SUPPLIER_PAYMENT', 'OWNER_DRAW', 'OTHER'].map(
                (cat) => (
                  <button
                    key={cat}
                    onClick={() => setPayoutCategoryFilter(cat)}
                    className={`px-2 py-0.5 rounded-lg font-bold transition-colors whitespace-nowrap ${
                      payoutCategoryFilter === cat ? 'bg-rose-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {cat.replace('_', ' ')}
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {/* 1. EXPENSES TAB */}
        {activeTab === 'EXPENSES' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-center">Payment Mode</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No operating expenses match your search.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((ex) => (
                    <tr key={ex.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-900">{ex.date}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                          {ex.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{ex.description}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {ex.payment_mode || ex.payment_method}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-rose-600">
                        {currencySymbol} {(ex.amount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            if (window.confirm('Delete this expense record?')) {
                              deleteExpense(ex.id);
                              showToast('Expense entry deleted.');
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. CASH PAYOUTS TAB */}
        {activeTab === 'PAYOUTS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Voucher No</th>
                  <th className="py-3 px-4">Date / Time</th>
                  <th className="py-3 px-4">Payee / Vendor</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Authorized By</th>
                  <th className="py-3 px-4 text-right">Amount Paid</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayouts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No cash payouts match your search filter.
                    </td>
                  </tr>
                ) : (
                  filteredPayouts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-rose-600">{p.payout_no}</td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {new Date(p.created_at).toLocaleDateString()}{' '}
                        {new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{p.payee_name}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-100">
                          {p.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.source === 'CASH_DRAWER'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}
                        >
                          {p.source.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">{p.authorized_by}</td>

                      <td className="py-3 px-4 text-right font-black text-rose-600 text-sm">
                        {currencySymbol} {(p.amount || 0).toLocaleString()}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewingPayout(p)}
                            title="View Voucher"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handlePrintPayout(p)}
                            title="Print Voucher"
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleSharePayoutWhatsApp(p)}
                            title="Share on WhatsApp"
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete payout voucher ${p.payout_no}?`)) {
                                deletePayout(p.id);
                                showToast('Payout record deleted.');
                              }
                            }}
                            title="Delete Voucher"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: RECORD EXPENSE */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-slate-900 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-base">{t.addExpense || 'Record Expense'}</h3>
              </div>
              <button onClick={() => setIsAddExpenseOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Expense Category:</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium"
                >
                  <option value="Electricity / CEB Bill">Electricity / CEB Bill</option>
                  <option value="Water Bill">Water Bill</option>
                  <option value="Shop Rent / Lease">Shop Rent / Lease</option>
                  <option value="Internet / SLT Fiber">Internet / SLT Fiber</option>
                  <option value="Packaging & Bags">Packaging &amp; Bags</option>
                  <option value="Shop Cleaning & Maintenance">Shop Cleaning &amp; Maintenance</option>
                  <option value="Transport / Fuel">Transport / Fuel</option>
                  <option value="Tea & Staff Refreshments">Tea &amp; Staff Refreshments</option>
                  <option value="Marketing & Printing">Marketing &amp; Printing</option>
                  <option value="Other Operating Cost">Other Operating Cost</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Expense Amount ({currencySymbol}): *</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 font-bold font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Payment Mode:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['CASH', 'BANK_TRANSFER', 'CARD'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setExpensePaymentMode(mode)}
                      className={`py-2 rounded-xl border text-center font-bold transition-all ${
                        expensePaymentMode === mode
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {mode.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Expense Description / Notes: *</label>
                <textarea
                  rows={2}
                  required
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  placeholder="e.g. Paid CEB electricity bill for shop unit 2"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RECORD CASH PAYOUT */}
      {isAddPayoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-slate-900 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-base">{t.recordPayout || 'Record Payout'}</h3>
              </div>
              <button onClick={() => setIsAddPayoutOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePayout} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Payee / Recipient Name: *</label>
                <input
                  type="text"
                  required
                  value={payoutPayeeName}
                  onChange={(e) => setPayoutPayeeName(e.target.value)}
                  placeholder="e.g. Kamal Delivery / CEB Collector / Tea Boy"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Payout Amount ({currencySymbol}): *</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-rose-600 font-black font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Category:</label>
                  <select
                    value={payoutCategory}
                    onChange={(e) => setPayoutCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium"
                  >
                    <option value="DELIVERY_TRANSPORT">Delivery / Transport</option>
                    <option value="TEA_SNACKS">Tea &amp; Snacks</option>
                    <option value="REPAIR_MAINTENANCE">Repair &amp; Maintenance</option>
                    <option value="SUPPLIER_PAYMENT">Direct Supplier Cash</option>
                    <option value="OWNER_DRAW">Owner Drawings</option>
                    <option value="OTHER">Other Petty Cash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Cash Source:</label>
                  <select
                    value={payoutSource}
                    onChange={(e) => setPayoutSource(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium"
                  >
                    <option value="CASH_DRAWER">POS Cash Drawer</option>
                    <option value="PETTY_CASH_BOX">Petty Cash Box</option>
                    <option value="BANK_ACCOUNT">Bank Account</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Payment Method:</label>
                  <select
                    value={payoutMethod}
                    onChange={(e) => setPayoutMethod(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium"
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Authorized By:</label>
                  <input
                    type="text"
                    value={payoutAuthorizedBy}
                    onChange={(e) => setPayoutAuthorizedBy(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Reference / Bill No (Optional):</label>
                <input
                  type="text"
                  value={payoutReferenceNo}
                  onChange={(e) => setPayoutReferenceNo(e.target.value)}
                  placeholder="e.g. Bill #8821 or Trans Ref"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Notes / Purpose:</label>
                <textarea
                  rows={2}
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  placeholder="e.g. Courier dispatch fee for customer package #1042"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddPayoutOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-sm"
                >
                  Disburse &amp; Record Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW PAYOUT VOUCHER */}
      {viewingPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-slate-900 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-sm">Payout Voucher #{viewingPayout.payout_no}</h3>
              </div>
              <button onClick={() => setViewingPayout(null)} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Payee / Recipient:</span>
                <span className="font-bold text-slate-900">{viewingPayout.payee_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Category:</span>
                <span className="font-semibold text-rose-700">{viewingPayout.category.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Paid:</span>
                <span className="font-black text-rose-600 font-mono text-sm">
                  {currencySymbol} {(viewingPayout.amount || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Method:</span>
                <span className="font-semibold text-slate-800">{viewingPayout.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cash Source:</span>
                <span className="font-semibold text-slate-800">{viewingPayout.cash_source || viewingPayout.source}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Authorized By:</span>
                <span className="font-semibold text-slate-800">{viewingPayout.authorized_by}</span>
              </div>
              {viewingPayout.notes && (
                <div className="border-t border-slate-200 pt-1.5 text-slate-600 italic">
                  "{viewingPayout.notes}"
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => handleSharePayoutWhatsApp(viewingPayout)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
              <button
                onClick={() => handlePrintPayout(viewingPayout)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel Import / Export Studio Modal */}
      {isExcelStudioOpen && (
        <ExcelDataStudio
          isModal={true}
          initialTab="expenses"
          onClose={() => setIsExcelStudioOpen(false)}
        />
      )}
    </div>
  );
};
