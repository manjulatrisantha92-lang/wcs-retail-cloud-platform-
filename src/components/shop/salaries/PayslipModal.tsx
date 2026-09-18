import React, { useRef } from 'react';
import { SalaryRecord, Employee, Tenant } from '../../../types';
import { X, Printer, Share2, Download, Building, UserCheck } from 'lucide-react';

interface PayslipModalProps {
  salary: SalaryRecord;
  employee?: Employee;
  tenant?: Tenant;
  currencySymbol: string;
  onClose: () => void;
  onPrintThermal: (salary: SalaryRecord) => void;
  onShareWhatsApp: (salary: SalaryRecord) => void;
}

export const PayslipModal: React.FC<PayslipModalProps> = ({
  salary,
  employee,
  tenant,
  currencySymbol,
  onClose,
  onPrintThermal,
  onShareWhatsApp,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handleBrowserPrint = () => {
    window.print();
  };

  const basicPay = salary.base_salary || salary.basic_salary || 0;
  const allowances = salary.allowances || salary.bonuses || 0;
  const travelAllow = salary.travel_allowance || 0;
  const foodAllow = salary.food_allowance || 0;
  const otAmount = salary.ot_amount || (salary.ot_hours && salary.ot_rate ? salary.ot_hours * salary.ot_rate : 0);
  const perfBonus = salary.performance_bonus || 0;
  const salesCommission = salary.sales_commission || 0;
  const grossPay = salary.gross_salary || (basicPay + allowances + travelAllow + foodAllow + otAmount + perfBonus + salesCommission);

  const advanceDed = salary.advances_deducted || salary.advance_deductions || 0;
  const epfEmp = salary.epf_employee || (employee?.epf_etf_applicable ? Math.round(basicPay * 0.08) : 0);
  const otherDed = salary.other_deductions || 0;
  const totalDed = salary.total_deductions || (advanceDed + epfEmp + otherDed);
  const netPay = salary.net_salary || (grossPay - totalDed);

  const epfEmployer = salary.epf_employer || (employee?.epf_etf_applicable ? Math.round(basicPay * 0.12) : 0);
  const etfEmployer = salary.etf_employer || (employee?.epf_etf_applicable ? Math.round(basicPay * 0.03) : 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl max-w-3xl w-full text-slate-900 shadow-2xl border border-slate-200 overflow-hidden my-8 print:border-none print:shadow-none print:m-0 print:max-w-full">
        {/* Modal Top Bar (Hidden on Print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-2.5">
            <Building className="w-5 h-5 text-teal-400" />
            <div>
              <h3 className="font-bold text-sm">Official Employee Payslip</h3>
              <p className="text-[11px] text-slate-400">
                {salary.slip_no || salary.id} • {salary.month}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPrintThermal(salary)}
              title="Print 80mm POS Thermal Slip"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>80mm POS Slip</span>
            </button>

            <button
              onClick={handleBrowserPrint}
              title="Print A4 Format"
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print A4</span>
            </button>

            <button
              onClick={() => onShareWhatsApp(salary)}
              title="Send to WhatsApp"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div ref={printRef} className="p-8 space-y-6 text-xs text-slate-800 font-sans">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-5">
            <div>
              <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                {tenant?.shop_name || 'Retail Enterprise'}
              </h1>
              <p className="text-slate-500 text-[11px] mt-0.5">
                {tenant?.address || 'Colombo, Sri Lanka'} • Tel: {tenant?.phone || '+94 11 234 5678'}
              </p>
              <p className="text-slate-500 text-[11px]">Email: {tenant?.email || 'accounts@retail.lk'}</p>
            </div>

            <div className="text-right">
              <div className="inline-block px-3 py-1 bg-teal-50 border border-teal-200 text-teal-800 rounded-lg font-black text-xs uppercase tracking-wider mb-1">
                SALARY PAYSLIP
              </div>
              <p className="text-[11px] font-mono font-bold text-slate-700">
                Slip No: {salary.slip_no || salary.id}
              </p>
              <p className="text-[11px] text-slate-500">Pay Period: <strong className="text-slate-800">{salary.month}</strong></p>
              <p className="text-[11px] text-slate-500">Payment Date: {salary.payment_date || salary.paid_date || 'N/A'}</p>
            </div>
          </div>

          {/* Employee & Bank Info Grid */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Employee Details</div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-sm text-slate-900">{salary.employee_name}</p>
                {(salary.is_shop_associate || employee?.is_shop_associate) && (
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-800 border border-purple-200 font-bold rounded-full text-[10px]">
                    ★ Shop Associate
                  </span>
                )}
              </div>
              <p className="text-slate-600">Designation: <span className="font-medium text-slate-800">{salary.designation || employee?.designation || 'Staff'}</span></p>
              <p className="text-slate-600">Department: <span className="font-medium text-slate-800">{salary.department || employee?.department || 'Operations'}</span></p>
              {employee?.nic && <p className="text-slate-600">NIC No: <span className="font-medium text-slate-800">{employee.nic}</span></p>}
              {employee?.epf_no && <p className="text-slate-600">EPF Member No: <span className="font-medium text-slate-800">{employee.epf_no}</span></p>}
            </div>

            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Payment & Bank Details</div>
              <p className="text-slate-600">Payment Method: <span className="font-bold text-slate-900">{salary.payment_method}</span></p>
              {(salary.bank_name || employee?.bank_name) && (
                <p className="text-slate-600">Bank: <span className="font-medium text-slate-800">{salary.bank_name || employee?.bank_name}</span></p>
              )}
              {(salary.account_no || employee?.account_no) && (
                <p className="text-slate-600">Account No: <span className="font-medium font-mono text-slate-800">{salary.account_no || employee?.account_no}</span></p>
              )}
              {salary.working_days && (
                <p className="text-slate-600">Working Days: <span className="font-medium text-slate-800">{salary.present_days || salary.working_days} / {salary.working_days} days</span></p>
              )}
              <p className="text-slate-600">Status: <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px]">PAID</span></p>
            </div>
          </div>

          {/* Earnings & Deductions Breakdown Tables */}
          <div className="grid grid-cols-2 gap-6">
            {/* Earnings Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 font-bold text-xs text-slate-800 flex justify-between">
                <span>EARNINGS & ALLOWANCES</span>
                <span>AMOUNT ({currencySymbol})</span>
              </div>
              <div className="divide-y divide-slate-100 p-2 space-y-1.5">
                <div className="flex justify-between px-2 py-1">
                  <span className="text-slate-600">Basic Salary</span>
                  <span className="font-mono font-medium">{basicPay.toLocaleString()}</span>
                </div>
                {salesCommission > 0 && (
                  <div className="flex justify-between px-2 py-1 bg-purple-50/70 rounded-lg">
                    <span className="text-purple-950 font-semibold">
                      Sales Commission {salary.commission_rate ? `(${salary.commission_rate}% on ${currencySymbol} ${(salary.associate_sales_total || 0).toLocaleString()})` : ''}
                    </span>
                    <span className="font-mono font-bold text-purple-900">+{salesCommission.toLocaleString()}</span>
                  </div>
                )}
                {allowances > 0 && (
                  <div className="flex justify-between px-2 py-1">
                    <span className="text-slate-600">Fixed / General Allowance</span>
                    <span className="font-mono font-medium">{allowances.toLocaleString()}</span>
                  </div>
                )}
                {travelAllow > 0 && (
                  <div className="flex justify-between px-2 py-1">
                    <span className="text-slate-600">Travel & Transport Allowance</span>
                    <span className="font-mono font-medium">{travelAllow.toLocaleString()}</span>
                  </div>
                )}
                {foodAllow > 0 && (
                  <div className="flex justify-between px-2 py-1">
                    <span className="text-slate-600">Meals & Food Allowance</span>
                    <span className="font-mono font-medium">{foodAllow.toLocaleString()}</span>
                  </div>
                )}
                {otAmount > 0 && (
                  <div className="flex justify-between px-2 py-1">
                    <span className="text-slate-600">Overtime ({salary.ot_hours || 0} hrs @ {salary.ot_rate || 0})</span>
                    <span className="font-mono font-medium">{otAmount.toLocaleString()}</span>
                  </div>
                )}
                {perfBonus > 0 && (
                  <div className="flex justify-between px-2 py-1">
                    <span className="text-slate-600">Performance / Attendance Bonus</span>
                    <span className="font-mono font-medium">{perfBonus.toLocaleString()}</span>
                  </div>
                )}
              </div>
              <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 font-bold text-xs text-slate-900 flex justify-between">
                <span>TOTAL GROSS EARNINGS</span>
                <span className="font-mono font-bold text-teal-700">{currencySymbol} {grossPay.toLocaleString()}</span>
              </div>
            </div>

            {/* Deductions Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 font-bold text-xs text-slate-800 flex justify-between">
                <span>DEDUCTIONS</span>
                <span>AMOUNT ({currencySymbol})</span>
              </div>
              <div className="divide-y divide-slate-100 p-2 space-y-1.5">
                {epfEmp > 0 && (
                  <div className="flex justify-between px-2 py-1">
                    <span className="text-slate-600">EPF Employee (8%)</span>
                    <span className="font-mono font-medium text-rose-600">-{epfEmp.toLocaleString()}</span>
                  </div>
                )}
                {advanceDed > 0 && (
                  <div className="flex justify-between px-2 py-1">
                    <span className="text-slate-600">Salary Advances Deducted</span>
                    <span className="font-mono font-medium text-rose-600">-{advanceDed.toLocaleString()}</span>
                  </div>
                )}
                {otherDed > 0 && (
                  <div className="flex justify-between px-2 py-1">
                    <span className="text-slate-600">Other Deductions / Loans</span>
                    <span className="font-mono font-medium text-rose-600">-{otherDed.toLocaleString()}</span>
                  </div>
                )}
                {totalDed === 0 && (
                  <div className="px-2 py-3 text-center text-slate-400 italic">No deductions applied.</div>
                )}
              </div>
              <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 font-bold text-xs text-slate-900 flex justify-between">
                <span>TOTAL DEDUCTIONS</span>
                <span className="font-mono font-bold text-rose-600">{currencySymbol} {totalDed.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Net Salary Banner */}
          <div className="bg-teal-900 text-white p-5 rounded-2xl flex items-center justify-between shadow-sm">
            <div>
              <span className="text-[10px] uppercase font-bold text-teal-200 tracking-wider">NET SALARY PAYABLE</span>
              <p className="text-xs text-teal-100 mt-0.5">Credited to employee via {salary.payment_method}</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-white font-mono">
                {currencySymbol} {netPay.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Statutory Employer Contributions (Informational) */}
          {(epfEmployer > 0 || etfEmployer > 0) && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-[10px] font-bold uppercase text-slate-400 mb-1 tracking-wider">
                Employer Statutory Contributions (Not Deducted From Salary)
              </div>
              <div className="flex gap-6 text-xs text-slate-700">
                <span>EPF Employer (12%): <strong className="font-mono">{currencySymbol} {epfEmployer.toLocaleString()}</strong></span>
                <span>ETF Employer (3%): <strong className="font-mono">{currencySymbol} {etfEmployer.toLocaleString()}</strong></span>
                <span>Total Statutory Benefit: <strong className="font-mono text-teal-700">{currencySymbol} {(epfEmployer + etfEmployer).toLocaleString()}</strong></span>
              </div>
            </div>
          )}

          {/* Notes */}
          {salary.notes && (
            <div className="text-slate-600 text-xs italic bg-slate-50 p-3 rounded-lg border border-slate-200">
              Note: {salary.notes}
            </div>
          )}

          {/* Signatures */}
          <div className="pt-10 grid grid-cols-2 gap-12 text-center text-xs text-slate-600">
            <div>
              <div className="border-t border-slate-300 pt-2 font-medium">
                Prepared / Authorized By: <strong>{salary.processed_by || 'Management'}</strong>
              </div>
            </div>
            <div>
              <div className="border-t border-slate-300 pt-2 font-medium">
                Employee Acknowledgment Signature
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
