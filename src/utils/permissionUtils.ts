import { UserAccount, UserRole, RolePermissions, PermissionKey, DEFAULT_ROLE_PERMISSIONS_MAP, DEFAULT_FULL_PERMISSIONS, DEFAULT_STAFF_PERMISSIONS } from '../types';

export function getEffectivePermissions(
  user: UserAccount | undefined,
  rolePermissionsMap: Record<UserRole, RolePermissions> = DEFAULT_ROLE_PERMISSIONS_MAP,
  customUserOverrides: Record<string, Partial<RolePermissions>> = {},
  ownerAdminFullAccess: { ownerFullAccess: boolean; adminFullAccess: boolean } = { ownerFullAccess: true, adminFullAccess: true }
): RolePermissions {
  if (!user) {
    return { ...DEFAULT_FULL_PERMISSIONS };
  }

  // 1. Super Admin, Owner, and Admin have unconditional 100% full access
  if (user.role === 'SUPER_ADMIN' || user.role === 'OWNER' || user.role === 'ADMIN') {
    return { ...DEFAULT_FULL_PERMISSIONS };
  }

  // 2. Base role permissions for other users (Sale, Sales Return, Reprint, Customer Add & Balance Pay, Categories, Products, Barcodes, Expenses/Payouts, Cash Balance & Day End Reports)
  const baseRolePerms = rolePermissionsMap[user.role] || DEFAULT_ROLE_PERMISSIONS_MAP[user.role] || DEFAULT_STAFF_PERMISSIONS;

  // 3. Apply individual user overrides if any
  const userOverride = customUserOverrides[user.id] || (user as any).custom_permissions;
  if (userOverride) {
    return {
      ...baseRolePerms,
      ...userOverride,
    };
  }

  return { ...baseRolePerms };
}

export function checkUserPermission(
  user: UserAccount | undefined,
  permissionKey: PermissionKey,
  rolePermissionsMap: Record<UserRole, RolePermissions> = DEFAULT_ROLE_PERMISSIONS_MAP,
  customUserOverrides: Record<string, Partial<RolePermissions>> = {},
  ownerAdminFullAccess: { ownerFullAccess: boolean; adminFullAccess: boolean } = { ownerFullAccess: true, adminFullAccess: true }
): boolean {
  if (!user) return true; // fallback
  const effective = getEffectivePermissions(user, rolePermissionsMap, customUserOverrides, ownerAdminFullAccess);
  return Boolean(effective[permissionKey]);
}
