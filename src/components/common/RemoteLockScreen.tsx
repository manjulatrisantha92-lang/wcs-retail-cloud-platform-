import React, { useState } from 'react';
import { useRetail } from '../../context/RetailContext';
import {
  ShieldAlert,
  Lock,
  KeyRound,
  Laptop,
  Building2,
  PhoneCall,
  AlertTriangle,
  Radio,
  CheckCircle2,
  RefreshCw,
  Clock,
  Sparkles,
  Info,
  Key,
  Check,
  Calendar,
} from 'lucide-react';

export const RemoteLockScreen: React.FC = () => {
  const {
    isLocalDeviceLocked,
    isLocalDeviceBlocked,
    localDeviceId,
    localDeviceName,
    setLocalDeviceName,
    localDeviceLockReason,
    localDeviceLockMessage,
    unlockLocalOverride,
    renewShopWithKey,
    currentTenant,
    currentTenantId,
    currentLicense,
    isSuperAdminAuthenticated,
    cloudSyncStatus,
    forceCloudSync,
  } = useRetail();

  // If in Super Admin headquarters mode, do not lock out the Super Admin
  const isSuperAdminMode = currentTenantId === 'SUPER_ADMIN' || isSuperAdminAuthenticated;

  // Check license expiration or suspension
  const isLicenseExpired =
    !isSuperAdminMode &&
    Boolean(
      currentLicense &&
        (currentLicense.status === 'EXPIRED' ||
          (currentLicense.valid_until && new Date(currentLicense.valid_until).getTime() <= Date.now()))
    );

  const isLicenseSuspended =
    !isSuperAdminMode &&
    Boolean(
      currentLicense &&
        (currentLicense.status === 'SUSPENDED' ||
          currentLicense.status === 'DEACTIVATED' ||
          currentLicense.status === 'TEMPORARY_SUSPENDED' ||
          currentLicense.is_device_disabled)
    );

  const isDeviceDisabled =
    !isSuperAdminMode && (isLocalDeviceLocked || isLocalDeviceBlocked || isLicenseExpired || isLicenseSuspended);

  const [renewalKeyInput, setRenewalKeyInput] = useState('');
  const [renewalMessage, setRenewalMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isRenewing, setIsRenewing] = useState(false);

  const [overrideInput, setOverrideInput] = useState('');
  const [overrideError, setOverrideError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(localDeviceName);
  const [copiedHotline, setCopiedHotline] = useState(false);

  if (!isDeviceDisabled) return null;

  // Handle direct renewal key submission by store staff / owner
  const handleRenewalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewalKeyInput.trim() || !currentTenant) return;

    setIsRenewing(true);
    setRenewalMessage(null);

    const result = renewShopWithKey(currentTenant.tenant_id, renewalKeyInput.trim());
    setIsRenewing(false);

    if (result.success) {
      setRenewalMessage({ text: result.message, isError: false });
      setRenewalKeyInput('');
    } else {
      setRenewalMessage({ text: result.message, isError: true });
    }
  };

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideInput.trim()) return;

    setIsVerifying(true);
    setOverrideError(null);

    const success = await unlockLocalOverride(overrideInput.trim());
    setIsVerifying(false);

    if (!success) {
      setOverrideError('Invalid Emergency Unlock PIN or Password. Contact Super Admin Headquarters.');
    } else {
      setOverrideInput('');
    }
  };

  const handleSaveName = () => {
    if (editedName.trim()) {
      setLocalDeviceName(editedName.trim());
      setIsEditingName(false);
    }
  };

  const displayMessage =
    localDeviceLockMessage ||
    currentLicense?.disabled_message ||
    currentLicense?.suspend_reason ||
    (isLicenseExpired
      ? 'This system operating device has been disabled because the software license validity term has ended. POS billing, checkout, and inventory operations are suspended until a valid renewal key is entered.'
      : 'This system operating device has been disabled by Super Admin Headquarters. Terminal operations are suspended.');

  const displayReason =
    localDeviceLockReason ||
    (isLicenseExpired
      ? 'Software License Term Expired'
      : isLicenseSuspended
      ? 'Operating Access Suspended by Headquarters'
      : isLocalDeviceBlocked
      ? 'Hardware Device Blocked'
      : 'Remote Terminal Lockdown');

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 text-slate-100 overflow-y-auto">
      <div className="max-w-xl w-full bg-slate-900 border-2 border-rose-600/70 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        {/* Top Header */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <div className="w-20 h-20 bg-rose-950/80 border-2 border-rose-500 rounded-3xl flex items-center justify-center text-rose-400 shadow-xl shadow-rose-900/50">
              <Lock className="w-10 h-10 animate-pulse" />
            </div>
            <div className="absolute -bottom-1 -right-1 p-1.5 bg-rose-600 rounded-full text-white shadow-md">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/90 border border-rose-500/50 text-rose-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Radio className="w-3.5 h-3.5 animate-pulse text-rose-400" />
              <span>System Operating Device Disabled</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              {isLicenseExpired
                ? 'License Validity Term Ended'
                : isLocalDeviceBlocked
                ? 'Hardware Device Blocked'
                : 'Terminal Remotely Disabled'}
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              This system operating device has been disabled. POS billing, checkout, and inventory operations are suspended.
            </p>
          </div>
        </div>

        {/* Disabled Message Card Prominently Displayed */}
        <div className="mt-5 bg-rose-950/40 border-2 border-rose-800/60 rounded-2xl p-4.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Status: {displayReason}</span>
            </span>
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Real-time Enforced
            </span>
          </div>

          <div className="p-3 bg-slate-950/80 rounded-xl border border-rose-900/50 text-xs text-slate-200 leading-relaxed">
            <strong className="text-rose-400 block mb-1 uppercase text-[10px] tracking-wider font-mono">
              Message Displayed on Device:
            </strong>
            <p className="font-medium text-slate-100">{displayMessage}</p>
          </div>
        </div>

        {/* Device & Shop Identity Details */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex items-start gap-2.5">
            <Building2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Connected Store</span>
              <p className="font-bold text-slate-200 truncate">{currentTenant?.shop_name || 'Retail Store'}</p>
              <span className="text-[10px] text-indigo-400 font-mono">{currentTenant?.tenant_id}</span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex items-start gap-2.5">
            <Laptop className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Terminal Station</span>
              {isEditingName ? (
                <div className="flex items-center gap-1 mt-1">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="px-2 py-0.5 text-xs bg-slate-800 border border-slate-700 rounded text-white w-full"
                    placeholder="e.g. Counter 1"
                  />
                  <button
                    onClick={handleSaveName}
                    className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-bold cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="font-bold text-slate-200 truncate">{localDeviceName}</p>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 ml-1 underline cursor-pointer"
                  >
                    Rename
                  </button>
                </div>
              )}
              <span className="text-[10px] text-slate-500 font-mono truncate block" title={localDeviceId}>
                ID: {localDeviceId.slice(0, 16)}...
              </span>
            </div>
          </div>
        </div>

        {/* Expired License Info */}
        {currentLicense && (
          <div className="mt-2.5 p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between text-[11px]">
            <span className="text-slate-400">
              License Key: <strong className="font-mono text-slate-300">{currentLicense.license_key}</strong>
            </span>
            <span className="text-rose-400 font-mono font-semibold">
              Term Ended:{' '}
              {currentLicense.valid_until ? new Date(currentLicense.valid_until).toLocaleDateString() : 'Expired'}
            </span>
          </div>
        )}

        {/* Enter Valid License Renewal Key to Re-Enable Device */}
        <div className="mt-5 p-4 bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-700/60 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-200 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-indigo-400" />
              <span>Enter Valid License Renewal Key to Re-Enable</span>
            </span>
            <span className="text-[10px] text-indigo-300 font-mono">01M / 03M / 06M / 12M</span>
          </div>

          <p className="text-[11px] text-slate-300 leading-tight">
            Obtain a valid renewal key from Super Admin Headquarters (1 Month, 3 Months, 6 Months, or 12 Months) to instantly unlock and re-enable this device.
          </p>

          <form onSubmit={handleRenewalSubmit} className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={renewalKeyInput}
                onChange={(e) => {
                  setRenewalKeyInput(e.target.value.toUpperCase());
                  setRenewalMessage(null);
                }}
                placeholder="e.g. WCS-PRO-01M-XXXX-2026"
                className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-indigo-700/70 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 rounded-xl font-mono text-xs text-indigo-200 placeholder:text-slate-600 outline-none"
              />
              <button
                type="submit"
                disabled={isRenewing || !renewalKeyInput.trim()}
                className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                {isRenewing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>Re-Enable Device</span>
              </button>
            </div>

            {renewalMessage && (
              <p
                className={`text-xs p-2.5 rounded-lg border flex items-center gap-2 ${
                  renewalMessage.isError
                    ? 'text-rose-300 bg-rose-950/60 border-rose-900/50'
                    : 'text-emerald-300 bg-emerald-950/60 border-emerald-900/50'
                }`}
              >
                {renewalMessage.isError ? (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                )}
                <span>{renewalMessage.text}</span>
              </p>
            )}
          </form>
        </div>

        {/* Emergency Unlock Override Form */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <form onSubmit={handleOverrideSubmit} className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                Emergency Manager Override
              </label>
              <span className="text-[10px] text-slate-500">PIN: 9999 or Master Password</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="password"
                value={overrideInput}
                onChange={(e) => {
                  setOverrideInput(e.target.value);
                  setOverrideError(null);
                }}
                placeholder="Enter emergency PIN or password..."
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl text-xs text-white placeholder:text-slate-600 outline-none"
              />
              <button
                type="submit"
                disabled={isVerifying || !overrideInput.trim()}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0"
              >
                {isVerifying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
                <span>Unlock</span>
              </button>
            </div>

            {overrideError && (
              <p className="text-[11px] text-rose-400 bg-rose-950/40 p-2 rounded-lg border border-rose-900/50 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{overrideError}</span>
              </p>
            )}
          </form>
        </div>

        {/* Real-time Gateway Polling Status */}
        <div className="mt-4 p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-slate-400 text-[10px]">
              Headquarters Link Active. Automatically unlocks when Super Admin issues valid key.
            </span>
          </div>

          <button
            type="button"
            onClick={() => forceCloudSync()}
            className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer shrink-0 ml-2"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Check Release</span>
          </button>
        </div>

        {/* Support Hotline Footer */}
        <div className="mt-4 text-center text-slate-500 text-[11px] space-y-1">
          <p className="flex items-center justify-center gap-1.5 text-slate-400">
            <PhoneCall className="w-3.5 h-3.5 text-indigo-400" />
            <span>WCS Support Hotline: <strong>+94 11 700 8899</strong> / WhatsApp: <strong>+94 77 000 8888</strong></span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText('+94770008888');
                setCopiedHotline(true);
                setTimeout(() => setCopiedHotline(false), 2000);
              }}
              className="text-[10px] text-emerald-400 hover:underline cursor-pointer ml-1"
            >
              {copiedHotline ? 'Copied' : 'Copy'}
            </button>
          </p>
          <p>
            Terminal ID: <span className="font-mono text-slate-400">{localDeviceId}</span>
          </p>
        </div>
      </div>
    </div>
  );
};
