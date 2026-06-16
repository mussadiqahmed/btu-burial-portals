'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { getNavigationForRole, getRoleLabel } from '@/lib/roles';
import { sidebarTransition } from '@/lib/animations';
import { PortalLogo } from '@/components/layout/PortalLogo';
import { PORTAL_NAME, PORTAL_ORG } from '@/lib/brand';

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const navigation = getNavigationForRole(user?.role);

  const content = (
    <div className="flex h-full flex-col">
      <div className={cn('flex h-16 items-center border-b border-border', collapsed ? 'justify-center px-2' : 'gap-3 px-4')}>
        <PortalLogo size="sm" />
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={sidebarTransition}
              className="overflow-hidden"
            >
              <p className="text-sm font-bold text-foreground">{PORTAL_NAME}</p>
              <p className="text-[11px] text-muted">{PORTAL_ORG}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onMobileClose}
              title={collapsed ? item.name : undefined}
              className={cn(
                'group relative flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                collapsed && 'justify-center px-2',
                isActive
                  ? 'bg-primary-muted text-primary'
                  : 'text-muted hover:bg-surface/50 hover:text-foreground'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg bg-primary-muted"
                  transition={sidebarTransition}
                />
              )}
              <item.icon className={cn('relative z-10 h-4 w-4 shrink-0', !collapsed && 'mr-3')} />
              {!collapsed && <span className="relative z-10">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        {!collapsed && (
          <div className="mb-3 rounded-lg bg-surface/30 px-3 py-2">
            <p className="truncate text-sm font-medium text-foreground">{user?.username}</p>
            <p className="text-xs text-muted">{getRoleLabel(user?.role)}</p>
          </div>
        )}
        <button
          onClick={() => {
            logout();
            router.push('/login');
          }}
          className={cn(
            'flex w-full items-center rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-danger-muted hover:text-danger',
            collapsed && 'justify-center'
          )}
        >
          <LogOut className={cn('h-4 w-4', !collapsed && 'mr-2')} />
          {!collapsed && 'Sign out'}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <motion.aside
        animate={{ width: collapsed ? 72 : 256 }}
        transition={sidebarTransition}
        className={cn(
          'relative hidden h-full shrink-0 flex-col border-r border-border bg-card/50 backdrop-blur-xl lg:flex'
        )}
      >
        {content}
        <button
          onClick={onToggle}
          className="absolute -right-3 top-20 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted shadow-card hover:text-foreground"
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </motion.aside>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-card backdrop-blur-xl transition-transform lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {content}
      </aside>
    </>
  );
}
