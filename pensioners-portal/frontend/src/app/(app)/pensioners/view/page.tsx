'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Banknote } from 'lucide-react';
import api from '@/lib/api';
import { formatMoney, MONTHS } from '@/lib/format';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Badge } from '@/components/ui/Badge';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { ChartCard } from '@/components/charts/ChartCard';
import { CollectionsAreaChart } from '@/components/charts/DashboardCharts';
import { DataTable } from '@/components/shared/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';
import { TableSkeleton } from '@/components/ui/Skeleton';

type Collection = {
  id: number;
  collection_month: number;
  collection_year: number;
  paid_amount: number;
  net_premium: number;
  bona_life: number;
  commission?: number;
};

function PensionerViewContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const { data, isLoading, error } = useQuery({
    queryKey: ['pensioner', id],
    enabled: !!id,
    queryFn: async () => {
      const response = await api.get(`/api/pensioners/${id}`);
      return response.data;
    },
  });

  const pensioner = data?.pensioner || data;
  const collections: Collection[] = data?.collections || [];

  const chartData = collections.map((c) => ({
    month: c.collection_month,
    year: c.collection_year,
    paid_amount: c.paid_amount,
  }));

  const totalPaid = collections.reduce(
    (sum, c) => sum + (Number(c.paid_amount) || 0),
    0
  );

  const columns = useMemo<ColumnDef<Collection>[]>(
    () => [
      {
        id: 'period',
        header: 'Month',
        accessorFn: (row) => `${MONTHS[row.collection_month - 1]} ${row.collection_year}`,
      },
      {
        accessorKey: 'paid_amount',
        header: 'Amount',
        cell: ({ row }) => formatMoney(row.original.paid_amount),
      },
    ],
    []
  );

  if (!id) {
    return (
      <PageWrapper title="Pensioner Profile">
        <p className="text-muted">
          No pensioner selected.{' '}
          <Link href="/pensioners" className="text-primary hover:underline">
            Back to list
          </Link>
        </p>
      </PageWrapper>
    );
  }

  if (isLoading) {
    return (
      <PageWrapper title="Loading…">
        <TableSkeleton rows={4} />
      </PageWrapper>
    );
  }

  if (error || !pensioner) {
    return (
      <PageWrapper title="Not Found">
        <p className="text-muted">
          Pensioner not found.{' '}
          <Link href="/pensioners" className="text-primary hover:underline">
            Back to list
          </Link>
        </p>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title=""
      actions={
        <Link
          href="/pensioners"
          className="inline-flex items-center text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card gradient-border mb-8 p-6"
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-violet-600 text-2xl font-bold text-white shadow-glow">
            {String(pensioner.full_name || '?')
              .split(' ')
              .map((w: string) => w[0])
              .slice(0, 2)
              .join('')}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{pensioner.full_name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5 text-muted">
                <User className="h-4 w-4" />
                {pensioner.payroll_number}
              </span>
              <Badge variant={pensioner.status === 'active' ? 'success' : 'muted'}>
                {pensioner.status}
              </Badge>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard label="Total Paid" value={formatMoney(totalPaid)} icon={Banknote} accent="primary" />
        <KpiCard
          label="Payment Months"
          value={collections.length.toLocaleString()}
          icon={User}
          accent="success"
        />
      </div>

      {chartData.length > 0 && (
        <div className="mb-8">
          <ChartCard title="Payment Trend" subtitle="Collection history">
            <CollectionsAreaChart data={chartData} />
          </ChartCard>
        </div>
      )}

      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Collection History</h2>
        <DataTable
          data={[...collections].reverse()}
          columns={columns}
          exportFilename={`pensioner-${pensioner.payroll_number}`}
          emptyMessage="No collection history yet"
        />
      </div>
    </PageWrapper>
  );
}

export default function PensionerViewPage() {
  return (
    <Suspense fallback={<PageWrapper title="Loading…"><TableSkeleton /></PageWrapper>}>
      <PensionerViewContent />
    </Suspense>
  );
}
