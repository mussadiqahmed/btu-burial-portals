'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { motion } from 'framer-motion';
import { Plus, Edit2, Palette, Trash2 } from 'lucide-react';
import {
  useDesignTypes, useCreateDesignType, useUpdateDesignType, useDeleteDesignType
} from '@/services/queries';
import { usePaginatedSearch } from '@/hooks/usePaginatedSearch';
import { TableSearchBar } from '@/components/shared/TableSearchBar';
import { TablePagination } from '@/components/shared/TablePagination';

const EMPTY_FORM = {
  code: '',
  name: '',
  category: 'Standard',
  price: 0,
  description: '',
  componentsJson: '[]'
};

const PIECE_TYPES = [
  'ledger', 'kerb_long', 'kerb_short', 'headstone_small', 'headstone_big',
  'base_small', 'base_big', 'slab', 'pillar', 'offcut', 'frame_short'
];

export default function DesignTypesPage() {
  const { data: designTypes, isLoading } = useDesignTypes();
  const createDesignType = useCreateDesignType();
  const updateDesignType = useUpdateDesignType();
  const deleteDesignType = useDeleteDesignType();

  const {
    searchTerm, setSearchTerm, currentPage, setCurrentPage,
    paginatedItems, totalPages, pageSize, totalCount
  } = usePaginatedSearch(designTypes, ['code', 'name', 'category', 'description'], 10);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [newPiece, setNewPiece] = useState({ piece_type: 'ledger', quantity: 1 });

  const parseComponents = () => {
    try {
      return JSON.parse(formData.componentsJson || '[]');
    } catch {
      return [];
    }
  };

  const addPiece = () => {
    const components = parseComponents();
    components.push({ piece_type: newPiece.piece_type, quantity: newPiece.quantity });
    setFormData({ ...formData, componentsJson: JSON.stringify(components, null, 2) });
  };

  const removePiece = (index: number) => {
    const components = parseComponents();
    components.splice(index, 1);
    setFormData({ ...formData, componentsJson: JSON.stringify(components, null, 2) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      code: formData.code,
      name: formData.name,
      category: formData.category,
      price: formData.price,
      description: formData.description,
      components: parseComponents()
    };
    try {
      if (editingId) {
        await updateDesignType.mutateAsync({ id: editingId, data: payload });
      } else {
        await createDesignType.mutateAsync(payload);
      }
      setIsModalOpen(false);
    } catch (err) {
      alert('Error saving design type.');
      console.error(err);
    }
  };

  const openNew = () => {
    setFormData(EMPTY_FORM);
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEdit = (dt: any) => {
    const components = typeof dt.components === 'string'
      ? dt.components
      : JSON.stringify(dt.components || [], null, 2);
    setFormData({
      code: dt.code || '',
      name: dt.name || '',
      category: dt.category || 'Standard',
      price: Number(dt.price) || 0,
      description: dt.description || '',
      componentsJson: components
    });
    setEditingId(dt.id);
    setIsModalOpen(true);
  };

  const componentCount = (dt: any) => {
    try {
      const c = typeof dt.components === 'string' ? JSON.parse(dt.components) : dt.components;
      return Array.isArray(c) ? c.length : 0;
    } catch {
      return 0;
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400">
            <Palette className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tombstone Designs</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage design codes, prices, and stock piece requirements</p>
          </div>
        </div>
        <button onClick={openNew} className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 shadow-sm">
          <Plus className="mr-2 h-4 w-4" /> Add Design
        </button>
      </div>

      <Card hoverEffect={false} className="p-0 overflow-hidden">
        <div className="border-b border-slate-200/60 p-6 dark:border-slate-800">
          <TableSearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search by code, name, or category..." />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Pieces</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center">Loading...</td></tr>
              ) : designTypes?.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">No designs found.</td></tr>
              ) : totalCount === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">No designs match your search.</td></tr>
              ) : (
                paginatedItems.map((dt: any, i: number) => (
                  <motion.tr key={dt.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-4 font-mono font-medium">{dt.code || '—'}</td>
                    <td className="px-6 py-4">{dt.name}</td>
                    <td className="px-6 py-4"><span className="rounded-full bg-indigo-50 px-2 py-1 text-xs text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">{dt.category || '—'}</span></td>
                    <td className="px-6 py-4 font-medium">BWP {Number(dt.price).toLocaleString()}</td>
                    <td className="px-6 py-4 text-slate-500">{componentCount(dt)} items</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => openEdit(dt)} className="rounded-full p-2 text-blue-400 hover:bg-blue-50"><Edit2 className="h-4 w-4" /></button>
                      <button onClick={() => confirm('Delete?') && deleteDesignType.mutateAsync(dt.id)} className="rounded-full p-2 text-red-400 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
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
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">{editingId ? 'Edit Design' : 'Add Design'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Design Code *</label>
                  <input required type="text" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })}
                    className="w-full rounded-lg border p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Category *</label>
                  <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-lg border p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                    <option>Standard</option><option>Executive</option><option>Presidential</option><option>Custom</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Design Name *</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Price (BWP) *</label>
                <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  className="w-full rounded-lg border p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Description</label>
                <textarea rows={2} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-lg border p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Design Pieces</label>
                <div className="mb-2 flex gap-2">
                  <select value={newPiece.piece_type} onChange={e => setNewPiece({ ...newPiece, piece_type: e.target.value })}
                    className="flex-1 rounded-lg border p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                    {PIECE_TYPES.map(p => <option key={p} value={p}>{p.replace(/_/g, ' ')}</option>)}
                  </select>
                  <input type="number" min={1} value={newPiece.quantity} onChange={e => setNewPiece({ ...newPiece, quantity: parseInt(e.target.value) })}
                    className="w-20 rounded-lg border p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                  <button type="button" onClick={addPiece} className="rounded-lg bg-gray-200 px-3 py-2 text-sm dark:bg-gray-700">Add</button>
                </div>
                <ul className="space-y-1">
                  {parseComponents().map((c: any, i: number) => (
                    <li key={i} className="flex items-center justify-between rounded bg-gray-50 px-3 py-1 text-sm dark:bg-gray-900">
                      <span>{c.piece_type?.replace(/_/g, ' ')} × {c.quantity}</span>
                      <button type="button" onClick={() => removePiece(i)} className="text-red-500"><Trash2 className="h-3 w-3" /></button>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100">Cancel</button>
                <button type="submit" disabled={createDesignType.isPending || updateDesignType.isPending}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50">Save</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
