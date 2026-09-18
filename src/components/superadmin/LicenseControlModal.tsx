import React, { useState } from 'react';
import { Tenant, TenantLicense, LicenseStatus } from '../../types';
import { useRetail } from '../../context/RetailContext';
import { ShieldCheck, X, Award, FileText, Send, Printer, Laptop, Lock } from 'lucide-react';
import { LicenseCertificateModal } from './LicenseCertificateModal';

interface LicenseControlModalProps {
  tenant: Tenant;
  license: TenantLicense;
  isOpen: boolean;
  onClose: () => void;
}

export const LicenseControlModal: React.FC<LicenseControlModalProps> = ({
  tenant,
  license,
  isOpen,
  onClose,
}) => {
  const { setLicenseStatus, updateTenantLicense, broadcastRiskAlert, executeShopLockdown, updateLicenseMaxTerminals } = useRetail();

  const [status, setStatus] = useState<LicenseStatus>(license.status);
  const [warningMessage, setWarningMessage] = useState(license.warning_message || '');
  const [suspendReason, setSuspendReason] = useState(license.suspend_reason || '');
  const [validUntil, setValidUntil] = useState(license.valid_until.slice(0, 10));
  const [packageTier, setPackageTier] = useState(license.package_tier);
  const [maxTerminals, setMaxTerminals] = useState<number>(license.max_terminals || 5);
  const [lockTerminalsNow, setLockTerminalsNow] = useState<boolean>(true);
  const [sendAlert, setSendAlert] = useState(false);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    setLicenseStatus(tenant.tenant_id, status, warningMessage, suspendReason);
    updateTenantLicense(tenant.tenant_id, {
      valid_until: new Date(validUntil).toISOString(),
      package_tier: packageTier,
      max_branches: packageTier === 'ENTERPRISE' ? 10 : packageTier === 'PROFESSIONAL' ? 3 : 1,
      max_users: packageTier === 'ENTERPRISE' ? 25 : packageTier === 'PROFESSIONAL' ? 8 : 3,
      max_terminals: maxTerminals,
    });
    if (updateLicenseMaxTerminals) {
      updateLicenseMaxTerminals(tenant.tenant_id, maxTerminals);
    }

    // Remote PC screen lockdown synchronization
    if (status === 'TEMPORARY_SUSPENDED' || status === 'SUSPENDED' || status === 'DEACTIVATED') {
      if (lockTerminalsNow && executeShopLockdown) {
        await executeShopLockdown(
          tenant.tenant_id,
          'LOCK_ALL',
          suspendReason || `Software license suspended (${status}). Terminal access restricted by Super Admin.`
        );
      }
    } else if (status === 'ACTIVE' && license.status !== 'ACTIVE') {
      // If returning to ACTIVE, release screen locks on remote PCs
      if (executeShopLockdown) {
        await executeShopLockdown(tenant.tenant_id, 'UNLOCK_ALL', 'License reactivated. Terminals restored.');
      }
    }

    if (sendAlert && warningMessage) {
      broadcastRiskAlert(tenant.tenant_id, {
        severity: status === 'DEACTIVATED' ? 'CRITICAL' : status === 'WARNING' ? 'WARNING' : 'INFO',
        title: `License Action: ${status}`,
        message: warningMessage,
        action_required: 'Please contact WCS Platform Support to resolve your account status.',
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">License & Security Control</h2>
              <p className="text-xs text-slate-400">
                {tenant.shop_name} ({tenant.tenant_id})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 space-y-5 text-xs">
          {/* License Key & Health + Certificate Trigger Banner */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-mono">Assigned License Key:</span>
                <span className="font-mono text-xs font-semibold text-emerald-400">{license.license_key}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block uppercase">Offline Grace:</span>
                <span className="font-semibold text-slate-200">{license.offline_grace_hours_remaining} Hours remaining</span>
              </div>
            </div>

            {/* Official Software License Certificate Trigger */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Award className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-[11px] font-semibold">Official Sri Lanka Software License Certificate</span>
              </div>
              <button
                type="button"
                onClick={() => setIsCertificateOpen(true)}
                className="px-2.5 py-1.5 bg-gradient-to-r from-amber-500/20 to-amber-600/30 hover:from-amber-500/30 hover:to-amber-600/40 text-amber-300 hover:text-amber-200 rounded-lg border border-amber-500/40 font-bold flex items-center gap-1.5 transition-all text-[11px] cursor-pointer shadow-xs active:scale-95"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View / Print Certificate</span>
              </button>
            </div>
          </div>

          {/* Status Selector */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5 uppercase text-[11px] tracking-wider">
              Remote License Status:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'ACTIVE', label: 'Active (Normal)', color: 'border-emerald-500/60 bg-emerald-950/40 text-emerald-300' },
                { id: 'WARNING', label: 'Warning Notice', color: 'border-amber-500/60 bg-amber-950/40 text-amber-300' },
                { id: 'TEMPORARY_SUSPENDED', label: 'Temp Lock POS', color: 'border-orange-500/60 bg-orange-950/40 text-orange-300' },
                { id: 'SUSPENDED', label: 'Suspended', color: 'border-rose-500/60 bg-rose-950/40 text-rose-300' },
                { id: 'DEACTIVATED', label: 'Deactivated (Lockout)', color: 'border-red-600 bg-red-950/70 text-red-300' },
                { id: 'EXPIRED', label: 'Expired', color: 'border-slate-600 bg-slate-800 text-slate-300' },
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setStatus(item.id as LicenseStatus)}
                  className={`p-2.5 rounded-xl border text-left font-medium transition-all cursor-pointer ${
                    status === item.id
                      ? `${item.color} ring-2 ring-indigo-500/80 font-bold shadow-sm`
                      : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs">{item.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Warning Message (if Warning or Deactivated) */}
          {(status === 'WARNING' || status === 'DEACTIVATED' || status === 'TEMPORARY_SUSPENDED') && (
            <div className="space-y-1.5 animate-in fade-in duration-150">
              <label className="block text-slate-300 font-semibold text-[11px] uppercase">
                Remote Warning / Reason Message (Displayed on POS Screen):
              </label>
              <textarea
                value={warningMessage}
                onChange={(e) => setWarningMessage(e.target.value)}
                placeholder="e.g. Please contact WCS Software Support regarding your annual subscription renewal..."
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Suspend Reason */}
          {status === 'TEMPORARY_SUSPENDED' && (
            <div className="space-y-1.5">
              <label className="block text-slate-300 font-semibold text-[11px] uppercase">
                Suspension Reason:
              </label>
              <input
                type="text"
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="e.g. Subscription payment overdue"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          )}

          {/* Package Tier & Expiry Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1 text-[11px] uppercase">
                Package Tier:
              </label>
              <select
                value={packageTier}
                onChange={(e) => setPackageTier(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500"
              >
                <option value="STARTER">STARTER (1 Branch / 3 Users)</option>
                <option value="PROFESSIONAL">PROFESSIONAL (3 Branches / 8 Users)</option>
                <option value="ENTERPRISE">ENTERPRISE (10 Branches / 25 Users)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1 text-[11px] uppercase">
                Valid Until (Expiry Date):
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Maximum Allowed Simultaneous Terminals / PCs */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-semibold text-[11px] uppercase flex items-center gap-1.5">
                <Laptop className="w-3.5 h-3.5 text-cyan-400" />
                <span>Allowed Remote PC / Counter Terminals:</span>
              </label>
              <span className="text-[10px] text-cyan-300 font-mono">
                {maxTerminals === 999 ? 'Unlimited' : `${maxTerminals} Simultaneous PCs`}
              </span>
            </div>
            <select
              value={maxTerminals}
              onChange={(e) => setMaxTerminals(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500"
            >
              <option value={1}>1 Terminal (Single Counter Station)</option>
              <option value={2}>2 Terminals (Dual Counter Stations)</option>
              <option value={3}>3 Terminals (3 Counter Terminals)</option>
              <option value={5}>5 Terminals (Medium Retail Store)</option>
              <option value={10}>10 Terminals (Large Supermarket)</option>
              <option value={999}>Unlimited Terminals (Enterprise License)</option>
            </select>
          </div>

          {/* Remote PC Screen Freeze on Suspension */}
          {(status === 'TEMPORARY_SUSPENDED' || status === 'SUSPENDED' || status === 'DEACTIVATED') && (
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-950/40 border border-rose-600/40 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={lockTerminalsNow}
                onChange={(e) => setLockTerminalsNow(e.target.checked)}
                className="rounded border-rose-500 text-rose-600 focus:ring-rose-500 bg-slate-950 w-4 h-4 mt-0.5 cursor-pointer shrink-0"
              />
              <div className="text-xs">
                <span className="font-bold text-rose-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-rose-400" />
                  <span>Freeze connected computer screens immediately</span>
                </span>
                <p className="text-[11px] text-rose-200/80 mt-0.5">
                  Remotely locks down billing on all other computers running this shop via real-time SSE signal.
                </p>
              </div>
            </label>
          )}

          {/* Push real-time alert checkbox */}
          <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={sendAlert}
              onChange={(e) => setSendAlert(e.target.checked)}
              className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-950 w-4 h-4 cursor-pointer"
            />
            <span className="text-slate-300">Broadcast immediate Risk Notification to shop dashboard</span>
          </label>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCertificateOpen(true)}
              className="px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-amber-300 hover:text-amber-200 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-amber-500/30"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>Certificate</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md hover:shadow-indigo-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                Apply License Changes
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Official License Certificate Modal */}
      {isCertificateOpen && (
        <LicenseCertificateModal
          isOpen={isCertificateOpen}
          onClose={() => setIsCertificateOpen(false)}
          tenant={tenant}
          license={license}
        />
      )}
    </div>
  );
};
