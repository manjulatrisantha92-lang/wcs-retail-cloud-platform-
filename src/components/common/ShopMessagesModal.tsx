import React, { useState } from 'react';
import { useRetail } from '../../context/RetailContext';
import { AdminShopMessage, MessageCategory, MessagePriority } from '../../types';
import {
  Bell,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  MessageSquare,
  ShieldAlert,
  Building2,
  CheckCheck,
  ExternalLink,
  MessageCircle,
  Inbox,
  Sparkles,
  Info,
} from 'lucide-react';

interface ShopMessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShopMessagesModal: React.FC<ShopMessagesModalProps> = ({ isOpen, onClose }) => {
  const {
    currentTenantId,
    currentTenant,
    currentUser,
    tenantMessages,
    unreadTenantMessagesCount,
    markMessageAsRead,
    acknowledgeMessage,
  } = useRetail();

  const [activeTab, setActiveTab] = useState<'INBOX' | 'ALL'>('INBOX');
  const [replyNotesMap, setReplyNotesMap] = useState<Record<string, string>>({});
  const [activeAckMsgId, setActiveAckMsgId] = useState<string | null>(null);

  if (!isOpen) return null;

  const unreadMessages = tenantMessages.filter((m) => !m.read_by_tenants?.[currentTenantId]);
  const displayList = activeTab === 'INBOX' ? unreadMessages : tenantMessages;

  const handleMarkAllAsRead = () => {
    unreadMessages.forEach((m) => {
      markMessageAsRead(m.id, currentUser?.full_name || 'Staff');
    });
  };

  const handleAcknowledge = (msgId: string) => {
    const note = replyNotesMap[msgId] || 'Acknowledged and noted by store manager.';
    acknowledgeMessage(msgId, note, currentUser?.full_name || 'Staff');
    setActiveAckMsgId(null);
  };

  const getPriorityBadge = (p: MessagePriority) => {
    switch (p) {
      case 'URGENT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
            URGENT NOTICE
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            HIGH PRIORITY
          </span>
        );
      case 'NORMAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
            NORMAL
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            INFO
          </span>
        );
    }
  };

  const getCategoryBadge = (cat: MessageCategory) => {
    switch (cat) {
      case 'GENERAL_ANNOUNCEMENT':
        return <span className="text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-medium">📢 General Notice</span>;
      case 'MAINTENANCE_UPDATE':
        return <span className="text-cyan-800 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded text-[10px] font-medium">🛠️ Maintenance</span>;
      case 'BILLING_INVOICE':
        return <span className="text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-medium">💳 Billing & License</span>;
      case 'SECURITY_ADVISORY':
        return <span className="text-purple-800 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded text-[10px] font-medium">🛡️ Security & Backup</span>;
      case 'FEATURE_UPDATE':
        return <span className="text-indigo-800 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded text-[10px] font-medium">🚀 New Features</span>;
      case 'DIRECT_INQUIRY':
        return <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-medium">💬 Direct Message</span>;
      case 'SYSTEM_ALERT':
        return <span className="text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[10px] font-medium">⚠️ System Alert</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl text-slate-800 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-xs">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">WCS Headquarter Messages & Notices</h2>
                {unreadTenantMessagesCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white">
                    {unreadTenantMessagesCount} Unread
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Official broadcasts, license notifications, and direct guidance sent from WCS Super Admin HQ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab & Action Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-6 py-2.5 bg-slate-50 border-b border-slate-100 text-xs">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('INBOX')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'INBOX'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
              }`}
            >
              Unread Inbox ({unreadMessages.length})
            </button>
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
              }`}
            >
              All Messages Archive ({tenantMessages.length})
            </button>
          </div>

          {unreadMessages.length > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all as read
            </button>
          )}
        </div>

        {/* Message List Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {displayList.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Inbox className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-700 text-sm">
                {activeTab === 'INBOX' ? 'No unread messages' : 'No messages in your store archive'}
              </p>
              <p className="text-xs text-slate-400">
                You are completely up to date with all WCS Cloud Headquarter communications.
              </p>
            </div>
          ) : (
            displayList.map((msg) => {
              const isRead = Boolean(msg.read_by_tenants?.[currentTenantId]);
              const ackData = msg.acknowledged_by_tenants?.[currentTenantId];
              const isAcknowledged = Boolean(ackData);
              const isAckFormOpen = activeAckMsgId === msg.id;

              return (
                <div
                  key={msg.id}
                  className={`rounded-xl border transition-all p-4 space-y-3 ${
                    !isRead
                      ? 'bg-indigo-50/40 border-indigo-200 shadow-sm'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getCategoryBadge(msg.category)}
                      {getPriorityBadge(msg.priority)}
                      <span className="text-[10px] text-slate-500 font-mono">#{msg.id}</span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {new Date(msg.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isRead ? (
                        <button
                          onClick={() => markMessageAsRead(msg.id, currentUser?.full_name || 'Staff')}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-indigo-600 border border-indigo-200 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          Mark as Read
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Read
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Sender Info & Title */}
                  <div>
                    <div className="text-[10px] text-slate-500 mb-0.5">
                      From: <span className="font-semibold text-slate-700">{msg.sender_name}</span> ({msg.sender_role || 'Super Admin'})
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">{msg.title}</h3>
                    <p className="text-xs text-slate-700 leading-relaxed mt-1.5 whitespace-pre-line font-sans">
                      {msg.message}
                    </p>
                  </div>

                  {/* Action Required Box if present */}
                  {msg.action_required && (
                    <div className="p-3 bg-amber-50 text-amber-900 rounded-xl border border-amber-200 text-xs font-medium flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>{msg.action_required}</span>
                      </div>
                      {msg.action_label && (
                        <span className="px-2 py-1 bg-amber-200/80 text-amber-900 rounded text-[10px] font-bold shrink-0">
                          {msg.action_label}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Acknowledgment Section */}
                  {msg.requires_acknowledgment && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      {isAcknowledged ? (
                        <div className="flex items-start justify-between gap-2 text-xs">
                          <div>
                            <div className="font-bold text-emerald-700 flex items-center gap-1.5">
                              <CheckCheck className="w-4 h-4 text-emerald-600" />
                              <span>Acknowledged by {ackData?.user_name || 'Store Manager'}</span>
                              <span className="text-[10px] font-normal text-slate-500">
                                ({new Date(ackData.acknowledged_at).toLocaleTimeString()})
                              </span>
                            </div>
                            <p className="text-slate-600 text-[11px] italic mt-0.5">
                              Response Note: "{ackData.reply_notes}"
                            </p>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            CONFIRMED TO HQ
                          </span>
                        </div>
                      ) : (
                        <div>
                          {!isAckFormOpen ? (
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-slate-600 text-xs font-medium">
                                WCS Super Admin requires confirmation of receipt.
                              </span>
                              <button
                                onClick={() => setActiveAckMsgId(msg.id)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                              >
                                <CheckCheck className="w-3.5 h-3.5" />
                                <span>Acknowledge & Send Reply</span>
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2 animate-in fade-in duration-150">
                              <label className="block text-slate-700 text-xs font-semibold">
                                Send Confirmation Response to Super Admin HQ:
                              </label>
                              <input
                                type="text"
                                value={replyNotesMap[msg.id] || ''}
                                onChange={(e) =>
                                  setReplyNotesMap((prev) => ({ ...prev, [msg.id]: e.target.value }))
                                }
                                placeholder="e.g. Bank transfer slip emailed / Scheduled downtime noted..."
                                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                              />
                              <div className="flex items-center justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setActiveAckMsgId(null)}
                                  className="px-2.5 py-1 text-slate-500 hover:text-slate-700 text-xs font-medium"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAcknowledge(msg.id)}
                                  className="px-3.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                                >
                                  <Send className="w-3 h-3" />
                                  <span>Submit Response to HQ</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Store Workspace: <strong className="text-slate-700">{currentTenant?.shop_name}</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
