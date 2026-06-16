'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatMoney, shortMonthLabel } from '@/lib/format';

const TOOLTIP_STYLE = {
  contentStyle: {
    background: '#1E293B',
    border: '1px solid rgba(148,163,184,0.12)',
    borderRadius: '8px',
    fontSize: '12px',
  },
};

type TrendRow = {
  month: number;
  year: number;
  paid_amount?: number | string;
  total_paid?: number | string;
  total_commission?: number | string;
  total_net_premium?: number | string;
  total_bona_life?: number | string;
};

export function CollectionsAreaChart({ data }: { data: TrendRow[] }) {
  const chartData = data.map((row) => ({
    label: shortMonthLabel(Number(row.month), Number(row.year)),
    paid: Number(row.paid_amount ?? row.total_paid) || 0,
  }));

  if (!chartData.length) return null;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="paidGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
        <XAxis dataKey="label" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip
          {...TOOLTIP_STYLE}
          formatter={(value) => [formatMoney(Number(value) || 0), 'Paid']}
        />
        <Area
          type="monotone"
          dataKey="paid"
          stroke="#3B82F6"
          fill="url(#paidGradient)"
          strokeWidth={2}
          isAnimationActive
          animationDuration={800}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ActiveInactivePieChart({
  active,
  inactive,
}: {
  active: number;
  inactive: number;
}) {
  const data = [
    { name: 'Active', value: active, color: '#22C55E' },
    { name: 'Inactive', value: inactive, color: '#64748B' },
  ].filter((d) => d.value > 0);

  if (!data.length) return null;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={4}
          dataKey="value"
          isAnimationActive
          animationDuration={800}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip {...TOOLTIP_STYLE} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function RevenueDonutChart({
  commission,
  adminFee,
  collectionFee,
  netPremium,
}: {
  commission: number;
  adminFee: number;
  collectionFee: number;
  netPremium: number;
}) {
  const data = [
    { name: 'Commission', value: commission, color: '#3B82F6' },
    { name: 'Admin Fee', value: adminFee, color: '#8B5CF6' },
    { name: 'Collection', value: collectionFee, color: '#F59E0B' },
    { name: 'Net Premium', value: netPremium, color: '#22C55E' },
  ].filter((d) => d.value > 0);

  if (!data.length) return null;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
          dataKey="value"
          isAnimationActive
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip {...TOOLTIP_STYLE} formatter={(v) => formatMoney(Number(v) || 0)} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function CollectionLineChart({ data }: { data: TrendRow[] }) {
  const chartData = data.map((row) => ({
    label: shortMonthLabel(Number(row.month), Number(row.year)),
    bona: Number(row.total_bona_life) || 0,
    net: Number(row.total_net_premium) || 0,
  }));

  if (!chartData.length) return null;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
        <XAxis dataKey="label" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip {...TOOLTIP_STYLE} formatter={(v) => formatMoney(Number(v) || 0)} />
        <Line type="monotone" dataKey="bona" stroke="#22C55E" strokeWidth={2} dot={false} isAnimationActive />
        <Line type="monotone" dataKey="net" stroke="#3B82F6" strokeWidth={2} dot={false} isAnimationActive />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function TopContributorsBarChart({
  rows,
}: {
  rows: { full_name: string; paid_amount: number }[];
}) {
  const top = [...rows]
    .sort((a, b) => Number(b.paid_amount) - Number(a.paid_amount))
    .slice(0, 8)
    .map((r) => ({
      name: String(r.full_name).split(' ').slice(0, 2).join(' '),
      paid: Number(r.paid_amount) || 0,
    }));

  if (!top.length) return null;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={top} layout="vertical" margin={{ left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" horizontal={false} />
        <XAxis type="number" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          width={90}
          tick={{ fill: '#94A3B8', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip {...TOOLTIP_STYLE} formatter={(v) => formatMoney(Number(v) || 0)} />
        <Bar dataKey="paid" fill="#3B82F6" radius={[0, 4, 4, 0]} isAnimationActive animationDuration={600} />
      </BarChart>
    </ResponsiveContainer>
  );
}
