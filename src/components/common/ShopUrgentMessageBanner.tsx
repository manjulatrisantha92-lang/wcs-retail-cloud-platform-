import React from 'react';
import { useRetail } from '../../context/RetailContext';
import { AlertTriangle, Bell, CheckCheck, ShieldAlert, X } from 'lucide-react';

interface ShopUrgentMessageBannerProps {
  onOpenMessagesModal: () => void;
}

export const ShopUrgentMessageBanner: React.FC<ShopUrgentMessageBannerProps> = ({ onOpenMessagesModal }) => {
  const { urgentUnreadMessage, currentTenantId, markMessageAsRead, currentUser } = useRetail();

  if (!urgentUnreadMessage) return null;

  return (
    <div className="bg-gradient-to-r from-rose-700 via-red-600 to-rose-700 text-white px-4 py-2.5 shadow-md flex items-center justify-between text-xs z-40 border-b border-rose-800 animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-2.5 overflow-hidden">
        <span className="p-1.5 bg-white/20 rounded-lg shrink-0">
          <ShieldAlert className="w-4 h-4 text-white animate-pulse" />
        </span>
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-bold tracking-wide uppercase text-[10px] bg-white text-rose-800 px-1.5 py-0.5 rounded font-mono shrink-0">
            URGENT HQ NOTICE
          </span>
          <span className="font-bold truncate">{urgentUnreadMessage.title}</span>
          <span className="hidden md:inline text-rose-100 text-[11px] truncate">
            — {urgentUnreadMessage.message}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onOpenMessagesModal}
          className="px-3 py-1 bg-white hover:bg-rose-50 text-rose-700 font-bold rounded-lg text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
        >
          <Bell className="w-3.5 h-3.5" />
          <span>View & Acknowledge</span>
        </button>
        <button
          onClick={() => markMessageAsRead(urgentUnreadMessage.id, currentUser?.full_name)}
          title="Dismiss banner"
          className="p-1 hover:bg-white/20 rounded-md text-white/80 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
