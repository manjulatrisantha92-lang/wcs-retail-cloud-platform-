import React, { useState, useMemo } from 'react';
import { useRetail } from '../../context/RetailContext';
import { RemoteDevice, RemoteSecurityActionPayload } from '../../types';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  LogOut,
  MessageSquare,
  Ban,
  Radio,
  Laptop,
  Building2,
  Users,
  Search,
  RefreshCw,
  X,
  AlertTriangle,
  CheckCircle2,
  Send,
  Eye,
  Globe,
  Sliders,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  Info,
  Clock,
  Sparkles,
} from 'lucide-react';

interface RemoteSecurityControlModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RemoteSecurityControlModal: React.FC<RemoteSecurityControlModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    remoteDevices,
    fetchRemoteDevices,
    executeDeviceSecurityAction,
    executeShopLockdown,
    allTenants,
    allLicenses,
    updateLicenseMaxTerminals,
    localDeviceId,
  } = useRetail();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTenantFilter, setSelectedTenantFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Modal for targeting a device with action
  const [actionModal, setActionModal] = useState<{
    device: RemoteDevice;
    actionType: 'LOCK' | 'FORCE_LOGOUT' | 'MESSAGE' | 'BLOCK';
  } | null>(null);

  const [actionReason, setActionReason] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Shop Lockdown confirmation modal
  const [shopLockdownModal, setShopLockdownModal] = useState<{
    tenantId: string;
    action: 'LOCK_ALL' | 'UNLOCK_ALL' | 'LOGOUT_ALL';
  } | null>(null);
  const [shopLockdownMessage, setShopLockdownMessage] = useState('');

  // Terminal Quota Adjust modal
  const [quotaModalTenantId, setQuotaModalTenantId] = useState<string | null>(null);
  const [newQuotaValue, setNewQuotaValue] = useState<number>(5);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchRemoteDevices();
    setIsRefreshing(false);
    showToast('Terminal status and heartbeats refreshed!');
  };

  const handleCopy = (text: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedText(label);
    showToast(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedText(null), 2500);
  };

  // Helper: check if device is recently online (< 30 seconds)
  const isDeviceOnline = (device: RemoteDevice) => {
    if (!device.last_heartbeat) return false;
    const diff = Date.now() - new Date(device.last_heartbeat).getTime();
    return diff < 30000;
  };

  // Filtered devices
  const filteredDevices = useMemo(() => {
    return remoteDevices.filter((dev) => {
      const matchesSearch =
        dev.device_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dev.device_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (dev.shop_name && dev.shop_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (dev.current_user_name && dev.current_user_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (dev.ip_address && dev.ip_address.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (dev.city && dev.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (dev.os && dev.os.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesTenant =
        selectedTenantFilter === 'ALL' || dev.tenant_id === selectedTenantFilter;

      const online = isDeviceOnline(dev);
      let matchesStatus = true;
      if (statusFilter === 'ONLINE') matchesStatus = online;
      else if (statusFilter === 'OFFLINE') matchesStatus = !online;
      else if (statusFilter === 'LOCKED') matchesStatus = dev.is_locked;
      else if (statusFilter === 'BLOCKED') matchesStatus = dev.is_blocked;

      return matchesSearch && matchesTenant && matchesStatus;
    });
  }, [remoteDevices, searchQuery, selectedTenantFilter, statusFilter]);

  // Statistics
  const totalDevicesCount = remoteDevices.length;
  const onlineDevicesCount = remoteDevices.filter(isDeviceOnline).length;
  const lockedDevicesCount = remoteDevices.filter((d) => d.is_locked).length;
  const blockedDevicesCount = remoteDevices.filter((d) => d.is_blocked).length;

  // Execute quick unlock
  const handleQuickUnlock = async (dev: RemoteDevice) => {
    const success = await executeDeviceSecurityAction({
      targetDeviceId: dev.device_id,
      command: 'UNLOCK',
      reason: 'Remotely unlocked by Super Admin Headquarters',
      initiatedBy: 'Super Admin',
    });
    if (success) {
      showToast(`Terminal "${dev.device_name}" has been unlocked.`);
    }
  };

  // Execute quick unblock
  const handleQuickUnblock = async (dev: RemoteDevice) => {
    const success = await executeDeviceSecurityAction({
      targetDeviceId: dev.device_id,
      command: 'UNBLOCK',
      reason: 'Remotely unblocked by Super Admin Headquarters',
      initiatedBy: 'Super Admin',
    });
    if (success) {
      showToast(`Hardware block removed for "${dev.device_name}".`);
    }
  };

  // Submit action modal (Lock, Logout, Message, Block)
  const handleSubmitActionModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModal) return;

    setIsSubmittingAction(true);
    const success = await executeDeviceSecurityAction({
      targetDeviceId: actionModal.device.device_id,
      command: actionModal.actionType,
      reason: actionReason || 'Headquarters administrative action',
      message: actionMessage,
      initiatedBy: 'Super Admin',
    });
    setIsSubmittingAction(false);

    if (success) {
      showToast(
        `Action ${actionModal.actionType} successfully broadcasted to ${actionModal.device.device_name}!`
      );
      setActionModal(null);
      setActionReason('');
      setActionMessage('');
    } else {
      showToast('Failed to deliver command. Check server connection.');
    }
  };

  // Submit shop lockdown
  const handleSubmitShopLockdown = async () => {
    if (!shopLockdownModal) return;
    setIsSubmittingAction(true);
    const success = await executeShopLockdown(
      shopLockdownModal.tenantId,
      shopLockdownModal.action,
      shopLockdownMessage || 'Headquarters Emergency Protocol'
    );
    setIsSubmittingAction(false);
    if (success) {
      showToast(`Shop command ${shopLockdownModal.action} broadcasted to all terminals!`);
      setShopLockdownModal(null);
      setShopLockdownMessage('');
    }
  };

  // Save new terminal quota for shop license
  const handleSaveQuota = (tenantId: string) => {
    if (newQuotaValue > 0) {
      updateLicenseMaxTerminals(tenantId, newQuotaValue);
      showToast(`Updated terminal quota for ${tenantId} to ${newQuotaValue} stations.`);
      setQuotaModalTenantId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-6xl w-full overflow-hidden shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[94vh]">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-6 right-6 z-[60] px-4 py-3 bg-emerald-950/90 border border-emerald-500 rounded-2xl shadow-2xl text-emerald-200 text-xs flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 text-white shadow-lg shadow-indigo-900/40">
              <Radio className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-extrabold text-white">
                  Remote PC License & Security Control Panel
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-500/40">
                  Global Fleet Active
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Monitor, lock, block, or broadcast security commands to client PCs & POS terminals across any location
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-2 cursor-pointer transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Heartbeats</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 4 Fleet Overview KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 py-4 bg-slate-950/40 border-b border-slate-800/80">
          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Connected PCs</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-white">{totalDevicesCount}</span>
              <span className="text-[10px] text-indigo-400">Registered Terminals</span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Online Now (Active Heartbeat)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-emerald-400">{onlineDevicesCount}</span>
              <span className="text-[10px] text-emerald-500/80 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> Live Ping
              </span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Remotely Locked Terminals</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-rose-400">{lockedDevicesCount}</span>
              <span className="text-[10px] text-rose-300">Screen Frozen</span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Hardware Blacklisted</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-amber-400">{blockedDevicesCount}</span>
              <span className="text-[10px] text-amber-300">Sync Restricted</span>
            </div>
          </div>
        </div>

        {/* Controls, Filters & Bulk Action Bar */}
        <div className="p-6 border-b border-slate-800 space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by PC Name, Device ID, Cashier, IP, City, OS..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 outline-none"
              />
            </div>

            {/* Shop/Tenant Filter */}
            <div className="w-full md:w-64">
              <select
                value={selectedTenantFilter}
                onChange={(e) => setSelectedTenantFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-100 outline-none"
              >
                <option value="ALL">All Retail Stores ({allTenants.length})</option>
                {allTenants.map((t) => (
                  <option key={t.tenant_id} value={t.tenant_id}>
                    {t.shop_name} ({t.tenant_id})
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-44">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-100 outline-none"
              >
                <option value="ALL">All Device Statuses</option>
                <option value="ONLINE">Online Now</option>
                <option value="OFFLINE">Offline / Idle</option>
                <option value="LOCKED">Remotely Locked</option>
                <option value="BLOCKED">Hardware Blocked</option>
              </select>
            </div>
          </div>

          {/* Shop-Wide Lockdown Quick Toolbar (When a specific shop or ALL is selected) */}
          <div className="p-3.5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-slate-300">
                Shop Emergency Protocol:{' '}
                <strong className="text-white">
                  {selectedTenantFilter === 'ALL'
                    ? 'Select a store to apply bulk actions'
                    : allTenants.find((t) => t.tenant_id === selectedTenantFilter)?.shop_name || selectedTenantFilter}
                </strong>
              </span>
            </div>

            {selectedTenantFilter !== 'ALL' && (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() =>
                    setShopLockdownModal({
                      tenantId: selectedTenantFilter,
                      action: 'LOCK_ALL',
                    })
                  }
                  className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Lock className="w-3.5 h-3.5 text-rose-400" />
                  <span>Lock All Shop PCs</span>
                </button>

                <button
                  onClick={() =>
                    setShopLockdownModal({
                      tenantId: selectedTenantFilter,
                      action: 'UNLOCK_ALL',
                    })
                  }
                  className="px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Unlock All Shop PCs</span>
                </button>

                <button
                  onClick={() =>
                    setShopLockdownModal({
                      tenantId: selectedTenantFilter,
                      action: 'LOGOUT_ALL',
                    })
                  }
                  className="px-3 py-1.5 bg-amber-950/80 hover:bg-amber-900 border border-amber-500/50 text-amber-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <LogOut className="w-3.5 h-3.5 text-amber-400" />
                  <span>Logout All Staff</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Body: List of Remote PCs & Terminals */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {filteredDevices.length === 0 ? (
            <div className="text-center py-16 bg-slate-950/50 border border-slate-800 rounded-3xl p-8 space-y-4">
              <div className="w-16 h-16 bg-slate-800/60 rounded-3xl flex items-center justify-center mx-auto text-slate-400">
                <Laptop className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">No Remote Terminals Found</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {searchQuery || selectedTenantFilter !== 'ALL' || statusFilter !== 'ALL'
                    ? 'No connected computers match the selected search or filter criteria.'
                    : 'When you open a shop link on another PC or branch computer, it automatically registers here in real time.'}
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedTenantFilter('ALL');
                    setStatusFilter('ALL');
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDevices.map((device) => {
                const online = isDeviceOnline(device);
                const isCurrentHost = device.device_id === localDeviceId;
                const shopLicense = allLicenses[device.tenant_id];

                return (
                  <div
                    key={device.device_id}
                    className={`bg-slate-950/70 border rounded-2xl p-4.5 transition-all relative overflow-hidden flex flex-col justify-between ${
                      device.is_locked
                        ? 'border-rose-600/70 bg-rose-950/10'
                        : device.is_blocked
                        ? 'border-amber-600/70 bg-amber-950/10'
                        : online
                        ? 'border-slate-800 hover:border-indigo-500/50'
                        : 'border-slate-800/60 opacity-80'
                    }`}
                  >
                    {/* Top Row: Device Name & Status Badges */}
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`p-2.5 rounded-xl text-white ${
                              device.is_locked
                                ? 'bg-rose-600'
                                : device.is_blocked
                                ? 'bg-amber-600'
                                : online
                                ? 'bg-indigo-600'
                                : 'bg-slate-700'
                            }`}
                          >
                            <Laptop className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-white truncate">
                                {device.device_name}
                              </h4>
                              {isCurrentHost && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-500/40">
                                  This PC
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 font-mono truncate" title={device.device_id}>
                              ID: {device.device_id}
                            </p>
                          </div>
                        </div>

                        {/* Status Pills */}
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {device.is_locked ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-500/50 flex items-center gap-1">
                              <Lock className="w-3 h-3 text-rose-400" />
                              LOCKED
                            </span>
                          ) : device.is_blocked ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-500/50 flex items-center gap-1">
                              <Ban className="w-3 h-3 text-amber-400" />
                              BLOCKED
                            </span>
                          ) : online ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/50 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                              ONLINE
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                              OFFLINE
                            </span>
                          )}

                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {device.last_heartbeat
                              ? new Date(device.last_heartbeat).toLocaleTimeString()
                              : 'No ping'}
                          </span>
                        </div>
                      </div>

                      {/* Store & Cashier Details */}
                      <div className="mt-3.5 grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-2.5">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-indigo-400" /> Assigned Store
                          </span>
                          <p className="font-bold text-slate-200 truncate mt-0.5">{device.shop_name}</p>
                          <span className="text-[10px] text-indigo-400 font-mono">{device.tenant_id}</span>
                        </div>

                        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-2.5">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block flex items-center gap-1">
                            <Users className="w-3 h-3 text-purple-400" /> Active Operator
                          </span>
                          <p className="font-bold text-slate-200 truncate mt-0.5">
                            {device.current_user_name || 'No Cashier Logged In'}
                          </p>
                          <span className="text-[10px] text-purple-400 font-semibold uppercase">
                            {device.current_user_role || 'GUEST'}
                          </span>
                        </div>
                      </div>

                      {/* Hardware / Network Details */}
                      <div className="mt-2.5 p-2.5 bg-slate-900/50 border border-slate-800/60 rounded-xl flex items-center justify-between text-[11px] text-slate-400">
                        <span className="flex items-center gap-1.5 truncate">
                          <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{device.ip_address || '127.0.0.1'}</span>
                          <span>•</span>
                          <span>{device.city || 'Colombo'}, {device.country || 'LK'}</span>
                        </span>
                        <span className="shrink-0 text-[10px] text-slate-400">
                          {device.os || 'OS'} / {device.browser || 'Web'}
                        </span>
                      </div>

                      {/* If Locked: show Reason */}
                      {device.is_locked && (
                        <div className="mt-2 p-2 bg-rose-950/40 border border-rose-900/40 rounded-xl text-[11px] text-rose-300">
                          <strong>Lock Reason: </strong>
                          {device.lock_reason || 'Administrative restriction'}
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-1.5 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        {device.is_locked ? (
                          <button
                            onClick={() => handleQuickUnlock(device)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            <span>Unlock PC</span>
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              setActionModal({
                                device,
                                actionType: 'LOCK',
                              })
                            }
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>Lock PC</span>
                          </button>
                        )}

                        <button
                          onClick={() =>
                            setActionModal({
                              device,
                              actionType: 'FORCE_LOGOUT',
                            })
                          }
                          title="Force terminate cashier session"
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <LogOut className="w-3.5 h-3.5 text-amber-400" />
                          <span>Logout</span>
                        </button>

                        <button
                          onClick={() =>
                            setActionModal({
                              device,
                              actionType: 'MESSAGE',
                            })
                          }
                          title="Send high priority security alert to this terminal"
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Send Notice</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {device.is_blocked ? (
                          <button
                            onClick={() => handleQuickUnblock(device)}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold rounded-xl border border-amber-600/50 flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Unblock</span>
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              setActionModal({
                                device,
                                actionType: 'BLOCK',
                              })
                            }
                            title="Blacklist PC hardware identifier"
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <Ban className="w-3.5 h-3.5 text-rose-400" />
                            <span>Block ID</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Terminal License Quota & Multi-Location Connecting Guide */}
          <div className="mt-8 bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Connecting New PCs Across Any Location, Branch or Warehouse
                  </h3>
                  <p className="text-xs text-slate-400">
                    How staff or managers can launch their shop from another computer simultaneously
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                  1
                </span>
                <h4 className="font-bold text-slate-200">Copy Shop Direct Cloud Link</h4>
                <p className="text-slate-400 leading-relaxed">
                  Every shop provisioned in Super Admin has a permanent direct URL (e.g. <code>?tenant=SHOP001</code>).
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                  2
                </span>
                <h4 className="font-bold text-slate-200">Open Browser on Remote PC</h4>
                <p className="text-slate-400 leading-relaxed">
                  Open Chrome or Safari on the remote computer and paste the shop link. All live data and sales load instantly.
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                  3
                </span>
                <h4 className="font-bold text-slate-200">Auto-Enrolled in Control Panel</h4>
                <p className="text-slate-400 leading-relaxed">
                  The new PC immediately establishes a heartbeat and appears on this screen for remote lock, unlock, and licensing.
                </p>
              </div>
            </div>

            {/* Quick Links for Each Tenant */}
            <div className="pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Store Direct Access & License Quota
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {allTenants.map((t) => {
                  const url = `${window.location.origin}?tenant=${t.tenant_id}`;
                  const lic = allLicenses[t.tenant_id];
                  const currentShopDevices = remoteDevices.filter((d) => d.tenant_id === t.tenant_id);
                  const maxTerminals = lic?.max_terminals || 5;

                  return (
                    <div
                      key={t.tenant_id}
                      className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-slate-200 text-xs truncate">{t.shop_name}</p>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                          <span className="font-mono text-indigo-400">{t.tenant_id}</span>
                          <span>•</span>
                          <span>
                            {currentShopDevices.length} / {maxTerminals} Terminals
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            setQuotaModalTenantId(t.tenant_id);
                            setNewQuotaValue(maxTerminals);
                          }}
                          title="Adjust terminal license quota"
                          className="p-1.5 text-slate-400 hover:text-indigo-300 rounded-lg hover:bg-slate-800 cursor-pointer"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleCopy(url, t.shop_name)}
                          title="Copy direct connection URL for other PCs"
                          className="px-2 py-1 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-200 rounded-lg text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          {copiedText === t.shop_name ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>Copy Link</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/60 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>End-to-End Encrypted Remote Fleet Management</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl cursor-pointer transition-all"
          >
            Close Panel
          </button>
        </div>
      </div>

      {/* Action Target Modal (Lock, Logout, Message, Block) */}
      {actionModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-xl text-white ${
                    actionModal.actionType === 'LOCK'
                      ? 'bg-rose-600'
                      : actionModal.actionType === 'FORCE_LOGOUT'
                      ? 'bg-amber-600'
                      : actionModal.actionType === 'MESSAGE'
                      ? 'bg-indigo-600'
                      : 'bg-red-700'
                  }`}
                >
                  {actionModal.actionType === 'LOCK' && <Lock className="w-5 h-5" />}
                  {actionModal.actionType === 'FORCE_LOGOUT' && <LogOut className="w-5 h-5" />}
                  {actionModal.actionType === 'MESSAGE' && <MessageSquare className="w-5 h-5" />}
                  {actionModal.actionType === 'BLOCK' && <Ban className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {actionModal.actionType === 'LOCK' && 'Remote Lock Terminal'}
                    {actionModal.actionType === 'FORCE_LOGOUT' && 'Force Cashier Sign-out'}
                    {actionModal.actionType === 'MESSAGE' && 'Push Security Alert'}
                    {actionModal.actionType === 'BLOCK' && 'Block Hardware Identifier'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Target: <strong className="text-slate-200">{actionModal.device.device_name}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActionModal(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitActionModal} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Reason / Purpose:
                </label>
                <input
                  type="text"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="e.g. End of day cash audit, Suspicious activity, Maintenance"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Message to display on screen:
                </label>
                <textarea
                  rows={3}
                  value={actionMessage}
                  onChange={(e) => setActionMessage(e.target.value)}
                  placeholder="e.g. Terminal is locked pending cash drawer verification. Contact HQ."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAction}
                  className={`px-5 py-2 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5 ${
                    actionModal.actionType === 'LOCK'
                      ? 'bg-rose-600 hover:bg-rose-500'
                      : actionModal.actionType === 'FORCE_LOGOUT'
                      ? 'bg-amber-600 hover:bg-amber-500'
                      : actionModal.actionType === 'MESSAGE'
                      ? 'bg-indigo-600 hover:bg-indigo-500'
                      : 'bg-red-700 hover:bg-red-600'
                  }`}
                >
                  {isSubmittingAction ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Execute Command</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shop Lockdown Confirmation Modal */}
      {shopLockdownModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border-2 border-rose-600 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-950 text-rose-400 border border-rose-500/50 rounded-2xl">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Confirm Shop-Wide Security Action
                </h3>
                <p className="text-xs text-slate-400">
                  Store: <strong className="text-white">{shopLockdownModal.tenantId}</strong>
                </p>
              </div>
            </div>

            <p className="text-xs text-rose-200 bg-rose-950/40 p-3 rounded-xl border border-rose-900/60 leading-relaxed">
              You are about to execute <strong>{shopLockdownModal.action}</strong> across all POS terminals and computers assigned to this store.
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Custom notice for cashier screens:
              </label>
              <input
                type="text"
                value={shopLockdownMessage}
                onChange={(e) => setShopLockdownMessage(e.target.value)}
                placeholder="e.g. Headquarters remote audit in progress."
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShopLockdownModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitShopLockdown}
                disabled={isSubmittingAction}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5"
              >
                {isSubmittingAction ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldAlert className="w-4 h-4" />
                )}
                <span>Confirm & Broadcast</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terminal Quota Adjust Modal */}
      {quotaModalTenantId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                Adjust Terminal Quota
              </h3>
              <button onClick={() => setQuotaModalTenantId(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Set the maximum number of simultaneous PC terminals allowed under the software license for{' '}
              <strong className="text-white">{quotaModalTenantId}</strong>.
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Max Permitted Terminals:
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={newQuotaValue}
                onChange={(e) => setNewQuotaValue(parseInt(e.target.value) || 1)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm font-bold text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setQuotaModalTenantId(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveQuota(quotaModalTenantId)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Save Quota
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
