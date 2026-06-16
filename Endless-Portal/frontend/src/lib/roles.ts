import {
  LayoutDashboard, ShoppingCart, Package, Settings, MessageSquare, BarChart3,
  Users, Palette, Layers, Wrench, Target, FolderOpen, Quote, LucideIcon, Sheet, Gem
} from 'lucide-react';

export type UserRole = 'admin' | 'employee' | 'sales' | 'manager' | 'marketing';

export type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
};

const opsNavigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Orders', href: '/dashboard/orders', icon: ShoppingCart },
  { name: 'Production', href: '/dashboard/production', icon: Wrench },
  { name: 'Materials', href: '/dashboard/materials', icon: Layers },
  { name: 'Material Families', href: '/dashboard/material-families', icon: Gem },
  { name: 'Inventory', href: '/dashboard/inventory', icon: Package },
  { name: 'Design Types', href: '/dashboard/design-types', icon: Palette },
  { name: 'Extras', href: '/dashboard/extras', icon: Settings },
  { name: 'Follow-ups', href: '/dashboard/followups', icon: MessageSquare },
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
  { name: 'EEM Operations Tool', href: '/dashboard/operations-tool', icon: Sheet },
];

const marketingNavigation: NavItem[] = [
  { name: 'Leads', href: '/dashboard/marketing/leads', icon: Target },
  { name: 'Quotations', href: '/dashboard/marketing/quotations', icon: Quote },
  { name: 'Documents', href: '/dashboard/marketing/documents', icon: FolderOpen },
  { name: 'Sales Reports', href: '/dashboard/marketing/sales', icon: BarChart3 },
];

export function normalizeRole(role?: string | null): UserRole {
  const value = (role || 'employee').trim().toLowerCase();
  if (value === 'admin' || value === 'employee' || value === 'sales' || value === 'manager' || value === 'marketing') {
    return value;
  }
  return 'employee';
}

export function getNavigationForRole(role?: string | null): NavItem[] {
  const r = normalizeRole(role);

  if (r === 'marketing') {
    return marketingNavigation;
  }

  if (r === 'admin') {
    return [
      ...opsNavigation,
      ...marketingNavigation,
      { name: 'Users', href: '/dashboard/users', icon: Users },
    ];
  }

  if (r === 'sales') {
    return [...opsNavigation, ...marketingNavigation];
  }

  // employee & manager — operations only
  return opsNavigation;
}

export function getHomePathForRole(role?: string | null): string {
  if (normalizeRole(role) === 'marketing') {
    return '/dashboard/marketing/leads';
  }
  return '/dashboard';
}

export function canAccessPath(role: string | undefined | null, pathname: string): boolean {
  const r = normalizeRole(role);
  const path = pathname.replace(/\/$/, '') || '/dashboard';

  if (r === 'admin') return true;

  if (r === 'marketing') {
    return path.startsWith('/dashboard/marketing');
  }

  if (r === 'sales') {
    return !path.startsWith('/dashboard/users');
  }

  // employee & manager
  return !path.startsWith('/dashboard/users') && !path.startsWith('/dashboard/marketing');
}
