import React, { useState } from 'react';
import { Employee, SalaryRecord } from '../../../types';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Search,
  Building,
  Phone,
  CreditCard,
  CheckCircle2,
  XCircle,
  History,
} from 'lucide-react';

interface EmployeeProfilesTabProps {
  employees: Employee[];
  salaries: SalaryRecord[];
  currencySymbol: string;
  onAddEmployee: () => void;
  onEditEmployee: (employee: Employee) => void;
  onDeleteEmployee: (id: string) => void;
}

export const EmployeeProfilesTab: React.FC<EmployeeProfilesTabProps> = ({
  employees,
  salaries,
  currencySymbol,
  onAddEmployee,
  onEditEmployee,
  onDeleteEmployee,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [selectedEmpHistory, setSelectedEmpHistory] = useState<Employee | null>(null);

  const departments = Array.from(
    new Set(employees.map((e) => e.department || 'Store Operations'))
  );

  const filteredEmployees = employees.filter((emp) => {
    const q = searchQuery.toLowerCase();
    const matchQ =
      emp.name.toLowerCase().includes(q) ||
      emp.designation.toLowerCase().includes(q) ||
      emp.phone.toLowerCase().includes(q) ||
      (emp.nic && emp.nic.toLowerCase().includes(q));
    const matchDept =
      departmentFilter === 'ALL' ||
      (emp.department || 'Store Operations') === departmentFilter;
    return matchQ && matchDept;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, role, NIC, phone..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:border-teal-500"
            />
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold text-slate-500">Dept:</span>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={onAddEmployee}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Employee</span>
        </button>
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
            <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-xs">No employees found matching criteria.</p>
          </div>
        ) : (
          filteredEmployees.map((emp) => {
            const empSalaries = salaries.filter((s) => s.employee_id === emp.id);
            const totalPaidToEmp = empSalaries.reduce((sum, s) => sum + (s.net_salary || 0), 0);

            return (
              <div
                key={emp.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-teal-300 transition-all space-y-4"
              >
                {/* Employee Top Details */}
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{emp.name}</span>
                      {emp.is_active ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full">
                          INACTIVE
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-teal-700 font-semibold">{emp.designation}</p>
                      {emp.is_shop_associate && (
                        <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 border border-purple-200 font-bold rounded-md text-[9px]">
                          ★ Associate ({emp.commission_percentage || 0}% Comm.)
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">{emp.department || 'Store Operations'}</p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditEmployee(emp)}
                      title="Edit Profile"
                      className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete employee ${emp.name}?`)) {
                          onDeleteEmployee(emp.id);
                        }
                      }}
                      title="Delete Profile"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Salary Package Breakdown Box */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Base Basic Pay:</span>
                    <strong className="font-mono text-slate-900">
                      {currencySymbol} {(emp.base_salary || 0).toLocaleString()}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Fixed Allowance:</span>
                    <strong className="font-mono text-emerald-700">
                      +{currencySymbol} {(emp.allowance || 0).toLocaleString()}
                    </strong>
                  </div>
                  {(emp.travel_allowance || emp.food_allowance) ? (
                    <div className="flex justify-between items-center text-slate-600 text-[11px]">
                      <span>Travel + Meals:</span>
                      <strong className="font-mono">
                        +{currencySymbol} {((emp.travel_allowance || 0) + (emp.food_allowance || 0)).toLocaleString()}
                      </strong>
                    </div>
                  ) : null}
                  <div className="border-t border-slate-200 pt-1 flex justify-between items-center font-bold text-slate-900">
                    <span>Est. Monthly Gross:</span>
                    <span className="font-mono text-teal-800">
                      {currencySymbol}{' '}
                      {(
                        (emp.base_salary || 0) +
                        (emp.allowance || 0) +
                        (emp.travel_allowance || 0) +
                        (emp.food_allowance || 0)
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Contact & Banking Meta */}
                <div className="text-[11px] text-slate-600 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{emp.phone || 'No phone recorded'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono font-medium">
                      {emp.bank_name ? `${emp.bank_name} - ${emp.account_no || 'Acc N/A'}` : 'Cash Disbursement'}
                    </span>
                  </div>
                </div>

                {/* Footer History Button */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">
                    {empSalaries.length} past payslips
                  </span>
                  <button
                    onClick={() => setSelectedEmpHistory(emp)}
                    className="text-teal-700 hover:text-teal-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Payment History</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Past History Modal */}
      {selectedEmpHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full text-slate-900 p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Salary History: {selectedEmpHistory.name}
                </h3>
                <p className="text-xs text-slate-500">{selectedEmpHistory.designation}</p>
              </div>
              <button
                onClick={() => setSelectedEmpHistory(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2">
              {salaries.filter((s) => s.employee_id === selectedEmpHistory.id).length === 0 ? (
                <p className="text-center py-6 text-slate-400 text-xs">
                  No salary records found for this employee.
                </p>
              ) : (
                salaries
                  .filter((s) => s.employee_id === selectedEmpHistory.id)
                  .map((sal) => (
                    <div
                      key={sal.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{sal.month}</div>
                        <div className="text-[10px] text-slate-500">
                          Slip: {sal.slip_no || sal.id} • Via {sal.payment_method}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold font-mono text-slate-900">
                          {currencySymbol} {sal.net_salary.toLocaleString()}
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[9px]">
                          PAID
                        </span>
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedEmpHistory(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
