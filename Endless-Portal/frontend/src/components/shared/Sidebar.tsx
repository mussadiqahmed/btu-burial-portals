'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LogOut
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { getNavigationForRole, normalizeRole } from '@/lib/roles';

export function Sidebar() {
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  const role = normalizeRole(user?.role);
  const navigation = getNavigationForRole(role);

  return (
    <div className="flex h-full w-64 flex-col border-r border-slate-800 bg-slate-900/95 backdrop-blur-xl text-slate-300 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex h-24 items-center justify-center border-b border-slate-800 px-4">
        <img src={process.env.NODE_ENV === 'production' ? '/portal/logo.png' : '/logo.png'} alt="Endless Eternity" className="h-16 w-auto object-contain brightness-0 invert" />
      </div>
      
      <SidebarNav pathname={pathname} navigation={navigation} />

      <div className="border-t border-slate-800 p-4">
        <div className="mb-4 px-3">
          <p className="text-sm font-medium text-white">{user?.username}</p>
          <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
        </div>
        <button
          onClick={() => {
            logout();
            window.location.href = process.env.NODE_ENV === 'production' ? '/portal/login' : '/login';
          }}
          className="group flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-all duration-200 hover:bg-slate-800/80 hover:text-white"
        >
          <LogOut className="mr-3 h-5 w-5 flex-shrink-0" />
          Sign out
        </button>
      </div>
    </div>
  );
}

function SidebarNav({ pathname, navigation }: { pathname: string; navigation: ReturnType<typeof getNavigationForRole> }) {
  return (
    <div className="flex-1 overflow-y-auto py-6">
      <nav className="space-y-1.5 px-3">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-white dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-white',
                'group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200'
              )}
            >
              <item.icon
                className={cn(
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200 dark:group-hover:text-slate-200',
                  'mr-3 h-5 w-5 flex-shrink-0 transition-colors'
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
