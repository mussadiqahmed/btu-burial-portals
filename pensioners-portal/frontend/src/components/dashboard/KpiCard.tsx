'use client';

import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import { staggerItem } from '@/lib/animations';

type KpiCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  sparkline?: number[];
  accent?: 'primary' | 'success' | 'warning' | 'danger' | 'violet';
  loading?: boolean;
};

const accents = {
  primary: { bg: 'bg-primary-muted', text: 'text-primary', stroke: '#3B82F6' },
  success: { bg: 'bg-success-muted', text: 'text-success', stroke: '#22C55E' },
  warning: { bg: 'bg-warning-muted', text: 'text-warning', stroke: '#F59E0B' },
  danger: { bg: 'bg-danger-muted', text: 'text-danger', stroke: '#EF4444' },
  violet: { bg: 'bg-violet-500/15', text: 'text-violet-400', stroke: '#8B5CF6' },
};

export function KpiCard({
  label,
  value,
  icon: Icon,
  trend,
  trendLabel,
  sparkline,
  accent = 'primary',
  loading,
}: KpiCardProps) {
  const style = accents[accent];
  const sparkData = (sparkline || []).map((v, i) => ({ v, i }));
  const trendUp = trend != null && trend >= 0;

  if (loading) {
    return (
      <div className="glass-card animate-pulse p-5">
        <div className="mb-4 h-4 w-24 rounded bg-surface/50" />
        <div className="mb-2 h-8 w-32 rounded bg-surface/50" />
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="group glass-card gradient-border relative overflow-hidden p-5 transition-shadow hover:shadow-glow"
    >
      <div className="mb-3 flex items-start justify-between">
        <span className="text-sm font-medium text-muted">{label}</span>
        <div className={cn('rounded-lg p-2.5 transition-transform group-hover:scale-110', style.bg)}>
          <Icon className={cn('h-4 w-4', style.text)} />
        </div>
      </div>

      <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>

      <div className="mt-2 flex items-center justify-between gap-2">
        {trend != null && (
          <div
            className={cn(
              'flex items-center gap-1 text-xs font-medium',
              trendUp ? 'text-success' : 'text-danger'
            )}
          >
            {trendUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            <span>{trendUp ? '+' : ''}{trend}%</span>
            {trendLabel && <span className="text-muted">{trendLabel}</span>}
          </div>
        )}
        {sparkData.length > 1 && (
          <div className="h-8 w-20 opacity-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData}>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke={style.stroke}
                  fill={style.stroke}
                  fillOpacity={0.2}
                  strokeWidth={1.5}
                  isAnimationActive
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </motion.div>
  );
}
