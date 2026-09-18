import React, { useState } from 'react';
import { useRetail } from '../../context/RetailContext';
import { UserAccount, UserRole } from '../../types';
import {
  Users,
  Plus,
  Shield,
  Key,
  Trash2,
  CheckCircle2,
  Lock,
  Unlock,
  X,
  UserCheck,
  Edit2,
  Search,
  AlertTriangle,
  UserX,
  Phone,
  Mail,
  UserPlus,
  Eye,
  EyeOff,
  Sparkles,
  KeyRound,
  ShieldAlert,
  Crown,
  CreditCard,
  Briefcase,
  Check,
  ArrowRight,
  LogIn,
  Sliders,
  ShieldCheck,
} from 'lucide-react';

const AVATAR_COLORS = [
  '#4f46e5', // Indigo
  '#059669', // Emerald
  '#d97706', // Amber
  '#dc2626', // Red
  '#7c3aed', // Purple
  '#0891b2', // Cyan
  '#db2777', // Pink
  '#475569', // Slate
];

export const UserManager: React.FC = () => {
  const {
    tenantUsers,
    currentUser,
    currentTenant,
    addUserAccount,
    updateUserAccount,
    deleteUserAccount,
    setUserPassword,
    removeUserPassword,
    currentTenantId,
    setCurrentUser,
    employees,
    addEmployee,
    updateEmployee,
  } = useRetail();

  const safeUsers = tenantUsers || [];
  const safeEmployees = employees || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('CASHIER');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [avatarColor, setAvatarColor] = useState('#4f46e5');
  const [isShopAssociate, setIsShopAssociate] = useState(false);
  const [associateCode, setAssociateCode] = useState('');
  const [commissionRate, setCommissionRate] = useState<number>(5.0);

  // Dedicated Password Modal State
  const [passwordTargetUser, setPasswordTargetUser] = useState<UserAccount | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Delete Confirmation State
  const [userToDelete, setUserToDelete] = useState<UserAccount | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Add User with specific preset role
  const handleOpenAddWithRole = (presetRole: UserRole) => {
    setEditingUser(null);
    setRole(presetRole);
    setIsActive(true);
    setShowPassword(false);
    setAvatarColor(AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]);

    const randId = Math.floor(10 + Math.random() * 90);
    if (presetRole === 'OWNER') {
      setFullName('Store Co-Owner');
      setUsername(`owner_${randId}`);
      setEmail(`owner${randId}@${currentTenant?.tenant_id?.toLowerCase() || 'shop'}.lk`);
      setPassword('');
      setPinCode('');
      setIsShopAssociate(false);
    } else if (presetRole === 'ADMIN') {
      setFullName('Shop Administrator');
      setUsername(`admin_${randId}`);
      setEmail(`admin${randId}@${currentTenant?.tenant_id?.toLowerCase() || 'shop'}.lk`);
      setPassword('');
      setPinCode('');
      setIsShopAssociate(false);
    } else if (presetRole === 'STORE_MANAGER') {
      setFullName('Store Manager');
      setUsername(`manager_${randId}`);
      setEmail(`manager${randId}@${currentTenant?.tenant_id?.toLowerCase() || 'shop'}.lk`);
      setPassword('');
      setPinCode('');
      setIsShopAssociate(false);
    } else if (presetRole === 'SHOP_ASSOCIATE' || presetRole === 'SALES_ASSOCIATE') {
      setFullName('Shop Sales Associate');
      setUsername(`associate_${randId}`);
      setEmail(`associate${randId}@${currentTenant?.tenant_id?.toLowerCase() || 'shop'}.lk`);
      setPassword('');
      setPinCode('');
      setIsShopAssociate(true);
      setAssociateCode(`SA-${randId}`);
      setCommissionRate(5.0);
    } else {
      setFullName('POS Cashier');
      setUsername(`cashier_${randId}`);
      setEmail(`cashier${randId}@${currentTenant?.tenant_id?.toLowerCase() || 'shop'}.lk`);
      setPassword('');
      setPinCode('');
      setIsShopAssociate(false);
      setAssociateCode('');
    }

    setIsModalOpen(true);
  };

  const handleOpenAdd = () => {
    handleOpenAddWithRole('CASHIER');
  };

  const handleOpenEdit = (u: UserAccount) => {
    setEditingUser(u);
    setFullName(u.full_name);
    setUsername(u.username);
    setEmail(u.email);
    setRole(u.role);
    setPassword(u.password || '');
    setShowPassword(false);
    setPinCode(u.pin_code || '');
    setIsActive(u.is_active);
    setAvatarColor(u.avatar_color || '#4f46e5');

    // Check matching employee
    const matchedEmp = safeEmployees.find(
      (e) => e.user_account_id === u.id || e.name.toLowerCase() === u.full_name.toLowerCase()
    );
    if (matchedEmp) {
      setIsShopAssociate(Boolean(matchedEmp.is_shop_associate || u.role === 'SHOP_ASSOCIATE' || u.role === 'SALES_ASSOCIATE'));
      setAssociateCode(matchedEmp.associate_code || '');
      setCommissionRate(matchedEmp.commission_percentage || 5.0);
    } else {
      setIsShopAssociate(u.role === 'SHOP_ASSOCIATE' || u.role === 'SALES_ASSOCIATE');
      setAssociateCode('');
      setCommissionRate(5.0);
    }

    setIsModalOpen(true);
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
    let res = '';
    for (let i = 0; i < 8; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(res);
    setShowPassword(true);
  };

  const generateRandomQuickPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
    let res = '';
    for (let i = 0; i < 8; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPasswordInput(res);
    setShowNewPassword(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !username.trim()) {
      showFeedback('Please fill in user full name and login username', 'error');
      return;
    }

    const cleanUsername = username.trim().toLowerCase();

    // Check duplicate username if adding new
    if (!editingUser) {
      const exists = safeUsers.some((u) => u.username.toLowerCase() === cleanUsername);
      if (exists) {
        showFeedback(`Username "${cleanUsername}" is already taken. Please choose another.`, 'error');
        return;
      }
    }

    const isAssociate = isShopAssociate || role === 'SHOP_ASSOCIATE' || role === 'SALES_ASSOCIATE';
    const effectiveRole: UserRole = isAssociate ? 'SHOP_ASSOCIATE' : role;

    if (editingUser) {
      updateUserAccount(editingUser.id, {
        full_name: fullName.trim(),
        username: cleanUsername,
        email: email.trim() || `${cleanUsername}@${currentTenant?.tenant_id?.toLowerCase() || 'shop'}.lk`,
        role: effectiveRole,
        password: password.trim() ? password.trim() : undefined,
        pin_code: pinCode.trim() ? pinCode.trim() : undefined,
        is_active: isActive,
        avatar_color: avatarColor,
      });

      // Sync employee profile
      const matchedEmp = safeEmployees.find(
        (emp) => emp.user_account_id === editingUser.id || emp.name.toLowerCase() === fullName.trim().toLowerCase()
      );
      if (matchedEmp) {
        updateEmployee(matchedEmp.id, {
          name: fullName.trim(),
          is_shop_associate: isAssociate,
          associate_code: isAssociate && associateCode.trim() ? associateCode.trim().toUpperCase() : undefined,
          commission_percentage: isAssociate ? Number(commissionRate) || 5.0 : undefined,
          is_active: isActive,
        });
      } else if (isAssociate) {
        addEmployee({
          user_account_id: editingUser.id,
          name: fullName.trim(),
          designation: 'Shop Sales Associate',
          department: 'Sales & Floor Operations',
          phone: '077' + Math.floor(1000000 + Math.random() * 9000000),
          nic: '199' + Math.floor(10000000 + Math.random() * 90000000) + 'V',
          base_salary: 45000,
          allowance: 5000,
          is_active: isActive,
          is_shop_associate: true,
          associate_code: associateCode.trim() ? associateCode.trim().toUpperCase() : undefined,
          commission_percentage: Number(commissionRate) || 5.0,
          join_date: new Date().toISOString().slice(0, 10),
          joined_date: new Date().toISOString().slice(0, 10),
        });
      }

      showFeedback(`User account "${fullName}" updated successfully!`);
    } else {
      addUserAccount({
        full_name: fullName.trim(),
        username: cleanUsername,
        email: email.trim() || `${cleanUsername}@${currentTenant?.tenant_id?.toLowerCase() || 'shop'}.lk`,
        role: effectiveRole,
        password: password.trim() ? password.trim() : undefined,
        pin_code: pinCode.trim() ? pinCode.trim() : undefined,
        is_active: isActive,
        avatar_color: avatarColor,
      });

      if (isAssociate) {
        addEmployee({
          name: fullName.trim(),
          designation: 'Shop Sales Associate',
          department: 'Sales & Floor Operations',
          phone: '077' + Math.floor(1000000 + Math.random() * 9000000),
          nic: '199' + Math.floor(10000000 + Math.random() * 90000000) + 'V',
          base_salary: 45000,
          allowance: 5000,
          is_active: isActive,
          is_shop_associate: true,
          associate_code: associateCode.trim() ? associateCode.trim().toUpperCase() : undefined,
          commission_percentage: Number(commissionRate) || 5.0,
          join_date: new Date().toISOString().slice(0, 10),
          joined_date: new Date().toISOString().slice(0, 10),
        });
      }

      showFeedback(`New staff member "${fullName}" added successfully!`);
    }

    setIsModalOpen(false);
  };

  const handleOpenPasswordModal = (u: UserAccount) => {
    setPasswordTargetUser(u);
    setNewPasswordInput(u.password || '');
    setShowNewPassword(false);
  };

  const handleSavePasswordModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordTargetUser) return;

    if (newPasswordInput.trim()) {
      setUserPassword(passwordTargetUser.id, newPasswordInput.trim());
      showFeedback(`Password updated for ${passwordTargetUser.full_name}`);
    } else {
      removeUserPassword(passwordTargetUser.id);
      showFeedback(`Password removed for ${passwordTargetUser.full_name} (User can now log in without a password)`);
    }

    setPasswordTargetUser(null);
  };

  const handleQuickRemovePassword = (u: UserAccount) => {
    removeUserPassword(u.id);
    showFeedback(`Password removed for ${u.full_name}. Passwordless login enabled.`);
  };

  const handleToggleStatus = (u: UserAccount) => {
    updateUserAccount(u.id, { is_active: !u.is_active });
    showFeedback(`Status for ${u.full_name} changed to ${!u.is_active ? 'Active' : 'Inactive'}`);
  };

  const handleSwitchToUser = (u: UserAccount) => {
    setCurrentUser(u);
    showFeedback(`Switched active session to: ${u.full_name} (${u.role})`);
  };

  const handleConfirmDelete = () => {
    if (!userToDelete) return;
    if (userToDelete.id === currentUser?.id) {
      showFeedback('You cannot remove the account you are currently logged into.', 'error');
      setUserToDelete(null);
      return;
    }
    deleteUserAccount(userToDelete.id);
    showFeedback(`Staff user "${userToDelete.full_name}" has been removed.`);
    setUserToDelete(null);
  };

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'OWNER':
        return (
          <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 w-fit">
            <Crown className="w-3 h-3 text-amber-600" />
            <span>STORE OWNER</span>
          </span>
        );
      case 'ADMIN':
        return (
          <span className="bg-indigo-100 text-indigo-800 border border-indigo-300 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 w-fit">
            <Shield className="w-3 h-3 text-indigo-600" />
            <span>ADMINISTRATOR</span>
          </span>
        );
      case 'STORE_MANAGER':
        return (
          <span className="bg-cyan-100 text-cyan-800 border border-cyan-300 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 w-fit">
            <Briefcase className="w-3 h-3 text-cyan-600" />
            <span>STORE MANAGER</span>
          </span>
        );
      case 'SHOP_ASSOCIATE':
      case 'SALES_ASSOCIATE':
        return (
          <span className="bg-purple-100 text-purple-900 border border-purple-300 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 w-fit shadow-2xs">
            <Sparkles className="w-3 h-3 text-purple-600" />
            <span>★ SHOP ASSOCIATE (COMMISSION)</span>
          </span>
        );
      case 'CASHIER':
        return (
          <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 w-fit">
            <CreditCard className="w-3 h-3 text-emerald-600" />
            <span>POS CASHIER</span>
          </span>
        );
      case 'TECHNICIAN':
        return <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md text-[10px] font-bold">TECHNICIAN</span>;
      case 'MECHANIC':
        return <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded-md text-[10px] font-bold">MECHANIC</span>;
      case 'KITCHEN':
      case 'KITCHEN_STAFF':
        return <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md text-[10px] font-bold">KITCHEN KOT</span>;
      case 'ACCOUNTANT':
        return <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md text-[10px] font-bold">ACCOUNTANT</span>;
      default:
        return <span className="text-xs">{r}</span>;
    }
  };

  const filteredUsers = safeUsers.filter((u) => {
    if (!u) return false;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q);
    const matchesRole =
      roleFilter === 'ALL' ||
      u.role === roleFilter ||
      (roleFilter === 'SHOP_ASSOCIATE' && (u.role === 'SHOP_ASSOCIATE' || u.role === 'SALES_ASSOCIATE'));
    return matchesSearch && matchesRole;
  });

  const activeCount = safeUsers.filter((u) => u.is_active).length;
  const cashierCount = safeUsers.filter((u) => u.role === 'CASHIER').length;
  const adminCount = safeUsers.filter((u) => u.role === 'ADMIN').length;
  const ownerCount = safeUsers.filter((u) => u.role === 'OWNER').length;
  const associateCount = safeUsers.filter((u) => u.role === 'SHOP_ASSOCIATE' || u.role === 'SALES_ASSOCIATE').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-top-3 ${
            feedbackMsg.type === 'error'
              ? 'bg-rose-900 text-white border border-rose-700'
              : 'bg-emerald-900 text-white border border-emerald-700'
          }`}
        >
          {feedbackMsg.type === 'error' ? <AlertTriangle className="w-4 h-4 text-rose-300" /> : <CheckCircle2 className="w-4 h-4 text-emerald-300" />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Header with Role Option Buttons */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-md uppercase tracking-wider">
              Staff & User Management
            </span>
            <span className="text-slate-400 text-xs">• {currentTenant?.shop_name}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            Admin, Owner, Shop Associate & User Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            Add and manage Store Owners, Admins, Shop Associates (with sales commission), Cashiers, and staff roles.
          </p>
        </div>

        {/* Quick Add Option Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Add Owner Button */}
          <button
            onClick={() => handleOpenAddWithRole('OWNER')}
            className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
          >
            <Crown className="w-3.5 h-3.5 text-amber-600" />
            <span>+ Add Owner</span>
          </button>

          {/* Add Admin Button */}
          <button
            onClick={() => handleOpenAddWithRole('ADMIN')}
            className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
          >
            <Shield className="w-3.5 h-3.5 text-indigo-600" />
            <span>+ Add Admin</span>
          </button>

          {/* Add Shop Associate Option Button */}
          <button
            onClick={() => handleOpenAddWithRole('SHOP_ASSOCIATE')}
            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm hover:shadow transition-all cursor-pointer ring-2 ring-purple-300 ring-offset-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-200" />
            <span>★ Add Shop Associate</span>
          </button>

          {/* Add Cashier / User Button */}
          <button
            onClick={() => handleOpenAddWithRole('CASHIER')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-100" />
            <span>+ Add Cashier</span>
          </button>

          {/* Add Manager Button */}
          <button
            onClick={() => handleOpenAddWithRole('STORE_MANAGER')}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Briefcase className="w-3.5 h-3.5 text-slate-500" />
            <span>+ Manager</span>
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <button
          onClick={() => setRoleFilter('ALL')}
          className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
            roleFilter === 'ALL'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md'
              : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className={`text-[10px] font-bold uppercase block ${roleFilter === 'ALL' ? 'text-slate-300' : 'text-slate-400'}`}>
            Total Staff Accounts
          </span>
          <div className="text-2xl font-black mt-1">{safeUsers.length}</div>
        </button>

        <button
          onClick={() => setRoleFilter('OWNER')}
          className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
            roleFilter === 'OWNER'
              ? 'bg-amber-900 text-white border-amber-800 shadow-md'
              : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className={`text-[10px] font-bold uppercase block ${roleFilter === 'OWNER' ? 'text-amber-200' : 'text-amber-600'}`}>
            Store Owners
          </span>
          <div className={`text-2xl font-black mt-1 ${roleFilter === 'OWNER' ? 'text-amber-100' : 'text-amber-700'}`}>
            {ownerCount}
          </div>
        </button>

        <button
          onClick={() => setRoleFilter('ADMIN')}
          className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
            roleFilter === 'ADMIN'
              ? 'bg-indigo-900 text-white border-indigo-800 shadow-md'
              : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className={`text-[10px] font-bold uppercase block ${roleFilter === 'ADMIN' ? 'text-indigo-200' : 'text-indigo-600'}`}>
            Shop Admins
          </span>
          <div className={`text-2xl font-black mt-1 ${roleFilter === 'ADMIN' ? 'text-indigo-100' : 'text-indigo-700'}`}>
            {adminCount}
          </div>
        </button>

        <button
          onClick={() => setRoleFilter('SHOP_ASSOCIATE')}
          className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
            roleFilter === 'SHOP_ASSOCIATE'
              ? 'bg-purple-900 text-white border-purple-800 shadow-md'
              : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className={`text-[10px] font-bold uppercase block ${roleFilter === 'SHOP_ASSOCIATE' ? 'text-purple-200' : 'text-purple-600'}`}>
            ★ Shop Associates
          </span>
          <div className={`text-2xl font-black mt-1 ${roleFilter === 'SHOP_ASSOCIATE' ? 'text-purple-100' : 'text-purple-700'}`}>
            {associateCount}
          </div>
        </button>

        <button
          onClick={() => setRoleFilter('CASHIER')}
          className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
            roleFilter === 'CASHIER'
              ? 'bg-emerald-900 text-white border-emerald-800 shadow-md'
              : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className={`text-[10px] font-bold uppercase block ${roleFilter === 'CASHIER' ? 'text-emerald-200' : 'text-emerald-600'}`}>
            Cashiers / POS
          </span>
          <div className={`text-2xl font-black mt-1 ${roleFilter === 'CASHIER' ? 'text-emerald-100' : 'text-emerald-700'}`}>
            {cashierCount}
          </div>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, username, email..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-hidden focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Roles</option>
            <option value="OWNER">Store Owners</option>
            <option value="ADMIN">Shop Admins</option>
            <option value="SHOP_ASSOCIATE">★ Shop Associates (Commission Eligible)</option>
            <option value="STORE_MANAGER">Store Managers</option>
            <option value="CASHIER">Cashiers & POS Users</option>
            <option value="TECHNICIAN">Technicians / Mechanics</option>
            <option value="ACCOUNTANT">Accountants</option>
            <option value="KITCHEN">Kitchen Staff</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <strong>{filteredUsers.length}</strong> of {safeUsers.length} accounts
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 tracking-wider">
              <tr>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Role Option</th>
                <th className="py-3 px-4">Password & Access</th>
                <th className="py-3 px-4">PIN</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Option Buttons</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No staff user accounts found. Click <strong>"+ Add Owner"</strong> or <strong>"+ Add Admin"</strong> to create a user.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrent = u.id === currentUser?.id;
                  const hasPassword = Boolean(u.password && u.password.trim().length > 0);

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            style={{ backgroundColor: u.avatar_color || '#4f46e5' }}
                            className="w-9 h-9 rounded-full text-white flex items-center justify-center font-bold text-sm shadow-2xs shrink-0"
                          >
                            {(u.full_name || 'U').slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{u.full_name}</span>
                              {isCurrent && (
                                <span className="bg-indigo-50 text-indigo-700 text-[9px] font-bold px-1.5 py-0.2 rounded border border-indigo-200">
                                  YOU (Active)
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Username */}
                      <td className="py-3 px-4 font-mono font-medium text-slate-800">
                        @{u.username}
                      </td>

                      {/* Role Option Badge */}
                      <td className="py-3 px-4">{getRoleBadge(u.role)}</td>

                      {/* Password & Security Actions */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {hasPassword ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-medium">
                              <Lock className="w-3 h-3 text-emerald-600" />
                              <span>Protected</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-medium">
                              <Unlock className="w-3 h-3 text-amber-600" />
                              <span>No Pass</span>
                            </span>
                          )}

                          {/* Quick Password Option Buttons */}
                          <button
                            onClick={() => handleOpenPasswordModal(u)}
                            title={hasPassword ? 'Change Password' : 'Create / Set Password'}
                            className="px-2 py-0.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 font-semibold rounded-md text-[10px] border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <KeyRound className="w-3 h-3 text-indigo-500" />
                            <span>{hasPassword ? 'Edit Pass' : 'Set Pass'}</span>
                          </button>

                          {hasPassword && (
                            <button
                              onClick={() => handleQuickRemovePassword(u)}
                              title="Remove password (allow passwordless login)"
                              className="px-1.5 py-0.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 rounded-md text-[10px] border border-slate-200 transition-colors cursor-pointer"
                            >
                              <Unlock className="w-3 h-3 text-rose-500" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* POS PIN */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md border border-slate-200 text-[11px]">
                          {u.pin_code || '1234'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          title="Click to toggle active/inactive status"
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
                            u.is_active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {u.is_active ? <CheckCircle2 className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                          <span>{u.is_active ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>

                      {/* Option Buttons (Edit, Remove, Switch User) */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Switch To User Option Button */}
                          {!isCurrent && (
                            <button
                              onClick={() => handleSwitchToUser(u)}
                              title="Switch active session to this user"
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <LogIn className="w-3 h-3 text-slate-500" />
                              <span className="hidden sm:inline">Switch</span>
                            </button>
                          )}

                          {/* Edit Option Button */}
                          <button
                            onClick={() => handleOpenEdit(u)}
                            title="Edit user account"
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-[10px] border border-indigo-200 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3 text-indigo-600" />
                            <span>Edit</span>
                          </button>

                          {/* Remove Option Button */}
                          <button
                            onClick={() => setUserToDelete(u)}
                            title="Remove user account"
                            disabled={isCurrent}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                              isCurrent
                                ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                            }`}
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-slate-900 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-base">
                  {editingUser ? 'Edit Staff User Account' : 'Add New Staff User Account'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Role Selection Buttons inside Add/Edit Modal */}
            <div className="space-y-1">
              <label className="block text-slate-700 font-semibold text-xs">Account Role Option:</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setRole('OWNER');
                    setIsShopAssociate(false);
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                    role === 'OWNER'
                      ? 'bg-amber-100 text-amber-900 border-amber-400'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Crown className="w-3 h-3 text-amber-600" />
                  <span>Owner</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRole('ADMIN');
                    setIsShopAssociate(false);
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                    role === 'ADMIN'
                      ? 'bg-indigo-100 text-indigo-900 border-indigo-400'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Shield className="w-3 h-3 text-indigo-600" />
                  <span>Admin</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRole('SHOP_ASSOCIATE');
                    setIsShopAssociate(true);
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                    role === 'SHOP_ASSOCIATE' || role === 'SALES_ASSOCIATE' || isShopAssociate
                      ? 'bg-purple-100 text-purple-900 border-purple-400 ring-1 ring-purple-300'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-purple-600" />
                  <span>★ Shop Associate</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRole('CASHIER');
                    setIsShopAssociate(false);
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                    role === 'CASHIER' && !isShopAssociate
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <CreditCard className="w-3 h-3 text-emerald-600" />
                  <span>Cashier</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRole('STORE_MANAGER');
                    setIsShopAssociate(false);
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                    role === 'STORE_MANAGER'
                      ? 'bg-cyan-100 text-cyan-900 border-cyan-400'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Briefcase className="w-3 h-3 text-cyan-600" />
                  <span>Manager</span>
                </button>
              </div>
            </div>

            {/* Shop Associate Commission Option Panel */}
            {(role === 'SHOP_ASSOCIATE' || role === 'SALES_ASSOCIATE' || isShopAssociate) && (
              <div className="p-3 bg-purple-50/80 border border-purple-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>Shop Associate Sales Commission</span>
                  </div>
                  <span className="text-[10px] font-bold bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">
                    Auto-Calculated in Payroll
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2.5 items-start">
                  <div>
                    <label className="block text-[11px] font-semibold text-purple-900 mb-1 flex items-center justify-between">
                      <span>Associate Code:</span>
                      <span className="text-[9px] text-purple-600 bg-purple-100 px-1 py-0.2 rounded font-normal">Optional</span>
                    </label>
                    <input
                      type="text"
                      value={associateCode}
                      onChange={(e) => setAssociateCode(e.target.value.toUpperCase())}
                      placeholder="e.g. SA-01 (Optional)"
                      className="w-full bg-white border border-purple-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-purple-900 uppercase placeholder:normal-case placeholder:font-normal focus:outline-hidden focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-purple-900 mb-1">
                      Commission Rate (%):
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={commissionRate}
                        onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
                        placeholder="5.0"
                        className="w-full bg-white border border-purple-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-purple-900 focus:outline-hidden focus:border-purple-500"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-purple-500">
                        %
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-purple-700 leading-tight">
                  Sales generated on POS billing selecting this associate will earn <strong>{commissionRate}%</strong> commission added to Payroll. Code is optional.
                </div>
              </div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Full Staff Name: *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Kasun Perera"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Login Username: *</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. kasun_pos"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">4-Digit POS PIN: (Optional)</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    placeholder="Optional (leave blank to disable)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono font-bold tracking-widest focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Password Option Field */}
              <div className="space-y-1 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-700 font-semibold">
                    Password Option:
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Auto Generate</span>
                    </button>
                    {password && (
                      <button
                        type="button"
                        onClick={() => setPassword('')}
                        className="text-[10px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                      >
                        <Unlock className="w-3 h-3" />
                        <span>Remove Pass</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave empty for no password login"
                    className="w-full bg-white border border-slate-200 rounded-lg pl-3 pr-9 py-2 text-xs text-slate-900 font-mono focus:outline-hidden focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <p className="text-[10px] text-slate-500 leading-tight">
                  {password
                    ? 'User will use this password + username to log into the shop.'
                    : '🔓 No password set: User can log in directly without a password.'}
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Email Address:</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kasun@shop.lk"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {/* Avatar Color */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">Avatar Color:</label>
                <div className="flex items-center gap-2">
                  {AVATAR_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setAvatarColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                        avatarColor === c ? 'ring-2 ring-indigo-600 ring-offset-2 scale-110' : 'hover:scale-105'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Status Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="user_active_toggle"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="user_active_toggle" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Account is Active (Allow login and POS access)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  {editingUser ? 'Save Changes' : 'Create User Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Password Management Modal */}
      {passwordTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-slate-900 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-base">User Password Setting</h3>
              </div>
              <button
                onClick={() => setPasswordTargetUser(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div
                style={{ backgroundColor: passwordTargetUser.avatar_color || '#4f46e5' }}
                className="w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-xs shrink-0"
              >
                {(passwordTargetUser.full_name || 'U').slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-xs text-slate-900 truncate">{passwordTargetUser.full_name}</div>
                <div className="text-[10px] text-slate-500 font-mono">@{passwordTargetUser.username} • {passwordTargetUser.role}</div>
              </div>
            </div>

            <form onSubmit={handleSavePasswordModal} className="space-y-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-700 font-semibold">New Password:</label>
                  <button
                    type="button"
                    onClick={generateRandomQuickPassword}
                    className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Auto Generate</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="Enter password or leave blank to remove"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-9 py-2 text-xs text-slate-900 font-mono focus:outline-hidden focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-2.5 bg-indigo-50/70 border border-indigo-100 rounded-xl text-[11px] text-indigo-900 space-y-1">
                <p className="font-semibold flex items-center gap-1 text-indigo-700">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Password Security Info:</span>
                </p>
                <p className="text-slate-600 leading-tight">
                  • Enter a new password to secure this user account.<br />
                  • Or leave the password field empty and click <strong>"Remove Pass"</strong> to allow passwordless login.
                </p>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    handleQuickRemovePassword(passwordTargetUser);
                    setPasswordTargetUser(null);
                  }}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs border border-rose-200 cursor-pointer flex items-center gap-1"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Remove Pass</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPasswordTargetUser(null)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-2xs cursor-pointer"
                >
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove / Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 text-slate-900 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="font-bold text-base text-slate-900">Remove Staff User?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove <strong>"{userToDelete.full_name}"</strong> (@{userToDelete.username})? This user will no longer be able to log in or unlock the POS terminal.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-2xs cursor-pointer"
              >
                Remove User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
