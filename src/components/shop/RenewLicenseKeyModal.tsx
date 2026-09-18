import React, { useState } from 'react';
import { useRetail } from '../../context/RetailContext';
import {
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  X,
  Calendar,
  ShieldCheck,
  Building2,
  Sparkles,
  Clock,
  ExternalLink,
  Copy,
  Check,
  HelpCircle,
} from 'lucide-react';

interface RenewLicenseKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RenewLicenseKeyModal: React.FC<RenewLicenseKeyModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    currentTenant,
    currentTenantId,
    currentLicense,
    renewShopWithKey,
  } = useRetail();

  const [renewalKey, setRenewalKey] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  if (!isOpen || !currentTenant) return null;

  // Calculate days remaining
  const validUntilDate = currentLicense?.valid_until ? new Date(currentLicense.valid_until) : null;
  const now = new Date();
  const daysRemaining = validUntilDate
    ? Math.ceil((validUntilDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const isExpired = daysRemaining <= 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = renewalKey.trim();

    if (!cleanKey) {
      setErrorMsg('Please enter a valid license renewal key.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const result = renewShopWithKey(currentTenantId, cleanKey);
      setIsSubmitting(false);

      if (result.success) {
        setSuccessMsg(result.message);
        setRenewalKey('');
        setTimeout(() => {
          // Keep success message visible briefly before closing
          setTimeout(() => {
            onClose();
          }, 1500);
        }, 300);
      } else {
        setErrorMsg(result.message);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err?.message || 'Failed to renew license key. Please verify key format.');
    }
  };

  const handleCopyCurrentKey = () => {
    if (!currentLicense?.license_key) return;
    navigator.clipboard.writeText(currentLicense.license_key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 text-slate-900 shadow-2xl border border-slate-200 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-2xl text-indigo-600">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Renew Store License Key</span>
                <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                  {currentTenant.tenant_id}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Extend subscription validity for {currentTenant.shop_name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current License Overview */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-semibold">Current Subscription Status:</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                isExpired
                  ? 'bg-rose-100 text-rose-700 border border-rose-200'
                  : currentLicense?.status === 'ACTIVE'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}
            >
              {isExpired ? 'EXPIRED' : currentLicense?.status || 'ACTIVE'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-white rounded-xl border border-slate-200">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Package Tier</div>
              <div className="font-bold text-slate-800 mt-0.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>{currentLicense?.package_tier || 'PROFESSIONAL'}</span>
              </div>
            </div>

            <div className="p-2.5 bg-white rounded-xl border border-slate-200">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Valid Until</div>
              <div className="font-bold text-slate-800 mt-0.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                <span>
                  {validUntilDate
                    ? validUntilDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Lifetime'}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {isExpired ? (
                  <span className="text-rose-600 font-semibold">Expired {Math.abs(daysRemaining)} days ago</span>
                ) : (
                  <span className="text-emerald-700 font-semibold">{daysRemaining} days remaining</span>
                )}
              </div>
            </div>
          </div>

          {currentLicense?.license_key && (
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
              <div className="text-slate-500">
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">Active Key:</span>
                <span className="font-mono text-[11px] font-bold text-slate-700">
                  {currentLicense.license_key}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyCurrentKey}
                className="p-1.5 hover:bg-slate-200 text-slate-500 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                title="Copy current key"
              >
                {copiedKey ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600 font-semibold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Feedback alerts */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-bold">Key Activation Failed</div>
              <div className="text-rose-700">{errorMsg}</div>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-start gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-bold">Subscription Successfully Renewed!</div>
              <div className="text-emerald-700">{successMsg}</div>
            </div>
          </div>
        )}

        {/* Form to enter renewal key */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-700 text-xs font-bold mb-1.5">
              Enter New License Renewal Key:
            </label>
            <div className="relative">
              <input
                type="text"
                value={renewalKey}
                onChange={(e) => {
                  setRenewalKey(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="e.g. WCS-PRO-01M-AB12-2026 or WCS-PRO-12M-CD34-2026"
                className="w-full bg-slate-50 border border-slate-300 focus:border-indigo-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono uppercase tracking-wider transition-colors outline-hidden pr-10"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            </div>
            <div className="mt-2 text-[11px] text-slate-500 flex items-start gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>
                Supported renewal terms: <strong>01 Month (-01M-)</strong>, <strong>03 Months (-03M-)</strong>, <strong>06 Months (-06M-)</strong>, or <strong>12 Months (-12M-)</strong> issued by Super Admin Headquarters.
              </span>
            </div>
          </div>

          <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between text-[11px]">
            <span className="text-indigo-900 font-semibold">Need a renewal key?</span>
            <span className="text-indigo-700">Contact WCS Super Admin / Head Office</span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !renewalKey.trim()}
              className={`px-5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-2 transition-all cursor-pointer shadow-md ${
                !renewalKey.trim() || isSubmitting
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Verifying...' : 'Validate & Apply Key'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
