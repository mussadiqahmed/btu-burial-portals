'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { motion } from 'framer-motion';
import { Plus, Edit2, Layers, Trash2 } from 'lucide-react';
import { usePaginatedSearch } from '@/hooks/usePaginatedSearch';
import { TableSearchBar } from '@/components/shared/TableSearchBar';
import { TablePagination } from '@/components/shared/TablePagination';
import { useInventory, useCreateInventoryItem, useUpdateInventoryItem, useDeleteInventoryItem } from '@/services/queries';
import { MaterialFamilySelect } from '@/components/shared/MaterialFamilySelect';

export default function MaterialsPage() {
  const { data: materials, isLoading } = useInventory();
  const createItem = useCreateInventoryItem();
  const updateItem = useUpdateInventoryItem();
  const deleteItem = useDeleteInventoryItem();

  const {
    searchTerm, setSearchTerm, currentPage, setCurrentPage,
    paginatedItems, totalPages, pageSize, totalCount
  } = usePaginatedSearch(materials, ['material_name', 'unit', 'piece_type', 'material_family'], 10);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    material_name: '',
    unit: 'Piece',
    quantity: 0,
    reorder_level: 10,
    supplier: '',
    last_order_date: '',
    piece_type: '',
    material_family: ''
  });

  const handleOpenNew = () => {
    setFormData({
      material_name: '',
      unit: 'Piece',
      quantity: 0,
      reorder_level: 10,
      supplier: '',
      last_order_date: '',
      piece_type: '',
      material_family: ''
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setFormData({
      material_name: item.material_name || '',
      unit: item.unit || 'Piece',
      quantity: item.quantity || 0,
      reorder_level: item.reorder_level || 10,
      supplier: item.supplier || '',
      last_order_date: item.last_order_date ? new Date(item.last_order_date).toISOString().split('T')[0] : '',
      piece_type: item.piece_type || '',
      material_family: item.material_family || ''
    });
    setEditingId(item.material_id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this material? This will also remove it from the inventory.')) {
      try {
        await deleteItem.mutateAsync(id);
      } catch (err) {
        alert('Error deleting material.');
        console.error(err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateItem.mutateAsync({ id: editingId, data: formData });
      } else {
        await createItem.mutateAsync(formData);
      }
      setIsModalOpen(false);
    } catch (err) {
      alert('Error saving material. Check console for details.');
      console.error(err);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Materials</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Define the materials used in your products</p>
          </div>
        </div>
        <button 
          onClick={handleOpenNew}
          className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 shadow-sm transition-all"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add New Material
        </button>
      </div>

      <Card hoverEffect={false} className="p-0 overflow-hidden">
        <div className="border-b border-slate-200/60 p-6 dark:border-slate-800">
          <TableSearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search materials by name, unit, or type..." />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500 backdrop-blur-sm dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">Material Name</th>
                <th className="px-6 py-4">Unit Type</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-transparent dark:divide-slate-800/60">
              {!materials && isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 w-48 rounded bg-slate-200 dark:bg-slate-700"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-700"></div></td>
                    <td className="px-6 py-4"><div className="flex justify-end space-x-3"><div className="h-5 w-5 rounded bg-slate-200 dark:bg-slate-700"></div><div className="h-5 w-5 rounded bg-slate-200 dark:bg-slate-700"></div></div></td>
                  </tr>
                ))
              ) : materials?.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    No materials defined yet.
                  </td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    No materials match your search.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item: any, i: number) => (
                  <motion.tr 
                    key={item.material_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="text-slate-700 transition-colors hover:bg-slate-50/50 dark:text-slate-300 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{item.material_name}</td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{item.unit}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => handleOpenEdit(item)}
                        className="rounded-full p-2 text-blue-400 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                        title="Edit Material Name/Unit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.material_id)}
                        className="rounded-full p-2 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                        title="Delete Material"
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

      {/* Material Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800"
          >
            <h2 className="mb-6 text-xl font-bold text-gray-900 dark:text-white">
              {editingId ? 'Edit Material' : 'Add New Material'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Material Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rust Ledger 204x85x5 cm Slab"
                  className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  value={formData.material_name}
                  onChange={e => setFormData({...formData, material_name: e.target.value})}
                />
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Unit Type *</label>
                <select
                  required
                  className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  value={formData.unit}
                  onChange={e => setFormData({...formData, unit: e.target.value})}
                >
                  <option value="Piece">Piece</option>
                  <option value="Slab">Slab</option>
                  <option value="units">units</option>
                  <option value="kg">kg</option>
                  <option value="liters">liters</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Piece Type (for auto stock deduction)</label>
                <select className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={formData.piece_type} onChange={e => setFormData({...formData, piece_type: e.target.value})}>
                  <option value="">-- None --</option>
                  <option value="ledger">Ledger</option>
                  <option value="kerb_long">Kerb Long</option>
                  <option value="kerb_short">Kerb Short</option>
                  <option value="headstone_small">Headstone Small</option>
                  <option value="headstone_big">Headstone Big</option>
                  <option value="base_small">Base Small</option>
                  <option value="base_big">Base Big</option>
                  <option value="slab">Slab</option>
                  <option value="pillar">Pillar</option>
                  <option value="offcut">Offcut</option>
                  <option value="frame_short">Frame Short</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Material Family</label>
                <MaterialFamilySelect
                  value={formData.material_family}
                  onChange={v => setFormData({ ...formData, material_family: v })}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createItem.isPending || updateItem.isPending}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {createItem.isPending || updateItem.isPending ? 'Saving...' : 'Save Material'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}