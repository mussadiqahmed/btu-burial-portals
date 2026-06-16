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
import { Wallet, Percent, Banknote, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer } from '@/lib/animations';

type ReportRow = {
  full_name: string;
  payroll_number: string;
  paid_amount: number;
  net_premium: number;
  bona_life: number;
};

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
      {
        accessorKey: 'paid_amount',
        header: 'Paid',
        cell: ({ row }) => formatMoney(row.original.paid_amount),
      },
      {
        accessorKey: 'net_premium',
        header: 'Net Premium',
        cell: ({ row }) => formatMoney(row.original.net_premium),
      },
      {
        accessorKey: 'bona_life',
        header: 'Bona Life',
        cell: ({ row }) => formatMoney(row.original.bona_life),
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
        <KpiCard label="Total Paid" value={formatMoney(totals.total_paid)} icon={Wallet} accent="primary" loading={isLoading} />
        <KpiCard label="Commission" value={formatMoney(totals.total_commission)} icon={Percent} accent="warning" loading={isLoading} />
        <KpiCard label="Net Premium" value={formatMoney(totals.total_net_premium)} icon={Banknote} accent="success" loading={isLoading} />
        <KpiCard label="Bona Life" value={formatMoney(totals.total_bona_life)} icon={Sparkles} accent="violet" loading={isLoading} />
      </motion.div>

      <DataTable
        data={rows}
        columns={columns}
        loading={isLoading}
        searchPlaceholder="Search pensioners…"
        exportFilename={`monthly-report-${month}-${year}`}
        emptyMessage="No collections for this period"
      />
    </PageWrapper>
  );
}
