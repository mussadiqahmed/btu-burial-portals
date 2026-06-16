'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatMoney, MONTHS } from '@/lib/format';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { ChartCard } from '@/components/charts/ChartCard';
import {
  CollectionsAreaChart,
  RevenueDonutChart,
  TopContributorsBarChart,
} from '@/components/charts/DashboardCharts';
import { Select } from '@/components/ui/Select';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { Wallet, TrendingUp, Users, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer } from '@/lib/animations';

export default function AnalyticsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data: dashboard, isLoading: dashLoading } = useQuery({
    queryKey: ['dashboard', month, year],
    queryFn: async () => {
      const res = await api.get('/api/dashboard', { params: { month, year } });
      return res.data;
    },
  });

  const { data: monthly } = useQuery({
    queryKey: ['monthly-report', month, year],
    queryFn: async () => {
      const res = await api.get('/api/reports/monthly', { params: { month, year } });
      return res.data;
    },
  });

  const { data: missing } = useQuery({
    queryKey: ['missing-report', month, year],
    queryFn: async () => {
      const res = await api.get('/api/reports/missing', { params: { month, year } });
      return res.data;
    },
  });

  const summary = dashboard?.summary || {};
  const trends = dashboard?.trends || [];
  const totals = monthly?.totals || {};
  const rows = monthly?.rows || [];

  const periodActions = (
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
  );

  return (
    <PageWrapper
      title="Analytics"
      subtitle="Collection tracking and member activity"
      actions={periodActions}
    >
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <KpiCard
          label="Total Collected"
          value={formatMoney(totals.total_paid)}
          icon={Wallet}
          accent="primary"
          loading={dashLoading}
        />
        <KpiCard
          label="Month-over-Month"
          value={`${summary.growth_percentage ?? 0}%`}
          icon={TrendingUp}
          accent="success"
          loading={dashLoading}
        />
        <KpiCard
          label="Pensioners Paid"
          value={totals.pensioner_count ?? 0}
          icon={Users}
          accent="violet"
          loading={dashLoading}
        />
        <KpiCard
          label="Missing"
          value={missing?.count ?? 0}
          icon={AlertTriangle}
          accent="danger"
          loading={dashLoading}
        />
      </motion.div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <ChartCard title="Collection Trends" subtitle="Paid amount over time">
          {trends.length ? (
            <CollectionsAreaChart data={trends} />
          ) : (
            <p className="py-16 text-center text-sm text-muted">No trend data available</p>
          )}
        </ChartCard>

        <ChartCard title="Fee Breakdown" subtitle="Calculated fields (reference)">
          <RevenueDonutChart
            commission={Number(totals.total_commission) || 0}
            adminFee={Number(totals.total_admin_fee) || 0}
            collectionFee={Number(totals.total_collection_fee) || 0}
            netPremium={Number(totals.total_net_premium) || 0}
          />
        </ChartCard>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <ChartCard title="Monthly Collections" subtitle="Area view">
          {trends.length ? (
            <CollectionsAreaChart data={trends} />
          ) : (
            <p className="py-16 text-center text-sm text-muted">No data</p>
          )}
        </ChartCard>

        <ChartCard title="Top Contributors" subtitle="Highest paid amounts">
          {rows.length ? (
            <TopContributorsBarChart rows={rows} />
          ) : (
            <p className="py-16 text-center text-sm text-muted">No contributors</p>
          )}
        </ChartCard>
      </div>

      <ChartCard title="Month-over-Month Comparison" subtitle={`${MONTHS[month - 1]} ${year}`}>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-surface/30 p-4">
            <p className="text-xs text-muted">Current Month</p>
            <p className="text-xl font-bold text-foreground">
              {formatMoney(summary.current_month_paid)}
            </p>
          </div>
          <div className="rounded-lg bg-surface/30 p-4">
            <p className="text-xs text-muted">Previous Month</p>
            <p className="text-xl font-bold text-foreground">
              {formatMoney(summary.previous_month_paid)}
            </p>
          </div>
          <div className="rounded-lg bg-surface/30 p-4">
            <p className="text-xs text-muted">Growth</p>
            <p className="text-xl font-bold text-foreground">{summary.growth_percentage ?? 0}%</p>
          </div>
        </div>
      </ChartCard>
    </PageWrapper>
  );
}
