'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Edit2, Trash2, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { canWritePensioners } from '@/lib/roles';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Users } from 'lucide-react';

type PensionerForm = {
  full_name: string;
  payroll_number: string;
  status: 'active' | 'inactive';
};

type Pensioner = PensionerForm & { id: number };

const emptyForm: PensionerForm = {
  full_name: '',
  payroll_number: '',
  status: 'active',
};

export default function PensionersPage() {
  const user = useAuthStore((state) => state.user);
  const canWrite = canWritePensioners(user?.role);
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [form, setForm] = useState<PensionerForm>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['pensioners-list', statusFilter],
    queryFn: async () => {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const response = await api.get('/api/pensioners', { params });
      return response.data as Pensioner[];
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: PensionerForm) => api.post('/api/pensioners', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pensioners-list'] });
      setShowForm(false);
      setForm(emptyForm);
      toast.success('Pensioner created');
    },
    onError: () => toast.error('Failed to create pensioner'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data: payload }: { id: number; data: PensionerForm }) =>
      api.put(`/api/pensioners/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pensioners-list'] });
      setEditingId(null);
      setForm(emptyForm);
      setShowForm(false);
      toast.success('Pensioner updated');
    },
    onError: () => toast.error('Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/pensioners/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pensioners-list'] });
      setDeleteId(null);
      toast.success('Pensioner deleted');
    },
    onError: () => toast.error('Failed to delete'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      api.post(`/api/pensioners/${id}/${active ? 'activate' : 'deactivate'}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pensioners-list'] });
      toast.success('Status updated');
    },
  });

  const openEdit = (pensioner: Pensioner) => {
    setForm({
      full_name: pensioner.full_name,
      payroll_number: pensioner.payroll_number,
      status: pensioner.status,
    });
    setEditingId(pensioner.id);
    setShowForm(true);
  };

  const columns = useMemo<ColumnDef<Pensioner>[]>(
    () => [
      {
        accessorKey: 'full_name',
        header: 'Full Name',
        cell: ({ row }) => (
          <Link
            href={`/pensioners/view?id=${row.original.id}`}
            className="font-medium text-primary hover:underline"
          >
            {row.original.full_name}
          </Link>
        ),
      },
      { accessorKey: 'payroll_number', header: 'Payroll Number' },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={row.original.status === 'active' ? 'success' : 'muted'}>
            {row.original.status}
          </Badge>
        ),
      },
      ...(canWrite
        ? [
            {
              id: 'actions',
              header: 'Actions',
              cell: ({ row }: { row: { original: Pensioner } }) => (
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(row.original)}
                    className="rounded-lg p-1.5 text-muted hover:bg-surface/50 hover:text-foreground"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() =>
                      toggleMutation.mutate({
                        id: row.original.id,
                        active: row.original.status === 'inactive',
                      })
                    }
                    className="rounded-lg p-1.5 text-muted hover:bg-surface/50 hover:text-foreground"
                  >
                    {row.original.status === 'active' ? (
                      <UserX className="h-4 w-4" />
                    ) : (
                      <UserCheck className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => setDeleteId(row.original.id)}
                    className="rounded-lg p-1.5 text-danger hover:bg-danger-muted"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ),
            } as ColumnDef<Pensioner>,
          ]
        : []),
    ],
    [canWrite, toggleMutation]
  );

  const filterButtons = (
    <div className="flex flex-wrap gap-2">
      {(['all', 'active', 'inactive'] as const).map((filter) => (
        <button
          key={filter}
          onClick={() => setStatusFilter(filter)}
          className={`rounded-lg px-3 py-1.5 text-sm capitalize transition-colors ${
            statusFilter === filter
              ? 'bg-primary-muted text-primary'
              : 'bg-surface/50 text-muted hover:text-foreground'
          }`}
        >
          {filter}
        </button>
      ))}
      {canWrite && (
        <Button
          icon={<Plus className="h-4 w-4" />}
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setForm(emptyForm);
          }}
        >
          Add Pensioner
        </Button>
      )}
    </div>
  );

  return (
    <PageWrapper
      title="Pensioners"
      subtitle={`${data?.length ?? 0} records`}
      actions={filterButtons}
    >
      {showForm && canWrite && (
        <div className="glass-card mb-6 p-5">
          <h2 className="mb-4 font-semibold text-foreground">
            {editingId ? 'Edit' : 'Add'} Pensioner
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              placeholder="Full Name"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="rounded-lg border border-border bg-background/50 px-3 py-2 text-foreground"
            />
            <input
              placeholder="Payroll Number"
              value={form.payroll_number}
              onChange={(e) => setForm({ ...form, payroll_number: e.target.value })}
              className="rounded-lg border border-border bg-background/50 px-3 py-2 text-foreground"
            />
            <select
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as PensionerForm['status'] })
              }
              className="rounded-lg border border-border bg-background/50 px-3 py-2 text-foreground"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              loading={createMutation.isPending || updateMutation.isPending}
              onClick={() =>
                editingId
                  ? updateMutation.mutate({ id: editingId, data: form })
                  : createMutation.mutate(form)
              }
            >
              Save
            </Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {!isLoading && !data?.length ? (
        <EmptyState
          icon={Users}
          title="No pensioners yet"
          description="Upload a monthly Excel file or add pensioners manually to get started."
        />
      ) : (
        <DataTable
          data={data || []}
          columns={columns}
          loading={isLoading}
          searchPlaceholder="Search name or payroll…"
          exportFilename="pensioners"
          rowClassName={(row) =>
            row.status === 'inactive' ? 'opacity-50 bg-surface/20' : undefined
          }
        />
      )}

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete pensioner?">
        <p className="text-sm text-muted">
          This permanently removes the record and all collection history.
        </p>
        <div className="mt-6 flex gap-2">
          <Button
            variant="danger"
            loading={deleteMutation.isPending}
            onClick={() => deleteId && deleteMutation.mutate(deleteId)}
          >
            Delete
          </Button>
          <Button variant="secondary" onClick={() => setDeleteId(null)}>
            Cancel
          </Button>
        </div>
      </Modal>
    </PageWrapper>
  );
}
