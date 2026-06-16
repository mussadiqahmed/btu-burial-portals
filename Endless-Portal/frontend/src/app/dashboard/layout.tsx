'use client';

import { Sidebar } from '@/components/shared/Sidebar';
import { useAuthStore } from '@/store/authStore';
import { canAccessPath, getHomePathForRole } from '@/lib/roles';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

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

    if (!canAccessPath(user.role, pathname)) {
      router.replace(getHomePathForRole(user.role));
    }
  }, [mounted, isAuthenticated, user, pathname, router]);

  if (!mounted || !isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50/50 via-slate-50 to-indigo-50/30 dark:bg-slate-950 dark:from-slate-900 dark:via-slate-950 dark:to-indigo-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
