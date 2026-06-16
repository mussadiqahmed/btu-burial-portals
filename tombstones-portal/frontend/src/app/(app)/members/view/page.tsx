'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Banknote, Calendar, Package } from 'lucide-react';
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
  expected_amount?: number;
  amount_difference?: number;
  comparison_status?: string;
};

type PersonRecord = {
  index: number;
  name: string;
  relationship?: string;
  gender?: string;
  age?: string | number;
  premium?: string | number;
  cover?: string | number;
  package_name?: string;
};

type MemberProfile = {
  id: number;
  payroll_number: string;
  full_name: string;
  premium: number | string;
  net_premium?: number | string;
  cover: number | string;
  package_name: string;
  standing: string;
  status: string;
  dob?: string;
  id_number?: string;
  gender?: string;
  age?: number | string;
  created_date?: string;
  updated_date?: string;
  dependents?: PersonRecord[];
  beneficiaries?: PersonRecord[];
  latest_paid_amount?: number | string | null;
  latest_expected_amount?: number | string | null;
  latest_difference?: number | string | null;
  latest_comparison_status?: string | null;
};

function MemberViewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const idParam = searchParams.get('id');
  const payrollParam = searchParams.get('payroll');
  const memberKey = idParam || payrollParam;

  const { data, isLoading, error } = useQuery({
    queryKey: ['member', memberKey],
    enabled: !!memberKey,
    queryFn: async () => {
      const response = await api.get(`/api/members/${memberKey}`);
      return response.data;
    },
  });

  const member: MemberProfile = data?.member || data;

  useEffect(() => {
    if (payrollParam && member?.id && !idParam) {
      router.replace(`/members/view?id=${member.id}`);
    }
  }, [payrollParam, member?.id, idParam, router]);
  const collections: Collection[] = data?.collections || [];

  const chartData = collections.map((c) => ({
    month: c.collection_month,
    year: c.collection_year,
    paid_amount: c.paid_amount,
  }));

  const totalPaid = collections.reduce((sum, c) => sum + (Number(c.paid_amount) || 0), 0);
  const avgMonthly = collections.length ? totalPaid / collections.length : 0;

  const columns = useMemo<ColumnDef<Collection>[]>(
    () => [
      {
        id: 'period',
        header: 'Month',
        accessorFn: (row) => `${MONTHS[row.collection_month - 1]} ${row.collection_year}`,
      },
      {
        accessorKey: 'paid_amount',
        header: 'Paid Amount',
        cell: ({ row }) => formatMoney(row.original.paid_amount),
      },
      {
        accessorKey: 'expected_amount',
        header: 'Expected',
        cell: ({ row }) => formatMoney(row.original.expected_amount),
      },
      {
        accessorKey: 'amount_difference',
        header: 'Difference',
        cell: ({ row }) => formatMoney(row.original.amount_difference),
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const s = row.original.comparison_status;
          if (s === 'match') return 'Match';
          if (s === 'underpaid') return 'Underpaid';
          if (s === 'overpaid') return 'Overpaid';
          return '—';
        },
      },
    ],
    []
  );

  const personColumns = useMemo<ColumnDef<PersonRecord>[]>(
    () => [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'relationship', header: 'Relationship' },
      { accessorKey: 'gender', header: 'Gender' },
      { accessorKey: 'age', header: 'Age' },
      {
        accessorKey: 'premium',
        header: 'Premium',
        cell: ({ row }) => (row.original.premium ? formatMoney(row.original.premium) : '—'),
      },
      {
        accessorKey: 'cover',
        header: 'Cover',
        cell: ({ row }) => (row.original.cover ? formatMoney(row.original.cover) : '—'),
      },
      { accessorKey: 'package_name', header: 'Package' },
    ],
    []
  );

  if (!memberKey) {
    return (
      <PageWrapper title="Member Profile">
        <p className="text-muted">
          No member selected.{' '}
          <Link href="/members" className="text-primary hover:underline">
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

  if (error || !member?.id) {
    return (
      <PageWrapper title="Not Found">
        <p className="text-muted">
          Member not found.{' '}
          <Link href="/members" className="text-primary hover:underline">
            Back to list
          </Link>
        </p>
      </PageWrapper>
    );
  }

  const dependents = member.dependents || [];
  const beneficiaries = member.beneficiaries || [];

  return (
    <PageWrapper
      title=""
      actions={
        <Link
          href="/members"
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
            {String(member.full_name || '?')
              .split(' ')
              .map((w: string) => w[0])
              .slice(0, 2)
              .join('')}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{member.full_name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5 text-muted">
                <User className="h-4 w-4" />
                {member.payroll_number}
              </span>
              <Badge variant={member.status === 'active' ? 'success' : 'muted'}>
                {member.standing || member.status}
              </Badge>
              {member.package_name && (
                <span className="flex items-center gap-1.5 text-muted">
                  <Package className="h-4 w-4" />
                  {member.package_name}
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted">
              <span>Premium: {formatMoney(member.premium)}</span>
              <span>Net Premium: {formatMoney(member.net_premium)}</span>
              <span>Cover: {formatMoney(member.cover)}</span>
              {member.created_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Created: {new Date(member.created_date).toLocaleDateString()}
                </span>
              )}
              {member.updated_date && (
                <span>Updated: {new Date(member.updated_date).toLocaleDateString()}</span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Net Premium"
          value={formatMoney(member.net_premium)}
          icon={Banknote}
          accent="violet"
        />
        <KpiCard
          label="Latest Paid"
          value={formatMoney(member.latest_paid_amount ?? 0)}
          icon={Banknote}
          accent="primary"
        />
        <KpiCard
          label="Latest Expected"
          value={formatMoney(member.latest_expected_amount ?? member.net_premium)}
          icon={Banknote}
          accent="success"
        />
        <KpiCard
          label="Latest Difference"
          value={formatMoney(member.latest_difference ?? 0)}
          icon={Banknote}
          accent="warning"
        />
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard label="Total Paid" value={formatMoney(totalPaid)} icon={Banknote} accent="primary" />
        <KpiCard
          label="Payment Months"
          value={collections.length.toLocaleString()}
          icon={User}
          accent="success"
        />
        <KpiCard
          label="Avg Monthly"
          value={formatMoney(avgMonthly)}
          icon={Banknote}
          accent="warning"
        />
      </div>

      {dependents.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Dependents</h2>
          <DataTable
            data={dependents}
            columns={personColumns}
            exportFilename={`dependents-${member.payroll_number}`}
            pageSize={10}
          />
        </div>
      )}

      {beneficiaries.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Beneficiaries</h2>
          <DataTable
            data={beneficiaries}
            columns={personColumns}
            exportFilename={`beneficiaries-${member.payroll_number}`}
            pageSize={10}
          />
        </div>
      )}

      {chartData.length > 0 && (
        <div className="mb-8">
          <ChartCard title="Payment Trend" subtitle="Monthly collection history">
            <CollectionsAreaChart data={chartData} />
          </ChartCard>
        </div>
      )}

      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Payment History</h2>
        <DataTable
          data={[...collections].reverse()}
          columns={columns}
          exportFilename={`member-${member.payroll_number}`}
          emptyMessage="No payment history yet"
        />
      </div>
    </PageWrapper>
  );
}

export default function MemberViewPage() {
  return (
    <Suspense fallback={<PageWrapper title="Loading…"><TableSkeleton /></PageWrapper>}>
      <MemberViewContent />
    </Suspense>
  );
}
