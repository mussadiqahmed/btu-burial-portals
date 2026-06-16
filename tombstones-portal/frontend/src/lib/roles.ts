import {
  LayoutDashboard,
  Users,
  UploadCloud,
  FileText,
  BarChart3,
  TriangleAlert,
  UserX,
  Shield,
  LucideIcon,
} from 'lucide-react';

export type UserRole = 'admin' | 'manager' | 'data_analyst';

export type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  writeOnly?: boolean;
  adminOnly?: boolean;
};

export const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Members', href: '/members', icon: Users },
  { name: 'Uploads', href: '/upload', icon: UploadCloud, writeOnly: true },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Upload History', href: '/reports/uploads', icon: UploadCloud },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Missing Payments', href: '/reports/missing', icon: TriangleAlert },
  { name: 'Inactive', href: '/reports/inactive', icon: UserX },
  { name: 'Users', href: '/users', icon: Shield, adminOnly: true },
];

export function normalizeRole(role?: string | null): UserRole | null {
  const value = (role || '').trim().toLowerCase();
  if (value === 'admin' || value === 'manager' || value === 'data_analyst') {
    return value;
  }
  return null;
}

export function canAccessPortal(role?: string | null): boolean {
  return normalizeRole(role) !== null;
}

/** @deprecated use canAccessPortal */
export function canAccessPensioners(role?: string | null): boolean {
  return canAccessPortal(role);
}

export function canWritePortal(role?: string | null): boolean {
  const r = normalizeRole(role);
  return r === 'admin' || r === 'manager';
}

/** @deprecated use canWritePortal */
export function canWritePensioners(role?: string | null): boolean {
  return canWritePortal(role);
}

export function getNavigationForRole(role?: string | null): NavItem[] {
  const r = normalizeRole(role);
  if (!r) return [];

  return navigation.filter((item) => {
    if (item.adminOnly && r !== 'admin') return false;
    if (item.writeOnly && !canWritePortal(r)) return false;
    return true;
  });
}

export function getHomePathForRole(role?: string | null): string {
  void role;
  return '/dashboard';
}

export function canAccessPath(role: string | undefined | null, pathname: string): boolean {
  const r = normalizeRole(role);
  if (!r) return false;

  const path = pathname.replace(/\/$/, '') || '/dashboard';

  if (r === 'admin') return true;

  if (path.startsWith('/users')) return false;
  if (path.startsWith('/upload') && !canWritePortal(r)) return false;

  return true;
}

export function getRoleLabel(role?: string | null): string {
  const r = normalizeRole(role);
  if (r === 'admin') return 'Admin';
  if (r === 'manager') return 'Manager';
  if (r === 'data_analyst') return 'Data Analyst';
  return role || '';
}
