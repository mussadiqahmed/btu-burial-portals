'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { BarChart3, Target, Quote, ShoppingCart } from 'lucide-react';
import { usePaginatedSearch } from '@/hooks/usePaginatedSearch';
import { TableSearchBar } from '@/components/shared/TableSearchBar';
import { TablePagination } from '@/components/shared/TablePagination';

export default function MarketingSalesPage() {
  const [dateMode, setDateMode] = useState<'month' | 'custom'>('month');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const statsQueryKey = dateMode === 'custom'
    ? ['marketing-stats', 'custom', customStartDate, customEndDate]
    : ['marketing-stats', 'month', month];

  const { data: stats, isLoading } = useQuery({
    queryKey: statsQueryKey,
    enabled: dateMode !== 'custom' || (!!customStartDate && !!customEndDate),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateMode === 'custom') {
        params.set('range', 'custom');
        params.set('startDate', customStartDate);
        params.set('endDate', customEndDate);
      } else {
        params.set('month', month);
      }
      return (await api.get(`/marketing/stats?${params.toString()}`)).data;
    },
  });

  const periodLabel = dateMode === 'custom' && customStartDate && customEndDate
    ? `${new Date(customStartDate).toLocaleDateString()} – ${new Date(customEndDate).toLocaleDateString()}`
    : new Date(`${month}-01`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const leadTotal = stats?.leadsByStatus?.reduce((sum: number, r: any) => sum + Number(r.count), 0) || 0;
  const quoteTotal = stats?.quotationStats?.reduce((sum: number, r: any) => sum + Number(r.count), 0) || 0;
  const quoteValue = stats?.quotationStats?.reduce((sum: number, r: any) => sum + Number(r.total), 0) || 0;

  const {
    searchTerm, setSearchTerm, currentPage, setCurrentPage,
    paginatedItems, totalPages, pageSize, totalCount
  } = usePaginatedSearch(stats?.recentQuotations, ['client_name', 'design_code', 'status'], 10);

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sales Performance</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Marketing and sales overview — {periodLabel}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            value={dateMode}
            onChange={(e) => setDateMode(e.target.value as 'month' | 'custom')}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="month">By Month</option>
            <option value="custom">Custom Range</option>
          </select>
          {dateMode === 'month' ? (
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
          )}
        </div>
      </div>

      {dateMode === 'custom' && (!customStartDate || !customEndDate) ? (
        <p className="text-center text-gray-500 py-12">Select a start and end date to view stats.</p>
      ) : isLoading ? (
        <p className="text-center text-gray-500 py-12">Loading stats...</p>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="flex items-center p-4">
              <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-violet-50 text-violet-600">
                <Target className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Leads</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{leadTotal}</p>
              </div>
            </Card>
            <Card className="flex items-center p-4">
              <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                <Quote className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Quotations</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{quoteTotal}</p>
              </div>
            </Card>
            <Card className="flex items-center p-4">
              <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Quote Value (BWP)</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{Number(quoteValue).toLocaleString()}</p>
              </div>
            </Card>
            <Card className="flex items-center p-4">
              <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Orders / Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.orderCount || 0} / BWP {Number(stats?.orderRevenue || 0).toLocaleString()}
                </p>
              </div>
            </Card>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card hoverEffect={false} className="p-0 overflow-hidden">
              <h2 className="border-b px-6 py-4 text-sm font-semibold uppercase text-slate-500">Leads by Status</h2>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {stats?.leadsByStatus?.length === 0 ? (
                    <tr><td className="px-6 py-8 text-center text-slate-500">No leads in this period</td></tr>
                  ) : stats?.leadsByStatus?.map((row: any) => (
                    <tr key={row.status}>
                      <td className="px-6 py-3">{row.status}</td>
                      <td className="px-6 py-3 text-right font-medium">{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            <Card hoverEffect={false} className="p-0 overflow-hidden">
              <h2 className="border-b px-6 py-4 text-sm font-semibold uppercase text-slate-500">Leads by Source</h2>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {stats?.leadsBySource?.length === 0 ? (
                    <tr><td className="px-6 py-8 text-center text-slate-500">No leads in this period</td></tr>
                  ) : stats?.leadsBySource?.map((row: any) => (
                    <tr key={row.source}>
                      <td className="px-6 py-3">{row.source}</td>
                      <td className="px-6 py-3 text-right font-medium">{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>

          <Card hoverEffect={false} className="mb-8 p-0 overflow-hidden">
            <h2 className="border-b px-6 py-4 text-sm font-semibold uppercase text-slate-500">Quotations by Status</h2>
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr><th className="px-6 py-2 text-left">Status</th><th className="px-6 py-2 text-right">Count</th><th className="px-6 py-2 text-right">Total (BWP)</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {stats?.quotationStats?.length === 0 ? (
                  <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-500">No quotations in this period</td></tr>
                ) : stats?.quotationStats?.map((row: any) => (
                  <tr key={row.status}>
                    <td className="px-6 py-3">{row.status}</td>
                    <td className="px-6 py-3 text-right">{row.count}</td>
                    <td className="px-6 py-3 text-right font-medium">{Number(row.total).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Card hoverEffect={false} className="p-0 overflow-hidden">
            <div className="border-b px-6 py-4">
              <h2 className="mb-4 text-sm font-semibold uppercase text-slate-500">Recent Quotations</h2>
              <TableSearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search recent quotations..." />
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50/50 text-xs font-semibold uppercase text-slate-500 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Design</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {stats?.recentQuotations?.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No recent quotations</td></tr>
                ) : totalCount === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No quotations match your search.</td></tr>
                ) : paginatedItems.map((q: any) => (
                  <tr key={q.quotation_id}>
                    <td className="px-6 py-4 font-medium">{q.client_name}</td>
                    <td className="px-6 py-4">{q.design_code || '—'}</td>
                    <td className="px-6 py-4">BWP {Number(q.amount).toLocaleString()}</td>
                    <td className="px-6 py-4">{q.status}</td>
                    <td className="px-6 py-4 text-slate-500">{new Date(q.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </Card>
        </>
      )}
    </div>
  );
}
