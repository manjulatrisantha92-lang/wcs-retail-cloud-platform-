import React from 'react';
import { useRetail } from '../../context/RetailContext';
import { AlertTriangle, ShieldAlert, Lock, AlertCircle, PhoneCall, RefreshCw } from 'lucide-react';

export const LicenseRiskBanner: React.FC = () => {
  const { currentLicense, isSuperAdminMode, currentTenant, setLicenseStatus } = useRetail();

  if (isSuperAdminMode || !currentLicense) return null;

  const { status, warning_message, suspend_reason, valid_until } = currentLicense;

  // If Deactivated: Full-screen lockout
  if (status === 'DEACTIVATED') {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center p-6 text-white text-center">
        <div className="max-w-md bg-slate-900 border border-rose-600/40 rounded-2xl p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto text-rose-500">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 bg-rose-500/20 text-rose-400 text-xs font-semibold uppercase tracking-wider rounded-full border border-rose-500/30">
              System Deactivated
            </span>
            <h1 className="text-xl font-bold text-slate-100">
              Software License Suspended
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              The WCS Retail Cloud license for <strong className="text-white">{currentTenant?.shop_name}</strong> has been remotely deactivated by the platform administrator.
            </p>
          </div>

          {suspend_reason && (
            <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl text-left">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Deactivation Reason:</span>
              <p className="text-xs text-rose-300 mt-0.5">{suspend_reason}</p>
            </div>
          )}

          <div className="bg-indigo-950/40 border border-indigo-500/30 p-4 rounded-xl text-xs text-indigo-200 text-left space-y-1.5">
            <p className="font-semibold flex items-center gap-1.5 text-indigo-100">
              <PhoneCall className="w-4 h-4 text-indigo-400" />
              WCS Software Support Hotline:
            </p>
            <p className="text-slate-300">Hotline: +94 11 700 8899 / WhatsApp: +94 77 000 8888</p>
            <p className="text-slate-300">Email: support@wcsretailcloud.com</p>
          </div>

          <p className="text-[11px] text-slate-500">
            All shop data is securely preserved. Please contact WCS billing department to reactivate your instance.
          </p>
        </div>
      </div>
    );
  }

  // If Temporary Suspended
  if (status === 'TEMPORARY_SUSPENDED' || status === 'SUSPENDED') {
    return (
      <div className="bg-gradient-to-r from-amber-600 to-rose-600 text-white px-4 py-2.5 shadow-md flex items-center justify-between text-xs sticky top-0 z-40 border-b border-rose-700">
        <div className="flex items-center gap-2.5 max-w-4xl">
          <ShieldAlert className="w-5 h-5 text-amber-200 shrink-0" />
          <div>
            <strong className="font-bold uppercase tracking-wide">
              Temporary Software Lock Active:
            </strong>{' '}
            <span>{suspend_reason || 'License verification pending. New POS checkout is restricted.'}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden md:inline text-[11px] text-amber-100">
            Contact Support: +94 11 700 8899
          </span>
        </div>
      </div>
    );
  }

  // If Warning
  if (status === 'WARNING') {
    return (
      <div className="bg-amber-500 text-slate-950 px-4 py-2 shadow-xs flex items-center justify-between text-xs sticky top-0 z-40 border-b border-amber-600 font-medium">
        <div className="flex items-center gap-2 max-w-4xl">
          <AlertTriangle className="w-4 h-4 text-slate-950 shrink-0" />
          <div>
            <strong className="font-bold">⚠️ IMPORTANT SYSTEM NOTICE:</strong>{' '}
            <span>
              {warning_message ||
                `Your software license requires attention (Expires on ${new Date(valid_until).toLocaleDateString()}). Please contact WCS Software Support.`}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 text-[11px]">
          <span className="font-bold">WCS Support: +94 77 000 8888</span>
        </div>
      </div>
    );
  }

  // If Expired
  if (status === 'EXPIRED') {
    return (
      <div className="bg-rose-600 text-white px-4 py-2 shadow-xs flex items-center justify-between text-xs sticky top-0 z-40 border-b border-rose-700">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-200" />
          <span>
            <strong>License Expired:</strong> Your software license expired on {new Date(valid_until).toLocaleDateString()}. Please renew immediately.
          </span>
        </div>
        <div className="text-[11px] font-bold">Renew: billing@wcsretailcloud.com</div>
      </div>
    );
  }

  return null;
};
