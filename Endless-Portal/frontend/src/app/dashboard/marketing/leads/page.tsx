'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Target, Plus, Trash2, Edit2, BarChart3 } from 'lucide-react';
import { usePaginatedSearch } from '@/hooks/usePaginatedSearch';
import { TableSearchBar } from '@/components/shared/TableSearchBar';
import { TablePagination } from '@/components/shared/TablePagination';

const STATUSES = ['New', 'Contacted', 'Quoted', 'Negotiation', 'Closed', 'Lost'];

const EMPTY_FORM = {
  client_name: '',
  contact_number: '',
  email: '',
  status: 'New',
  source: '',
  notes: '',
  assigned_to: ''
};

export default function LeadsPage() {
  const queryClient = useQueryClient();
  const { data: leads, isLoading } = useQuery({
    queryKey: ['marketing-leads'],
    queryFn: async () => (await api.get('/marketing/leads')).data
  });

  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  const createLead = useMutation({
    mutationFn: async (body: typeof EMPTY_FORM) => (await api.post('/marketing/leads', body)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-leads'] });
      resetForm();
    }
  });

  const updateLead = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof EMPTY_FORM }) =>
      (await api.put(`/marketing/leads/${id}`, data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-leads'] });
      resetForm();
    }
  });

  const deleteLead = useMutation({
    mutationFn: async (id: number) => (await api.delete(`/marketing/leads/${id}`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['marketing-leads'] })
  });

  const {
    searchTerm, setSearchTerm, currentPage, setCurrentPage,
    paginatedItems, totalPages, pageSize, totalCount
  } = usePaginatedSearch(leads, ['client_name', 'contact_number', 'email', 'status', 'source', 'assigned_to'], 10);

  const leadsByStatus = useMemo(() => {
    const map: Record<string, number> = {};
    (leads || []).forEach((l: any) => {
      const status = l.status || 'Unknown';
      map[status] = (map[status] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [leads]);

  const leadsBySource = useMemo(() => {
    const map: Record<string, number> = {};
    (leads || []).forEach((l: any) => {
      const source = (l.source && l.source.trim()) ? l.source.trim() : 'Unknown';
      map[source] = (map[source] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [leads]);

  const openEdit = (lead: any) => {
    setForm({
      client_name: lead.client_name || '',
      contact_number: lead.contact_number || '',
      email: lead.email || '',
      status: lead.status || 'New',
      source: lead.source || '',
      notes: lead.notes || '',
      assigned_to: lead.assigned_to || ''
    });
    setEditingId(lead.lead_id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateLead.mutate({ id: editingId, data: form });
    } else {
      createLead.mutate(form);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <Target className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leads Management</h1>
            <p className="text-sm text-gray-500">Capture and track sales enquiries</p>
          </div>
        </div>
        <button
          onClick={() => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true); }}
          className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" /> New Lead
        </button>
      </div>

      {!isLoading && leads && leads.length > 0 && (
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card hoverEffect={false} className="p-0 overflow-hidden">
            <h2 className="flex items-center gap-2 border-b px-6 py-4 text-sm font-semibold uppercase text-slate-500">
              <BarChart3 className="h-4 w-4" /> Leads by Status
            </h2>
            <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
              {leadsByStatus.map(([status, count]) => (
                <div key={status} className="rounded-lg bg-slate-50 p-3 text-center dark:bg-slate-800/50">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
                  <p className="text-xs text-slate-500">{status}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card hoverEffect={false} className="p-0 overflow-hidden">
            <h2 className="flex items-center gap-2 border-b px-6 py-4 text-sm font-semibold uppercase text-slate-500">
              <BarChart3 className="h-4 w-4" /> Leads by Source
            </h2>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {leadsBySource.map(([source, count]) => (
                <div key={source} className="flex items-center justify-between px-6 py-3">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{count} from {source}</span>
                  <span className="rounded-full bg-violet-50 px-2 py-1 text-xs font-medium text-violet-700">{count}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {showForm && (
        <Card className="mb-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            {editingId ? 'Edit Lead' : 'New Lead'}
          </h2>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <input required placeholder="Client name" className="rounded-lg border p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} />
            <input placeholder="Contact" className="rounded-lg border p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={form.contact_number} onChange={e => setForm({ ...form, contact_number: e.target.value })} />
            <input placeholder="Email" className="rounded-lg border p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            <select className="rounded-lg border p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input placeholder="Source" className="rounded-lg border p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} />
            <input placeholder="Assigned to" className="rounded-lg border p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })} />
            <textarea placeholder="Notes" className="rounded-lg border p-2 sm:col-span-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            <div className="sm:col-span-2 flex gap-2">
              <button type="submit" disabled={createLead.isPending || updateLead.isPending} className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50">
                {editingId ? 'Update Lead' : 'Save Lead'}
              </button>
              <button type="button" onClick={resetForm} className="rounded-lg px-4 py-2 text-gray-600">Cancel</button>
            </div>
          </form>
        </Card>
      )}

      <Card hoverEffect={false} className="p-0 overflow-hidden">
        <div className="border-b border-slate-200/60 p-6 dark:border-slate-800">
          <TableSearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search leads by client, contact, status, or source..." />
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/50 text-xs font-semibold uppercase text-slate-500 dark:bg-slate-800/50">
            <tr>
              <th className="px-6 py-4">Client</th>
              <th className="px-6 py-4">Contact</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Source</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {isLoading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center">Loading...</td></tr>
            ) : leads?.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No leads yet.</td></tr>
            ) : totalCount === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No leads match your search.</td></tr>
            ) : (
              paginatedItems.map((l: any) => (
                <tr key={l.lead_id}>
                  <td className="px-6 py-4 font-medium">{l.client_name}</td>
                  <td className="px-6 py-4">{l.contact_number}</td>
                  <td className="px-6 py-4"><span className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700">{l.status}</span></td>
                  <td className="px-6 py-4">{l.source}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => openEdit(l)} className="text-blue-400 hover:text-blue-600"><Edit2 className="h-4 w-4 inline" /></button>
                    <button onClick={() => confirm('Delete?') && deleteLead.mutate(l.lead_id)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4 inline" /></button>
                  </td>
                </tr>
              ))
            )}
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
    </div>
  );
}
