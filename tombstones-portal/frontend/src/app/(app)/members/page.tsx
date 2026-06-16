'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { UserCheck, UserX, Eye } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { formatMoney, MONTHS } from '@/lib/format';
import { useAuthStore } from '@/store/authStore';
import { canWritePortal } from '@/lib/roles';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { DataTable } from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Users } from 'lucide-react';

type Member = {
  id: number;
  payroll_number: string;
  full_name: string;
  premium: number | string;
  package_name: string;
  standing: string;
  status: string;
  is_active: boolean;
  latest_payment: number | null;
  latest_payment_period?: { month: number; year: number } | null;
};

type MembersResponse = {
  rows: Member[];
  total: number;
};

export default function MembersPage() {
  const user = useAuthStore((state) => state.user);
  const canWrite = canWritePortal(user?.role);
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading } = useQuery({
    queryKey: ['members-list', statusFilter, searchQuery],
    queryFn: async () => {
      const params: Record<string, string | number> = { limit: 10000, offset: 0 };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;
      const response = await api.get('/api/members', { params });
      return response.data as MembersResponse;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      api.post(`/api/members/${id}/${active ? 'activate' : 'deactivate'}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members-list'] });
      toast.success('Member status updated');
    },
    onError: () => toast.error('Failed to update status'),
  });

  const rows = data?.rows || [];

  const columns = useMemo<ColumnDef<Member>[]>(
    () => [
      { accessorKey: 'payroll_number', header: 'Payroll Number' },
      {
        accessorKey: 'full_name',
        header: 'Full Name',
        cell: ({ row }) => (
          <Link
            href={`/members/view?id=${row.original.id}`}
            className={`font-medium hover:underline ${
              row.original.is_active ? 'text-primary' : 'text-muted'
            }`}
          >
            {row.original.full_name}
          </Link>
        ),
      },
      {
        accessorKey: 'premium',
        header: 'Premium',
        cell: ({ row }) => formatMoney(row.original.premium),
      },
      { accessorKey: 'package_name', header: 'Package' },
      {
        accessorKey: 'standing',
        header: 'Standing',
        cell: ({ row }) => (
          <Badge variant={row.original.is_active ? 'success' : 'muted'}>
            {row.original.standing || row.original.status}
          </Badge>
        ),
      },
      {
        id: 'latest_payment',
        header: 'Latest Payment',
        accessorFn: (row) => {
          if (row.latest_payment == null) return '—';
          const period = row.latest_payment_period;
          const label = period
            ? `${MONTHS[period.month - 1]} ${period.year}`
            : '';
          return `${formatMoney(row.latest_payment)}${label ? ` (${label})` : ''}`;
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex gap-1">
            <Link
              href={`/members/view?id=${row.original.id}`}
              className="rounded-lg p-1.5 text-muted hover:bg-surface/50 hover:text-foreground"
              title="View"
            >
              <Eye className="h-4 w-4" />
            </Link>
            {canWrite && row.original.is_active && (
              <button
                onClick={() => toggleMutation.mutate({ id: row.original.id, active: false })}
                className="rounded-lg p-1.5 text-muted hover:bg-surface/50 hover:text-foreground"
                title="Exclude from analytics"
              >
                <UserX className="h-4 w-4" />
              </button>
            )}
            {canWrite && row.original.status === 'excluded' && (
              <button
                onClick={() => toggleMutation.mutate({ id: row.original.id, active: true })}
                className="rounded-lg p-1.5 text-muted hover:bg-surface/50 hover:text-foreground"
                title="Re-include"
              >
                <UserCheck className="h-4 w-4" />
              </button>
            )}
          </div>
        ),
      },
    ],
    [canWrite, toggleMutation]
  );

  const filterButtons = (
    <div className="flex flex-wrap gap-2">
      {(['all', 'active', 'inactive'] as const).map((filter) => (
        <button
          key={filter}
          onClick={() => setStatusFilter(filter)}
          className={`rounded-lg px-3 py-1.5 text-sm capitalize transition-colors ${
            statusFilter === filter
              ? 'bg-primary-muted text-primary'
              : 'bg-surface/50 text-muted hover:text-foreground'
          }`}
        >
          {filter}
        </button>
      ))}
    </div>
  );

  return (
    <PageWrapper
      title="Members"
      subtitle={`${data?.total ?? rows.length} records from Members-New`}
      actions={filterButtons}
    >
      <div className="mb-4">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search payroll number, surname, or first name…"
          className="w-full max-w-md rounded-lg border border-border bg-background/50 px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {!isLoading && !rows.length ? (
        <EmptyState
          icon={Users}
          title="No members found"
          description="Member records are loaded from the BTU master database."
        />
      ) : (
        <DataTable
          data={rows}
          columns={columns}
          loading={isLoading}
          searchPlaceholder="Filter loaded results…"
          exportFilename="tombstone-members"
          rowClassName={(row) => (!row.is_active ? 'opacity-50 bg-surface/20' : undefined)}
        />
      )}
    </PageWrapper>
  );
}
