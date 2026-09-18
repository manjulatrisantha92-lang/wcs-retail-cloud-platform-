import React from 'react';
import { useRetail } from '../../context/RetailContext';
import { ShieldAlert, Bell, CheckCircle2, X, AlertTriangle } from 'lucide-react';

export const RemoteAlertModal: React.FC = () => {
  const { remoteAlertPopup, clearRemoteAlertPopup } = useRetail();

  if (!remoteAlertPopup) return null;

  return (
    <div className="fixed inset-0 z-[9998] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border-2 border-amber-500/70 rounded-3xl max-w-md w-full p-6 shadow-2xl text-slate-100 relative overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-2xl shrink-0">
            <ShieldAlert className="w-6 h-6 animate-bounce" />
          </div>

          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
              Direct Security Notice
            </span>
            <h2 className="text-base font-bold text-white">
              {remoteAlertPopup.title || 'Administrative Message'}
            </h2>
          </div>

          <button
            onClick={clearRemoteAlertPopup}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 p-4 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs text-slate-200 leading-relaxed">
          {remoteAlertPopup.message}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={clearRemoteAlertPopup}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Understood & Acknowledge</span>
          </button>
        </div>
      </div>
    </div>
  );
};
