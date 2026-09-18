import React, { useState } from 'react';
import { useRetail } from '../../context/RetailContext';
import { SalaryRecord, Employee, SalaryAdvance } from '../../types';
import {
  Users,
  Calendar,
  Wallet,
  ShieldCheck,
  Building,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';
import { PayrollRunTab } from './salaries/PayrollRunTab';
import { EmployeeProfilesTab } from './salaries/EmployeeProfilesTab';
import { SalaryAdvancesTab } from './salaries/SalaryAdvancesTab';
import { EpfEtfReportTab } from './salaries/EpfEtfReportTab';
import { PayslipModal } from './salaries/PayslipModal';
import { ProcessSalaryModal } from './salaries/ProcessSalaryModal';
import { EmployeeModal } from './salaries/EmployeeModal';

export const StaffSalariesManager: React.FC = () => {
  const {
    employees = [],
    salaries = [],
    advances = [],
    sales = [],
    salaryPayments: contextSalaryPayments,
    salaryAdvances: contextSalaryAdvances,
    currentTenant,
    currentUser,
    currencySymbol: contextCurrencySymbol,
    recordSalaryPayment,
    updateSalaryPayment,
    deleteSalaryPayment,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    requestSalaryAdvance,
    updateSalaryAdvanceStatus,
    deleteSalaryAdvance,
  } = useRetail();

  const salaryPayments = contextSalaryPayments || salaries || [];
  const salaryAdvances = contextSalaryAdvances || advances || [];
  const currencySymbol = contextCurrencySymbol || currentTenant?.currency_symbol || 'Rs.';

  // Active view tab
  const [activeTab, setActiveTab] = useState<'PAYROLL_RUN' | 'EMPLOYEES' | 'ADVANCES' | 'EPF_ETF'>('PAYROLL_RUN');

  // Selected payroll month (default to current month)
  const currentMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);

  // Modals state
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [editingSalary, setEditingSalary] = useState<SalaryRecord | null>(null);
  const [viewingSalary, setViewingSalary] = useState<SalaryRecord | null>(null);

  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Toast notifications
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // 1. Batch generate payroll for all active staff for the selected month
  const handleBatchProcessPayroll = () => {
    const activeStaff = employees.filter((e) => e.is_active);
    if (activeStaff.length === 0) {
      showToast('No active staff found to generate payroll.', 'error');
      return;
    }

    let createdCount = 0;
    activeStaff.forEach((emp) => {
      // Check if already processed for this month
      const exists = salaryPayments.some(
        (s) => s.employee_id === emp.id && s.month === selectedMonth
      );
      if (!exists) {
        // Compute pending approved advances for this employee
        const empApprovedAdvances = salaryAdvances
          .filter((a) => a.employee_id === emp.id && a.status === 'APPROVED')
          .reduce((sum, a) => sum + (a.amount || 0), 0);

        // Shop Associate & Sales Commission computation
        const isShopAssoc = emp.is_shop_associate || (emp.commission_percentage ? emp.commission_percentage > 0 : false);
        const commRate = emp.commission_percentage || (isShopAssoc ? 3.5 : 0);

        let assocSalesTotal = 0;
        let salesCommission = 0;

        if (isShopAssoc) {
          const empSales = sales.filter((s) => {
            const saleMonth = (s.created_at || '').slice(0, 7);
            if (saleMonth !== selectedMonth) return false;
            return (
              s.sales_associate_id === emp.id ||
              (emp.associate_code && s.sales_associate_code === emp.associate_code) ||
              s.sales_associate_id === emp.user_account_id ||
              s.cashier_id === emp.id ||
              s.cashier_id === emp.user_account_id ||
              s.sales_associate_name === emp.name
            );
          });
          assocSalesTotal = empSales.reduce((sum, s) => sum + (s.grand_total || 0), 0);
          const directCommSum = empSales.reduce((sum, s) => sum + (s.commission_amount || 0), 0);
          salesCommission = directCommSum > 0 ? Math.round(directCommSum) : Math.round((assocSalesTotal * commRate) / 100);
        }

        const baseSalary = emp.base_salary || 0;
        const allowances = (emp.allowance || 0) + (emp.attendance_allowance || 0);
        const travelAllowance = emp.travel_allowance || 0;
        const foodAllowance = emp.food_allowance || 0;
        const grossSalary = baseSalary + allowances + travelAllowance + foodAllowance + salesCommission;

        const epfEmployee = emp.epf_etf_applicable ? Math.round(baseSalary * 0.08) : 0;
        const epfEmployer = emp.epf_etf_applicable ? Math.round(baseSalary * 0.12) : 0;
        const etfEmployer = emp.epf_etf_applicable ? Math.round(baseSalary * 0.03) : 0;

        const totalDeductions = empApprovedAdvances + epfEmployee;
        const netSalary = Math.max(0, grossSalary - totalDeductions);

        recordSalaryPayment({
          slip_no: `PAY-${selectedMonth.replace('-', '')}-${emp.id.slice(-4).toUpperCase()}`,
          employee_id: emp.id,
          employee_name: emp.name,
          designation: emp.designation,
          department: emp.department,
          month: selectedMonth,
          working_days: 26,
          present_days: 26,
          base_salary: baseSalary,
          allowances: allowances,
          travel_allowance: travelAllowance,
          food_allowance: foodAllowance,
          is_shop_associate: isShopAssoc,
          commission_rate: isShopAssoc ? commRate : undefined,
          associate_sales_total: isShopAssoc ? assocSalesTotal : undefined,
          sales_commission: isShopAssoc ? salesCommission : undefined,
          gross_salary: grossSalary,
          epf_employee: epfEmployee,
          epf_employer: epfEmployer,
          etf_employer: etfEmployer,
          advances_deducted: empApprovedAdvances,
          other_deductions: 0,
          total_deductions: totalDeductions,
          net_salary: netSalary,
          payment_method: emp.default_payment_method || 'BANK_TRANSFER',
          bank_name: emp.bank_name,
          account_no: emp.account_no,
          payment_date: new Date().toISOString().slice(0, 10),
          status: 'PAID',
          notes: isShopAssoc && salesCommission > 0
            ? `Auto-generated via Monthly Batch Payroll Run (Includes Sales Commission: ${currencySymbol} ${salesCommission.toLocaleString()})`
            : 'Auto-generated via Monthly Batch Payroll Run',
        });
        createdCount++;
      }
    });

    if (createdCount > 0) {
      showToast(`Successfully processed payroll for ${createdCount} staff members!`);
    } else {
      showToast('All active staff have already been processed for this month.');
    }
  };

  // 2. Export Bank Transfer CSV for bulk disbursement
  const handleExportBankCsv = () => {
    const monthSalaries = salaryPayments.filter((s) => s.month === selectedMonth);
    if (monthSalaries.length === 0) {
      showToast('No salaries to export for this month.', 'error');
      return;
    }

    const headers = [
      'Beneficiary Name',
      'Bank Name',
      'Account Number',
      'Amount',
      'Payment Reference / Slip No',
      'Month',
      'Employee ID',
    ];

    const rows = monthSalaries.map((s) => [
      `"${s.employee_name}"`,
      `"${s.bank_name || 'Commercial Bank'}"`,
      `"${s.account_no || 'N/A'}"`,
      s.net_salary,
      `"${s.slip_no || s.id}"`,
      `"${s.month}"`,
      `"${s.employee_id}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bank_Salary_Disbursement_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Bank transfer CSV generated.');
  };

  // 3. 80mm Thermal Receipt Printer Handler
  const handlePrintThermal = (salary: SalaryRecord) => {
    const printWindow = window.open('', '_blank', 'width=380,height=600');
    if (!printWindow) return;

    const basePay = salary.base_salary || salary.basic_salary || 0;
    const allowances = (salary.allowances || salary.bonuses || 0) + (salary.travel_allowance || 0) + (salary.food_allowance || 0);
    const gross = salary.gross_salary || (basePay + allowances);
    const adv = salary.advances_deducted || salary.advance_deductions || 0;
    const epf = salary.epf_employee || 0;
    const totalDed = salary.total_deductions || (adv + epf);
    const net = salary.net_salary || (gross - totalDed);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payslip - ${salary.slip_no || salary.id}</title>
          <style>
            @page { margin: 0; size: 80mm auto; }
            body {
              font-family: 'Courier New', monospace;
              font-size: 11px;
              line-height: 1.3;
              margin: 4mm;
              padding: 0;
              color: #000;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .divider { border-bottom: 1px dashed #000; margin: 4px 0; }
            .row { display: flex; justify-content: space-between; }
            .large { font-size: 14px; font-weight: bold; }
            .pad-y { margin: 4px 0; }
          </style>
        </head>
        <body>
          <div class="center bold large">${currentTenant?.shop_name || 'RETAIL STORE'}</div>
          <div class="center">${currentTenant?.address || 'Colombo, Sri Lanka'}</div>
          <div class="center">Tel: ${currentTenant?.phone || '+94 11 234 5678'}</div>
          <div class="divider"></div>
          
          <div class="center bold">SALARY PAYSLIP VOUCHER</div>
          <div class="row"><span>Slip No:</span><span>${salary.slip_no || salary.id}</span></div>
          <div class="row"><span>Pay Period:</span><span class="bold">${salary.month}</span></div>
          <div class="row"><span>Date Paid:</span><span>${salary.payment_date || salary.paid_date || new Date().toISOString().slice(0, 10)}</span></div>
          <div class="divider"></div>

          <div class="row"><span>Employee:</span><span class="bold">${salary.employee_name}</span></div>
          <div class="row"><span>Role:</span><span>${salary.designation || 'Staff'}</span></div>
          <div class="row"><span>Method:</span><span>${salary.payment_method}</span></div>
          <div class="divider"></div>

          <div class="bold pad-y">EARNINGS</div>
          <div class="row"><span>Basic Salary:</span><span>${currencySymbol} ${(basePay || 0).toLocaleString()}</span></div>
          ${salary.sales_commission && salary.sales_commission > 0 ? `<div class="row"><span>Sales Commission (${salary.commission_rate || 0}%):</span><span>+${currencySymbol} ${(salary.sales_commission || 0).toLocaleString()}</span></div>` : ''}
          ${allowances > 0 ? `<div class="row"><span>Allowances & OT:</span><span>+${currencySymbol} ${(allowances || 0).toLocaleString()}</span></div>` : ''}
          <div class="row bold"><span>Gross Earnings:</span><span>${currencySymbol} ${(gross || 0).toLocaleString()}</span></div>
          <div class="divider"></div>

          <div class="bold pad-y">DEDUCTIONS</div>
          ${adv > 0 ? `<div class="row"><span>Advance Deducted:</span><span>-${currencySymbol} ${(adv || 0).toLocaleString()}</span></div>` : ''}
          ${epf > 0 ? `<div class="row"><span>EPF Employee (8%):</span><span>-${currencySymbol} ${(epf || 0).toLocaleString()}</span></div>` : ''}
          <div class="row bold"><span>Total Deductions:</span><span>-${currencySymbol} ${(totalDed || 0).toLocaleString()}</span></div>
          <div class="divider"></div>

          <div class="row large pad-y">
            <span>NET SALARY:</span>
            <span>${currencySymbol} ${(net || 0).toLocaleString()}</span>
          </div>
          <div class="divider"></div>

          <div class="center" style="margin-top: 15px;">
            ___________________________<br/>
            Employee Signature
          </div>
          <div class="center" style="margin-top: 10px; font-size: 9px;">
            System Generated • Thank you for your service
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // 4. WhatsApp Sharing Handler
  const handleShareWhatsApp = (salary: SalaryRecord) => {
    const emp = employees.find((e) => e.id === salary.employee_id);
    const phone = emp?.phone?.replace(/[^0-9]/g, '') || '';
    
    const basePay = salary.base_salary || salary.basic_salary || 0;
    const allowances = (salary.allowances || salary.bonuses || 0) + (salary.travel_allowance || 0) + (salary.food_allowance || 0);
    const gross = salary.gross_salary || (basePay + allowances);
    const adv = salary.advances_deducted || salary.advance_deductions || 0;
    const epf = salary.epf_employee || 0;
    const net = salary.net_salary || (gross - (adv + epf));

    const text = `📄 *OFFICIAL SALARY PAYSLIP - ${currentTenant?.shop_name || 'Retail'}*
👤 *Employee:* ${salary.employee_name} (${salary.designation || 'Staff'})
📅 *Pay Period:* ${salary.month}
🧾 *Slip No:* ${salary.slip_no || salary.id}
---------------------------
💵 *Basic Salary:* ${currencySymbol} ${(basePay || 0).toLocaleString()}
${salary.sales_commission && salary.sales_commission > 0 ? `✨ *Sales Commission (${salary.commission_rate || 0}%):* ${currencySymbol} ${(salary.sales_commission || 0).toLocaleString()}\n` : ''}➕ *Allowances & OT:* ${currencySymbol} ${(allowances || 0).toLocaleString()}
💰 *Gross Salary:* ${currencySymbol} ${(gross || 0).toLocaleString()}
${adv > 0 ? `➖ *Advance Deductions:* ${currencySymbol} ${(adv || 0).toLocaleString()}\n` : ''}${epf > 0 ? `➖ *EPF (8%):* ${currencySymbol} ${(epf || 0).toLocaleString()}\n` : ''}---------------------------
🌟 *NET SALARY PAID:* ${currencySymbol} ${(net || 0).toLocaleString()}
💳 *Disbursed Via:* ${salary.payment_method}
---------------------------
_Thank you for your dedicated service!_`;

    const url = phone
      ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // 5. Print Advance Voucher
  const handlePrintAdvance = (advance: SalaryAdvance) => {
    const printWindow = window.open('', '_blank', 'width=380,height=500');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Advance Voucher - ${advance.advance_no || advance.id}</title>
          <style>
            body { font-family: 'Courier New', monospace; font-size: 11px; margin: 4mm; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .divider { border-bottom: 1px dashed #000; margin: 4px 0; }
            .row { display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="center bold" style="font-size: 13px;">${currentTenant?.shop_name || 'RETAIL STORE'}</div>
          <div class="center bold">SALARY ADVANCE RECEIPT</div>
          <div class="divider"></div>
          <div class="row"><span>Voucher No:</span><span>${advance.advance_no || advance.id}</span></div>
          <div class="row"><span>Date:</span><span>${advance.request_date || advance.date}</span></div>
          <div class="row"><span>Employee:</span><span class="bold">${advance.employee_name}</span></div>
          <div class="row"><span>Source:</span><span>${advance.payment_source || 'CASH_DRAWER'}</span></div>
          <div class="row"><span>Reason:</span><span>${advance.reason}</span></div>
          <div class="divider"></div>
          <div class="row bold" style="font-size: 14px;">
            <span>ADVANCE AMOUNT:</span>
            <span>${currencySymbol} ${(advance.amount || 0).toLocaleString()}</span>
          </div>
          <div class="divider"></div>
          <div style="margin-top: 25px; text-align: center;">
            ___________________________<br/>Employee Signature
          </div>
          <script>
            window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-top-3 ${
            toastMsg.type === 'error'
              ? 'bg-rose-900 text-white border border-rose-700'
              : 'bg-teal-900 text-white border border-teal-700'
          }`}
        >
          {toastMsg.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-rose-300" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-teal-300" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Main Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-teal-50 text-teal-800 text-[10px] font-bold rounded-md uppercase tracking-wider">
              Human Resources &amp; Payroll
            </span>
            <span className="text-slate-400 text-xs">• {currentTenant?.shop_name}</span>
          </div>
          <h1 className="text-xl font-black text-slate-900">
            Staff Salaries &amp; Payroll Suite
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            Complete staff payroll management: automated monthly salary runs, formal A4 &amp; 80mm payslips, salary advance tracking, WhatsApp dispatch, bank CSV exports, and EPF/ETF statutory contributions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-add-employee-top"
            onClick={() => {
              setEditingEmployee(null);
              setIsEmployeeModalOpen(true);
            }}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Users className="w-4 h-4 text-teal-400" />
            <span>Manage Staff Directory</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl px-4 pt-3 gap-2 overflow-x-auto shadow-xs">
        <button
          onClick={() => setActiveTab('PAYROLL_RUN')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'PAYROLL_RUN'
              ? 'bg-teal-50 text-teal-800 border-b-2 border-teal-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Monthly Payroll Run ({salaryPayments.filter((s) => s.month === selectedMonth).length})</span>
        </button>

        <button
          onClick={() => setActiveTab('EMPLOYEES')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'EMPLOYEES'
              ? 'bg-teal-50 text-teal-800 border-b-2 border-teal-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Staff Directory &amp; Contracts ({employees.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ADVANCES')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'ADVANCES'
              ? 'bg-teal-50 text-teal-800 border-b-2 border-teal-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Salary Advances ({salaryAdvances.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('EPF_ETF')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'EPF_ETF'
              ? 'bg-teal-50 text-teal-800 border-b-2 border-teal-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>EPF / ETF Statutory Return</span>
        </button>
      </div>

      {/* Tab Content Panels */}
      {activeTab === 'PAYROLL_RUN' && (
        <PayrollRunTab
          salaries={salaryPayments}
          employees={employees}
          advances={salaryAdvances}
          currencySymbol={currencySymbol}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          onOpenProcessModal={(salary) => {
            setEditingSalary(salary || null);
            setIsProcessModalOpen(true);
          }}
          onViewPayslip={(salary) => setViewingSalary(salary)}
          onPrintThermal={handlePrintThermal}
          onShareWhatsApp={handleShareWhatsApp}
          onDeleteSalary={(id) => {
            deleteSalaryPayment(id);
            showToast('Salary record removed.');
          }}
          onBatchProcessPayroll={handleBatchProcessPayroll}
          onExportBankCsv={handleExportBankCsv}
        />
      )}

      {activeTab === 'EMPLOYEES' && (
        <EmployeeProfilesTab
          employees={employees}
          salaries={salaryPayments}
          currencySymbol={currencySymbol}
          onAddEmployee={() => {
            setEditingEmployee(null);
            setIsEmployeeModalOpen(true);
          }}
          onEditEmployee={(emp) => {
            setEditingEmployee(emp);
            setIsEmployeeModalOpen(true);
          }}
          onDeleteEmployee={(id) => {
            deleteEmployee(id);
            showToast('Employee profile deleted.');
          }}
        />
      )}

      {activeTab === 'ADVANCES' && (
        <SalaryAdvancesTab
          advances={salaryAdvances}
          employees={employees}
          currencySymbol={currencySymbol}
          onRequestAdvance={(adv) => {
            requestSalaryAdvance(adv);
            showToast('Salary advance approved and recorded.');
          }}
          onUpdateStatus={(id, status) => {
            updateSalaryAdvanceStatus(id, status);
            showToast(`Advance status updated to ${status}.`);
          }}
          onDeleteAdvance={(id) => {
            deleteSalaryAdvance(id);
            showToast('Salary advance removed.');
          }}
          onPrintAdvanceReceipt={handlePrintAdvance}
        />
      )}

      {activeTab === 'EPF_ETF' && (
        <EpfEtfReportTab
          salaries={salaryPayments}
          employees={employees}
          currencySymbol={currencySymbol}
          selectedMonth={selectedMonth}
          tenant={currentTenant}
        />
      )}

      {/* MODAL: PROCESS INDIVIDUAL SALARY */}
      {isProcessModalOpen && (
        <ProcessSalaryModal
          employees={employees}
          advances={salaryAdvances}
          currencySymbol={currencySymbol}
          selectedMonth={selectedMonth}
          editingSalary={editingSalary}
          onClose={() => {
            setIsProcessModalOpen(false);
            setEditingSalary(null);
          }}
          onSave={(salaryData) => {
            if (editingSalary) {
              updateSalaryPayment(editingSalary.id, salaryData);
              showToast('Salary voucher updated successfully.');
            } else {
              recordSalaryPayment(salaryData);
              showToast('Salary payment processed successfully!');
            }
            setIsProcessModalOpen(false);
            setEditingSalary(null);
          }}
        />
      )}

      {/* MODAL: VIEW / PRINT OFFICIAL PAYSLIP */}
      {viewingSalary && (
        <PayslipModal
          salary={viewingSalary}
          employee={employees.find((e) => e.id === viewingSalary.employee_id)}
          tenant={currentTenant}
          currencySymbol={currencySymbol}
          onClose={() => setViewingSalary(null)}
          onPrintThermal={handlePrintThermal}
          onShareWhatsApp={handleShareWhatsApp}
        />
      )}

      {/* MODAL: ADD / EDIT EMPLOYEE */}
      {isEmployeeModalOpen && (
        <EmployeeModal
          employee={editingEmployee}
          currencySymbol={currencySymbol}
          onClose={() => {
            setIsEmployeeModalOpen(false);
            setEditingEmployee(null);
          }}
          onSave={(empData) => {
            if (editingEmployee) {
              updateEmployee(editingEmployee.id, empData);
              showToast('Employee profile updated.');
            } else {
              addEmployee(empData);
              showToast('New employee added successfully!');
            }
            setIsEmployeeModalOpen(false);
            setEditingEmployee(null);
          }}
        />
      )}
    </div>
  );
};

export default StaffSalariesManager;
