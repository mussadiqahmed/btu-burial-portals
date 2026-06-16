'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import api from '@/lib/api';
import { getNavigationForRole } from '@/lib/roles';
import { useAuthStore } from '@/store/authStore';

type MemberSearchResult = {
  id: number;
  full_name: string;
  payroll_number: string;
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const nav = getNavigationForRole(user?.role);

  const { data: members } = useQuery({
    queryKey: ['command-members'],
    queryFn: async () => {
      const res = await api.get('/api/members', { params: { limit: 500 } });
      const payload = res.data as { rows?: MemberSearchResult[] } | MemberSearchResult[];
      if (Array.isArray(payload)) return payload;
      return payload.rows || [];
    },
    enabled: open,
    staleTime: 60000,
  });

  const toggle = useCallback(() => setOpen((o) => !o), []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggle();
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [toggle]);

  useEffect(() => {
    (window as unknown as { __openCommandPalette?: () => void }).__openCommandPalette = () =>
      setOpen(true);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    setQuery('');
    router.push(href);
  };

  const filteredMembers = (members || [])
    .filter(
      (p: MemberSearchResult) =>
        !query ||
        p.full_name.toLowerCase().includes(query.toLowerCase()) ||
        p.payroll_number.includes(query)
    )
    .slice(0, 8);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-background/80 pt-[15vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <Command
        className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-card shadow-card"
        onClick={(e) => e.stopPropagation()}
        shouldFilter={false}
      >
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search className="h-4 w-4 text-muted" />
          <Command.Input
            value={query}
            onValueChange={setQuery}
            placeholder="Search pages, members…"
            className="flex-1 bg-transparent py-3 text-sm text-foreground outline-none placeholder:text-muted"
          />
        </div>
        <Command.List className="max-h-80 overflow-y-auto p-2">
          <Command.Empty className="py-6 text-center text-sm text-muted">
            No results found.
          </Command.Empty>

          <Command.Group heading="Pages" className="px-2 py-1 text-xs text-muted">
            {nav.map((item) => (
              <Command.Item
                key={item.href}
                value={item.name}
                onSelect={() => go(item.href)}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground aria-selected:bg-primary-muted aria-selected:text-primary"
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Command.Item>
            ))}
          </Command.Group>

          {filteredMembers.length > 0 && (
            <Command.Group heading="Members" className="mt-2 px-2 py-1 text-xs text-muted">
              {filteredMembers.map((p: MemberSearchResult) => (
                <Command.Item
                  key={p.id}
                  value={`${p.full_name} ${p.payroll_number}`}
                  onSelect={() => go(`/members/view?id=${p.id}`)}
                  className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm aria-selected:bg-primary-muted"
                >
                  <span className="text-foreground">{p.full_name}</span>
                  <span className="text-xs text-muted">{p.payroll_number}</span>
                </Command.Item>
              ))}
            </Command.Group>
          )}
        </Command.List>
      </Command>
    </div>
  );
}

export function openCommandPalette() {
  (window as unknown as { __openCommandPalette?: () => void }).__openCommandPalette?.();
}
