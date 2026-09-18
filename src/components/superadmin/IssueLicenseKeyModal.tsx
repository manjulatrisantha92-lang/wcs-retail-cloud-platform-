import React, { useState, useEffect } from 'react';
import { useRetail } from '../../context/RetailContext';
import { Tenant } from '../../types';
import {
  KeyRound,
  X,
  Check,
  Copy,
  Calendar,
  Layers,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Store,
  Clock,
  Send,
  MessageSquare,
  Radio,
  Lock,
  Unlock,
  AlertTriangle,
  Award,
} from 'lucide-react';
import { LicenseCertificateModal } from './LicenseCertificateModal';

interface IssueLicenseKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetShopId?: string;
}

export const IssueLicenseKeyModal: React.FC<IssueLicenseKeyModalProps> = ({
  isOpen,
  onClose,
  targetShopId,
}) => {
  const {
    allTenants,
    allLicenses,
    issueValidLicenseKey,
    disableShopOperatingDevices,
    executeShopLockdown,
    currentTenantId,
  } = useRetail();

  const [activeTab, setActiveTab] = useState<'ISSUE_KEY' | 'DISABLE_DEVICE'>('ISSUE_KEY');
  const [selectedTenantId, setSelectedTenantId] = useState<string>(targetShopId || (allTenants[0]?.tenant_id || ''));
  const [durationMonths, setDurationMonths] = useState<1 | 3 | 6 | 12>(12);
  const [packageTier, setPackageTier] = useState<'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'>('PROFESSIONAL');
  const [notes, setNotes] = useState('');
  const [copied, setCopied] = useState(false);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);

  // Disable device state
  const [disableMessage, setDisableMessage] = useState(
    'This system operating device has been disabled by Super Admin Headquarters. Software license validity term ended. POS billing, checkout, and inventory operations are suspended.'
  );
  const [disableReason, setDisableReason] = useState('Software License Term Ended');
  const [isDisabling, setIsDisabling] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Success state after issuing key
  const [issuedResult, setIssuedResult] = useState<{
    key: string;
    validUntil: string;
    durationTag: string;
    shopName: string;
  } | null>(null);

  useEffect(() => {
    if (targetShopId) {
      setSelectedTenantId(targetShopId);
    } else if (allTenants.length > 0 && !selectedTenantId) {
      setSelectedTenantId(allTenants[0].tenant_id);
    }
  }, [targetShopId, allTenants]);

  // Sync tier with shop's existing license if present
  useEffect(() => {
    if (selectedTenantId && allLicenses[selectedTenantId]) {
      setPackageTier(allLicenses[selectedTenantId].package_tier || 'PROFESSIONAL');
    }
  }, [selectedTenantId, allLicenses]);

  if (!isOpen) return null;

  const targetTenant = allTenants.find((t) => t.tenant_id === selectedTenantId);
  const targetLicense = allLicenses[selectedTenantId];

  // Calculate live preview date
  const previewExpiry = new Date();
  previewExpiry.setMonth(previewExpiry.getMonth() + durationMonths);
  const durationTag = durationMonths === 1 ? '01M' : durationMonths === 3 ? '03M' : durationMonths === 6 ? '06M' : '12M';
  const prefix = packageTier === 'ENTERPRISE' ? 'ENT' : packageTier === 'STARTER' ? 'STR' : 'PRO';
  const previewKeyFormat = `WCS-${prefix}-${durationTag}-XXXXX-${new Date().getFullYear()}`;

  const handleIssueKey = () => {
    if (!selectedTenantId) return;

    const res = issueValidLicenseKey(selectedTenantId, durationMonths, packageTier, notes);

    setIssuedResult({
      key: res.newKey,
      validUntil: res.validUntil,
      durationTag: res.durationTag,
      shopName: targetTenant?.shop_name || selectedTenantId,
    });

    setActionSuccessMsg(
      `Valid ${res.durationTag} key successfully issued to "${targetTenant?.shop_name || selectedTenantId}"! Operating devices re-enabled.`
    );
  };

  const handleDisableDevice = async () => {
    if (!selectedTenantId) return;

    setIsDisabling(true);
    await disableShopOperatingDevices(selectedTenantId, disableMessage, disableReason);
    setIsDisabling(false);

    setActionSuccessMsg(
      `System operating device for "${targetTenant?.shop_name || selectedTenantId}" has been disabled. The custom message is now displayed on their screen.`
    );
  };

  const handleCopyVoucher = () => {
    if (!issuedResult) return;
    const voucherText = `--- WCS RETAIL CLOUD PLATFORM LICENSE VOUCHER ---
Shop: ${issuedResult.shopName}
Status: ACTIVE & VERIFIED
License Key: ${issuedResult.key}
Validity Term: ${issuedResult.durationTag} (${durationMonths} Month(s))
Valid Until: ${new Date(issuedResult.validUntil).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
Issued by: Super Admin Headquarters
To activate: Go to your store screen, enter this valid key to re-enable your system operating device.`;

    navigator.clipboard.writeText(voucherText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl text-slate-100 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">Super Admin License Key & Device Control</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800">
                  Headquarters
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Issue valid license keys (01M, 03M, 06M, 12M) and remotely disable or re-enable operating devices
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

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-6 pt-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('ISSUE_KEY');
              setActionSuccessMsg(null);
            }}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'ISSUE_KEY'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Issue Valid Key (01M, 03M, 06M, 12M)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('DISABLE_DEVICE');
              setActionSuccessMsg(null);
            }}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'DISABLE_DEVICE'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-4 h-4 text-rose-400" />
            <span>Disable Operating Device & Show Message</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Target Shop Selector */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1 text-[11px] uppercase tracking-wider">
              Select Target Shop / Customer Store: *
            </label>
            <select
              value={selectedTenantId}
              onChange={(e) => {
                setSelectedTenantId(e.target.value);
                setIssuedResult(null);
                setActionSuccessMsg(null);
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:border-indigo-500"
            >
              {allTenants.map((t) => {
                const lic = allLicenses[t.tenant_id];
                const isExp = lic?.valid_until && new Date(lic.valid_until).getTime() <= Date.now();
                const isSuspended = lic?.status === 'SUSPENDED' || lic?.status === 'DEACTIVATED';
                const statusTag = isSuspended ? 'SUSPENDED / DISABLED' : isExp ? 'EXPIRED' : lic?.status || 'ACTIVE';
                return (
                  <option key={t.tenant_id} value={t.tenant_id}>
                    {t.shop_name} ({t.tenant_id}) — [{statusTag}] — Current Key: {lic?.license_key || 'None'}
                  </option>
                );
              })}
            </select>

            {targetTenant && (
              <div className="mt-2 p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between text-[11px] gap-2">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-indigo-400" />
                  <span className="font-bold text-slate-200">{targetTenant.shop_name}</span>
                  <span className="text-slate-500 font-mono">({targetTenant.tenant_id})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Current Expiry:</span>
                  <span className="font-mono text-slate-200">
                    {targetLicense?.valid_until
                      ? new Date(targetLicense.valid_until).toLocaleDateString()
                      : 'No License'}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      targetLicense?.status === 'ACTIVE'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}
                  >
                    {targetLicense?.status || 'UNLICENSED'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action Success Alert */}
          {actionSuccessMsg && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{actionSuccessMsg}</span>
            </div>
          )}

          {activeTab === 'ISSUE_KEY' && (
            <div className="space-y-5">
              {/* Duration Selector */}
              <div>
                <label className="block text-slate-300 font-semibold mb-2 uppercase text-[11px] tracking-wider">
                  Select License Validity Term to Issue:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { months: 1, tag: '01M', label: '01 Month', desc: '30 Days Term', badge: 'Monthly' },
                    { months: 3, tag: '03M', label: '03 Months', desc: '90 Days Term', badge: 'Quarterly' },
                    { months: 6, tag: '06M', label: '06 Months', desc: '180 Days Term', badge: 'Half-Year' },
                    { months: 12, tag: '12M', label: '12 Months', desc: '365 Days Term', badge: 'Annual' },
                  ].map((dur) => {
                    const isSelected = durationMonths === dur.months;
                    const exp = new Date();
                    exp.setMonth(exp.getMonth() + dur.months);
                    return (
                      <div
                        key={dur.months}
                        onClick={() => {
                          setDurationMonths(dur.months as any);
                          setIssuedResult(null);
                        }}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-950/60 ring-2 ring-indigo-500/40 text-white'
                            : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-slate-100">{dur.label}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                              isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {dur.badge}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">{dur.desc}</div>
                        <div className="text-[9px] text-indigo-300 font-mono mt-1.5">
                          Expires: {exp.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Package Tier */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1 text-[11px] uppercase">
                    Package Tier:
                  </label>
                  <select
                    value={packageTier}
                    onChange={(e) => {
                      setPackageTier(e.target.value as any);
                      setIssuedResult(null);
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-indigo-500"
                  >
                    <option value="STARTER">Starter Tier (1 Branch, 3 Users, Unlimited SKUs)</option>
                    <option value="PROFESSIONAL">Professional Tier (3 Branches, 8 Users, Unlimited SKUs)</option>
                    <option value="ENTERPRISE">Enterprise Cloud (10 Branches, 25 Users, Unlimited SKUs)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1 text-[11px] uppercase">
                    Admin Notes / Invoice Reference:
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Paid via Bank Transfer #INV-2026-081"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="p-4 bg-slate-950 border border-indigo-900/50 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Live Key Structure Preview ({durationTag}):
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                    Unlimited Catalog Enabled
                  </span>
                </div>

                <div className="font-mono text-sm font-bold text-indigo-300 bg-slate-900/80 p-2.5 rounded-xl border border-indigo-900/60 flex items-center justify-between">
                  <span>{issuedResult ? issuedResult.key : previewKeyFormat}</span>
                  <span className="text-[10px] font-sans font-normal text-slate-400">
                    Duration: <strong>{durationMonths} Month(s)</strong>
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>
                    New Expiration Date:{' '}
                    <strong className="text-white">
                      {issuedResult
                        ? new Date(issuedResult.validUntil).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : previewExpiry.toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                    </strong>
                  </span>
                  <span className="text-emerald-400 font-semibold">Instantly Unlocks Operating Devices</span>
                </div>
              </div>

              {/* Issued Success Voucher Display */}
              {issuedResult && (
                <div className="p-4 bg-gradient-to-r from-emerald-950/70 via-slate-900 to-indigo-950/70 border-2 border-emerald-500/70 rounded-2xl space-y-3 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>Valid Key Successfully Issued & Devices Re-Enabled!</span>
                    </div>
                    <span className="text-[10px] font-mono bg-emerald-900/60 text-emerald-200 px-2 py-0.5 rounded border border-emerald-700">
                      {issuedResult.durationTag} Active
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-mono">Issued License Key:</span>
                    <div className="font-mono text-sm font-bold text-white bg-slate-950 p-2.5 rounded-xl border border-emerald-800 flex items-center justify-between">
                      <span className="select-all text-emerald-300">{issuedResult.key}</span>
                      <button
                        type="button"
                        onClick={handleCopyVoucher}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied!' : 'Copy Key & Voucher'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                    <span>
                      Store: <strong>{issuedResult.shopName}</strong>
                    </span>
                    <span>
                      Valid until:{' '}
                      <strong>
                        {new Date(issuedResult.validUntil).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </strong>
                    </span>
                  </div>

                  {targetTenant && targetLicense && (
                    <div className="pt-2 border-t border-slate-800 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setIsCertificateOpen(true)}
                        className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                      >
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        <span>Print Official License Certificate</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium cursor-pointer"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={handleIssueKey}
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-900/40 flex items-center gap-2 cursor-pointer transition-all active:scale-98"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Issue {durationTag} Valid Key & Re-Enable Device</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'DISABLE_DEVICE' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-rose-950/40 border border-rose-800/50 rounded-2xl flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-rose-300 text-xs">
                    Remote Operating Device Lockdown & Disable
                  </h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    When you disable this shop, its operating terminal will immediately lock with a full-screen
                    disabled interface. The shop staff will not be able to perform POS billing, sales checkout,
                    or inventory actions until a valid license renewal key is issued or unlocked.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-[11px] uppercase">
                  Lockdown Reason:
                </label>
                <select
                  value={disableReason}
                  onChange={(e) => setDisableReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-rose-500"
                >
                  <option value="Software License Term Ended">Software License Term Ended / Expired</option>
                  <option value="Non-Payment of Subscription">Non-Payment of Subscription Fee</option>
                  <option value="Security Audit Required">Security Audit / Head Office Protocol</option>
                  <option value="Temporary Administrative Suspension">Temporary Administrative Suspension</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-[11px] uppercase">
                  Custom Message Displayed on Device Screen: *
                </label>
                <textarea
                  rows={3}
                  required
                  value={disableMessage}
                  onChange={(e) => setDisableMessage(e.target.value)}
                  placeholder="Enter message to display on the customer's disabled screen..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:border-rose-500 resize-none font-sans"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  This exact text will be displayed prominently on the customer's terminal screen.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={async () => {
                    if (!selectedTenantId) return;
                    await executeShopLockdown(selectedTenantId, 'UNLOCK_ALL', 'Operating device released by Super Admin');
                    setActionSuccessMsg(`Operating devices for "${targetTenant?.shop_name || selectedTenantId}" unlocked.`);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Release Device Lock</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium cursor-pointer text-xs"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleDisableDevice}
                    disabled={isDisabling}
                    className="px-5 py-2.5 bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-rose-950/50 flex items-center gap-2 cursor-pointer transition-all active:scale-98 text-xs"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{isDisabling ? 'Disabling...' : 'Disable Operating Device Now'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Certificate Modal if triggered */}
      {isCertificateOpen && targetTenant && targetLicense && (
        <LicenseCertificateModal
          tenant={targetTenant}
          license={targetLicense}
          isOpen={isCertificateOpen}
          onClose={() => setIsCertificateOpen(false)}
        />
      )}
    </div>
  );
};
