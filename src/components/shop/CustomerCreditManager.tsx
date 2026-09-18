import React, { useState, useMemo } from 'react';
import { useRetail } from '../../context/RetailContext';
import { Customer } from '../../types';
import {
  Users,
  Plus,
  Search,
  DollarSign,
  AlertTriangle,
  Receipt,
  Phone,
  MapPin,
  CheckCircle2,
  X,
  CreditCard,
  FileSpreadsheet,
  BookOpen,
  Printer,
  FileText,
} from 'lucide-react';
import { ExcelDataStudio } from './ExcelDataStudio';

export const CustomerCreditManager: React.FC = () => {
  const { customers, currentTenant, sales, customerPayments, addCustomer, recordCustomerPayment } = useRetail();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState<'ALL' | 'NAME' | 'PHONE'>('ALL');
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isExcelStudioOpen, setIsExcelStudioOpen] = useState(false);
  const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState<Customer | null>(null);
  const [selectedCustomerForLedger, setSelectedCustomerForLedger] = useState<Customer | null>(null);

  // Add Customer Form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+94 7');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState<number>(50000);
  const [openingBalance, setOpeningBalance] = useState<number>(0);

  // Payment Form
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'BANK_TRANSFER'>('CASH');
  const [paymentNote, setPaymentNote] = useState('Credit Cash Settlement');

  const currencySymbol = currentTenant?.currency_symbol || 'Rs.';

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addCustomer({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      credit_limit: Number(creditLimit),
      current_balance: Number(openingBalance),
      loyalty_points: 0,
    });

    setName('');
    setPhone('+94 7');
    setEmail('');
    setAddress('');
    setCreditLimit(50000);
    setOpeningBalance(0);
    setIsAddCustomerOpen(false);
  };

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerForPayment || paymentAmount <= 0) return;

    recordCustomerPayment({
      customer_id: selectedCustomerForPayment.id,
      customer_name: selectedCustomerForPayment.name,
      amount: Number(paymentAmount),
      payment_method: paymentMethod,
      notes: paymentNote,
    });

    setSelectedCustomerForPayment(null);
    setPaymentAmount(0);
  };

  // Compile full ledger statement for the selected customer
  const ledgerTransactions = useMemo(() => {
    if (!selectedCustomerForLedger) return [];

    // 1. Credit Sales or Partial / Half Pay Sales with balance_due > 0
    const salesTx = (sales || [])
      .filter((s) => s.customer_id === selectedCustomerForLedger.id)
      .filter(
        (s) =>
          s.payment_method === 'CREDIT' ||
          (s.balance_due && s.balance_due > 0) ||
          (s.payment_split?.credit && s.payment_split.credit > 0)
      )
      .map((s) => {
        const creditAmt =
          s.balance_due !== undefined && s.balance_due > 0
            ? s.balance_due
            : s.payment_method === 'CREDIT'
            ? s.grand_total
            : s.payment_split?.credit || 0;
        const isHalfPay = (s.paid_amount || 0) > 0 && creditAmt > 0;
        return {
          id: s.id,
          date: s.created_at,
          type: isHalfPay ? 'HALF_PAY' : 'CREDIT_SALE',
          ref: s.invoice_no,
          description: isHalfPay
            ? `Half/Partial Pay Bill (Total: ${currencySymbol} ${(s.grand_total || 0).toLocaleString()} | Paid Now: ${currencySymbol} ${(s.paid_amount || 0).toLocaleString()})`
            : `Full Credit Sale (Invoice #${s.invoice_no})`,
          debit: creditAmt, // Increases customer debt
          credit: 0,
          payment_method: s.payment_method,
        };
      });

    // 2. Customer Repayments (Settlements)
    const repaymentTx = (customerPayments || [])
      .filter((p) => p.customer_id === selectedCustomerForLedger.id)
      .map((p) => ({
        id: p.id,
        date: p.payment_date,
        type: 'REPAYMENT',
        ref: p.reference_no || `REC-${p.id.slice(-6)}`,
        description: `Cash/Bank Repayment Settlement - ${p.notes || 'Repayment'}`,
        debit: 0,
        credit: p.amount, // Decreases customer debt
        payment_method: p.payment_method,
      }));

    // Combine & Sort by Date Ascending for Running Balance calculation
    const combined = [...salesTx, ...repaymentTx].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let runningBal = 0;
    const withRunning = combined.map((tx) => {
      runningBal = runningBal + tx.debit - tx.credit;
      return {
        ...tx,
        running_balance: runningBal,
      };
    });

    return withRunning.reverse(); // Most recent first for display
  }, [selectedCustomerForLedger, sales, customerPayments, currencySymbol]);

  const safeCustomers = customers || [];
  const q = (searchQuery || '').toLowerCase().trim();
  const filteredCustomers = safeCustomers.filter((c) => {
    if (!c) return false;
    if (!q) return true;
    if (searchField === 'NAME') {
      return (c.name || '').toLowerCase().includes(q);
    }
    if (searchField === 'PHONE') {
      return (c.phone || '').toLowerCase().includes(q);
    }
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q) ||
      (c.address && c.address.toLowerCase().includes(q))
    );
  });

  const totalOutstandingCredit = safeCustomers.reduce((acc, c) => acc + (c.current_balance || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-md uppercase tracking-wider">
              Credit Ledger
            </span>
            <span className="text-slate-400 text-xs">• {currentTenant?.shop_name}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            Customer Credit & Accounts Receivable
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            Track customer debts, credit limits, record partial/full cash repayments, and monitor payment health.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsExcelStudioOpen(true)}
            className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel Import / Export</span>
          </button>

          <button
            onClick={() => setIsAddCustomerOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm hover:shadow transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Customer</span>
          </button>
        </div>
      </div>

      {/* Credit Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 font-semibold uppercase block">Total Customers</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{customers.length}</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-amber-200 bg-amber-50/20 shadow-xs">
          <span className="text-[10px] text-amber-700 font-semibold uppercase block">
            Total Outstanding Credit
          </span>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {currencySymbol} {(totalOutstandingCredit || 0).toLocaleString()}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 font-semibold uppercase block">
            Customers with Active Debt
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {safeCustomers.filter((c) => (c && c.current_balance || 0) > 0).length}
          </div>
        </div>
      </div>

      {/* Customer List & Search */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1 max-w-xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  searchField === 'NAME'
                    ? 'Search by customer name...'
                    : searchField === 'PHONE'
                    ? 'Search by phone number...'
                    : 'Search customer name or phone number...'
                }
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Optional Filter Switcher */}
            <div className="flex items-center gap-1 text-[11px] bg-slate-200/70 p-1 rounded-xl shrink-0">
              <span className="text-slate-500 font-medium px-1 text-[10px]">Search for:</span>
              <button
                type="button"
                onClick={() => setSearchField('ALL')}
                className={`px-2 py-0.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  searchField === 'ALL'
                    ? 'bg-white text-indigo-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setSearchField('NAME')}
                className={`px-2 py-0.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  searchField === 'NAME'
                    ? 'bg-white text-indigo-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Customer Name
              </button>
              <button
                type="button"
                onClick={() => setSearchField('PHONE')}
                className={`px-2 py-0.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  searchField === 'PHONE'
                    ? 'bg-white text-indigo-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Phone Number
              </button>
            </div>
          </div>

          <span className="text-xs text-slate-500 font-medium">
            Showing {filteredCustomers.length} of {safeCustomers.length} customers
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 tracking-wider">
              <tr>
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-4">Contact & City</th>
                <th className="py-3 px-4">Credit Limit</th>
                <th className="py-3 px-4">Outstanding Credit</th>
                <th className="py-3 px-4">Loyalty Points</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map((c) => {
                const balance = c.current_balance || 0;
                const isOverLimit = balance > c.credit_limit;
                return (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-xs">{c.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">ID: {c.id}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-slate-800">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{c.phone}</span>
                      </div>
                      {c.address && (
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{c.address}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-700">
                      {currencySymbol} {(c.credit_limit || 0).toLocaleString()}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-bold ${
                            balance > 0
                              ? isOverLimit
                                ? 'text-rose-600'
                                : 'text-amber-600'
                              : 'text-slate-500'
                          }`}
                        >
                          {currencySymbol} {(balance || 0).toLocaleString()}
                        </span>
                        {isOverLimit && (
                          <span className="p-0.5 bg-rose-100 text-rose-700 rounded" title="Credit limit exceeded!">
                            <AlertTriangle className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-indigo-600 font-bold">
                      ★ {c.loyalty_points || 0} pts
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedCustomerForLedger(c)}
                          className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold rounded-lg text-xs shadow-2xs transition-all flex items-center gap-1"
                          title="View Customer Credit Ledger & Statements"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Ledger</span>
                        </button>

                        {balance > 0 ? (
                          <button
                            onClick={() => {
                              setSelectedCustomerForPayment(c);
                              setPaymentAmount(balance);
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-2xs transition-all flex items-center gap-1"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>Record Payment</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-medium px-2 py-1 bg-emerald-50 rounded-lg">✓ Settled</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {selectedCustomerForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-slate-900 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                Record Customer Repayment
              </h3>
              <button
                onClick={() => setSelectedCustomerForPayment(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-900">{selectedCustomerForPayment.name}</div>
              <div className="text-slate-500">
                Total Debt: <strong className="text-amber-600 font-bold">{currencySymbol} {(selectedCustomerForPayment.current_balance || 0).toLocaleString()}</strong>
              </div>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Payment Amount Received ({currencySymbol}): *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-base font-bold text-emerald-700 font-mono text-center"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Payment Method:</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                >
                  <option value="CASH">Cash in Hand</option>
                  <option value="CARD">Debit / Credit Card</option>
                  <option value="BANK_TRANSFER">Bank Online Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Payment Reference / Note:</label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCustomerForPayment(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm"
                >
                  Confirm Cash Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-slate-900 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Register New Customer
              </h3>
              <button onClick={() => setIsAddCustomerOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Customer Full Name: *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Kasun Jayawardena"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Mobile Phone: *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Credit Limit ({currencySymbol}):</label>
                  <input
                    type="number"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Address / City:</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Maharagama, Colombo"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Opening Credit Balance (if any):</label>
                <input
                  type="number"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Credit Ledger Statement Modal */}
      {selectedCustomerForLedger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 text-slate-900 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <span>Customer Credit Ledger Statement</span>
                    <span className="text-xs font-normal text-slate-400 font-sans">(ගනුදෙනුකරු ණය ලෙජරය)</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Detailed ledger tracking full credit sales, half-pay bill balances, and repayments.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all print:hidden"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Statement</span>
                </button>
                <button
                  onClick={() => setSelectedCustomerForLedger(null)}
                  className="text-slate-400 hover:text-slate-700 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Customer Overview Card */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 md:grid-cols-5 gap-3 text-xs shrink-0">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Customer Name</span>
                <span className="font-bold text-slate-900 text-sm">{selectedCustomerForLedger.name}</span>
                <div className="text-[11px] text-slate-500">{selectedCustomerForLedger.phone}</div>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Credit Limit</span>
                <span className="font-bold text-slate-700 font-mono">
                  {currencySymbol} {(selectedCustomerForLedger.credit_limit || 0).toLocaleString()}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Current Debt Balance</span>
                <span className="font-black text-rose-600 font-mono text-base">
                  {currencySymbol} {(selectedCustomerForLedger.current_balance || 0).toLocaleString()}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Loyalty Points</span>
                <span className="font-black text-amber-600 font-mono text-base">
                  ★ {(selectedCustomerForLedger.loyalty_points || 0).toLocaleString()} pts
                </span>
                <div className="text-[10px] text-slate-500 font-mono font-semibold">
                  Worth {currencySymbol} {(selectedCustomerForLedger.loyalty_points || 0).toLocaleString()}
                </div>
              </div>

              <div className="flex items-center justify-end">
                {selectedCustomerForLedger.current_balance > 0 ? (
                  <button
                    onClick={() => {
                      const c = selectedCustomerForLedger;
                      setSelectedCustomerForLedger(null);
                      setSelectedCustomerForPayment(c);
                      setPaymentAmount(c.current_balance || 0);
                    }}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all"
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>Settle Repayment</span>
                  </button>
                ) : (
                  <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold rounded-xl text-xs">
                    ✓ Balance Fully Settled
                  </span>
                )}
              </div>
            </div>

            {/* Ledger Transactions Table */}
            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl">
              {ledgerTransactions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300 opacity-60" />
                  <p className="font-semibold text-slate-600">No credit ledger records found</p>
                  <p className="text-[11px] mt-1 text-slate-400">
                    Transactions appear here when this customer uses Half Pay (partial bill payment) or Credit at POS, or makes repayments.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Date & Time</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Ref / Invoice #</th>
                      <th className="py-2.5 px-3">Description & Calculation</th>
                      <th className="py-2.5 px-3 text-right">Debit (+Debt)</th>
                      <th className="py-2.5 px-3 text-right">Credit (-Paid)</th>
                      <th className="py-2.5 px-3 text-right font-mono">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {ledgerTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap text-[11px]">
                          {new Date(tx.date).toLocaleDateString()} {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {tx.type === 'HALF_PAY' ? (
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[10px] font-bold">
                              ⚡ Half Pay Bill
                            </span>
                          ) : tx.type === 'CREDIT_SALE' ? (
                            <span className="px-2 py-0.5 bg-rose-50 text-rose-800 border border-rose-200 rounded text-[10px] font-bold">
                              Full Credit Sale
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-bold">
                              Repayment Settle
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-700 text-[11px] whitespace-nowrap">
                          {tx.ref}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          {tx.description}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600 whitespace-nowrap">
                          {tx.debit > 0 ? `+${currencySymbol} ${tx.debit.toFixed(2)}` : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 whitespace-nowrap">
                          {tx.credit > 0 ? `-${currencySymbol} ${tx.credit.toFixed(2)}` : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 whitespace-nowrap">
                          {currencySymbol} {tx.running_balance.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Bottom Close Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 shrink-0 text-xs text-slate-500">
              <div>
                Showing <strong>{ledgerTransactions.length}</strong> recorded ledger transactions
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomerForLedger(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel Import / Export Modal */}
      {isExcelStudioOpen && (
        <ExcelDataStudio
          isModal={true}
          initialTab="customers"
          onClose={() => setIsExcelStudioOpen(false)}
        />
      )}
    </div>
  );
};
