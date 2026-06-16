'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Shield, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { normalizeRole, getRoleLabel } from '@/lib/roles';
import { useAuthStore } from '@/store/authStore';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';

type UserRecord = {
  user_id: number;
  username: string;
  role: string;
};

export default function UsersPage() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/api/users');
      return response.data as UserRecord[];
    },
    enabled: normalizeRole(user?.role) === 'admin',
  });

  const updateUser = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, string> }) =>
      api.put(`/api/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User updated');
    },
    onError: () => toast.error('Failed to update user'),
  });

  const deleteUser = useMutation({
    mutationFn: (id: number) => api.delete(`/api/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted');
    },
    onError: () => toast.error('Failed to delete user'),
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('manager');
  const [saving, setSaving] = useState(false);

  const isAdmin = normalizeRole(user?.role) === 'admin';

  const handleOpenEdit = useCallback((u: UserRecord) => {
    setUsername(u.username);
    setPassword('');
    setRole(u.role);
    setEditingId(u.user_id);
    setIsModalOpen(true);
  }, []);

  const columns = useMemo<ColumnDef<UserRecord>[]>(
    () => [
      { accessorKey: 'username', header: 'Username' },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ row }) => (
          <Badge variant="default">{getRoleLabel(row.original.role)}</Badge>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex gap-1">
            <button
              onClick={() => handleOpenEdit(row.original)}
              className="rounded-lg p-1.5 text-muted hover:bg-surface/50 hover:text-foreground"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => deleteUser.mutate(row.original.user_id)}
              className="rounded-lg p-1.5 text-danger hover:bg-danger-muted"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    [deleteUser, handleOpenEdit]
  );

  if (!isAdmin) {
    return (
      <PageWrapper title="Users">
        <EmptyState
          icon={Shield}
          title="Access Denied"
          description="Only administrators can manage user accounts."
        />
      </PageWrapper>
    );
  }

  const handleOpenNew = () => {
    setUsername('');
    setPassword('');
    setRole('manager');
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updateUser.mutateAsync({ id: editingId, data: { username, password, role } });
      } else {
        await api.post('/api/users', { username, password, role });
        toast.success('User created');
        queryClient.invalidateQueries({ queryKey: ['users'] });
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      toast.error(axiosErr.response?.data?.detail || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageWrapper
      title="User Management"
      subtitle="Manage portal users and roles"
      actions={
        <Button icon={<Plus className="h-4 w-4" />} onClick={handleOpenNew}>
          Add User
        </Button>
      }
    >
      <DataTable
        data={users || []}
        columns={columns}
        loading={isLoading}
        searchPlaceholder="Search users…"
        exportFilename="users"
      />

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit User' : 'Register New User'}
      >
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-muted">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-foreground"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">
              Password {editingId && '(leave blank to keep)'}
            </label>
            <input
              type="password"
              required={!editingId}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-foreground"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-foreground"
            >
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="data_analyst">Data Analyst</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save User
            </Button>
          </div>
        </form>
      </Modal>
    </PageWrapper>
  );
}
