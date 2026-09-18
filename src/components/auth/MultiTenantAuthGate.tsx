import React, { useState, useEffect, useRef } from 'react';
import { useRetail } from '../../context/RetailContext';
import { BusinessType, UserAccount, UserRole } from '../../types';
import { SuperAdminPasswordModal } from '../superadmin/SuperAdminPasswordModal';
import { SuperAdminLoginModal } from '../superadmin/SuperAdminLoginModal';
import {
  ShieldCheck,
  Building2,
  Key,
  Lock,
  User,
  Store,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  LogOut,
  ChevronRight,
  UserCheck,
  Crown,
  Shield,
  CreditCard,
  Briefcase,
  KeyRound,
  RotateCcw,
  Search,
  Check,
  Unlock,
  Trash2,
  X,
  AlertTriangle,
  LayoutDashboard,
  Receipt,
  Package,
} from 'lucide-react';

interface MultiTenantAuthGateProps {
  isOpen: boolean;
  onClose?: () => void;
  onPostLoginAction?: (destination: 'POS' | 'DASHBOARD' | 'SALES' | 'PRODUCTS') => void;
}

export const MultiTenantAuthGate: React.FC<MultiTenantAuthGateProps> = ({
  isOpen,
  onClose,
  onPostLoginAction,
}) => {
  const {
    authSession,
    loginShopUser,
    logoutSession,
    validateLicenseKey,
    activateShopWithLicense,
    allTenants,
    users,
    authenticateSuperAdmin,
    isSuperAdminAuthenticated,
    currentTenantId,
    setCurrentTenantId,
    currentTenant,
    currentUser,
    superAdminPasswordHint,
    resetSuperAdminPasswordToDefault,
    updateUserAccount,
    deleteUserAccount,
    setUserPassword,
    addUserAccount,
  } = useRetail();

  const [mode, setMode] = useState<'LOGIN' | 'ACTIVATE_LICENSE' | 'SUPER_ADMIN'>('LOGIN');

  const openedShop =
    currentTenantId && currentTenantId !== 'SUPER_ADMIN' && currentTenant
      ? currentTenant
      : allTenants.find((t) => t.tenant_id === currentTenantId) || allTenants[0];

  const activeShopId = openedShop?.tenant_id || 'SHOP001';

  // Selected Role Option Button State in Login Tab
  const [selectedRoleOption, setSelectedRoleOption] = useState<UserRole>('OWNER');
  const [selectedShopId, setSelectedShopId] = useState<string>(activeShopId);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [postLoginDestination, setPostLoginDestination] = useState<'POS' | 'DASHBOARD' | 'SALES' | 'PRODUCTS'>('POS');
  const [requirePassword, setRequirePassword] = useState<boolean>(false);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'OWNER':
        return {
          label: 'Owner',
          icon: Crown,
          bg: 'bg-amber-950/70 border-amber-500/40 text-amber-300',
        };
      case 'ADMIN':
        return {
          label: 'Admin',
          icon: Shield,
          bg: 'bg-indigo-950/70 border-indigo-500/40 text-indigo-300',
        };
      case 'SHOP_ASSOCIATE':
      case 'SALES_ASSOCIATE':
        return {
          label: 'Associate',
          icon: Briefcase,
          bg: 'bg-pink-950/70 border-pink-500/40 text-pink-300',
        };
      case 'CASHIER':
      default:
        return {
          label: 'Cashier / User',
          icon: CreditCard,
          bg: 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300',
        };
    }
  };

  // Password studio modal from Auth Gate
  const [isPasswordStudioOpen, setIsPasswordStudioOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Shop User Login State
  const usernameInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const [username, setUsername] = useState(`${activeShopId.toLowerCase()}_owner`);
  const [password, setPassword] = useState('');
  const [tenantId, setTenantId] = useState(activeShopId);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSuperAdminLoginModalOpen, setIsSuperAdminLoginModalOpen] = useState(false);

  // Dedicated Change Password Modal State
  const [userForPasswordChange, setUserForPasswordChange] = useState<UserAccount | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('1234');
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState<string | null>(null);

  // Dedicated Delete User Modal State
  const [userToDelete, setUserToDelete] = useState<UserAccount | null>(null);
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState<string | null>(null);

  // Computed list of users for the opened store (including Owner, Admin, Cashier, and Sales Associate)
  const storeUsers = React.useMemo(() => {
    const shopSpecific = (users || []).filter(
      (u) => u.tenant_id === activeShopId && u.is_active && u.role !== 'SUPER_ADMIN'
    );
    if (shopSpecific.length > 0) {
      return shopSpecific;
    }
    // Fallback if no users registered yet
    return [
      {
        id: `USER_${activeShopId}_OWNER`,
        tenant_id: activeShopId,
        username: `${activeShopId.toLowerCase()}_owner`,
        full_name: `${openedShop?.shop_name || 'Store'} Owner`,
        email: `owner@${activeShopId.toLowerCase()}.lk`,
        role: 'OWNER' as UserRole,
        password: 'owner',
        pin_code: '1234',
        is_active: true,
        avatar_color: '#f59e0b',
      },
      {
        id: `USER_${activeShopId}_ADMIN`,
        tenant_id: activeShopId,
        username: `${activeShopId.toLowerCase()}_admin`,
        full_name: `${openedShop?.shop_name || 'Store'} Administrator`,
        email: `admin@${activeShopId.toLowerCase()}.lk`,
        role: 'ADMIN' as UserRole,
        password: 'admin',
        pin_code: '2222',
        is_active: true,
        avatar_color: '#6366f1',
      },
      {
        id: `USER_${activeShopId}_CASHIER`,
        tenant_id: activeShopId,
        username: `${activeShopId.toLowerCase()}_cashier`,
        full_name: 'Store Cashier',
        email: `cashier@${activeShopId.toLowerCase()}.lk`,
        role: 'CASHIER' as UserRole,
        password: 'pass',
        pin_code: '1111',
        is_active: true,
        avatar_color: '#10b981',
      },
      {
        id: `USER_${activeShopId}_ASSOCIATE`,
        tenant_id: activeShopId,
        username: `${activeShopId.toLowerCase()}_associate`,
        full_name: 'Shop Sales Associate',
        email: `associate@${activeShopId.toLowerCase()}.lk`,
        role: 'SHOP_ASSOCIATE' as UserRole,
        password: 'pass',
        pin_code: '3333',
        is_active: true,
        avatar_color: '#db2777',
        is_shop_associate: true,
        associate_code: 'SA-01',
        commission_percentage: 5.0,
      },
    ];
  }, [users, activeShopId, openedShop]);

  // Clean typed username
  const cleanTypedUser = username.trim().toLowerCase().replace(/^@+/, '');

  // Dynamic user matching based on typed username/email/role alias
  const matchedUserByTyping = React.useMemo(() => {
    if (!cleanTypedUser) return null;
    return (
      storeUsers.find((u) => u.username.toLowerCase() === cleanTypedUser) ||
      storeUsers.find((u) => ((u as any).email ? (u as any).email.toLowerCase() === cleanTypedUser : false)) ||
      (cleanTypedUser === 'admin' ? storeUsers.find((u) => u.role === 'ADMIN') : null) ||
      (cleanTypedUser === 'owner' ? storeUsers.find((u) => u.role === 'OWNER') : null) ||
      (cleanTypedUser === 'cashier' || cleanTypedUser === 'user' ? storeUsers.find((u) => u.role === 'CASHIER') : null) ||
      (cleanTypedUser === 'associate' || cleanTypedUser === 'sales_associate' || cleanTypedUser === 'kamal'
        ? storeUsers.find((u) => u.role === 'SHOP_ASSOCIATE' || u.role === 'SALES_ASSOCIATE' || u.is_shop_associate)
        : null)
    );
  }, [storeUsers, cleanTypedUser]);

  const selectedUser = React.useMemo(() => {
    if (matchedUserByTyping) return matchedUserByTyping;
    return (
      storeUsers.find((u) => u.id === selectedUserId) ||
      storeUsers[0]
    );
  }, [matchedUserByTyping, storeUsers, selectedUserId]);

  useEffect(() => {
    if (activeShopId && storeUsers.length > 0) {
      setSelectedShopId(activeShopId);
      setTenantId(activeShopId);
      const defaultUser = storeUsers[0];
      setSelectedUserId(defaultUser.id);
      setSelectedRoleOption(defaultUser.role as any);
      setUsername(defaultUser.username);
      setPassword('');
      if (defaultUser.role === 'OWNER' || defaultUser.role === 'ADMIN') {
        setPostLoginDestination('DASHBOARD');
      } else {
        setPostLoginDestination('POS');
      }
    }
  }, [activeShopId, storeUsers, isOpen]);

  const handleSelectUserAccount = (user: typeof storeUsers[0]) => {
    setSelectedUserId(user.id);
    setSelectedRoleOption(user.role as any);
    setUsername(user.username);
    setPassword('');
    setLoginError(null);
    if (user.role === 'OWNER' || user.role === 'ADMIN') {
      setPostLoginDestination('DASHBOARD');
    } else {
      setPostLoginDestination('POS');
    }
    setTimeout(() => {
      passwordInputRef.current?.focus();
    }, 50);
  };

  // Open Password Change Modal
  const handleOpenPasswordModal = (user: any) => {
    setUserForPasswordChange(user);
    setNewPasswordInput(user.password || '');
    setNewPinInput(user.pin_code || '');
    setShowModalPassword(false);
    setPasswordChangeSuccess(null);
  };

  // Save Changed Password & PIN
  const handleSavePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForPasswordChange) return;

    const targetId = userForPasswordChange.id;
    const cleanPass = newPasswordInput.trim();
    const cleanPin = newPinInput.trim();

    updateUserAccount(targetId, {
      id: targetId,
      tenant_id: userForPasswordChange.tenant_id || activeShopId,
      full_name: userForPasswordChange.full_name,
      username: userForPasswordChange.username,
      role: userForPasswordChange.role,
      password: cleanPass || undefined,
      pin_code: cleanPin || undefined,
      is_active: true,
      avatar_color: userForPasswordChange.avatar_color || '#4f46e5',
    });

    setPassword('');

    setPasswordChangeSuccess(`Password & PIN successfully updated for ${userForPasswordChange.full_name}!`);
    setTimeout(() => {
      setUserForPasswordChange(null);
      setPasswordChangeSuccess(null);
    }, 1200);
  };

  // Confirm Delete User
  const handleConfirmDeleteUser = () => {
    if (!userToDelete) return;

    deleteUserAccount(userToDelete.id);

    // If deleted user was currently selected, select another user
    const remaining = storeUsers.filter((u) => u.id !== userToDelete.id);
    if (remaining.length > 0) {
      handleSelectUserAccount(remaining[0]);
    }

    setDeleteSuccessMsg(`User @${userToDelete.username} deleted successfully.`);
    setTimeout(() => {
      setUserToDelete(null);
      setDeleteSuccessMsg(null);
    }, 1000);
  };

  // License Activation State
  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  const [newShopName, setNewShopName] = useState('');
  const [newBusinessType, setNewBusinessType] = useState<BusinessType>('grocery');
  const [newAdminName, setNewAdminName] = useState('Store Owner');
  const [newAdminUsername, setNewAdminUsername] = useState('owner');
  const [newAdminPassword, setNewAdminPassword] = useState('owner123');
  const [newAdminPin, setNewAdminPin] = useState('1234');
  const [activationStep, setActivationStep] = useState<1 | 2>(1);
  const [licenseValidationInfo, setLicenseValidationInfo] = useState<{
    tier?: string;
    clientName?: string;
  } | null>(null);
  const [activationError, setActivationError] = useState<string | null>(null);

  // Super Admin Login State
  const [superAdminPass, setSuperAdminPass] = useState('');
  const [superAdminError, setSuperAdminError] = useState<string | null>(null);

  // Helper to sync credentials when shop or role option button is clicked
  const handleSelectRoleOption = (role: UserRole, shopId?: string) => {
    setSelectedRoleOption(role);
    const targetShop = shopId || selectedShopId || 'SHOP001';
    setTenantId(targetShop);

    // Find a matching user for this shop and role
    const matched = storeUsers.find(
      (u) =>
        u.tenant_id === targetShop &&
        (u.role === role ||
          ((role === 'SHOP_ASSOCIATE' || role === 'SALES_ASSOCIATE') &&
            (u.role === 'SHOP_ASSOCIATE' || u.role === 'SALES_ASSOCIATE' || u.is_shop_associate)))
    );

    if (matched) {
      setSelectedUserId(matched.id);
      setUsername(matched.username);
      setPassword('');
    } else {
      setSelectedUserId('');
      if (role === 'OWNER') {
        setUsername(`${targetShop.toLowerCase()}_owner`);
      } else if (role === 'ADMIN') {
        setUsername(`${targetShop.toLowerCase()}_admin`);
      } else if (role === 'SHOP_ASSOCIATE' || role === 'SALES_ASSOCIATE') {
        setUsername(`${targetShop.toLowerCase()}_associate`);
      } else {
        setUsername(`${targetShop.toLowerCase()}_cashier`);
      }
      setPassword('');
    }

    // Set smart post-login destination by default
    if (role === 'OWNER' || role === 'ADMIN') {
      setPostLoginDestination('DASHBOARD');
    } else {
      setPostLoginDestination('POS');
    }
  };

  const handleSelectShop = (shopId: string) => {
    setSelectedShopId(shopId);
    setTenantId(shopId);
    handleSelectRoleOption(selectedRoleOption, shopId);
  };

  // Quick direct login by selected user / role and shop
  const handleQuickRoleLogin = (shopId: string, role: UserRole) => {
    setLoginError(null);
    const targetUser = storeUsers.find((u) => u.role === role) || selectedUser || storeUsers[0];
    const targetUsername = targetUser ? targetUser.username : username;
    const targetPass = targetUser?.password || (role === 'OWNER' ? 'owner' : role === 'ADMIN' ? 'admin' : 'pass');

    const result = loginShopUser({
      tenantId: shopId,
      username: targetUsername,
      password: targetPass,
      role: targetUser?.role || role,
    });

    if (!result.success) {
      setLoginError(result.message);
      return;
    }

    if (onPostLoginAction) {
      const defaultDest = role === 'OWNER' || role === 'ADMIN' ? 'DASHBOARD' : 'POS';
      onPostLoginAction(postLoginDestination || defaultDest);
    }

    if (onClose) onClose();
  };

  // Handle Standard Shop User Login (Username & Password Typed)
  const handleUserLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const cleanName = username.trim().replace(/^@+/, '');
    const effectiveRole = matchedUserByTyping?.role || selectedRoleOption;

    if (!cleanName) {
      setLoginError('Please enter a username.');
      usernameInputRef.current?.focus();
      return;
    }

    if (requirePassword && !password.trim()) {
      setLoginError('Password is required in strict password verification mode.');
      passwordInputRef.current?.focus();
      return;
    }

    const result = loginShopUser({
      username: cleanName,
      password: password.trim(),
      tenantId: tenantId ? tenantId.trim() : undefined,
      role: effectiveRole,
    });

    if (!result.success) {
      setLoginError(result.message);
      return;
    }

    if (onPostLoginAction) {
      onPostLoginAction(postLoginDestination);
    }

    if (onClose) onClose();
  };

  // Step 1: Validate License Key for Activation
  const handleValidateLicense = (e: React.FormEvent) => {
    e.preventDefault();
    setActivationError(null);

    const val = validateLicenseKey(licenseKeyInput.trim());
    if (!val.valid) {
      setActivationError(val.reason || 'Invalid license key.');
      return;
    }

    const lic = val.license;
    setLicenseValidationInfo({
      tier: lic?.package_tier,
      clientName: lic?.issued_to_client,
    });

    if (lic?.issued_to_client) {
      setNewShopName(lic.issued_to_client);
    }
    setActivationStep(2);
  };

  // Step 2: Provision Store and Create Admin Account
  const handleCompleteActivation = (e: React.FormEvent) => {
    e.preventDefault();
    setActivationError(null);

    if (!newShopName.trim()) {
      setActivationError('Please enter a valid shop name.');
      return;
    }

    const res = activateShopWithLicense({
      license_key: licenseKeyInput.trim(),
      shop_name: newShopName.trim(),
      company_name: `${newShopName.trim()} (Pvt) Ltd`,
      business_type: newBusinessType,
      owner_full_name: newAdminName.trim() || 'Store Owner',
      owner_username: newAdminUsername.trim() || 'owner',
      owner_password: newAdminPassword.trim() || 'owner123',
      owner_pin: newAdminPin.trim() || '1234',
    });

    if (!res.success) {
      setActivationError(res.message);
      return;
    }

    if (onClose) onClose();
  };

  // Handle Super Admin Password
  const handleSuperAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setSuperAdminError(null);

    const valid = authenticateSuperAdmin(superAdminPass);
    if (!valid) {
      setSuperAdminError('Incorrect Super Admin master password.');
      return;
    }

    setCurrentTenantId('SUPER_ADMIN');
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[94vh]">
        {/* Brand Banner */}
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/80 p-5 border-b border-slate-800 text-center relative">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center text-white shadow-xl shadow-indigo-900/40 mb-2.5">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black text-white tracking-tight">WCS Retail Cloud</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Multi-Tenant Point of Sale & Enterprise Retail Management
          </p>

          {/* Current Session indicator if already logged in */}
          {authSession?.isAuthenticated && (
            <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1 bg-emerald-950/80 border border-emerald-500/40 rounded-full text-xs text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>
                Current Session: <strong>{currentTenant?.shop_name || 'Shop'}</strong> (
                <strong>{currentUser?.full_name || currentUser?.username}</strong> - {currentUser?.role})
              </span>
            </div>
          )}
        </div>

        {/* Navigation Header */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 text-xs font-semibold">
          <div className="flex-1 py-3 px-6 border-b-2 border-indigo-500 text-indigo-400 bg-indigo-950/20 flex items-center justify-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            <span>Shop Sign In (First Step)</span>
          </div>
        </div>

        {/* Tab Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* TAB 1: SHOP USER LOGIN */}
          {mode === 'LOGIN' && (
            <div className="space-y-5 text-xs">
              {/* Step 1: Shop Selection */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5">
                {/* Active Opened Store Display */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Store className="w-4 h-4 text-indigo-400" />
                      <span>1. Opened Retail Store:</span>
                    </label>
                    <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">
                      ● Active Store
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-900 border border-slate-700/80 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xl shrink-0">
                        🏪
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-slate-100 truncate">
                          {openedShop?.shop_name || 'Store'}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono truncate">
                          {openedShop?.tenant_id} • {openedShop?.business_type?.toUpperCase()}
                          {openedShop?.branch_name ? ` • ${openedShop.branch_name}` : ''}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-1 rounded-md bg-slate-800 text-indigo-300 font-mono font-bold border border-slate-700 shrink-0">
                      {openedShop?.currency || 'LKR'}
                    </span>
                  </div>
                </div>
              </div>

              {loginError && (
                <div className="p-3 bg-rose-950/60 border border-rose-500/50 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{loginError}</span>
                </div>
              )}

              {/* Step 2: Select User Account to Login (Grid of Cards) */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-indigo-400" />
                    <span>2. Select User Account to Login:</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {storeUsers.length} Users Available
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {storeUsers.map((u) => {
                    const isSelected = selectedUserId === u.id || (!selectedUserId && selectedUser?.id === u.id);
                    const badge = getRoleBadge(u.role);
                    const RoleIcon = badge.icon;

                    return (
                      <div
                        key={u.id}
                        onClick={() => handleSelectUserAccount(u)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 relative group ${
                          isSelected
                            ? 'bg-indigo-950/50 border-indigo-500 ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-950/50'
                            : 'bg-slate-900/80 border-slate-800/90 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        {/* Header with avatar, name, username, and selected check */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs border border-white/10"
                              style={{ backgroundColor: u.avatar_color || '#4f46e5' }}
                            >
                              {u.full_name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-xs text-slate-100 truncate" title={u.full_name}>
                                {u.full_name}
                              </div>
                              <div className="text-[10px] text-indigo-400 font-mono truncate">
                                @{u.username}
                              </div>
                            </div>
                          </div>

                          {isSelected ? (
                            <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
                              <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
                            </span>
                          ) : (
                            <div className="w-5 h-5 rounded-full border border-slate-700 shrink-0 group-hover:border-slate-500" />
                          )}
                        </div>

                        {/* Footer with Role badge */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 gap-1">
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-md font-bold border flex items-center gap-1.5 shrink-0 ${badge.bg}`}>
                            <RoleIcon className="w-3 h-3 shrink-0" />
                            <span>{badge.label}</span>
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {isSelected ? '● Selected' : 'Click to select'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Username, Password & Login Form */}
              <form onSubmit={handleUserLogin} className="space-y-4 bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5">
                {/* Active Selected User Account Summary Banner */}
                <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
                      style={{ backgroundColor: selectedUser?.avatar_color || '#4f46e5' }}
                    >
                      {selectedUser?.full_name?.charAt(0) || 'U'}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-100 flex items-center gap-2 truncate">
                        <span>{selectedUser?.full_name || 'Staff User'}</span>
                        <span className="text-[10px] text-indigo-300 font-mono font-normal">
                          @{selectedUser?.username || username}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Role: <span className="font-semibold text-slate-300">{selectedUser?.role?.replace('_', ' ') || selectedRoleOption}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-900/50 text-indigo-300 font-mono border border-indigo-500/30">
                    Type or select account
                  </span>
                </div>

                {/* Username Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Username:</span>
                    </label>

                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      Type username & press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded-sm text-indigo-300 font-bold">Enter ↵</kbd> for password
                    </span>
                  </div>

                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-mono font-bold text-sm">
                      @
                    </div>
                    <input
                      ref={usernameInputRef}
                      type="text"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setLoginError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          passwordInputRef.current?.focus();
                          passwordInputRef.current?.select();
                        }
                      }}
                      placeholder="Type username (e.g. lankafresh_owner, admin, cashier, kamal)"
                      className="w-full bg-slate-900 border border-slate-700 hover:border-indigo-500 focus:border-indigo-500 rounded-xl pl-8 pr-4 py-3 text-sm text-slate-100 focus:outline-hidden font-mono"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Password:</span>
                    </label>

                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      Type password & press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded-sm text-indigo-300 font-bold">Enter ↵</kbd> to login
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      ref={passwordInputRef}
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setLoginError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleUserLogin(e);
                        }
                      }}
                      placeholder="Enter password"
                      className="w-full bg-slate-900 border border-slate-700 hover:border-indigo-500 focus:border-indigo-500 rounded-xl px-4 pr-10 py-3 text-sm text-slate-100 focus:outline-hidden font-mono"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: ACTIVATE NEW SHOP WITH LICENSE */}
          {mode === 'ACTIVATE_LICENSE' && (
            <div className="space-y-5 text-xs">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>Activate Customer Shop with License Key</span>
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Enter your issued WCS license key to provision and launch your independent store.
                </p>
              </div>

              {activationError && (
                <div className="p-3 bg-rose-950/60 border border-rose-500/50 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{activationError}</span>
                </div>
              )}

              {activationStep === 1 ? (
                <form onSubmit={handleValidateLicense} className="space-y-4">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 text-[11px] uppercase">
                      Enter WCS License Activation Key: *
                    </label>
                    <div className="relative">
                      <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
                      <input
                        type="text"
                        required
                        value={licenseKeyInput}
                        onChange={(e) => setLicenseKeyInput(e.target.value.toUpperCase())}
                        placeholder="e.g. LIC_NEW_PRO_01 or WCS-PRO-LK-..."
                        className="w-full bg-slate-950 border border-purple-500/50 rounded-xl pl-9 pr-3 py-2.5 text-xs font-mono text-purple-300 focus:outline-hidden focus:border-purple-400 tracking-wider"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <span>Validate License & Proceed</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleCompleteActivation} className="space-y-4">
                  <div className="p-3 bg-purple-950/40 border border-purple-500/40 rounded-xl space-y-1">
                    <div className="text-[10px] text-purple-300 uppercase font-semibold">License Validated</div>
                    <div className="text-sm font-bold text-white">
                      Tier: {licenseValidationInfo?.tier || 'PROFESSIONAL'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 text-[11px] uppercase">
                      Shop / Store Name: *
                    </label>
                    <input
                      type="text"
                      required
                      value={newShopName}
                      onChange={(e) => setNewShopName(e.target.value)}
                      placeholder="e.g. Royal Supermarket"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-hidden focus:border-purple-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1 text-[11px] uppercase">
                        Business Domain:
                      </label>
                      <select
                        value={newBusinessType}
                        onChange={(e) => setNewBusinessType(e.target.value as BusinessType)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-hidden focus:border-purple-500"
                      >
                        <option value="grocery">Grocery & Supermarket</option>
                        <option value="automobile">Auto Spares & Parts</option>
                        <option value="pharmacy">Pharmacy & Healthcare</option>
                        <option value="restaurant">Restaurant & Cafe</option>
                        <option value="wholesale">Wholesale Trading</option>
                        <option value="phone_shop">Phone & Electronics</option>
                        <option value="computer_shop">Computer & IT Shop</option>
                        <option value="hardware">Hardware & Construction</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1 text-[11px] uppercase">
                        Owner Full Name:
                      </label>
                      <input
                        type="text"
                        value={newAdminName}
                        onChange={(e) => setNewAdminName(e.target.value)}
                        placeholder="Owner Name"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-hidden focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1 text-[11px] uppercase">
                        Owner Username:
                      </label>
                      <input
                        type="text"
                        value={newAdminUsername}
                        onChange={(e) => setNewAdminUsername(e.target.value)}
                        placeholder="owner"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200 font-mono focus:outline-hidden focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1 text-[11px] uppercase">
                        Owner Password:
                      </label>
                      <input
                        type="password"
                        value={newAdminPassword}
                        onChange={(e) => setNewAdminPassword(e.target.value)}
                        placeholder="owner123"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200 font-mono focus:outline-hidden focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Complete Activation & Launch Store</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: SUPER ADMIN LOGIN */}
          {mode === 'SUPER_ADMIN' && (
            <div className="space-y-5 text-xs">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>WCS Super Administrator Headquarters</span>
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Access master tenant provisioning, remote license controls, risk monitors, and updates.
                </p>
              </div>

              {superAdminError && (
                <div className="p-3 bg-rose-950/60 border border-rose-500/50 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{superAdminError}</span>
                </div>
              )}

              <form onSubmit={handleSuperAdminLogin} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-slate-300 font-semibold text-[11px] uppercase flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Master Headquarters Password (Manual Optional):</span>
                    </label>

                    {/* Change HQ Password button */}
                    <button
                      type="button"
                      onClick={() => setIsPasswordStudioOpen(true)}
                      className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-950/50 border border-amber-500/30 cursor-pointer transition-colors"
                    >
                      <Key className="w-3 h-3" />
                      <span>Change HQ Password</span>
                    </button>
                  </div>

                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-amber-400" />
                    <input
                      type="password"
                      value={superAdminPass}
                      onChange={(e) => setSuperAdminPass(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-950 border border-amber-500/50 rounded-xl pl-9 pr-24 py-2.5 text-xs text-slate-200 focus:outline-hidden focus:border-amber-400 font-mono tracking-widest"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/30">
                        XXXX MASKED
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl shadow-lg shadow-amber-900/30 flex items-center justify-center gap-2 cursor-pointer transition-all text-xs"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Authenticate & Enter Headquarters</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Cloud Network Online</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Special Super Admin Panel Login Button */}
            <button
              type="button"
              onClick={() => setIsSuperAdminLoginModalOpen(true)}
              className="px-2.5 py-1 bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-300 hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>Super Admin Panel Login</span>
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Super Admin Login Modal */}
      <SuperAdminLoginModal
        isOpen={isSuperAdminLoginModalOpen}
        onClose={() => setIsSuperAdminLoginModalOpen(false)}
        onSuccess={() => {
          setIsSuperAdminLoginModalOpen(false);
          if (onClose) onClose();
          setCurrentTenantId('SUPER_ADMIN');
        }}
        onOpenPasswordStudio={() => {
          setIsSuperAdminLoginModalOpen(false);
          setIsPasswordStudioOpen(true);
        }}
      />

      {/* Super Admin Password Studio Modal */}
      <SuperAdminPasswordModal
        isOpen={isPasswordStudioOpen}
        onClose={() => setIsPasswordStudioOpen(false)}
      />

      {/* User Password & PIN Change Modal */}
      {userForPasswordChange && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-100">
                    Change Password & PIN
                  </h4>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {userForPasswordChange.full_name} (@{userForPasswordChange.username})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setUserForPasswordChange(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content / Form */}
            <form onSubmit={handleSavePasswordChange} className="p-4 space-y-4 text-xs">
              {passwordChangeSuccess && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-[11px] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{passwordChangeSuccess}</span>
                </div>
              )}

              {/* User Role & Info Badge */}
              <div className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center text-white font-bold text-[10px]"
                    style={{ backgroundColor: userForPasswordChange.avatar_color || '#4f46e5' }}
                  >
                    {userForPasswordChange.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="font-bold text-slate-200">{userForPasswordChange.full_name}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 font-bold font-mono">
                  {userForPasswordChange.role}
                </span>
              </div>

              {/* Password Field (Manual Entry - Optional) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-slate-300 uppercase flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Password:</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    (Manual Entry / Optional)
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showModalPassword ? 'text' : 'password'}
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="Enter password manually (optional)"
                    className="w-full bg-slate-950 border border-slate-700 hover:border-indigo-500 focus:border-indigo-500 rounded-xl px-3.5 pr-10 py-2.5 text-xs text-slate-100 focus:outline-hidden font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowModalPassword(!showModalPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer p-1"
                  >
                    {showModalPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* 4-Digit PIN Code Field (Manual Entry - Optional) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-slate-300 uppercase flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>4-Digit PIN Code:</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    (Manual Entry / Optional)
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={4}
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="Enter 4-digit PIN manually (optional)"
                  className="w-full bg-slate-950 border border-slate-700 hover:border-indigo-500 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-hidden font-mono font-bold tracking-widest text-center placeholder:font-normal placeholder:tracking-normal placeholder:text-xs placeholder:text-slate-500"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setUserForPasswordChange(null)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Save Password & PIN</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-rose-950/40 border-b border-rose-500/20 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-100">Delete User Account</h4>
                <p className="text-[10px] text-rose-300">Are you sure you want to remove this user?</p>
              </div>
            </div>

            <div className="p-4 space-y-3 text-xs">
              {deleteSuccessMsg ? (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{deleteSuccessMsg}</span>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <div className="font-bold text-slate-100">{userToDelete.full_name}</div>
                    <div className="text-[11px] text-indigo-300 font-mono">@{userToDelete.username}</div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Role: <strong className="text-slate-300">{userToDelete.role}</strong> • Shop: {openedShop?.shop_name || activeShopId}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    This user will no longer be able to log in to this store. This action can be undone by re-adding the user.
                  </p>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setUserToDelete(null)}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDeleteUser}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Yes, Delete User</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
