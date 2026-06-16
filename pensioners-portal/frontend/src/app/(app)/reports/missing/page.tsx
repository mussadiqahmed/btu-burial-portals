'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { TriangleAlert } from 'lucide-react';
import api from '@/lib/api';
import { MONTHS } from '@/lib/format';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { DataTable } from '@/components/shared/DataTable';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';

type MissingRow = {
  full_name: string;
  payroll_number: string;
  status: string;
};

export default function MissingCollectionsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data, isLoading } = useQuery({
    queryKey: ['missing-report', month, year],
    queryFn: async () => {
      const response = await api.get('/api/reports/missing', { params: { month, year } });
      return response.data;
    },
  });

  const rows: MissingRow[] = data?.rows || [];

  const columns = useMemo<ColumnDef<MissingRow>[]>(
    () => [
      { accessorKey: 'full_name', header: 'Full Name' },
      { accessorKey: 'payroll_number', header: 'Payroll Number' },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: () => <Badge variant="success">active</Badge>,
      },
    ],
    []
  );

  return (
    <PageWrapper
      title="Missing Collections"
      subtitle={`Active pensioners with no collection for ${MONTHS[month - 1]} ${year}`}
      actions={
        <>
          <Select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTHS.map((name, i) => (
              <option key={name} value={i + 1}>
                {name}
              </option>
            ))}
          </Select>
          <Select value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
        </>
      }
    >
      <div className="glass-card mb-6 flex items-center gap-3 border-warning/30 bg-warning-muted/20 p-4">
        <TriangleAlert className="h-5 w-5 text-warning" />
        <p className="text-sm text-foreground">
          <span className="font-bold text-warning">{data?.count ?? 0}</span> active pensioner(s)
          missing from the upload
        </p>
      </div>

      {!isLoading && rows.length === 0 ? (
        <EmptyState
          icon={TriangleAlert}
          title="All caught up"
          description="No missing collections for this period. Every active member has a payment record."
        />
      ) : (
        <DataTable
          data={rows}
          columns={columns}
          loading={isLoading}
          searchPlaceholder="Search missing pensioners…"
          exportFilename={`missing-collections-${month}-${year}`}
        />
      )}
    </PageWrapper>
  );
}
