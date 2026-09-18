import React from 'react';
import { SalaryRecord, Employee, Tenant } from '../../../types';
import { Building, Download, Printer, ShieldCheck } from 'lucide-react';

interface EpfEtfReportTabProps {
  salaries: SalaryRecord[];
  employees: Employee[];
  currencySymbol: string;
  selectedMonth: string;
  tenant?: Tenant;
}

export const EpfEtfReportTab: React.FC<EpfEtfReportTabProps> = ({
  salaries,
  employees,
  currencySymbol,
  selectedMonth,
  tenant,
}) => {
  const monthSalaries = salaries.filter((s) => s.month === selectedMonth);

  // Group EPF data
  const epfRows = monthSalaries.map((s) => {
    const emp = employees.find((e) => e.id === s.employee_id);
    const basicEarnings = s.base_salary || s.basic_salary || 0;
    const epfEmp = s.epf_employee || (emp?.epf_etf_applicable ? Math.round(basicEarnings * 0.08) : 0);
    const epfComp = s.epf_employer || (emp?.epf_etf_applicable ? Math.round(basicEarnings * 0.12) : 0);
    const etfComp = s.etf_employer || (emp?.epf_etf_applicable ? Math.round(basicEarnings * 0.03) : 0);
    const totalRemittance = epfEmp + epfComp + etfComp;

    return {
      id: s.id,
      employeeName: s.employee_name,
      epfNo: emp?.epf_no || s.employee_id.slice(-5),
      nic: emp?.nic || 'N/A',
      designation: s.designation || emp?.designation || 'Staff',
      basicEarnings,
      epfEmp,
      epfComp,
      etfComp,
      totalRemittance,
    };
  });

  const totalBasic = epfRows.reduce((sum, r) => sum + r.basicEarnings, 0);
  const totalEpfEmp = epfRows.reduce((sum, r) => sum + r.epfEmp, 0);
  const totalEpfComp = epfRows.reduce((sum, r) => sum + r.epfComp, 0);
  const totalEtfComp = epfRows.reduce((sum, r) => sum + r.etfComp, 0);
  const grandTotalStatutory = epfRows.reduce((sum, r) => sum + r.totalRemittance, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const headers = [
      'Member No',
      'NIC',
      'Employee Name',
      'Designation',
      'Qualifying Wages',
      'Employee EPF 8%',
      'Employer EPF 12%',
      'Employer ETF 3%',
      'Total Remittance',
    ];

    const rows = epfRows.map((r) => [
      `"${r.epfNo}"`,
      `"${r.nic}"`,
      `"${r.employeeName}"`,
      `"${r.designation}"`,
      r.basicEarnings,
      r.epfEmp,
      r.epfComp,
      r.etfComp,
      r.totalRemittance,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `EPF_ETF_Return_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-900">
              Statutory Contributions Schedule (EPF / ETF)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Form C Monthly Contribution Schedule for Central Bank / Department of Labour ({selectedMonth})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Schedule</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Form C CSV</span>
          </button>
        </div>
      </div>

      {/* Statutory 4-Way Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Qualifying Basic Wages
          </span>
          <div className="text-xl font-black text-slate-900 font-mono">
            {currencySymbol} {totalBasic.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">{epfRows.length} eligible staff</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-rose-200 bg-rose-50/20 shadow-xs">
          <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block mb-1">
            Employee EPF (8%)
          </span>
          <div className="text-xl font-black text-rose-700 font-mono">
            {currencySymbol} {totalEpfEmp.toLocaleString()}
          </div>
          <p className="text-[11px] text-rose-600 mt-0.5">Deducted from salary</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-indigo-200 bg-indigo-50/20 shadow-xs">
          <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block mb-1">
            Employer EPF (12%)
          </span>
          <div className="text-xl font-black text-indigo-800 font-mono">
            {currencySymbol} {totalEpfComp.toLocaleString()}
          </div>
          <p className="text-[11px] text-indigo-600 mt-0.5">Company contribution</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-teal-200 bg-teal-50/20 shadow-xs">
          <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block mb-1">
            Employer ETF (3%)
          </span>
          <div className="text-xl font-black text-teal-800 font-mono">
            {currencySymbol} {totalEtfComp.toLocaleString()}
          </div>
          <p className="text-[11px] text-teal-600 mt-0.5">Trust Fund share</p>
        </div>
      </div>

      {/* Grand Remittance Highlight Box */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-950 text-white p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">
            TOTAL STATUTORY REMITTANCE (23%)
          </span>
          <h4 className="text-lg font-bold text-white mt-0.5">
            Department of Labour &amp; Central Bank of Sri Lanka
          </h4>
          <p className="text-xs text-slate-300">
            Employer EPF (12%) + Employee EPF (8%) + ETF (3%)
          </p>
        </div>

        <div className="text-right">
          <div className="text-3xl font-black font-mono text-teal-300">
            {currencySymbol} {grandTotalStatutory.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400">Due before 30th of next month</span>
        </div>
      </div>

      {/* Member Schedule Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200 tracking-wider">
              <tr>
                <th className="py-3 px-4">Member No</th>
                <th className="py-3 px-4">Employee &amp; NIC</th>
                <th className="py-3 px-4">Designation</th>
                <th className="py-3 px-4 text-right">Qualifying Pay</th>
                <th className="py-3 px-4 text-right">Emp EPF (8%)</th>
                <th className="py-3 px-4 text-right">Co EPF (12%)</th>
                <th className="py-3 px-4 text-right">Co ETF (3%)</th>
                <th className="py-3 px-4 text-right font-black text-slate-900">Total Remittance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {epfRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No payroll data for {selectedMonth}.
                  </td>
                </tr>
              ) : (
                epfRows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{r.epfNo}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{r.employeeName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">NIC: {r.nic}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{r.designation}</td>
                    <td className="py-3 px-4 text-right font-mono font-semibold">
                      {currencySymbol} {r.basicEarnings.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-rose-600">
                      {currencySymbol} {r.epfEmp.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-indigo-700">
                      {currencySymbol} {r.epfComp.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-teal-700">
                      {currencySymbol} {r.etfComp.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                      {currencySymbol} {r.totalRemittance.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {epfRows.length > 0 && (
              <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-200">
                <tr>
                  <td colSpan={3} className="py-3 px-4 text-slate-900 uppercase text-xs">
                    Grand Totals:
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-900">
                    {currencySymbol} {totalBasic.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-rose-600">
                    {currencySymbol} {totalEpfEmp.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-indigo-700">
                    {currencySymbol} {totalEpfComp.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-teal-700">
                    {currencySymbol} {totalEtfComp.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-900 text-sm font-black">
                    {currencySymbol} {grandTotalStatutory.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
