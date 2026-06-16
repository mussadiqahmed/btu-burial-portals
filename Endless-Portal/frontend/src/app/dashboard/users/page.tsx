'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { motion } from 'framer-motion';
import { Plus, ShieldAlert, UserPlus, Edit2, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { normalizeRole } from '@/lib/roles';
import { useAuthStore } from '@/store/authStore';
import { useUsers, useUpdateUser, useDeleteUser } from '@/services/queries';
import { usePaginatedSearch } from '@/hooks/usePaginatedSearch';
import { TableSearchBar } from '@/components/shared/TableSearchBar';
import { TablePagination } from '@/components/shared/TablePagination';

export default function UsersPage() {
  const user = useAuthStore((state) => state.user);
  const { data: users, isLoading: isLoadingUsers } = useUsers();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const {
    searchTerm, setSearchTerm, currentPage, setCurrentPage,
    paginatedItems, totalPages, pageSize, totalCount
  } = usePaginatedSearch(users, ['username', 'role'], 10);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('employee');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);

  if (normalizeRole(user?.role) !== 'admin') {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-900/20">
          <ShieldAlert className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Access Denied</h2>
        <p className="mt-2 max-w-md text-gray-500 dark:text-gray-400">
          You do not have permission to view this page. Only administrators can manage user accounts.
        </p>
      </div>
    );
  }

  const handleOpenNew = () => {
    setUsername('');
    setPassword('');
    setRole('employee');
    setEditingId(null);
    setStatus({ type: '', message: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: any) => {
    setUsername(u.username);
    setPassword(''); // leave blank unless changing
    setRole(u.role);
    setEditingId(u.user_id);
    setStatus({ type: '', message: '' });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser.mutateAsync(id);
      } catch (err) {
        alert('Error deleting user.');
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ type: '', message: '' });

    try {
      if (editingId) {
        await updateUser.mutateAsync({ id: editingId, data: { username, password, role } });
        setStatus({ type: 'success', message: 'User updated successfully' });
      } else {
        const response = await api.post('/register', { username, password, role });
        setStatus({ type: 'success', message: response.data.message });
      }
      setTimeout(() => setIsModalOpen(false), 1000);
    } catch (err: any) {
      setStatus({ 
        type: 'error', 
        message: err.response?.data?.detail || 'Failed to save user' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400">
            <UserPlus className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage staff members and roles</p>
          </div>
        </div>
        <button 
          onClick={handleOpenNew}
          className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 shadow-sm transition-all"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </button>
      </div>

      <Card hoverEffect={false} className="p-0 overflow-hidden">
        <div className="border-b border-slate-200/60 p-6 dark:border-slate-800">
          <TableSearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search users by username or role..." />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500 backdrop-blur-sm dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">Username</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-transparent dark:divide-slate-800/60">
              {!users && isLoadingUsers ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-700"></div></td>
                    <td className="px-6 py-4 text-right"><div className="flex justify-end space-x-3"><div className="h-5 w-5 rounded bg-slate-200 dark:bg-slate-700"></div><div className="h-5 w-5 rounded bg-slate-200 dark:bg-slate-700"></div></div></td>
                  </tr>
                ))
              ) : users?.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    No users found.
                  </td>
                </tr>
              ) : totalCount === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    No users match your search.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((u: any, i: number) => (
                  <motion.tr 
                    key={u.user_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="text-slate-700 transition-colors hover:bg-slate-50/50 dark:text-slate-300 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{u.username}</td>
                    <td className="px-6 py-4 capitalize">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                        u.role === 'admin' ? 'bg-purple-50 text-purple-600 ring-1 ring-inset ring-purple-500/20 dark:bg-purple-500/10 dark:text-purple-400 dark:ring-purple-500/20' :
                        'bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => handleOpenEdit(u)}
                        className="rounded-full p-2 text-blue-400 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(u.user_id)}
                        className="rounded-full p-2 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </motion.tr>
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

      {/* User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-800"
          >
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
              {editingId ? 'Edit User' : 'Register New User'}
            </h2>
            <form onSubmit={handleRegister} className="space-y-4">
              {status.message && (
                <div className={`rounded-lg p-4 text-sm ${
                  status.type === 'success' 
                    ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                    : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                }`}>
                  {status.message}
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Username
                </label>
                <input 
                  type="text" 
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter username"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password {editingId && <span className="text-gray-400 text-xs">(Leave blank to keep current)</span>}
                </label>
                <input 
                  type="password" 
                  required={!editingId}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder={editingId ? "Enter new password" : "Enter password"}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Role Designation
                </label>
                <select 
                  required
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="employee">Employee</option>
                  <option value="sales">Sales</option>
                  <option value="manager">Manager</option>
                  <option value="marketing">Marketing</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save User'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
