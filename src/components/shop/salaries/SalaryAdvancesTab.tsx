import React, { useState } from 'react';
import { SalaryAdvance, Employee, Tenant } from '../../../types';
import {
  Wallet,
  Plus,
  Printer,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  ArrowUpRight,
  User,
  DollarSign,
} from 'lucide-react';

interface SalaryAdvancesTabProps {
  advances: SalaryAdvance[];
  employees: Employee[];
  currencySymbol: string;
  onRequestAdvance: (advance: Omit<SalaryAdvance, 'id' | 'tenant_id' | 'approved_by'>) => void;
  onUpdateStatus: (id: string, status: SalaryAdvance['status']) => void;
  onDeleteAdvance: (id: string) => void;
  onPrintAdvanceReceipt: (advance: SalaryAdvance) => void;
}

export const SalaryAdvancesTab: React.FC<SalaryAdvancesTabProps> = ({
  advances,
  employees,
  currencySymbol,
  onRequestAdvance,
  onUpdateStatus,
  onDeleteAdvance,
  onPrintAdvanceReceipt,
}) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'APPROVED' | 'DEDUCTED' | 'PENDING' | 'REJECTED'>('ALL');

  // Form states
  const [employeeId, setEmployeeId] = useState(employees[0]?.id || '');
  const [amount, setAmount] = useState(5000);
  const [reason, setReason] = useState('Medical & Family emergency advance');
  const [disbursementSource, setDisbursementSource] = useState<'CASH_DRAWER' | 'BANK_TRANSFER' | 'PETTY_CASH'>('CASH_DRAWER');
  const [notes, setNotes] = useState('');

  const filteredAdvances = advances.filter((adv) => {
    const q = searchQuery.toLowerCase();
    const matchQ =
      adv.employee_name.toLowerCase().includes(q) ||
      adv.reason.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'ALL' || adv.status === statusFilter;
    return matchQ && matchStatus;
  });

  const totalActiveAdvances = advances
    .filter((a) => a.status === 'APPROVED')
    .reduce((sum, a) => sum + (a.amount || 0), 0);

  const totalDeductedAdvances = advances
    .filter((a) => a.status === 'DEDUCTED')
    .reduce((sum, a) => sum + (a.amount || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) return;

    onRequestAdvance({
      advance_no: `ADV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      employee_id: emp.id,
      employee_name: emp.name,
      amount: Number(amount),
      request_date: new Date().toISOString().slice(0, 10),
      reason: reason.trim(),
      status: 'APPROVED',
      payment_source: disbursementSource,
      notes: notes.trim() || undefined,
    });

    setIsAddOpen(false);
    setAmount(5000);
    setReason('Medical & Family emergency advance');
    setNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Metrics */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-amber-700 block">Pending Recovery</span>
            <span className="text-sm font-black text-amber-900 font-mono">
              {currencySymbol} {totalActiveAdvances.toLocaleString()}
            </span>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-emerald-700 block">Deducted in Payroll</span>
            <span className="text-sm font-black text-emerald-900 font-mono">
              {currencySymbol} {totalDeductedAdvances.toLocaleString()}
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Record Salary Advance</span>
        </button>
      </div>

      {/* Filter & Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search advances by employee or reason..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold text-slate-500">Status:</span>
            {(['ALL', 'APPROVED', 'DEDUCTED', 'PENDING'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                  statusFilter === st
                    ? 'bg-amber-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Advances Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200 tracking-wider">
              <tr>
                <th className="py-3 px-4">Date &amp; No</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Reason / Notes</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4 text-right font-bold text-slate-900">Advance Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAdvances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Wallet className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-xs">No salary advance requests recorded.</p>
                  </td>
                </tr>
              ) : (
                filteredAdvances.map((adv) => (
                  <tr key={adv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900">{adv.request_date || adv.date}</span>
                      <div className="text-[10px] font-mono text-slate-400">{adv.advance_no || adv.id}</div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{adv.employee_name}</td>
                    <td className="py-3 px-4 text-slate-600">{adv.reason}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-semibold">
                        {adv.payment_source || 'CASH_DRAWER'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-amber-800 text-sm">
                      {currencySymbol} {adv.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          adv.status === 'APPROVED'
                            ? 'bg-amber-100 text-amber-800'
                            : adv.status === 'DEDUCTED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {adv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onPrintAdvanceReceipt(adv)}
                          title="Print 80mm Advance Slip"
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {adv.status === 'APPROVED' && (
                          <button
                            onClick={() => onUpdateStatus(adv.id, 'DEDUCTED')}
                            title="Mark as Deducted"
                            className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[10px] font-bold border border-emerald-200 cursor-pointer"
                          >
                            Mark Deducted
                          </button>
                        )}

                        <button
                          onClick={() => {
                            if (window.confirm(`Delete advance record for ${adv.employee_name}?`)) {
                              onDeleteAdvance(adv.id);
                            }
                          }}
                          title="Delete Advance"
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Advance Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full text-slate-900 p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-sm">Issue Staff Salary Advance</h3>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Select Employee: *</label>
                <select
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Advance Amount ({currencySymbol}): *
                </label>
                <input
                  type="number"
                  required
                  min="100"
                  step="100"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-amber-300 rounded-xl px-3 py-2 text-sm font-mono font-black text-amber-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Payment / Disbursement Source:</label>
                <select
                  value={disbursementSource}
                  onChange={(e) => setDisbursementSource(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                >
                  <option value="CASH_DRAWER">Cash Drawer (Register Payout)</option>
                  <option value="PETTY_CASH">Petty Cash Safe</option>
                  <option value="BANK_TRANSFER">Bank Direct Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Reason for Advance: *</label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Medical emergency / Child school fees"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Approve &amp; Disburse Advance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
