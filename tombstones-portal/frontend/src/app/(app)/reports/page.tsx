'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import api from '@/lib/api';
import { formatMoney, MONTHS } from '@/lib/format';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { DataTable } from '@/components/shared/DataTable';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { Select } from '@/components/ui/Select';
import { Wallet, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer } from '@/lib/animations';

type ReportRow = {
  full_name: string;
  payroll_number: string;
  paid_amount: number;
  expected_amount?: number;
  amount_difference?: number;
  comparison_status?: string;
  package_name?: string;
  standing?: string;
};

function statusLabel(status?: string) {
  if (!status) return '—';
  if (status === 'match') return 'Match';
  if (status === 'underpaid') return 'Underpaid';
  if (status === 'overpaid') return 'Overpaid';
  return status;
}

export default function MonthlyReportPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data, isLoading } = useQuery({
    queryKey: ['monthly-report', month, year],
    queryFn: async () => {
      const response = await api.get('/api/reports/monthly', { params: { month, year } });
      return response.data;
    },
  });

  const totals = data?.totals || {};
  const rows: ReportRow[] = data?.rows || [];

  const columns = useMemo<ColumnDef<ReportRow>[]>(
    () => [
      { accessorKey: 'full_name', header: 'Full Name' },
      { accessorKey: 'payroll_number', header: 'Payroll' },
      { accessorKey: 'package_name', header: 'Package' },
      {
        accessorKey: 'expected_amount',
        header: 'Expected',
        cell: ({ row }) => formatMoney(row.original.expected_amount),
      },
      {
        accessorKey: 'paid_amount',
        header: 'Paid',
        cell: ({ row }) => formatMoney(row.original.paid_amount),
      },
      {
        accessorKey: 'amount_difference',
        header: 'Difference',
        cell: ({ row }) => formatMoney(row.original.amount_difference),
      },
      {
        accessorKey: 'comparison_status',
        header: 'Status',
        cell: ({ row }) => statusLabel(row.original.comparison_status),
      },
    ],
    []
  );

  return (
    <PageWrapper
      title="Monthly Collections Report"
      subtitle={`${MONTHS[month - 1]} ${year}`}
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
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <KpiCard
          label="Expected Collections"
          value={formatMoney(totals.total_expected)}
          icon={Wallet}
          accent="violet"
          loading={isLoading}
        />
        <KpiCard
          label="Total Collected"
          value={formatMoney(totals.total_paid)}
          icon={Wallet}
          accent="primary"
          loading={isLoading}
        />
        <KpiCard
          label="Difference"
          value={formatMoney(totals.total_difference)}
          icon={Users}
          accent="warning"
          loading={isLoading}
        />
        <KpiCard
          label="Members Paid"
          value={totals.member_count ?? 0}
          icon={Users}
          accent="success"
          loading={isLoading}
        />
      </motion.div>

      <DataTable
        data={rows}
        columns={columns}
        loading={isLoading}
        searchPlaceholder="Search members…"
        exportFilename={`monthly-report-${month}-${year}`}
        emptyMessage="No collections for this period"
      />
    </PageWrapper>
  );
}
