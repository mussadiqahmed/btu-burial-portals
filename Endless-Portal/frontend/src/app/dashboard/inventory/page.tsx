'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { motion } from 'framer-motion';
import { Package, Search, ChevronLeft, ChevronRight, RefreshCw, AlertTriangle } from 'lucide-react';
import { useInventory, useUpdateInventoryItem } from '@/services/queries';
import { MaterialFamilySelect } from '@/components/shared/MaterialFamilySelect';

export default function InventoryPage() {
  const { data: inventory, isLoading } = useInventory();
  const updateItem = useUpdateInventoryItem();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    material_name: '',
    quantity: 0,
    unit: 'Piece',
    reorder_level: 10,
    supplier: '',
    last_order_date: '',
    piece_type: '',
    material_family: ''
  });

  // Search and Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredInventory = inventory?.filter((item: any) => 
    item.material_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.supplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.piece_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.material_family?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);
  const paginatedInventory = filteredInventory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleOpenEdit = (item: any) => {
    setFormData({
      material_name: item.material_name || '',
      quantity: item.quantity || 0,
      unit: item.unit || 'Piece',
      reorder_level: item.reorder_level || 10,
      supplier: item.supplier || '',
      last_order_date: item.last_order_date ? new Date(item.last_order_date).toISOString().split('T')[0] : '',
      piece_type: item.piece_type || '',
      material_family: item.material_family || ''
    });
    setEditingId(item.material_id);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateItem.mutateAsync({ id: editingId, data: formData });
      }
      setIsModalOpen(false);
    } catch (err) {
      alert('Error saving inventory item. Check console for details.');
      console.error(err);
    }
  };

  const lowStockItems = inventory?.filter((item: any) => item.quantity <= item.reorder_level) || [];
  const inStockItems = inventory?.filter((item: any) => item.quantity > item.reorder_level) || [];

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory Stock</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage stock quantities and reorder levels for your materials</p>
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="flex items-center p-4">
          <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Materials</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{inventory?.length || 0}</p>
          </div>
        </Card>
        <Card className="flex items-center p-4">
          <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
            <RefreshCw className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Healthy Stock</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{inStockItems.length}</p>
          </div>
        </Card>
        <Card className="flex items-center p-4 border border-red-100 dark:border-red-900/30">
          <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-red-600 dark:text-red-400">Low Stock Alert</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{lowStockItems.length}</p>
          </div>
        </Card>
      </div>

      <Card hoverEffect={false} className="p-0 overflow-hidden">
        <div className="border-b border-slate-200/60 bg-transparent p-6 dark:border-slate-800">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by material name or supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
              <tr>
                <th className="px-6 py-4 font-medium">Material Name</th>
                <th className="px-6 py-4 font-medium">Piece Type</th>
                <th className="px-6 py-4 font-medium">Family</th>
                <th className="px-6 py-4 font-medium">Quantity</th>
                <th className="px-6 py-4 font-medium">Unit</th>
                <th className="px-6 py-4 font-medium">Reorder Level</th>
                <th className="px-6 py-4 font-medium">Supplier</th>
                <th className="px-6 py-4 font-medium">Last Updated</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {!inventory && isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 w-48 rounded bg-gray-200 dark:bg-gray-700"></div></td>
                    <td className="px-6 py-4"><div className="h-6 w-12 rounded-full bg-gray-200 dark:bg-gray-700"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-700"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-700"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700"></div></td>
                    <td className="px-6 py-4"><div className="flex justify-end space-x-3"><div className="h-5 w-20 rounded bg-gray-200 dark:bg-gray-700"></div></div></td>
                  </tr>
                ))
              ) : paginatedInventory.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No materials found matching your search.
                  </td>
                </tr>
              ) : (
                paginatedInventory.map((item: any, i: number) => (
                  <motion.tr 
                    key={item.material_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="text-gray-900 transition-colors hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-6 py-4 font-medium">{item.material_name}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{item.piece_type?.replace(/_/g, ' ') || '—'}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{item.material_family || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                        item.quantity <= item.reorder_level 
                          ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20 dark:bg-red-900/20 dark:text-red-400 dark:ring-red-900/50' 
                          : 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-900/50'
                      }`}>
                        {item.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{item.unit}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{item.reorder_level}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{item.supplier || '-'}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{new Date(item.last_updated).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleOpenEdit(item)}
                        className="flex items-center text-blue-600 transition-colors hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 ml-auto"
                        title="Update Stock"
                      >
                        <RefreshCw className="mr-1 h-4 w-4" />
                        <span className="text-xs font-medium">Update Stock</span>
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200/60 bg-transparent px-6 py-4 dark:border-slate-800">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Showing <span className="font-medium text-slate-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-slate-900 dark:text-white">{Math.min(currentPage * itemsPerPage, filteredInventory.length)}</span> of <span className="font-medium text-slate-900 dark:text-white">{filteredInventory.length}</span> results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === page 
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20' 
                        : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Update Stock Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800"
          >
            <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
              Update Stock
            </h2>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              Updating inventory for <span className="font-bold text-gray-900 dark:text-white">{formData.material_name}</span>
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Quantity in Stock *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    value={formData.quantity}
                    onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Reorder Level</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    value={formData.reorder_level}
                    onChange={e => setFormData({...formData, reorder_level: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Piece Type</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    value={formData.piece_type}
                    onChange={e => setFormData({...formData, piece_type: e.target.value})}
                  >
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Supplier</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    value={formData.supplier}
                    onChange={e => setFormData({...formData, supplier: e.target.value})}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Last Order Date</label>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    value={formData.last_order_date}
                    onChange={e => setFormData({...formData, last_order_date: e.target.value})}
                  />
                </div>
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
                  disabled={updateItem.isPending}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {updateItem.isPending ? 'Saving...' : 'Update Stock'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
