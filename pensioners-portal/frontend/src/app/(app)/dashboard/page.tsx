'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Users,
  UserCheck,
  UserX as UserXIcon,
  Wallet,
  TrendingUp,
  TriangleAlert,
  ArrowRight,
} from 'lucide-react';
import api from '@/lib/api';
import { PORTAL_ORG } from '@/lib/brand';
import { formatMoney, MONTHS } from '@/lib/format';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { ChartCard } from '@/components/charts/ChartCard';
import {
  ActiveInactivePieChart,
  CollectionsAreaChart,
} from '@/components/charts/DashboardCharts';
import { Select } from '@/components/ui/Select';
import { KpiSkeleton } from '@/components/ui/Skeleton';
import { staggerContainer } from '@/lib/animations';

export default function DashboardPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', month, year],
    queryFn: async () => {
      const response = await api.get('/api/dashboard', { params: { month, year } });
      return response.data;
    },
  });

  const summary = data?.summary || {};
  const trends = (data?.trends || []).map((row: Record<string, unknown>) => ({
    ...row,
    paid_amount: row.paid_amount ?? row.total_paid,
  }));
  const stats = {
    ...summary,
    collection_this_month: summary.current_month_paid,
    collection_previous_month: summary.previous_month_paid,
    trends,
    month_label: summary.period
      ? `${MONTHS[Number(summary.period.month) - 1]} ${summary.period.year}`
      : undefined,
  };

  const sparkFromTrends = trends.map((t: { paid_amount?: number }) => Number(t.paid_amount) || 0);

  const periodActions = (
    <>
      <Select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
        {MONTHS.map((name, index) => (
          <option key={name} value={index + 1}>
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
  );

  return (
    <PageWrapper
      title="Dashboard"
      subtitle={`${PORTAL_ORG} — ${stats.month_label ?? `${MONTHS[month - 1]} ${year}`}`}
      actions={periodActions}
    >
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <KpiSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            <KpiCard
              label="Total Members"
              value={(stats.total_pensioners ?? 0).toLocaleString()}
              icon={Users}
              accent="primary"
            />
            <KpiCard
              label="Active Members"
              value={(stats.active_pensioners ?? 0).toLocaleString()}
              icon={UserCheck}
              accent="success"
            />
            <KpiCard
              label="Inactive Members"
              value={(stats.inactive_pensioners ?? 0).toLocaleString()}
              icon={UserXIcon}
              accent="violet"
            />
            <KpiCard
              label="Total Paid Amount"
              value={formatMoney(stats.collection_this_month)}
              icon={Wallet}
              accent="warning"
              sparkline={sparkFromTrends}
            />
            <KpiCard
              label="Missing Payments"
              value={(stats.missing_collections_count ?? 0).toLocaleString()}
              icon={TriangleAlert}
              accent="danger"
            />
            <KpiCard
              label="Month-over-Month"
              value={`${stats.growth_percentage ?? 0}%`}
              icon={TrendingUp}
              accent="primary"
              trend={stats.growth_percentage}
              trendLabel="vs prev month"
            />
          </motion.div>

          <div className="mb-8 grid gap-6 lg:grid-cols-2">
            <ChartCard title="Monthly Collections" subtitle="Paid amount over time">
              {trends.length ? (
                <CollectionsAreaChart data={trends} />
              ) : (
                <p className="py-16 text-center text-sm text-muted">
                  No collection data yet. Upload a monthly Excel file.
                </p>
              )}
            </ChartCard>

            <ChartCard title="Active vs Inactive" subtitle="Member status distribution">
              <div className="flex items-center justify-center">
                <ActiveInactivePieChart
                  active={stats.active_pensioners ?? 0}
                  inactive={stats.inactive_pensioners ?? 0}
                />
              </div>
              <div className="mt-2 flex justify-center gap-6 text-sm">
                <span className="flex items-center gap-2 text-success">
                  <span className="h-2 w-2 rounded-full bg-success" />
                  Active: {stats.active_pensioners ?? 0}
                </span>
                <span className="flex items-center gap-2 text-muted">
                  <span className="h-2 w-2 rounded-full bg-muted" />
                  Inactive: {stats.inactive_pensioners ?? 0}
                </span>
              </div>
            </ChartCard>
          </div>

          <div className="mb-8 grid gap-4 sm:grid-cols-2">
            <div className="glass-card border-success/20 bg-success-muted/30 p-5">
              <p className="text-sm font-medium text-success">Collected This Month</p>
              <p className="mt-1 text-3xl font-bold text-foreground">
                {stats.collected_this_month ?? 0}
              </p>
              <p className="mt-1 text-xs text-muted">active pensioners with a payment record</p>
            </div>
            <div className="glass-card border-warning/20 bg-warning-muted/30 p-5">
              <p className="text-sm font-medium text-warning">Not Collected</p>
              <p className="mt-1 text-3xl font-bold text-foreground">
                {stats.not_collected_this_month ?? 0}
              </p>
              <p className="mt-1 text-xs text-muted">active pensioners missing from upload</p>
            </div>
          </div>

          {(stats.missing_collections_count ?? 0) > 0 && (
            <div className="glass-card border-warning/30 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserXIcon className="h-5 w-5 text-warning" />
                  <h2 className="font-semibold text-foreground">Missing Payments Alert</h2>
                </div>
                <Link
                  href="/reports/missing"
                  className="flex items-center text-sm text-primary hover:text-primary-hover"
                >
                  View all <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
              <p className="text-sm text-muted">
                {stats.missing_collections_count} active members have no collection for this period.
              </p>
            </div>
          )}
        </>
      )}
    </PageWrapper>
  );
}
