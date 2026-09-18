import React, { useState } from 'react';
import { useRetail } from '../../context/RetailContext';
import { RiskAlert } from '../../types';
import { AlertTriangle, Send, Bell, CheckCircle2, ShieldAlert, Radio, X } from 'lucide-react';

interface RiskAlertsCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RiskAlertsCenter: React.FC<RiskAlertsCenterProps> = ({ isOpen, onClose }) => {
  const { allTenants, allRiskAlerts, broadcastRiskAlert, acknowledgeRiskAlert } = useRetail();

  const [targetTenantId, setTargetTenantId] = useState<string>('ALL');
  const [severity, setSeverity] = useState<RiskAlert['severity']>('WARNING');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [actionRequired, setActionRequired] = useState('Contact WCS Support (+94 11 700 8899)');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;

    if (targetTenantId === 'ALL') {
      allTenants.forEach((t) => {
        broadcastRiskAlert(t.tenant_id, {
          severity,
          title,
          message,
          action_required: actionRequired,
        });
      });
      setSuccessNotice(`Alert broadcasted to all ${allTenants.length} customer shops!`);
    } else {
      broadcastRiskAlert(targetTenantId, {
        severity,
        title,
        message,
        action_required: actionRequired,
      });
      const targetShop = allTenants.find((t) => t.tenant_id === targetTenantId);
      setSuccessNotice(`Alert dispatched to ${targetShop?.shop_name || targetTenantId}!`);
    }

    setTitle('');
    setMessage('');
    setTimeout(() => setSuccessNotice(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Risk Alerts & Remote Broadcast Center</h2>
              <p className="text-xs text-slate-400">Push urgent license, compliance, or security notices to POS screens</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        {successNotice && (
          <div className="bg-emerald-950 border-b border-emerald-800/80 px-6 py-2.5 text-xs text-emerald-300 flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Broadcast Form */}
          <form onSubmit={handleBroadcast} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            <h3 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-indigo-400" />
              Dispatch New System Notice
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">
                  Target Tenant / Shop:
                </label>
                <select
                  value={targetTenantId}
                  onChange={(e) => setTargetTenantId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                >
                  <option value="ALL">📢 All Customer Shops (Broadcast)</option>
                  {allTenants.map((t) => (
                    <option key={t.tenant_id} value={t.tenant_id}>
                      {t.shop_name} ({t.tenant_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">
                  Severity Level:
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                >
                  <option value="INFO">ℹ️ INFO - Advisory / System Update</option>
                  <option value="WARNING">⚠️ WARNING - Subscription Expiring Soon</option>
                  <option value="CRITICAL">🚨 CRITICAL - Urgent Payment Overdue</option>
                  <option value="URGENT">🛑 URGENT - Security Lockout Notice</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">
                Notice Title:
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Annual License Fee Due Notice"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">
                Message Content:
              </label>
              <textarea
                required
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Details of warning, invoice number, or support instructions..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg flex items-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                Dispatch Alert to Shop
              </button>
            </div>
          </form>

          {/* Past Alerts Stream */}
          <div>
            <h3 className="font-bold text-slate-200 text-xs mb-3 flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-amber-400" />
              Active System Risk Alerts ({allRiskAlerts.length})
            </h3>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {allRiskAlerts.length === 0 ? (
                <div className="p-4 text-center text-slate-500 bg-slate-950 rounded-xl border border-slate-800">
                  No active risk alerts dispatched.
                </div>
              ) : (
                allRiskAlerts.map((alert) => {
                  const targetShop = allTenants.find((t) => t.tenant_id === alert.tenant_id);
                  return (
                    <div
                      key={alert.id}
                      className={`p-3 rounded-xl border flex items-start justify-between gap-3 ${
                        alert.severity === 'CRITICAL' || alert.severity === 'URGENT'
                          ? 'border-rose-500/40 bg-rose-950/20'
                          : 'border-amber-500/40 bg-amber-950/20'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                              alert.severity === 'CRITICAL' || alert.severity === 'URGENT'
                                ? 'bg-rose-500/30 text-rose-300'
                                : 'bg-amber-500/30 text-amber-300'
                            }`}
                          >
                            {alert.severity}
                          </span>
                          <span className="font-bold text-slate-200">{alert.title}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Target: {targetShop?.shop_name || alert.tenant_id}
                          </span>
                        </div>
                        <p className="text-slate-300 text-[11px] mt-1">{alert.message}</p>
                        <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                          <span>Action: {alert.action_required}</span>
                          <span>•</span>
                          <span>{new Date(alert.created_at).toLocaleString()}</span>
                        </div>
                      </div>

                      {!alert.is_acknowledged && (
                        <button
                          onClick={() => acknowledgeRiskAlert(alert.id)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] shrink-0 flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Mark Resolved
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
