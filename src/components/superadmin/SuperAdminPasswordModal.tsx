import React, { useState, useEffect, useMemo } from 'react';
import { useRetail } from '../../context/RetailContext';
import { 
  KeyRound, 
  Lock, 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  Sparkles, 
  Calendar, 
  Check, 
  Shield, 
  Dices, 
  Copy 
} from 'lucide-react';

interface SuperAdminPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SuperAdminPasswordModal: React.FC<SuperAdminPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { 
    verifySuperAdminPassword, 
    setSuperAdminPassword, 
    resetSuperAdminPasswordToDefault,
    superAdminPasswordUpdatedAt,
    superAdminPasswordHint,
    isSuperAdminAuthenticated,
    isSuperAdminMode,
    currentUser,
    authSession
  } = useRetail();

  const isAlreadySuperAdmin = isSuperAdminAuthenticated || isSuperAdminMode || currentUser?.role === 'SUPER_ADMIN' || authSession?.authType === 'SUPER_ADMIN';

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordHint, setPasswordHint] = useState(superAdminPasswordHint || '');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Sync state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordHint(superAdminPasswordHint || '');
      setErrorMsg('');
      setSuccessMsg('');
      setShowResetConfirm(false);
      setCopiedNotification(false);
    }
  }, [isOpen, superAdminPasswordHint]);

  // Password strength calculation
  const strengthInfo = useMemo(() => {
    if (!newPassword) return { score: 0, label: 'None', color: 'bg-slate-700', text: 'text-slate-400' };
    let score = 0;
    if (newPassword.length >= 6) score += 1;
    if (newPassword.length >= 8) score += 1;
    if (/[0-9]/.test(newPassword)) score += 1;
    if (/[A-Z]/.test(newPassword) || /[^A-Za-z0-9]/.test(newPassword)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-rose-500', text: 'text-rose-400' };
    if (score === 2 || score === 3) return { score: 2, label: 'Medium', color: 'bg-amber-500', text: 'text-amber-400' };
    return { score: 3, label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-400' };
  }, [newPassword]);

  const formattedDate = useMemo(() => {
    try {
      return new Date(superAdminPasswordUpdatedAt).toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Recently';
    }
  }, [superAdminPasswordUpdatedAt]);

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    let pass = 'WCS-Admin@';
    for (let i = 0; i < 4; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
    setConfirmPassword(pass);
    setErrorMsg('');
  };

  const handleCopyPassword = () => {
    if (!newPassword) return;
    navigator.clipboard.writeText(newPassword);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // If user is not already authenticated, verify current password
    if (!isAlreadySuperAdmin) {
      if (!currentPassword) {
        setErrorMsg('Please enter your current master password to verify authorization.');
        return;
      }
      if (!verifySuperAdminPassword(currentPassword)) {
        setErrorMsg('Current master password is incorrect. Verification failed.');
        return;
      }
    }

    const trimmedNew = newPassword.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedNew) {
      setErrorMsg('Please enter a new master password.');
      return;
    }

    if (trimmedNew.length < 4) {
      setErrorMsg('New password must be at least 4 characters long.');
      return;
    }

    if (trimmedNew !== trimmedConfirm) {
      setErrorMsg('New password and confirmation do not match. Please re-enter.');
      return;
    }

    // Save new password
    setSuperAdminPassword(trimmedNew, passwordHint.trim() || undefined);
    setSuccessMsg('Super Admin Master Password created and updated successfully!');

    if (onSuccess) {
      onSuccess();
    }

    setTimeout(() => {
      onClose();
    }, 1800);
  };

  const handleResetDefault = () => {
    resetSuperAdminPasswordToDefault();
    setShowResetConfirm(false);
    setSuccessMsg('Master Password restored to default factory key.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordHint('');
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-100 tracking-tight">
                  Super Admin Password Studio
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Security
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Create, update, or restore master password for WCS Headquarters access
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Status Banners */}
          {successMsg && (
            <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {copiedNotification && (
            <div className="p-2.5 bg-indigo-500/20 border border-indigo-500/40 rounded-xl text-xs text-indigo-300 flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-indigo-400" />
              <span>New password copied to clipboard!</span>
            </div>
          )}

          {/* Current Password (if verification needed when not already authenticated) */}
          {!isAlreadySuperAdmin && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Current Super Admin Password <span className="text-rose-400">*</span>
                </label>
                <span className="text-[10px] text-slate-400 font-normal">
                  Default: <strong className="text-purple-300">admin123</strong>
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4 text-purple-400" />
                </div>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-24 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 font-mono tracking-widest"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded tracking-normal">
                    XXXX MASKED
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* New Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                New Super Admin Password <span className="text-purple-400">*</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="text-[11px] font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Dices className="w-3.5 h-3.5" />
                  <span>Generate</span>
                </button>
                {newPassword && (
                  <span className={`text-[11px] font-bold ${strengthInfo.text}`}>
                    • {strengthInfo.label}
                  </span>
                )}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <KeyRound className="w-4 h-4 text-purple-400" />
              </div>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-24 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 font-mono tracking-widest"
                autoFocus={isAlreadySuperAdmin}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1.5">
                {newPassword && (
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    title="Copy password"
                    className="text-slate-400 hover:text-slate-200 cursor-pointer p-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                )}
                <span className="text-[10px] font-mono font-bold text-purple-400 bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-500/30 tracking-normal pointer-events-none">
                  XXXX MASKED
                </span>
              </div>
            </div>

            {/* Strength Bar */}
            {newPassword && (
              <div className="grid grid-cols-3 gap-1.5 mt-2">
                <div className={`h-1.5 rounded-full transition-all ${strengthInfo.score >= 1 ? strengthInfo.color : 'bg-slate-800'}`} />
                <div className={`h-1.5 rounded-full transition-all ${strengthInfo.score >= 2 ? strengthInfo.color : 'bg-slate-800'}`} />
                <div className={`h-1.5 rounded-full transition-all ${strengthInfo.score >= 3 ? strengthInfo.color : 'bg-slate-800'}`} />
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Confirm New Password <span className="text-purple-400">*</span>
              </label>
              {confirmPassword && newPassword === confirmPassword && (
                <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Matches
                </span>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Shield className="w-4 h-4 text-purple-400" />
              </div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-24 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 font-mono tracking-widest"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded tracking-normal">
                  XXXX MASKED
                </span>
              </div>
            </div>
          </div>

          {/* Password Recovery Hint */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Password Recovery Hint / Reminder <span className="text-slate-500 font-normal lowercase">(optional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Sparkles className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={passwordHint}
                onChange={(e) => setPasswordHint(e.target.value)}
                placeholder="e.g. Colombo office code / Director mobile pin..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500"
              />
            </div>
          </div>

          {/* Meta Info Box */}
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Last Modified: <strong className="text-slate-300">{formattedDate}</strong></span>
            </span>
            <span className="flex items-center gap-1 text-purple-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Cloud Local Sync Active</span>
            </span>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
            <button
              type="submit"
              className="w-full sm:flex-1 py-2.5 px-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save & Update Super Admin Password</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>

          {/* Reset Section */}
          <div className="border-t border-slate-800/80 pt-3 text-center">
            {!showResetConfirm ? (
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="text-[11px] text-slate-500 hover:text-rose-400 transition-colors cursor-pointer flex items-center justify-center gap-1 mx-auto"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restore default factory master password</span>
              </button>
            ) : (
              <div className="p-3 bg-slate-950 border border-rose-500/30 rounded-xl space-y-2">
                <p className="text-xs text-rose-300 font-medium">
                  Are you sure you want to reset the Super Admin password to factory default key?
                </p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetDefault}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Yes, Reset to Default
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className="px-3 py-1.5 bg-slate-800 text-slate-300 hover:text-slate-100 text-xs rounded-lg transition-colors cursor-pointer"
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
