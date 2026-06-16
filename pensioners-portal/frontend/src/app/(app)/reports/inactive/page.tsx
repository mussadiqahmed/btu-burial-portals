'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { UserX } from 'lucide-react';
import api from '@/lib/api';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { DataTable } from '@/components/shared/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';

type InactiveRow = {
  full_name: string;
  payroll_number: string;
  updated_at?: string;
};

export default function InactiveReportPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['inactive-report'],
    queryFn: async () => {
      const response = await api.get('/api/reports/inactive');
      return response.data;
    },
  });

  const rows: InactiveRow[] = data?.rows || [];

  const columns = useMemo<ColumnDef<InactiveRow>[]>(
    () => [
      { accessorKey: 'full_name', header: 'Full Name' },
      { accessorKey: 'payroll_number', header: 'Payroll Number' },
      {
        accessorKey: 'updated_at',
        header: 'Last Updated',
        cell: ({ row }) =>
          row.original.updated_at
            ? new Date(row.original.updated_at).toLocaleDateString()
            : '—',
      },
    ],
    []
  );

  return (
    <PageWrapper
      title="Inactive Pensioners"
      subtitle={`${data?.count ?? 0} inactive member(s)`}
    >
      {!isLoading && rows.length === 0 ? (
        <EmptyState
          icon={UserX}
          title="No inactive members"
          description="All pensioners are currently active. Deactivated members will appear here."
        />
      ) : (
        <DataTable
          data={rows}
          columns={columns}
          loading={isLoading}
          searchPlaceholder="Search inactive pensioners…"
          exportFilename="inactive-pensioners"
        />
      )}
    </PageWrapper>
  );
}
