'use client';

import { Card } from '@/components/ui/Card';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Wrench } from 'lucide-react';
import { usePaginatedSearch } from '@/hooks/usePaginatedSearch';
import { TableSearchBar } from '@/components/shared/TableSearchBar';
import { TablePagination } from '@/components/shared/TablePagination';

const PROCESSES = [
  { key: 'sorting', label: 'Sorting' },
  { key: 'designing', label: 'Designing' },
  { key: 'cutting', label: 'Cutting' },
  { key: 'grinding', label: 'Grinding' },
  { key: 'polishing', label: 'Polishing' },
  { key: 'word_engraving', label: 'Word Engraving' },
  { key: 'blasting', label: 'Blasting' },
  { key: 'sampling', label: 'Sampling' },
  { key: 'installation', label: 'Installation' },
];

function isStepDone(value: unknown): boolean {
  return value === 1 || value === true || value === '1';
}

export default function ProductionPage() {
  const queryClient = useQueryClient();
  const { data: workflows, isLoading } = useQuery({
    queryKey: ['production'],
    queryFn: async () => {
      const { data } = await api.get('/production');
      return data;
    }
  });

  const updateWorkflow = useMutation({
    mutationFn: async ({ orderId, updates }: { orderId: number; updates: Record<string, boolean> }) => {
      const { data } = await api.put(`/production/${orderId}`, updates);
      return data;
    },
    onMutate: async ({ orderId, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['production'] });
      const previous = queryClient.getQueryData<any[]>(['production']);
      queryClient.setQueryData(['production'], (old: any[] | undefined) =>
        old?.map(row =>
          row.order_id === orderId
            ? { ...row, ...Object.fromEntries(Object.entries(updates).map(([k, v]) => [k, v ? 1 : 0])) }
            : row
        )
      );
      return { previous };
    },
    onError: (err: any, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['production'], context.previous);
      }
      const msg = err?.response?.data?.error || err?.message || 'Save failed';
      alert(
        `Could not save production step.\n\n${msg}\n\nIf columns are missing in the database, run the production_workflow section of migration_v2_amendments.sql in phpMyAdmin.`
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['production'] });
    }
  });

  const toggle = (orderId: number, field: string, current: boolean, row: any) => {
    if (updateWorkflow.isPending) return;

    const updates: Record<string, boolean> = {};
    PROCESSES.forEach(p => {
      updates[p.key] = isStepDone(row[p.key]);
    });
    updates[field] = !current;
    updateWorkflow.mutate({ orderId, updates });
  };

  const {
    searchTerm, setSearchTerm, currentPage, setCurrentPage,
    paginatedItems, totalPages, pageSize, totalCount
  } = usePaginatedSearch(workflows, ['order_id', 'client_name', 'design_code', 'design_type'], 10);

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
          <Wrench className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Production Workflow</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Click a checkbox to mark each production step complete</p>
        </div>
      </div>

      <Card hoverEffect={false} className="p-0 overflow-hidden">
        <div className="border-b border-slate-200/60 p-6 dark:border-slate-800">
          <TableSearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search by order ID, client, or design..." />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Design</th>
                {PROCESSES.map(p => (
                  <th key={p.key} className="px-2 py-3 text-center whitespace-nowrap">{p.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {isLoading ? (
                <tr><td colSpan={12} className="px-6 py-8 text-center text-slate-500">Loading...</td></tr>
              ) : workflows?.length === 0 ? (
                <tr><td colSpan={12} className="px-6 py-8 text-center text-slate-500">No production orders yet.</td></tr>
              ) : totalCount === 0 ? (
                <tr><td colSpan={12} className="px-6 py-8 text-center text-slate-500">No orders match your search.</td></tr>
              ) : (
                paginatedItems.map((row: any) => (
                  <tr key={row.order_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-medium">#{row.order_id}</td>
                    <td className="px-4 py-3">{row.client_name}</td>
                    <td className="px-4 py-3">{row.design_code || row.design_type}</td>
                    {PROCESSES.map(p => {
                      const checked = isStepDone(row[p.key]);
                      return (
                        <td key={p.key} className="px-2 py-3 text-center">
                          <label className="inline-flex cursor-pointer items-center justify-center p-1">
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={updateWorkflow.isPending}
                              onChange={() => toggle(row.order_id, p.key, checked, row)}
                              className="h-5 w-5 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                            />
                          </label>
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </Card>
    </div>
  );
}
