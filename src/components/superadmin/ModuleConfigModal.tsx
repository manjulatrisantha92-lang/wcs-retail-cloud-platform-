import React, { useState } from 'react';
import { Tenant, TenantSettings } from '../../types';
import { useRetail } from '../../context/RetailContext';
import { Sliders, X, Check, Box, Wrench, UtensilsCrossed, Pill, Warehouse, Barcode, DollarSign, Calendar } from 'lucide-react';

interface ModuleConfigModalProps {
  tenant: Tenant;
  settings: TenantSettings;
  isOpen: boolean;
  onClose: () => void;
}

export const ModuleConfigModal: React.FC<ModuleConfigModalProps> = ({
  tenant,
  settings,
  isOpen,
  onClose,
}) => {
  const { updateTenantModules } = useRetail();

  const defaultModules: TenantSettings['enabled_modules'] = {
    grocery_weight: true,
    vehicle_parts: false,
    restaurant_kot: false,
    pharmacy_batch: false,
    wholesale_credit: true,
    barcode_studio: true,
    staff_salaries: true,
    expense_tracker: true,
    expiry_manager: true,
  };

  const [modules, setModules] = useState<TenantSettings['enabled_modules']>({
    ...defaultModules,
    ...(settings?.enabled_modules || {}),
  });

  if (!isOpen) return null;

  const toggleModule = (key: keyof TenantSettings['enabled_modules']) => {
    setModules((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateTenantModules(tenant.tenant_id, modules);
    onClose();
  };

  const moduleItems: {
    key: keyof TenantSettings['enabled_modules'];
    label: string;
    description: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      key: 'repair_job_sheet',
      label: 'Device Repair Jobs & Service Tickets',
      description: 'Customer device intake, intake receipts, security lock PINs, technician notes & delivery workflow',
      icon: <Wrench className="w-5 h-5 text-amber-400" />,
      color: 'border-amber-500/40 bg-amber-950/20',
    },
    {
      key: 'phone_imei_warranty',
      label: 'Phone IMEI & Warranty Tracking',
      description: 'IMEI 15-digit barcode scanning, storage variants (128GB/256GB), color options & TRCSL approval',
      icon: <Barcode className="w-5 h-5 text-blue-400" />,
      color: 'border-blue-500/40 bg-blue-950/20',
    } as any,
    {
      key: 'computer_specs',
      label: 'Computer & Hardware Specs',
      description: 'CPU processor specs, RAM DDR4/DDR5 capacity, NVMe SSD storage, and component warranty terms',
      icon: <Box className="w-5 h-5 text-cyan-400" />,
      color: 'border-cyan-500/40 bg-cyan-950/20',
    } as any,
    {
      key: 'grocery_weight',
      label: 'Grocery & Weighing Scales',
      description: 'Support KG, grams, decimal weights, and digital scale reading directly on POS',
      icon: <Box className="w-5 h-5 text-emerald-400" />,
      color: 'border-emerald-500/40 bg-emerald-950/20',
    },
    {
      key: 'vehicle_parts',
      label: 'Motor Spare Parts & Compatibility',
      description: 'Vehicle brand, model compatibility search, part numbers, and OEM references',
      icon: <Wrench className="w-5 h-5 text-orange-400" />,
      color: 'border-orange-500/40 bg-orange-950/20',
    },
    {
      key: 'restaurant_kot',
      label: 'Restaurant & Hotel KOT, Table & Room Management',
      description: 'Kitchen Order Ticket (KOT) printing, dine-in tables, hotel room service, takeaway parcel tokens & delivery orders',
      icon: <UtensilsCrossed className="w-5 h-5 text-amber-400" />,
      color: 'border-amber-500/40 bg-amber-950/20',
    },
    {
      key: 'pharmacy_batch',
      label: 'Pharmacy Batch & Expiry Tracker',
      description: 'Drug batch numbers, NMRA/CDDA registration, expiry warnings, and schedule types',
      icon: <Pill className="w-5 h-5 text-sky-400" />,
      color: 'border-sky-500/40 bg-sky-950/20',
    },
    {
      key: 'wholesale_credit',
      label: 'Wholesale Bulk & Customer Credit Ledger',
      description: 'Tiered wholesale bulk pricing, customer credit limits, and credit repayment books',
      icon: <Warehouse className="w-5 h-5 text-indigo-400" />,
      color: 'border-indigo-500/40 bg-indigo-950/20',
    },
    {
      key: 'barcode_studio',
      label: 'Barcode Generator & Label Studio',
      description: '1-Column custom barcode stickers (20x10mm to 50x30mm) with ESC/POS print support',
      icon: <Barcode className="w-5 h-5 text-purple-400" />,
      color: 'border-purple-500/40 bg-purple-950/20',
    },
    {
      key: 'expiry_manager',
      label: 'Approaching Expiry Quarantine',
      description: 'Automated 30/60/90 days stock expiration monitors and loss prevention alerts',
      icon: <Calendar className="w-5 h-5 text-rose-400" />,
      color: 'border-rose-500/40 bg-rose-950/20',
    },
    {
      key: 'staff_salaries',
      label: 'Staff Payroll & Salary Advances',
      description: 'Employee monthly salary slips, advance requests, deductions, and payout history',
      icon: <DollarSign className="w-5 h-5 text-teal-400" />,
      color: 'border-teal-500/40 bg-teal-950/20',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Tenant Module Configuration</h2>
              <p className="text-xs text-slate-400">
                {tenant.shop_name} ({tenant.tenant_id})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <p className="text-xs text-slate-400">
            Enable or disable specialized retail modules for this shop. Changes take effect immediately on the shop dashboard and POS terminal.
          </p>

          <div className="space-y-2.5 max-h-[55vh] overflow-y-auto pr-1">
            {moduleItems.map((mod) => {
              const isEnabled = modules[mod.key];
              return (
                <div
                  key={mod.key}
                  onClick={() => toggleModule(mod.key)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    isEnabled
                      ? `${mod.color} border-indigo-500/50 shadow-sm`
                      : 'border-slate-800 bg-slate-950/30 opacity-60 hover:opacity-90'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0 mt-0.5">
                      {mod.icon}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">{mod.label}</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">{mod.description}</p>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors shrink-0 ml-3 ${
                      isEnabled
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'border-slate-700 bg-slate-950 text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md transition-all text-xs"
            >
              Save Module Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
