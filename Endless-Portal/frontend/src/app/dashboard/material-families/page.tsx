'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { motion } from 'framer-motion';
import { Plus, Edit2, Gem, Trash2 } from 'lucide-react';
import {
  useMaterialFamilies,
  useCreateMaterialFamily,
  useUpdateMaterialFamily,
  useDeleteMaterialFamily,
} from '@/services/queries';
import { usePaginatedSearch } from '@/hooks/usePaginatedSearch';
import { TableSearchBar } from '@/components/shared/TableSearchBar';
import { TablePagination } from '@/components/shared/TablePagination';

export default function MaterialFamiliesPage() {
  const { data: families, isLoading } = useMaterialFamilies();
  const createFamily = useCreateMaterialFamily();
  const updateFamily = useUpdateMaterialFamily();
  const deleteFamily = useDeleteMaterialFamily();

  const {
    searchTerm, setSearchTerm, currentPage, setCurrentPage,
    paginatedItems, totalPages, pageSize, totalCount,
  } = usePaginatedSearch(families, ['name'], 10);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');

  const handleOpenNew = () => {
    setName('');
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: { family_id: number; name: string }) => {
    setName(item.name);
    setEditingId(item.family_id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this material family? This cannot be undone if it is not in use.')) return;
    try {
      await deleteFamily.mutateAsync(id);
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to delete material family.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      alert('Material family name is required.');
      return;
    }
    try {
      if (editingId) {
        await updateFamily.mutateAsync({ id: editingId, data: { name: trimmed } });
      } else {
        await createFamily.mutateAsync({ name: trimmed });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to save material family.');
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400">
            <Gem className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Material Families</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage stone and material family options used across orders and inventory</p>
          </div>
        </div>
        <button
          onClick={handleOpenNew}
          className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 shadow-sm transition-all"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Material Family
        </button>
      </div>

      <Card hoverEffect={false} className="p-0 overflow-hidden">
        <div className="border-b border-slate-200/60 p-6 dark:border-slate-800">
          <TableSearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search material families..." />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500 backdrop-blur-sm dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-transparent dark:divide-slate-800/60">
              {isLoading ? (
                <tr><td colSpan={2} className="px-6 py-8 text-center">Loading...</td></tr>
              ) : totalCount === 0 ? (
                <tr><td colSpan={2} className="px-6 py-12 text-center text-slate-500">No material families found.</td></tr>
              ) : (
                paginatedItems.map((item: { family_id: number; name: string }, i: number) => (
                  <motion.tr
                    key={item.family_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="text-slate-700 transition-colors hover:bg-slate-50/50 dark:text-slate-300 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{item.name}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="rounded-full p-2 text-blue-400 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.family_id)}
                        className="rounded-full p-2 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                        title="Delete"
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800"
          >
            <h2 className="mb-6 text-xl font-bold text-gray-900 dark:text-white">
              {editingId ? 'Edit Material Family' : 'Add Material Family'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rustenburg"
                  className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createFamily.isPending || updateFamily.isPending}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {createFamily.isPending || updateFamily.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
