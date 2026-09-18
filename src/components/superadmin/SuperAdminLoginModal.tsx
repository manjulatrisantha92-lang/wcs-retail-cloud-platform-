import React, { useState, useEffect } from 'react';
import { useRetail } from '../../context/RetailContext';
import { 
  ShieldCheck, 
  Lock, 
  X, 
  KeyRound, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  HelpCircle,
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface SuperAdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPasswordStudio?: () => void;
  onSuccess?: () => void;
}

export const SuperAdminLoginModal: React.FC<SuperAdminLoginModalProps> = ({
  isOpen,
  onClose,
  onOpenPasswordStudio,
  onSuccess,
}) => {
  const { 
    authenticateSuperAdmin, 
    superAdminPasswordHint,
    resetSuperAdminPasswordToDefault 
  } = useRetail();

  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setErrorMsg('');
      setShowHint(false);
      setShowResetConfirm(false);
      setResetSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setErrorMsg('Please enter the Super Admin master password');
      triggerShake();
      return;
    }

    const success = authenticateSuperAdmin(password);
    if (success) {
      setErrorMsg('');
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } else {
      setErrorMsg('Incorrect Super Admin Password. Access denied.');
      triggerShake();
    }
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleResetPassword = () => {
    resetSuperAdminPasswordToDefault();
    setShowResetConfirm(false);
    setResetSuccess(true);
    setPassword('');
    setTimeout(() => setResetSuccess(false), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div 
        className={`bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl text-slate-100 transition-all ${
          isShaking ? 'animate-bounce' : ''
        }`}
      >
        {/* Header Banner */}
        <div className="relative p-6 bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-inner">
                <ShieldCheck className="w-6 h-6 text-purple-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-slate-100 tracking-tight">
                    Super Admin Portal
                  </h2>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    HQ Gate
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Platform license controls, kill-switch & tenant management
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {resetSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Master password successfully restored to factory default key.</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Enter Super Admin Password
              </label>
              <span className="text-[10px] text-purple-300/80 font-mono font-bold flex items-center gap-1">
                <Lock className="w-3 h-3 text-purple-400" />
                <span>Masked (XXXX Type)</span>
              </span>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4 text-purple-400" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-28 py-2.5 text-base sm:text-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 font-mono tracking-widest select-none"
                autoFocus
                autoComplete="current-password"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-[10px] font-mono font-bold text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-500/30 tracking-normal shadow-xs">
                  XXXX MASKED
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 px-0.5">
              <span className="text-slate-400">
                Type password masked. Plain-text view disabled.
              </span>
              {password.length > 0 && (
                <span className="font-mono text-purple-300 font-bold bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-500/20">
                  {password.length} chars (●●●●)
                </span>
              )}
            </div>
          </div>

          {/* Password Hint Drawer */}
          <div className="flex items-center justify-between text-xs pt-1">
            {superAdminPasswordHint ? (
              <button
                type="button"
                onClick={() => setShowHint(!showHint)}
                className="text-purple-400 hover:text-purple-300 flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{showHint ? 'Hide hint' : 'Show password hint'}</span>
              </button>
            ) : <span />}

            {onOpenPasswordStudio && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPasswordStudio();
                }}
                className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Create / Change Password</span>
              </button>
            )}
          </div>

          {showHint && superAdminPasswordHint && (
            <div className="p-3 bg-purple-950/40 border border-purple-800/40 rounded-xl text-xs text-purple-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-purple-300">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Password Hint:</span>
              </div>
              <p className="text-slate-300">{superAdminPasswordHint}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Unlock Super Admin Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 px-4 bg-slate-800/80 hover:bg-slate-800 text-slate-300 font-medium text-xs rounded-xl border border-slate-700/60 transition-colors cursor-pointer"
            >
              Cancel & Return to Store
            </button>
          </div>

          {/* Emergency Reset Section */}
          <div className="border-t border-slate-800 pt-3 text-center">
            {!showResetConfirm ? (
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="text-[11px] text-slate-500 hover:text-slate-400 transition-colors cursor-pointer flex items-center justify-center gap-1 mx-auto"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Forgot password? Reset to default key</span>
              </button>
            ) : (
              <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                <p className="text-[11px] text-slate-300">
                  Reset master password to factory default key?
                </p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] rounded-lg transition-colors cursor-pointer"
                  >
                    Confirm Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className="px-2.5 py-1 bg-slate-800 text-slate-400 hover:text-slate-200 text-[10px] rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
