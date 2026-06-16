'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { motion } from 'framer-motion';
import { Plus, Edit2, Settings, Trash2 } from 'lucide-react';
import { 
  useExtras, useCreateExtra, useUpdateExtra, useDeleteExtra
} from '@/services/queries';
import { usePaginatedSearch } from '@/hooks/usePaginatedSearch';
import { TableSearchBar } from '@/components/shared/TableSearchBar';
import { TablePagination } from '@/components/shared/TablePagination';

const DEFAULT_FORM_STATE = {
  extra_name: '',
  price: 0
};

export default function ExtrasPage() {
  const { data: extras, isLoading } = useExtras();
  const createExtra = useCreateExtra();
  const updateExtra = useUpdateExtra();
  const deleteExtra = useDeleteExtra();

  const {
    searchTerm, setSearchTerm, currentPage, setCurrentPage,
    paginatedItems, totalPages, pageSize, totalCount
  } = usePaginatedSearch(extras, ['extra_name'], 10);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(DEFAULT_FORM_STATE);

  const handleOpenNew = () => {
    setFormData(DEFAULT_FORM_STATE);
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (extra: any) => {
    setFormData({
      extra_name: extra.extra_name || '',
      price: extra.price || 0
    });
    setEditingId(extra.extra_id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this extra?')) {
      try {
        await deleteExtra.mutateAsync(id);
      } catch (err) {
        alert('Error deleting extra.');
        console.error(err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateExtra.mutateAsync({ id: editingId, data: formData });
      } else {
        await createExtra.mutateAsync(formData);
      }
      setIsModalOpen(false);
    } catch (err) {
      alert('Error saving extra. Check console for details.');
      console.error(err);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Extras Pricing</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage prices for optional add-ons and accessories</p>
          </div>
        </div>
        <button 
          onClick={handleOpenNew}
          className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 shadow-sm transition-all"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Extra
        </button>
      </div>

      <Card hoverEffect={false} className="p-0 overflow-hidden">
        <div className="border-b border-slate-200/60 p-6 dark:border-slate-800">
          <TableSearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search extras by name..." />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500 backdrop-blur-sm dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">Extra Name</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-transparent dark:divide-slate-800/60">
              {!extras && isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-700"></div></td>
                    <td className="px-6 py-4 text-right"><div className="flex justify-end space-x-3"><div className="h-5 w-5 rounded bg-slate-200 dark:bg-slate-700"></div><div className="h-5 w-5 rounded bg-slate-200 dark:bg-slate-700"></div></div></td>
                  </tr>
                ))
              ) : extras?.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    No extras found.
                  </td>
                </tr>
              ) : totalCount === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    No extras match your search.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((extra: any, i: number) => (
                  <motion.tr 
                    key={extra.extra_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="text-slate-700 transition-colors hover:bg-slate-50/50 dark:text-slate-300 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{extra.extra_name}</td>
                    <td className="px-6 py-4">BWP {Number(extra.price).toFixed(2)}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => handleOpenEdit(extra)}
                        className="rounded-full p-2 text-blue-400 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(extra.extra_id)}
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

      {/* Extra Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-800"
          >
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
              {editingId ? 'Edit Extra' : 'Add New Extra'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Extra Name
                </label>
                <input 
                  type="text" 
                  required
                  value={formData.extra_name}
                  onChange={e => setFormData({...formData, extra_name: e.target.value})}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Price (BWP)
                </label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
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
                  disabled={createExtra.isPending || updateExtra.isPending}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {createExtra.isPending || updateExtra.isPending ? 'Saving...' : 'Save Extra'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
