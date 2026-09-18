import React, { useState } from 'react';
import { SalaryRecord, Employee, SalaryAdvance, Tenant } from '../../../types';
import {
  Users,
  Plus,
  Play,
  Download,
  Printer,
  Share2,
  FileText,
  Trash2,
  Edit2,
  CheckCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Building,
} from 'lucide-react';

interface PayrollRunTabProps {
  salaries: SalaryRecord[];
  employees: Employee[];
  advances: SalaryAdvance[];
  currencySymbol: string;
  selectedMonth: string;
  setSelectedMonth: (m: string) => void;
  onOpenProcessModal: (salary?: SalaryRecord) => void;
  onViewPayslip: (salary: SalaryRecord) => void;
  onPrintThermal: (salary: SalaryRecord) => void;
  onShareWhatsApp: (salary: SalaryRecord) => void;
  onDeleteSalary: (id: string) => void;
  onBatchProcessPayroll: () => void;
  onExportBankCsv: () => void;
}

export const PayrollRunTab: React.FC<PayrollRunTabProps> = ({
  salaries,
  employees,
  advances,
  currencySymbol,
  selectedMonth,
  setSelectedMonth,
  onOpenProcessModal,
  onViewPayslip,
  onPrintThermal,
  onShareWhatsApp,
  onDeleteSalary,
  onBatchProcessPayroll,
  onExportBankCsv,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<'ALL' | 'BANK_TRANSFER' | 'CASH' | 'CHEQUE'>('ALL');

  // Filter salaries for selected month
  const monthSalaries = salaries.filter((s) => s.month === selectedMonth);

  const filteredSalaries = monthSalaries.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchQ =
      s.employee_name.toLowerCase().includes(q) ||
      (s.designation && s.designation.toLowerCase().includes(q)) ||
      (s.slip_no && s.slip_no.toLowerCase().includes(q));
    const matchMethod = filterPaymentMethod === 'ALL' || s.payment_method === filterPaymentMethod;
    return matchQ && matchMethod;
  });

  // Calculate totals
  const totalGross = monthSalaries.reduce((sum, s) => sum + (s.gross_salary || (s.base_salary + (s.allowances || 0))), 0);
  const totalAdvancesDeducted = monthSalaries.reduce((sum, s) => sum + (s.advances_deducted || s.advance_deductions || 0), 0);
  const totalEpfEmployee = monthSalaries.reduce((sum, s) => sum + (s.epf_employee || 0), 0);
  const totalEpfEmployer = monthSalaries.reduce((sum, s) => sum + (s.epf_employer || 0), 0);
  const totalEtfEmployer = monthSalaries.reduce((sum, s) => sum + (s.etf_employer || 0), 0);
  const totalNetPaid = monthSalaries.reduce((sum, s) => sum + (s.net_salary || 0), 0);

  // Month navigation helpers
  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    const newMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(y, m, 1);
    const newMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
  };

  const activeEmployeesCount = employees.filter((e) => e.is_active).length;
  const processedCount = monthSalaries.length;

  return (
    <div className="space-y-6">
      {/* Month Selector Bar & Quick Actions */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Month Selector */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors cursor-pointer"
            title="Previous Month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Payroll Month:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-black text-slate-900 focus:outline-hidden focus:border-teal-500"
            />
          </div>

          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors cursor-pointer"
            title="Next Month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onBatchProcessPayroll}
            title="Auto-calculate and generate payslips for all active staff"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Generate All Staff Payroll ({activeEmployeesCount})</span>
          </button>

          <button
            onClick={() => onOpenProcessModal()}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Individual Payslip</span>
          </button>

          <button
            onClick={onExportBankCsv}
            disabled={monthSalaries.length === 0}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-teal-400" />
            <span>Bank Transfer CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Gross Earnings</div>
          <div className="text-xl font-black text-slate-900 font-mono">
            {currencySymbol} {totalGross.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Basic + Allowances + OT
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-teal-200 bg-teal-50/20 shadow-xs">
          <div className="text-[10px] font-bold text-teal-700 uppercase tracking-wider mb-1">Net Salaries Disbursed</div>
          <div className="text-xl font-black text-teal-800 font-mono">
            {currencySymbol} {totalNetPaid.toLocaleString()}
          </div>
          <p className="text-[11px] text-teal-600 font-semibold mt-0.5">
            {processedCount} of {activeEmployeesCount} staff processed
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-rose-200 bg-rose-50/20 shadow-xs">
          <div className="text-[10px] font-bold text-rose-700 uppercase tracking-wider mb-1">Advances Deducted</div>
          <div className="text-xl font-black text-rose-700 font-mono">
            -{currencySymbol} {totalAdvancesDeducted.toLocaleString()}
          </div>
          <p className="text-[11px] text-rose-600 mt-0.5">Recovered from pay</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-indigo-200 bg-indigo-50/20 shadow-xs">
          <div className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-1">Statutory EPF &amp; ETF</div>
          <div className="text-xl font-black text-indigo-800 font-mono">
            {currencySymbol} {(totalEpfEmployee + totalEpfEmployer + totalEtfEmployer).toLocaleString()}
          </div>
          <p className="text-[11px] text-indigo-600 mt-0.5">
            Emp 8% + Co 12% + ETF 3%
          </p>
        </div>
      </div>

      {/* Main Payslips Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Filters Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by staff name, designation, slip no..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:border-teal-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500">Method:</span>
            {(['ALL', 'BANK_TRANSFER', 'CASH', 'CHEQUE'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setFilterPaymentMethod(m)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                  filterPaymentMethod === m
                    ? 'bg-teal-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {m === 'ALL' ? 'All Methods' : m.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Payslips Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200 tracking-wider">
              <tr>
                <th className="py-3 px-4">Slip &amp; Staff</th>
                <th className="py-3 px-4">Designation / Role</th>
                <th className="py-3 px-4 text-right">Basic Pay</th>
                <th className="py-3 px-4 text-right">Commission &amp; Allowances</th>
                <th className="py-3 px-4 text-right">Advances</th>
                <th className="py-3 px-4 text-right">EPF (8%)</th>
                <th className="py-3 px-4 text-right font-bold text-slate-900">Net Payable</th>
                <th className="py-3 px-4 text-center">Disbursement</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSalaries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FileText className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold">No payslips found for {selectedMonth}.</p>
                      <p className="text-[11px]">
                        Click "Generate All Staff Payroll" to batch compute or "Individual Payslip" to add.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSalaries.map((s) => {
                  const basic = s.base_salary || s.basic_salary || 0;
                  const comm = s.sales_commission || 0;
                  const allow = (s.allowances || s.bonuses || 0) + (s.travel_allowance || 0) + (s.food_allowance || 0) + (s.ot_amount || 0);
                  const totalEarningsExtra = comm + allow;
                  const adv = s.advances_deducted || s.advance_deductions || 0;
                  const epf = s.epf_employee || 0;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900">{s.employee_name}</span>
                          {s.is_shop_associate && (
                            <span className="px-1.5 py-0.2 bg-purple-100 text-purple-700 font-bold rounded text-[9px]">
                              Associate
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">{s.slip_no || s.id}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">{s.designation || 'Staff'}</td>
                      <td className="py-3 px-4 text-right font-mono font-medium">
                        {currencySymbol} {basic.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-700">
                        {totalEarningsExtra > 0 ? `+${currencySymbol} ${totalEarningsExtra.toLocaleString()}` : '-'}
                        {comm > 0 && (
                          <div className="text-[10px] text-purple-700 font-semibold">
                            (Comm: {currencySymbol} {comm.toLocaleString()})
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-rose-600">
                        {adv > 0 ? `-${currencySymbol} ${adv.toLocaleString()}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-rose-600">
                        {epf > 0 ? `-${currencySymbol} ${epf.toLocaleString()}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-slate-900 text-sm">
                        {currencySymbol} {s.net_salary.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 rounded-full font-bold text-[10px] text-slate-700">
                          {s.payment_method}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onViewPayslip(s)}
                            title="View / Print A4 Payslip"
                            className="p-1.5 text-teal-700 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onPrintThermal(s)}
                            title="Print 80mm POS Slip"
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onShareWhatsApp(s)}
                            title="Share on WhatsApp"
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onOpenProcessModal(s)}
                            title="Edit Payslip"
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm(`Delete salary record for ${s.employee_name}?`)) {
                                onDeleteSalary(s.id);
                              }
                            }}
                            title="Delete Record"
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
    </div>
  );
};
