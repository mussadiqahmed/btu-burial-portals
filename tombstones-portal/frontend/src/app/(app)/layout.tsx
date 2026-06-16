'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { openCommandPalette } from '@/components/layout/CommandPalette';
import { useAuthStore } from '@/store/authStore';
import { canAccessPath, canAccessPortal, getHomePathForRole } from '@/lib/roles';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router, mounted]);

  useEffect(() => {
    if (!mounted || !isAuthenticated || !user) return;

    if (!canAccessPortal(user.role)) {
      router.replace('/login');
      return;
    }

    if (!canAccessPath(user.role, pathname)) {
      router.replace(getHomePathForRole(user.role));
    }
  }, [mounted, isAuthenticated, user, pathname, router]);

  if (!mounted || !isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          onMenuClick={() => setMobileOpen(true)}
          onSearchClick={openCommandPalette}
        />
        <main className="flex-1 overflow-y-auto bg-mesh">{children}</main>
      </div>
      <CommandPalette />
    </div>
  );
}
