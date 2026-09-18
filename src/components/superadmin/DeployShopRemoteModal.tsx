import React, { useState } from 'react';
import { useRetail } from '../../context/RetailContext';
import { Tenant } from '../../types';
import {
  Laptop,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Store,
  Users,
  Lock,
  Radio,
  QrCode,
  Share2,
  Key,
  CreditCard,
  MessageSquare,
  AlertTriangle,
  X,
  Info,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface DeployShopRemoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTenantId?: string;
}

export const DeployShopRemoteModal: React.FC<DeployShopRemoteModalProps> = ({
  isOpen,
  onClose,
  initialTenantId,
}) => {
  const {
    allTenants,
    allLicenses,
    users,
    currentTenantId,
    remoteDevices,
    executeShopLockdown,
  } = useRetail();

  const [selectedTenantId, setSelectedTenantId] = useState<string>(
    initialTenantId || currentTenantId || (allTenants[0]?.tenant_id || 'SHOP001')
  );

  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isLockingShop, setIsLockingShop] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const targetTenant =
    allTenants.find((t) => t.tenant_id === selectedTenantId) || allTenants[0];
  const targetLicense = targetTenant ? allLicenses[targetTenant.tenant_id] : null;

  // Compute live origin and direct URL
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const directShopUrl = `${baseUrl}/?tenant=${encodeURIComponent(targetTenant?.tenant_id || 'SHOP001')}&station=terminal`;

  // Get users for this shop
  const shopUsers = (users || []).filter(
    (u) => u.tenant_id === targetTenant?.tenant_id && u.is_active && u.role !== 'SUPER_ADMIN'
  );

  // Fallback credentials if not yet customized
  const defaultCredentials = [
    {
      role: 'Cashier (Billing)',
      username: `${(targetTenant?.tenant_id || 'shop001').toLowerCase()}_cashier`,
      password: 'pass',
      pin: '1111',
      desc: 'Quick barcode checkout, receipts, returns, and cash ledger',
      badge: 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300',
    },
    {
      role: 'Sales Associate',
      username: `${(targetTenant?.tenant_id || 'shop001').toLowerCase()}_associate`,
      password: 'pass',
      pin: '3333',
      desc: 'Sales orders, quotes, customer balance inquiries',
      badge: 'bg-pink-950/70 border-pink-500/40 text-pink-300',
    },
    {
      role: 'Branch Manager / Admin',
      username: `${(targetTenant?.tenant_id || 'shop001').toLowerCase()}_admin`,
      password: 'admin',
      pin: '2222',
      desc: 'Products, stock adjustment, categories, and day-end reports',
      badge: 'bg-indigo-950/70 border-indigo-500/40 text-indigo-300',
    },
    {
      role: 'Shop Owner',
      username: `${(targetTenant?.tenant_id || 'shop001').toLowerCase()}_owner`,
      password: 'owner',
      pin: '1234',
      desc: 'Full store management, staff salaries, expenses & settings',
      badge: 'bg-amber-950/70 border-amber-500/40 text-amber-300',
    },
  ];

  // Connected devices for this shop
  const connectedTerminals = (remoteDevices || []).filter(
    (d) => (d.tenant_id || d.tenantId) === targetTenant?.tenant_id
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const copyToClipboard = (text: string, identifier: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedField(identifier);
    showToast(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Generate full briefing message for WhatsApp / Email
  const getWhatsAppBriefing = () => {
    return `🏪 *WCS RETAIL CLOUD — BRANCH TERMINAL ACCESS*
Store: *${targetTenant?.shop_name || 'Retail Store'}*
Branch: *${targetTenant?.branch_name || 'Main Branch'}*
Tenant ID: *${targetTenant?.tenant_id}*

🔗 *Direct Store Terminal Launch Link:*
${directShopUrl}

🔑 *Cashier Access Credentials:*
• Cashier Username: *${defaultCredentials[0].username}*
• Cashier PIN: *${defaultCredentials[0].pin}* (Password: ${defaultCredentials[0].password})

👨‍💼 *Branch Manager Credentials:*
• Manager Username: *${defaultCredentials[2].username}*
• Manager PIN: *${defaultCredentials[2].pin}* (Password: ${defaultCredentials[2].password})

⚙️ *Setup Steps on Counter Computer:*
1. Open Google Chrome or Microsoft Edge on the counter PC.
2. Paste the link above or scan the store QR code.
3. Enter Cashier PIN (1111) to launch the POS terminal.
4. All sales, stock changes, and customer records automatically synchronize with Headquarters in real-time.`;
  };

  const handleCopyWhatsAppBriefing = () => {
    const text = getWhatsAppBriefing();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedSection('WHATSAPP');
    showToast('Branch briefing copied! Ready to paste into WhatsApp or Email.');
    setTimeout(() => setCopiedSection(null), 3000);
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    directShopUrl
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[9999] p-3.5 bg-emerald-950/95 border border-emerald-500 rounded-2xl shadow-2xl text-emerald-200 text-xs flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-800 text-white shadow-lg shadow-purple-900/40">
              <Laptop className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white tracking-tight">
                  Deploy Store to Remote PC / Branch Computers
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-500/30">
                  Cloud Terminal Dispatch
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Keep Super Admin HQ on this computer while operating shops on other counter PCs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
          {/* Store Selector Pill Bar */}
          <div>
            <label className="block text-slate-300 font-bold mb-1.5 uppercase text-[11px] tracking-wider">
              Select Shop to Deploy on Another Computer:
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5">
              {allTenants.map((t) => {
                const isSelected = t.tenant_id === selectedTenantId;
                const lic = allLicenses[t.tenant_id];
                const activeOnCount = (remoteDevices || []).filter(
                  (d) => (d.tenant_id || d.tenantId) === t.tenant_id
                ).length;

                return (
                  <button
                    key={t.tenant_id}
                    type="button"
                    onClick={() => setSelectedTenantId(t.tenant_id)}
                    className={`px-3.5 py-2 rounded-xl text-left border shrink-0 transition-all cursor-pointer flex items-center gap-2 ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-950/60 ring-2 ring-indigo-500/40 text-white font-bold'
                        : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <Store className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                    <div>
                      <div className="text-xs font-semibold">{t.shop_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {t.tenant_id} • {activeOnCount} Active {activeOnCount === 1 ? 'PC' : 'PCs'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Core Dispatch Panel (Direct Link + QR Code) */}
          <div className="bg-gradient-to-br from-slate-950 via-indigo-950/30 to-purple-950/20 border border-indigo-500/40 rounded-2xl p-5 space-y-4 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-900/40 pb-3">
              <div>
                <span className="text-[10px] text-indigo-400 uppercase font-mono tracking-wider font-bold block">
                  Store Terminal Launch URL
                </span>
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mt-0.5">
                  <span>{targetTenant?.shop_name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
                    {targetTenant?.tenant_id}
                  </span>
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    targetLicense?.status === 'ACTIVE'
                      ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
                      : 'bg-rose-950/70 border-rose-500/50 text-rose-300'
                  }`}
                >
                  License: {targetLicense?.status || 'ACTIVE'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  Branch: {targetTenant?.branch_name || 'Main'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              {/* Left 2 Cols: Direct Link & Copy Action */}
              <div className="md:col-span-2 space-y-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1 text-[11px]">
                    Open this URL in Google Chrome / Edge on the Other Computer:
                  </label>
                  <div className="bg-slate-950 border border-indigo-800/70 rounded-xl p-3 font-mono text-xs text-indigo-200 break-all select-all flex items-center justify-between gap-3 shadow-inner">
                    <span className="truncate">{directShopUrl}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(directShopUrl, 'URL', 'Direct URL')}
                      className="shrink-0 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    >
                      {copiedField === 'URL' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy URL</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 3 Step Deployment Instructions */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
                  <div className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>How it works across multiple computers:</span>
                  </div>
                  <ol className="text-[11px] text-slate-300 space-y-1.5 list-decimal list-inside leading-relaxed">
                    <li>
                      <strong>On other computers:</strong> Open the link above. It locks the computer to <em>Store Terminal Mode</em>, keeping Super Admin HQ secured on this machine.
                    </li>
                    <li>
                      <strong>Cashier log-in:</strong> Select the cashier name or enter PIN <code className="bg-slate-950 px-1 py-0.5 rounded text-emerald-400 font-mono">1111</code> to begin billing.
                    </li>
                    <li>
                      <strong>Master Control from this PC:</strong> All sales, stock changes, and customer credits sync in real-time. You can freeze their screen or revoke their license anytime from this Super Admin screen.
                    </li>
                  </ol>
                </div>

                {/* WhatsApp & Email Quick Share */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCopyWhatsAppBriefing}
                    className="w-full py-2 bg-gradient-to-r from-emerald-600/90 to-teal-700/90 hover:from-emerald-500 hover:to-teal-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-950/50"
                  >
                    {copiedSection === 'WHATSAPP' ? (
                      <>
                        <Check className="w-4 h-4 text-white" />
                        <span>Briefing Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4" />
                        <span>Copy Complete Branch Setup for WhatsApp / Email</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Right Col: QR Code for Mobile / Tablet / Scanner */}
              <div className="flex flex-col items-center justify-center p-3 bg-slate-950/90 border border-indigo-900/50 rounded-2xl text-center space-y-2 shadow-inner">
                <div className="p-2 bg-white rounded-xl shadow-md">
                  <img
                    src={qrImageUrl}
                    alt="Scan to launch store on remote PC"
                    className="w-32 h-32 object-contain"
                    onError={(e) => {
                      // Fallback if offline
                      (e.target as any).style.display = 'none';
                    }}
                  />
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                  <QrCode className="w-3 h-3 text-cyan-400" />
                  <span>Scan to Open on Tablet / POS</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pre-Configured Store Staff Logins */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                <span>Ready-to-Use Staff Credentials for this Store ({targetTenant?.shop_name}):</span>
              </h4>
              <span className="text-[10px] text-slate-400">
                Staff can log in immediately on the remote computer
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {defaultCredentials.map((cred, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 space-y-2 relative group hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${cred.badge}`}>
                      {cred.role}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          `Username: ${cred.username} | PIN: ${cred.pin} | Password: ${cred.password}`,
                          `CRED_${idx}`,
                          cred.role
                        )
                      }
                      className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {copiedField === `CRED_${idx}` ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>{copiedField === `CRED_${idx}` ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
                      <span className="text-[9px] text-slate-500 uppercase block">Username:</span>
                      <span className="text-slate-200 font-bold truncate block">{cred.username}</span>
                    </div>
                    <div className="bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
                      <span className="text-[9px] text-slate-500 uppercase block">PIN Code:</span>
                      <span className="text-emerald-400 font-bold block">{cred.pin}</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-tight">{cred.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Currently Connected Remote Computers for this Store */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-purple-400 animate-pulse" />
                <h4 className="text-xs font-bold text-slate-200">
                  Terminals Currently Operating Under {targetTenant?.shop_name} ({connectedTerminals.length}):
                </h4>
              </div>
              {connectedTerminals.length > 0 && (
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm(`Emergency Lockdown: Are you sure you want to freeze ALL screens for ${targetTenant?.shop_name}?`)) {
                      setIsLockingShop(true);
                      await executeShopLockdown(targetTenant.tenant_id, 'LOCK_ALL', 'Emergency lockdown initiated from Super Admin HQ.');
                      setIsLockingShop(false);
                      showToast(`All terminals for ${targetTenant.shop_name} are now locked!`);
                    }
                  }}
                  disabled={isLockingShop}
                  className="px-2.5 py-1 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-300 text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1"
                >
                  <Lock className="w-3 h-3 text-rose-400" />
                  <span>Lock All ({connectedTerminals.length}) Screens</span>
                </button>
              )}
            </div>

            {connectedTerminals.length === 0 ? (
              <div className="py-6 text-center text-slate-500 space-y-1">
                <p>No remote computers currently connected for this store.</p>
                <p className="text-[10px] text-slate-400">
                  Open the direct launch link on another computer to connect your first counter station.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {connectedTerminals.map((dev: any) => {
                  const devId = dev.deviceId || dev.device_id;
                  const devName = dev.deviceName || dev.device_name;
                  const isLocked = dev.isLocked ?? dev.is_locked;
                  const isBlocked = dev.status === 'BLOCKED' || dev.is_blocked;
                  const user = dev.currentUserName || dev.current_user_name || 'Idle Terminal';

                  return (
                    <div
                      key={devId}
                      className="flex items-center justify-between p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${
                            isBlocked
                              ? 'bg-rose-600'
                              : isLocked
                              ? 'bg-amber-400'
                              : 'bg-emerald-400 animate-pulse'
                          }`}
                        />
                        <div>
                          <span className="font-bold text-slate-200">{devName}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            User: {user} • IP: {dev.ipAddress || dev.ip_address || '192.168.1.x'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                            isBlocked
                              ? 'bg-rose-950 text-rose-300 border border-rose-700'
                              : isLocked
                              ? 'bg-amber-950 text-amber-300 border border-amber-600'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                          }`}
                        >
                          {isBlocked ? 'BLOCKED' : isLocked ? 'SCREEN FROZEN' : 'ONLINE'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>HQ Master Security is active on this host PC.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-md"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
