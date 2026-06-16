'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, ChevronRight, Menu, Search } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { getRoleLabel } from '@/lib/roles';
import { cn } from '@/lib/utils';

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  pensioners: 'Pensioners',
  upload: 'Uploads',
  reports: 'Reports',
  analytics: 'Analytics',
  missing: 'Missing Collections',
  inactive: 'Inactive Members',
  users: 'Users',
  view: 'Profile',
};

export function TopBar({
  onMenuClick,
  onSearchClick,
}: {
  onMenuClick: () => void;
  onSearchClick: () => void;
}) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const main = document.querySelector('main');
    const handler = () => setScrolled((main?.scrollTop || 0) > 8);
    main?.addEventListener('scroll', handler);
    return () => main?.removeEventListener('scroll', handler);
  }, []);

  const segments = pathname.split('/').filter(Boolean);
  const crumbs = segments.map((seg, i) => ({
    label: routeLabels[seg] || seg,
    href: '/' + segments.slice(0, i + 1).join('/'),
    last: i === segments.length - 1,
  }));

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-transparent px-4 transition-all lg:px-6',
        scrolled && 'border-border bg-background/80 backdrop-blur-xl'
      )}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-muted hover:bg-surface/50 hover:text-foreground lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <nav className="hidden items-center gap-1 text-sm sm:flex">
          <Link href="/dashboard" className="text-muted hover:text-foreground">
            Home
          </Link>
          {crumbs.map((crumb) => (
            <span key={crumb.href} className="flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5 text-muted/50" />
              {crumb.last ? (
                <span className="font-medium text-foreground">{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className="text-muted hover:text-foreground">
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onSearchClick}
          className="flex items-center gap-2 rounded-lg border border-border bg-card/50 px-3 py-1.5 text-sm text-muted transition-colors hover:border-primary/30 hover:text-foreground"
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden rounded border border-border bg-surface/50 px-1.5 py-0.5 text-[10px] sm:inline">
            ⌘K
          </kbd>
        </button>

        <button className="relative rounded-lg p-2 text-muted hover:bg-surface/50 hover:text-foreground">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
        </button>

        <div className="hidden items-center gap-2 rounded-lg border border-border bg-card/50 px-3 py-1.5 sm:flex">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-violet-600 text-xs font-bold text-white">
            {(user?.username || '?')[0].toUpperCase()}
          </div>
          <div className="text-left">
            <p className="text-xs font-medium text-foreground">{user?.username}</p>
            <p className="text-[10px] text-muted">{getRoleLabel(user?.role)}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
