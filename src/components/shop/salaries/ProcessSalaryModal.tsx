import React, { useState, useEffect, useMemo } from 'react';
import { Employee, SalaryAdvance, SalaryRecord } from '../../../types';
import { useRetail } from '../../../context/RetailContext';
import { X, Calculator, User, DollarSign, Calendar, AlertCircle, Award, Percent, TrendingUp } from 'lucide-react';

interface ProcessSalaryModalProps {
  employees: Employee[];
  advances: SalaryAdvance[];
  currencySymbol: string;
  selectedMonth: string;
  onClose: () => void;
  onSave: (salary: Omit<SalaryRecord, 'id' | 'tenant_id' | 'processed_by'>) => void;
  editingSalary?: SalaryRecord | null;
}

export const ProcessSalaryModal: React.FC<ProcessSalaryModalProps> = ({
  employees,
  advances,
  currencySymbol,
  selectedMonth,
  onClose,
  onSave,
  editingSalary,
}) => {
  const { sales = [] } = useRetail();

  const [employeeId, setEmployeeId] = useState<string>(
    editingSalary?.employee_id || (employees.length > 0 ? employees[0].id : '')
  );
  const [month, setMonth] = useState<string>(editingSalary?.month || selectedMonth);
  const [workingDays, setWorkingDays] = useState<number>(editingSalary?.working_days || 26);
  const [presentDays, setPresentDays] = useState<number>(editingSalary?.present_days || 26);
  const [baseSalary, setBaseSalary] = useState<number>(editingSalary?.base_salary || 0);
  const [allowance, setAllowance] = useState<number>(editingSalary?.allowances || 0);
  const [travelAllowance, setTravelAllowance] = useState<number>(editingSalary?.travel_allowance || 0);
  const [foodAllowance, setFoodAllowance] = useState<number>(editingSalary?.food_allowance || 0);
  const [otHours, setOtHours] = useState<number>(editingSalary?.ot_hours || 0);
  const [otRate, setOtRate] = useState<number>(editingSalary?.ot_rate || 0);
  const [performanceBonus, setPerformanceBonus] = useState<number>(editingSalary?.performance_bonus || 0);

  // Shop Associate Commission States
  const [isShopAssociate, setIsShopAssociate] = useState<boolean>(
    editingSalary?.is_shop_associate !== undefined ? Boolean(editingSalary.is_shop_associate) : false
  );
  const [commissionRate, setCommissionRate] = useState<number>(editingSalary?.commission_rate || 0);
  const [associateSalesTotal, setAssociateSalesTotal] = useState<number>(editingSalary?.associate_sales_total || 0);
  const [salesCommission, setSalesCommission] = useState<number>(editingSalary?.sales_commission || 0);
  
  const [epfApplicable, setEpfApplicable] = useState<boolean>(true);
  const [advanceDeduction, setAdvanceDeduction] = useState<number>(editingSalary?.advances_deducted || 0);
  const [otherDeduction, setOtherDeduction] = useState<number>(editingSalary?.other_deductions || 0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'CHEQUE'>(
    editingSalary?.payment_method || 'BANK_TRANSFER'
  );
  const [paymentRef, setPaymentRef] = useState<string>(editingSalary?.payment_reference || '');
  const [notes, setNotes] = useState<string>(editingSalary?.notes || '');

  const activeEmployee = employees.find((e) => e.id === employeeId);

  // When selected employee changes, prepopulate contract defaults & pending advances & commission
  useEffect(() => {
    if (!editingSalary && activeEmployee) {
      setBaseSalary(activeEmployee.base_salary || 0);
      setAllowance(activeEmployee.allowance || 0);
      setTravelAllowance(activeEmployee.travel_allowance || 0);
      setFoodAllowance(activeEmployee.food_allowance || 0);
      setOtRate(activeEmployee.ot_hourly_rate || Math.round((activeEmployee.base_salary || 0) / (26 * 8) * 1.5));
      setEpfApplicable(activeEmployee.epf_etf_applicable !== false);
      if (activeEmployee.default_payment_method) {
        setPaymentMethod(activeEmployee.default_payment_method);
      }

      const isAssociate = activeEmployee.is_shop_associate || (activeEmployee.commission_percentage ? activeEmployee.commission_percentage > 0 : false);
      setIsShopAssociate(Boolean(isAssociate));
      const rate = activeEmployee.commission_percentage || (isAssociate ? 3.5 : 0);
      setCommissionRate(rate);

      // Compute sales for this associate in the target month
      const empSales = sales.filter((s) => {
        const saleMonth = (s.created_at || '').slice(0, 7);
        if (saleMonth !== month) return false;
        return (
          s.sales_associate_id === activeEmployee.id ||
          (activeEmployee.associate_code && s.sales_associate_code === activeEmployee.associate_code) ||
          s.sales_associate_id === activeEmployee.user_account_id ||
          s.cashier_id === activeEmployee.id ||
          s.cashier_id === activeEmployee.user_account_id ||
          s.sales_associate_name === activeEmployee.name
        );
      });
      const totalSales = empSales.reduce((sum, s) => sum + (s.grand_total || 0), 0);
      const directCommSum = empSales.reduce((sum, s) => sum + (s.commission_amount || 0), 0);
      const calculatedComm = directCommSum > 0 ? Math.round(directCommSum) : Math.round((totalSales * rate) / 100);
      setAssociateSalesTotal(totalSales);
      setSalesCommission(calculatedComm);

      // Calculate approved pending advances for this employee
      const approvedAdvances = advances
        .filter((a) => a.employee_id === activeEmployee.id && a.status === 'APPROVED')
        .reduce((sum, a) => sum + (a.amount || 0), 0);
      setAdvanceDeduction(approvedAdvances);
    }
  }, [employeeId, activeEmployee, advances, editingSalary, month, sales]);

  // Recalculate commission when rate or sales total manually updated
  const handleCommissionRateChange = (newRate: number) => {
    setCommissionRate(newRate);
    setSalesCommission(Math.round((associateSalesTotal * newRate) / 100));
  };

  const handleSalesTotalChange = (newTotal: number) => {
    setAssociateSalesTotal(newTotal);
    setSalesCommission(Math.round((newTotal * commissionRate) / 100));
  };

  // Dynamic calculations
  const otAmount = Math.round(otHours * otRate);
  const activeCommissionAmount = isShopAssociate ? salesCommission : 0;
  const grossSalary = baseSalary + allowance + travelAllowance + foodAllowance + otAmount + performanceBonus + activeCommissionAmount;
  const epfEmployee = epfApplicable ? Math.round(baseSalary * 0.08) : 0;
  const epfEmployer = epfApplicable ? Math.round(baseSalary * 0.12) : 0;
  const etfEmployer = epfApplicable ? Math.round(baseSalary * 0.03) : 0;
  const totalDeductions = advanceDeduction + epfEmployee + otherDeduction;
  const netSalary = Math.max(0, grossSalary - totalDeductions);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEmployee) return;

    onSave({
      slip_no: editingSalary?.slip_no,
      employee_id: activeEmployee.id,
      employee_name: activeEmployee.name,
      designation: activeEmployee.designation,
      department: activeEmployee.department,
      month,
      working_days: workingDays,
      present_days: presentDays,
      ot_hours: otHours,
      ot_rate: otRate,
      ot_amount: otAmount,
      base_salary: baseSalary,
      allowances: allowance,
      travel_allowance: travelAllowance,
      food_allowance: foodAllowance,
      performance_bonus: performanceBonus,
      is_shop_associate: isShopAssociate,
      commission_rate: isShopAssociate ? commissionRate : undefined,
      associate_sales_total: isShopAssociate ? associateSalesTotal : undefined,
      sales_commission: isShopAssociate ? salesCommission : undefined,
      gross_salary: grossSalary,
      epf_employee: epfEmployee,
      epf_employer: epfEmployer,
      etf_employer: etfEmployer,
      advances_deducted: advanceDeduction,
      other_deductions: otherDeduction,
      total_deductions: totalDeductions,
      net_salary: netSalary,
      payment_method: paymentMethod,
      payment_reference: paymentRef.trim() || undefined,
      bank_name: activeEmployee.bank_name,
      account_no: activeEmployee.account_no,
      payment_date: new Date().toISOString().slice(0, 10),
      status: 'PAID',
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full text-slate-900 shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-teal-900 text-white">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-teal-300" />
            <div>
              <h3 className="font-bold text-sm">
                {editingSalary ? 'Edit Staff Salary Slip' : 'Process Staff Salary Payment'}
              </h3>
              <p className="text-[11px] text-teal-200">Month: {month}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-teal-200 hover:text-white rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Employee & Month Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Select Employee / Staff: *</label>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                disabled={Boolean(editingSalary)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.designation}) {emp.is_shop_associate ? '★ Associate' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Salary Month (YYYY-MM): *</label>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
              />
            </div>
          </div>

          {/* Attendance & Basic Pay */}
          <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="block text-slate-600 font-medium mb-1">Total Working Days</label>
              <input
                type="number"
                value={workingDays}
                onChange={(e) => setWorkingDays(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">Present Days</label>
              <input
                type="number"
                value={presentDays}
                onChange={(e) => setPresentDays(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Basic Salary ({currencySymbol})</label>
              <input
                type="number"
                value={baseSalary}
                onChange={(e) => setBaseSalary(Number(e.target.value))}
                required
                className="w-full bg-white border border-teal-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-black text-teal-800"
              />
            </div>
          </div>

          {/* Shop Associate Sales Commission Box */}
          <div className="bg-purple-50 p-3.5 rounded-xl border border-purple-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-purple-700" />
                <span className="font-bold text-xs text-purple-950">Shop Associate Sales Commission</span>
              </div>
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-purple-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isShopAssociate}
                  onChange={(e) => setIsShopAssociate(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span>Include Sales Commission in Net Pay</span>
              </label>
            </div>

            {isShopAssociate && (
              <div className="grid grid-cols-3 gap-3 bg-white p-3 rounded-lg border border-purple-200">
                <div>
                  <label className="block text-purple-900 text-[11px] font-semibold mb-1">
                    Associate Sales Value ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    value={associateSalesTotal}
                    onChange={(e) => handleSalesTotalChange(Number(e.target.value))}
                    className="w-full bg-purple-50/50 border border-purple-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-purple-950"
                  />
                </div>
                <div>
                  <label className="block text-purple-900 text-[11px] font-semibold mb-1">
                    Commission Rate (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={commissionRate}
                      onChange={(e) => handleCommissionRateChange(Number(e.target.value))}
                      className="w-full bg-purple-50/50 border border-purple-200 rounded-lg pl-2.5 pr-6 py-1.5 text-xs font-mono font-bold text-purple-950"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-purple-500 font-bold text-[10px]">%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-purple-900 text-[11px] font-bold mb-1">
                    Sales Commission ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    value={salesCommission}
                    onChange={(e) => setSalesCommission(Number(e.target.value))}
                    className="w-full bg-purple-100 border border-purple-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-black text-purple-950"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Earnings & Allowances */}
          <div>
            <h4 className="font-bold text-slate-800 text-xs mb-2">Allowances & Overtime</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-slate-500 text-[11px] mb-1">Fixed Allowance</label>
                <input
                  type="number"
                  value={allowance}
                  onChange={(e) => setAllowance(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-500 text-[11px] mb-1">Travel Allowance</label>
                <input
                  type="number"
                  value={travelAllowance}
                  onChange={(e) => setTravelAllowance(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-500 text-[11px] mb-1">Food Allowance</label>
                <input
                  type="number"
                  value={foodAllowance}
                  onChange={(e) => setFoodAllowance(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-500 text-[11px] mb-1">Performance Bonus</label>
                <input
                  type="number"
                  value={performanceBonus}
                  onChange={(e) => setPerformanceBonus(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono"
                />
              </div>
            </div>

            {/* Overtime */}
            <div className="grid grid-cols-3 gap-2.5 mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <div>
                <label className="block text-slate-600 text-[11px]">OT Hours</label>
                <input
                  type="number"
                  step="0.5"
                  value={otHours}
                  onChange={(e) => setOtHours(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-600 text-[11px]">OT Hourly Rate ({currencySymbol})</label>
                <input
                  type="number"
                  value={otRate}
                  onChange={(e) => setOtRate(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-600 text-[11px]">Total OT Pay</label>
                <div className="py-1 px-2 font-mono font-bold text-slate-800 text-xs">
                  {currencySymbol} {otAmount.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-800 text-xs">Deductions & Advances</h4>
              <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={epfApplicable}
                  onChange={(e) => setEpfApplicable(e.target.checked)}
                  className="rounded text-teal-600"
                />
                <span>Apply EPF/ETF (Employee 8% / Employer 12%+3%)</span>
              </label>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-slate-600 text-[11px] mb-1">
                  Salary Advance Deducted ({currencySymbol})
                </label>
                <input
                  type="number"
                  value={advanceDeduction}
                  onChange={(e) => setAdvanceDeduction(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono text-rose-600 font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-600 text-[11px] mb-1">
                  EPF Employee 8% ({currencySymbol})
                </label>
                <input
                  type="number"
                  disabled
                  value={epfEmployee}
                  className="w-full bg-slate-100 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono text-rose-600 font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-600 text-[11px] mb-1">
                  Other Deductions / Loans ({currencySymbol})
                </label>
                <input
                  type="number"
                  value={otherDeduction}
                  onChange={(e) => setOtherDeduction(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono text-rose-600"
                />
              </div>
            </div>
          </div>

          {/* Payment Method & Bank */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Disbursement Method:</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold"
              >
                <option value="BANK_TRANSFER">Direct Bank Transfer</option>
                <option value="CASH">Cash Drawer / Petty Cash</option>
                <option value="CHEQUE">Bank Cheque</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Bank Reference / Cheque No:</label>
              <input
                type="text"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                placeholder="e.g. TXN-882910 or CHQ-00129"
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
              />
            </div>
          </div>

          {/* Live Summary Calculation Card */}
          <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-teal-300">
                Gross: {currencySymbol} {grossSalary.toLocaleString()} {isShopAssociate && salesCommission > 0 ? `(Inc. +${currencySymbol} ${salesCommission.toLocaleString()} Comm.)` : ''} | Deductions: {currencySymbol} {totalDeductions.toLocaleString()}
              </span>
              <div className="text-xl font-black font-mono text-white">
                Net Pay: {currencySymbol} {netSalary.toLocaleString()}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl shadow-md transition-all cursor-pointer"
              >
                {editingSalary ? 'Save Changes' : 'Confirm & Process Salary'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
