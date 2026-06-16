'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { useOrders, useCreateOrder, useUpdateOrder, useDeleteOrder, useDesignTypes } from '@/services/queries';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, FileText, ShoppingCart, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import InvoiceModal from '@/components/InvoiceModal';
import { MaterialFamilySelect } from '@/components/shared/MaterialFamilySelect';

const DEFAULT_FORM_STATE = {
  clientName: '',
  contactNumber: '',
  orderDate: new Date().toISOString().split('T')[0],
  dueDate: '',
  deliveryDate: '',
  designType: 'Standard',
  designCode: '',
  isCustomOrder: false,
  materialFamily: '',
  status: 'Pending',
  paymentStatus: '',
  depositPaid: 0,
  botubsScheme: false,
  extraBible: false,
  extraHeart: false,
  extraPhoto: false,
  extraWhiteVase: false,
  extraBlackVase: false,
  customRequirements: '',
  notes: '',
  materials: {} as Record<string, number>,
  extrasDetails: {} as Record<string, number>
};

export default function OrdersPage() {
  const { data: orders, isLoading } = useOrders();
  const { data: designTypes } = useDesignTypes();
  const createOrder = useCreateOrder();
  const updateOrder = useUpdateOrder();
  const deleteOrder = useDeleteOrder();
  
  const { data: inventory } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const { data } = await api.get('/inventory');
      return data;
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(DEFAULT_FORM_STATE);
  const [invoiceOrder, setInvoiceOrder] = useState<any | null>(null);

  // Search, Filter, and Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const filteredOrders = orders?.filter((o: any) => {
    const matchesSearch = 
      o.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      String(o.order_id).includes(searchTerm) ||
      o.design_type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
    const matchesPayment = paymentFilter === 'All' || o.payment_status === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  }) || [];

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, paymentFilter]);

  // Temporary state for adding dynamic items
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [customMaterial, setCustomMaterial] = useState('');
  const [materialQty, setMaterialQty] = useState(1);
  const [extraName, setExtraName] = useState('');
  const [extraPrice, setExtraPrice] = useState(0);

  const handleOpenNew = () => {
    setFormData(DEFAULT_FORM_STATE);
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (order: any) => {
    setFormData({
      clientName: order.client_name || '',
      contactNumber: order.contact_number || '',
      orderDate: order.order_date ? new Date(order.order_date).toISOString().split('T')[0] : '',
      dueDate: order.due_date ? new Date(order.due_date).toISOString().split('T')[0] : '',
      deliveryDate: order.delivery_date ? new Date(order.delivery_date).toISOString().split('T')[0] : '',
      designType: order.design_type || 'Standard',
      designCode: order.design_code || '',
      isCustomOrder: !!order.is_custom_order,
      materialFamily: order.material_family || '',
      status: order.status || 'Pending',
      paymentStatus: order.payment_status || '',
      depositPaid: order.deposit_paid || 0,
      botubsScheme: !!order.botubs_scheme,
      extraBible: !!order.extra_bible,
      extraHeart: !!order.extra_heart,
      extraPhoto: !!order.extra_photo,
      extraWhiteVase: !!order.extra_white_vase,
      extraBlackVase: !!order.extra_black_vase,
      customRequirements: order.custom_requirements || '',
      notes: order.notes || '',
      materials: order.materials ? (typeof order.materials === 'string' ? JSON.parse(order.materials) : order.materials) : {},
      extrasDetails: order.extras_details ? (typeof order.extras_details === 'string' ? JSON.parse(order.extras_details) : order.extras_details) : {}
    });
    setEditingId(order.order_id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this order?')) {
      try {
        await deleteOrder.mutateAsync(id);
      } catch (err) {
        alert('Error deleting order.');
        console.error(err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateOrder.mutateAsync({ id: editingId, data: formData });
      } else {
        await createOrder.mutateAsync(formData);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || 'Unknown error';
      alert(`Error saving order: ${message}`);
      console.error(err);
    }
  };

  const addMaterial = () => {
    const materialName = selectedMaterial === 'other' ? customMaterial : selectedMaterial;
    if (!materialName || materialQty <= 0) return;
    setFormData(prev => ({
      ...prev,
      materials: { ...prev.materials, [materialName]: materialQty }
    }));
    setSelectedMaterial('');
    setCustomMaterial('');
    setMaterialQty(1);
  };

  const removeMaterial = (name: string) => {
    const newMaterials = { ...formData.materials };
    delete newMaterials[name];
    setFormData(prev => ({ ...prev, materials: newMaterials }));
  };

  const addExtra = () => {
    if (!extraName || extraPrice < 0) return;
    setFormData(prev => ({
      ...prev,
      extrasDetails: { ...prev.extrasDetails, [extraName]: extraPrice }
    }));
    setExtraName('');
    setExtraPrice(0);
  };

  const removeExtra = (name: string) => {
    const newExtras = { ...formData.extrasDetails };
    delete newExtras[name];
    setFormData(prev => ({ ...prev, extrasDetails: newExtras }));
  };

  const designsWithCode = designTypes?.filter((d: any) => d.code) || [];
  const selectedDesign = designsWithCode.find((d: any) => d.code === formData.designCode);

  const pendingCount = orders?.filter((o: any) => o.status === 'Pending').length || 0;
  const inProgressCount = orders?.filter((o: any) => o.status === 'In Progress').length || 0;
  const completedCount = orders?.filter((o: any) => o.status === 'Completed').length || 0;

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
            <ShoppingCart className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Orders</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage your memorial orders and invoices</p>
          </div>
        </div>
        <button
          onClick={handleOpenNew}
          className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 shadow-sm transition-all"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Order
        </button>
      </div>

      {/* Analytics Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="flex items-center p-4">
          <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400">
            <ShoppingCart className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Orders</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingCount}</p>
          </div>
        </Card>
        <Card className="flex items-center p-4">
          <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
            <Search className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">In Progress</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{inProgressCount}</p>
          </div>
        </Card>
        <Card className="flex items-center p-4">
          <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedCount}</p>
          </div>
        </Card>
      </div>

      <Card hoverEffect={false} className="p-0 overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-slate-200/60 bg-transparent p-6 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by client name, ID, or design..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Closed">Closed</option>
            </select>
            <span className="text-sm text-gray-500 dark:text-gray-400">Payment:</span>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option value="All">All Payments</option>
              <option value="Deposit Paid">Deposit Paid</option>
              <option value="Fully Paid">Fully Paid</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500 backdrop-blur-sm dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Client Name</th>
                <th className="px-6 py-4">Design Type</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">Final Amount</th>
                <th className="px-6 py-4">Order Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-transparent dark:divide-slate-800/60">
              {!orders && isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 w-8 rounded bg-slate-200 dark:bg-slate-700"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700"></div></td>
                    <td className="px-6 py-4"><div className="h-6 w-20 rounded-full bg-slate-200 dark:bg-slate-700"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-700"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700"></div></td>
                    <td className="px-6 py-4"><div className="flex justify-end space-x-3"><div className="h-5 w-5 rounded bg-slate-200 dark:bg-slate-700"></div><div className="h-5 w-5 rounded bg-slate-200 dark:bg-slate-700"></div><div className="h-5 w-5 rounded bg-slate-200 dark:bg-slate-700"></div></div></td>
                  </tr>
                ))
              ) : paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    No orders found matching your search.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order: any, i: number) => (
                  <motion.tr 
                    key={order.order_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="text-slate-700 transition-colors hover:bg-slate-50/50 dark:text-slate-300 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-6 py-4">#{order.order_id}</td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{order.client_name}</td>
                    <td className="px-6 py-4">{order.design_code || order.design_type}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                        order.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20' :
                        order.status === 'In Progress' ? 'bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20' :
                        'bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      {order.payment_status || '—'}
                    </td>
                    <td className="px-6 py-4 font-medium">BWP {Number(order.final_amount || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{new Date(order.order_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => setInvoiceOrder(order)}
                        className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                        title="View Invoice"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleOpenEdit(order)}
                        className="rounded-full p-2 text-blue-400 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                        title="Edit Order"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(order.order_id)}
                        className="rounded-full p-2 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                        title="Delete Order"
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
        
        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200/60 bg-transparent px-6 py-4 dark:border-slate-800">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Showing <span className="font-medium text-slate-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-slate-900 dark:text-white">{Math.min(currentPage * itemsPerPage, filteredOrders.length)}</span> of <span className="font-medium text-slate-900 dark:text-white">{filteredOrders.length}</span> results
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
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-xl dark:bg-gray-800"
          >
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingId ? `Edit Order #${editingId}` : 'Create New Order'}
              </h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <form id="orderForm" onSubmit={handleSubmit} className="space-y-8">
                
                {/* Section 1: Client Details */}
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Client Details</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Client Name *</label>
                      <input type="text" required className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={formData.clientName} onChange={e => setFormData({...formData, clientName: e.target.value})} />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Contact Number</label>
                      <input type="text" className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={formData.contactNumber} onChange={e => setFormData({...formData, contactNumber: e.target.value})} />
                    </div>
                  </div>
                </div>

                {/* Section 2: Order Details */}
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Order Details</h3>
                  <label className="mb-4 flex items-center space-x-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
                    <input type="checkbox" checked={formData.isCustomOrder} onChange={e => setFormData({...formData, isCustomOrder: e.target.checked, designCode: e.target.checked ? '' : formData.designCode})} className="h-5 w-5 rounded" />
                    <span className="text-sm font-bold text-amber-900 dark:text-amber-100">Custom Order (build tombstone manually)</span>
                  </label>
                  {!formData.isCustomOrder && (
                    <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Design Code *</label>
                        <select required={!formData.isCustomOrder} className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={formData.designCode} onChange={e => {
                          const code = e.target.value;
                          const design = designsWithCode.find((dt: any) => dt.code === code);
                          setFormData({ ...formData, designCode: code, designType: design?.category || 'Standard' });
                        }}>
                          <option value="">-- Select Design Code --</option>
                          {designsWithCode.map((dt: any) => (
                            <option key={dt.id} value={dt.code}>{dt.code} — {dt.category} (BWP {Number(dt.price).toLocaleString()})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Material Family</label>
                        <MaterialFamilySelect
                          value={formData.materialFamily}
                          onChange={v => setFormData({ ...formData, materialFamily: v })}
                          allowEmpty
                          emptyLabel="-- Select material family --"
                        />
                      </div>
                      {selectedDesign && (
                        <div className="sm:col-span-2 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                          <p className="font-semibold text-blue-900 dark:text-blue-100">{selectedDesign.name}</p>
                          <p className="text-sm text-blue-700 dark:text-blue-300">Base price: BWP {Number(selectedDesign.price).toLocaleString()}</p>
                          <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">{selectedDesign.description || 'Stock will be deducted automatically from inventory.'}</p>
                          <p className="mt-2 text-xs font-medium text-blue-800 dark:text-blue-200">No need to pick individual materials — the system deducts kerbs, ledgers, and other pieces automatically.</p>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                      <select className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Status</label>
                      <select className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={formData.paymentStatus} onChange={e => setFormData({...formData, paymentStatus: e.target.value})}>
                        <option value="">— Not set —</option>
                        <option value="Deposit Paid">Deposit Paid</option>
                        <option value="Fully Paid">Fully Paid</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Deposit Paid (BWP)</label>
                      <input type="number" step="0.01" className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={formData.depositPaid} onChange={e => setFormData({...formData, depositPaid: parseFloat(e.target.value) || 0})} />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Order Date *</label>
                      <input type="date" required className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={formData.orderDate} onChange={e => setFormData({...formData, orderDate: e.target.value})} />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Due Date</label>
                      <input type="date" className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Delivery Date</label>
                      <input type="date" className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={formData.deliveryDate} onChange={e => setFormData({...formData, deliveryDate: e.target.value})} />
                    </div>
                  </div>
                </div>

                {/* Section 3: Materials - only for custom orders */}
                {formData.isCustomOrder && (
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Materials Used (Custom Order)</h3>
                  <div className="mb-4 flex flex-wrap items-end gap-2">
                    <div className="flex-1 min-w-[200px]">
                      <label className="mb-1 block text-xs font-medium text-gray-500">Select Material from Inventory</label>
                      <select className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={selectedMaterial} onChange={e => setSelectedMaterial(e.target.value)}>
                        <option value="">-- Choose Material --</option>
                        {inventory?.map((item: any) => (
                          <option key={item.material_id} value={item.material_name}>
                            {item.material_name} (Stock: {item.quantity})
                          </option>
                        ))}
                        <option value="other">Other (Custom)</option>
                      </select>
                    </div>
                    {selectedMaterial === 'other' && (
                      <div className="flex-1 min-w-[200px]">
                        <label className="mb-1 block text-xs font-medium text-gray-500">Custom Material Name</label>
                        <input type="text" placeholder="Enter material name" className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={customMaterial} onChange={e => setCustomMaterial(e.target.value)} />
                      </div>
                    )}
                    <div className="w-24">
                      <label className="mb-1 block text-xs font-medium text-gray-500">Qty</label>
                      <input type="number" min="1" className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={materialQty} onChange={e => setMaterialQty(parseInt(e.target.value))} />
                    </div>
                    <button type="button" onClick={addMaterial} className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
                      Add
                    </button>
                  </div>
                  
                  {Object.keys(formData.materials).length > 0 && (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                      <ul className="space-y-2">
                        {Object.entries(formData.materials).map(([name, qty]) => (
                          <li key={name} className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
                            <span>{name} <span className="font-bold text-gray-900 dark:text-white">x{qty}</span></span>
                            <button type="button" onClick={() => removeMaterial(name)} className="text-red-500 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                )}

                {/* Section 4: Extras & Options */}
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Extras & Toggles</h3>
                  <div className="mb-6 grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:grid-cols-2 dark:border-gray-700 dark:bg-gray-800/50">
                    <label className="flex items-center space-x-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20 col-span-full">
                      <input type="checkbox" checked={formData.botubsScheme} onChange={e => setFormData({...formData, botubsScheme: e.target.checked})} className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm font-bold text-blue-900 dark:text-blue-100">Botubs Scheme (Waives Base Price)</span>
                    </label>
                    <label className="flex items-center space-x-2 p-2">
                      <input type="checkbox" checked={formData.extraBible} onChange={e => setFormData({...formData, extraBible: e.target.checked})} className="rounded border-gray-300" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Extra Bible</span>
                    </label>
                    <label className="flex items-center space-x-2 p-2">
                      <input type="checkbox" checked={formData.extraHeart} onChange={e => setFormData({...formData, extraHeart: e.target.checked})} className="rounded border-gray-300" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Extra Heart</span>
                    </label>
                    <label className="flex items-center space-x-2 p-2">
                      <input type="checkbox" checked={formData.extraPhoto} onChange={e => setFormData({...formData, extraPhoto: e.target.checked})} className="rounded border-gray-300" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Extra Photo</span>
                    </label>
                    <label className="flex items-center space-x-2 p-2">
                      <input type="checkbox" checked={formData.extraWhiteVase} onChange={e => setFormData({...formData, extraWhiteVase: e.target.checked})} className="rounded border-gray-300" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">White Vase</span>
                    </label>
                    <label className="flex items-center space-x-2 p-2">
                      <input type="checkbox" checked={formData.extraBlackVase} onChange={e => setFormData({...formData, extraBlackVase: e.target.checked})} className="rounded border-gray-300" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Black Vase</span>
                    </label>
                  </div>

                  {/* Manual Extras Map */}
                  <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Manual Extras (Overrides toggles if used)</h4>
                  <div className="mb-4 flex items-end space-x-2">
                    <div className="flex-1">
                      <input type="text" placeholder="Extra Name (e.g. Custom Engraving)" className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={extraName} onChange={e => setExtraName(e.target.value)} />
                    </div>
                    <div className="w-32">
                      <input type="number" step="0.01" placeholder="Price (BWP)" className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={extraPrice} onChange={e => setExtraPrice(parseFloat(e.target.value))} />
                    </div>
                    <button type="button" onClick={addExtra} className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
                      Add
                    </button>
                  </div>
                  
                  {Object.keys(formData.extrasDetails).length > 0 && (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                      <ul className="space-y-2">
                        {Object.entries(formData.extrasDetails).map(([name, price]) => (
                          <li key={name} className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
                            <span>{name}</span>
                            <div className="flex items-center space-x-4">
                              <span className="font-bold text-gray-900 dark:text-white">BWP {price.toFixed(2)}</span>
                              <button type="button" onClick={() => removeExtra(name)} className="text-red-500 hover:text-red-700">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Section 5: Text Areas */}
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Additional Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Custom Requirements</label>
                      <textarea rows={3} className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={formData.customRequirements} onChange={e => setFormData({...formData, customRequirements: e.target.value})} />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Internal Notes</label>
                      <textarea rows={3} className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                    </div>
                  </div>
                </div>

              </form>
            </div>

            <div className="flex justify-end space-x-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="orderForm"
                disabled={createOrder.isPending || updateOrder.isPending}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {createOrder.isPending || updateOrder.isPending ? 'Saving...' : 'Save Order'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Invoice Modal */}
      {invoiceOrder && (
        <InvoiceModal 
          order={invoiceOrder} 
          onClose={() => setInvoiceOrder(null)} 
        />
      )}
    </div>
  );
}
