import React, { useState } from 'react';
import { Employee } from '../../../types';
import { X, UserPlus, Building, DollarSign, CreditCard, Percent, Sparkles, Award } from 'lucide-react';

interface EmployeeModalProps {
  employee?: Employee | null;
  currencySymbol: string;
  onClose: () => void;
  onSave: (employeeData: Omit<Employee, 'id' | 'tenant_id'>) => void;
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  employee,
  currencySymbol,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(employee?.name || '');
  const [designation, setDesignation] = useState(employee?.designation || 'Sales Cashier');
  const [department, setDepartment] = useState(employee?.department || 'Store Operations');
  const [phone, setPhone] = useState(employee?.phone || '');
  const [email, setEmail] = useState(employee?.email || '');
  const [nic, setNic] = useState(employee?.nic || '');
  const [address, setAddress] = useState(employee?.address || '');
  const [joinDate, setJoinDate] = useState(employee?.join_date || new Date().toISOString().slice(0, 10));
  
  const [baseSalary, setBaseSalary] = useState(employee?.base_salary || 50000);
  const [allowance, setAllowance] = useState(employee?.allowance || 5000);
  const [travelAllowance, setTravelAllowance] = useState(employee?.travel_allowance || 0);
  const [foodAllowance, setFoodAllowance] = useState(employee?.food_allowance || 0);
  const [attendanceAllowance, setAttendanceAllowance] = useState(employee?.attendance_allowance || 0);
  const [otHourlyRate, setOtHourlyRate] = useState(employee?.ot_hourly_rate || 350);

  // Shop Associate & Sales Commission
  const [isShopAssociate, setIsShopAssociate] = useState(
    employee?.is_shop_associate !== undefined
      ? employee.is_shop_associate
      : (employee?.commission_percentage ? employee.commission_percentage > 0 : false)
  );
  const [associateCode, setAssociateCode] = useState(employee?.associate_code || '');
  const [commissionPercentage, setCommissionPercentage] = useState(employee?.commission_percentage ?? 3.5);
  
  const [epfEtfApplicable, setEpfEtfApplicable] = useState(employee?.epf_etf_applicable !== false);
  const [epfNo, setEpfNo] = useState(employee?.epf_no || '');
  
  const [bankName, setBankName] = useState(employee?.bank_name || 'Commercial Bank of Ceylon');
  const [accountNo, setAccountNo] = useState(employee?.account_no || '');
  const [branchName, setBranchName] = useState(employee?.branch_name || 'Colombo Super Branch');
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'CHEQUE'>(
    employee?.default_payment_method || 'BANK_TRANSFER'
  );
  const [isActive, setIsActive] = useState(employee?.is_active !== false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      designation: designation.trim(),
      department: department.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      nic: nic.trim(),
      address: address.trim() || undefined,
      join_date: joinDate,
      base_salary: Number(baseSalary),
      allowance: Number(allowance),
      travel_allowance: Number(travelAllowance),
      food_allowance: Number(foodAllowance),
      attendance_allowance: Number(attendanceAllowance),
      ot_hourly_rate: Number(otHourlyRate),
      is_shop_associate: isShopAssociate,
      associate_code: isShopAssociate ? associateCode.trim().toUpperCase() : undefined,
      commission_percentage: isShopAssociate ? Number(commissionPercentage) : 0,
      epf_etf_applicable: epfEtfApplicable,
      epf_no: epfNo.trim() || undefined,
      bank_name: bankName.trim() || undefined,
      account_no: accountNo.trim() || undefined,
      branch_name: branchName.trim() || undefined,
      default_payment_method: defaultPaymentMethod,
      is_active: isActive,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full text-slate-900 shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-teal-400" />
            <h3 className="font-bold text-sm">
              {employee ? 'Edit Staff & Salary Profile' : 'Add New Staff Employee'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Personal Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Full Employee Name: *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Kasun Rathnayake"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Job Designation / Role: *</label>
              <input
                type="text"
                required
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. Senior Cashier / Inventory Officer"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-600 font-medium mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
              >
                <option value="Store Operations">Store Operations</option>
                <option value="Sales & Showroom">Sales &amp; Showroom</option>
                <option value="POS & Cashiering">POS &amp; Cashiering</option>
                <option value="Inventory & Warehouse">Inventory &amp; Warehouse</option>
                <option value="Technical & Repairs">Technical &amp; Repairs</option>
                <option value="Logistics & Delivery">Logistics &amp; Delivery</option>
                <option value="Administration">Administration</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+94 77 123 4567"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">NIC Number</label>
              <input
                type="text"
                value={nic}
                onChange={(e) => setNic(e.target.value)}
                placeholder="912830129V / 199128300129"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono"
              />
            </div>
          </div>

          {/* Shop Associate & Sales Commission Panel */}
          <div className="bg-purple-50/80 p-4 rounded-xl border border-purple-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-700" />
                <h4 className="font-bold text-purple-950 text-xs">
                  Shop Associate &amp; Sales Commission Setting
                </h4>
              </div>
              <label className="flex items-center gap-2 font-bold text-purple-900 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={isShopAssociate}
                  onChange={(e) => setIsShopAssociate(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                />
                <span>Enable Shop Associate Status</span>
              </label>
            </div>

            {isShopAssociate ? (
              <div className="bg-white p-3.5 rounded-lg border border-purple-200 space-y-3 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-purple-950 font-bold mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-purple-600" />
                        <span>Associate Code:</span>
                      </span>
                      <span className="text-[10px] text-purple-600 font-normal bg-purple-100 px-1.5 py-0.2 rounded">Optional</span>
                    </label>
                    <input
                      type="text"
                      required={false}
                      value={associateCode}
                      onChange={(e) => setAssociateCode(e.target.value.toUpperCase())}
                      placeholder="e.g. SA-01, SA-02 (Optional)"
                      className="w-full bg-purple-50/50 border border-purple-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-purple-950 uppercase placeholder:normal-case placeholder:font-normal focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                    />
                    <p className="text-[10px] text-purple-600 mt-1">
                      If left blank, employee name will be used directly during POS checkout.
                    </p>
                  </div>

                  <div>
                    <label className="block text-purple-950 font-bold mb-1 flex items-center gap-1">
                      <Percent className="w-3.5 h-3.5 text-purple-600" />
                      <span>Sales Commission Rate (%):</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={commissionPercentage}
                        onChange={(e) => setCommissionPercentage(Number(e.target.value))}
                        placeholder="3.5"
                        className="w-full bg-purple-50/50 border border-purple-300 rounded-lg pl-3 pr-8 py-2 text-xs font-mono font-bold text-purple-950 focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-purple-500">%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 p-2.5 rounded-lg text-[11px] text-purple-900 leading-relaxed border border-purple-100">
                  <p className="font-semibold text-purple-950">💡 POS Associate Commission:</p>
                  <span>
                    When cashiers type or select associate code <strong>[{associateCode || 'CODE'}]</strong> during POS checkout,
                    sales commission of <strong>{commissionPercentage || 0}%</strong> is calculated on each bill and automatically attributed to this employee for payroll.
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-purple-700/80 italic">
                Enable to track sales made by this staff member and calculate sales commission into their monthly payroll report.
              </p>
            )}
          </div>

          {/* Salary & Allowances Grid */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-teal-600" />
              Base Salary &amp; Contract Allowances
            </h4>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Base Monthly Salary ({currencySymbol}): *</label>
                <input
                  type="number"
                  required
                  value={baseSalary}
                  onChange={(e) => setBaseSalary(Number(e.target.value))}
                  className="w-full bg-white border border-teal-400 rounded-lg px-3 py-1.5 text-xs font-mono font-black text-teal-900"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Fixed Allowance ({currencySymbol})</label>
                <input
                  type="number"
                  value={allowance}
                  onChange={(e) => setAllowance(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">OT Rate / Hour ({currencySymbol})</label>
                <input
                  type="number"
                  value={otHourlyRate}
                  onChange={(e) => setOtHourlyRate(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-slate-500 text-[11px] mb-1">Travel Allowance</label>
                <input
                  type="number"
                  value={travelAllowance}
                  onChange={(e) => setTravelAllowance(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-500 text-[11px] mb-1">Food Allowance</label>
                <input
                  type="number"
                  value={foodAllowance}
                  onChange={(e) => setFoodAllowance(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-500 text-[11px] mb-1">Attendance Bonus</label>
                <input
                  type="number"
                  value={attendanceAllowance}
                  onChange={(e) => setAttendanceAllowance(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Bank & Statutory EPF */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                Bank Transfer Details
              </h4>
              <div>
                <label className="block text-slate-500 text-[11px] mb-1">Bank Name</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. Commercial Bank / BOC / Sampath"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium"
                />
              </div>
              <div>
                <label className="block text-slate-500 text-[11px] mb-1">Account Number</label>
                <input
                  type="text"
                  value={accountNo}
                  onChange={(e) => setAccountNo(e.target.value)}
                  placeholder="e.g. 8001928301"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Building className="w-4 h-4 text-teal-600" />
                EPF / ETF Statutory Settings
              </h4>
              <label className="flex items-center gap-2 text-slate-700 font-semibold cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={epfEtfApplicable}
                  onChange={(e) => setEpfEtfApplicable(e.target.checked)}
                  className="rounded text-teal-600"
                />
                <span>Subject to EPF (8%/12%) &amp; ETF (3%)</span>
              </label>
              <div>
                <label className="block text-slate-500 text-[11px] mb-1">EPF Registration / Member Number</label>
                <input
                  type="text"
                  value={epfNo}
                  onChange={(e) => setEpfNo(e.target.value)}
                  placeholder="e.g. EPF-88190"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Status & Actions */}
          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded text-teal-600"
              />
              <span>Active Employee Status</span>
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
              >
                {employee ? 'Update Employee' : 'Save Employee Profile'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
