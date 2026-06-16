'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { motion } from 'framer-motion';
import { Plus, Edit2, MessageSquare } from 'lucide-react';
import { useFollowups, useCreateFollowup, useUpdateFollowup, useOrders } from '@/services/queries';
import { usePaginatedSearch } from '@/hooks/usePaginatedSearch';
import { TableSearchBar } from '@/components/shared/TableSearchBar';
import { TablePagination } from '@/components/shared/TablePagination';

const DEFAULT_FORM_STATE = {
  order_id: '',
  client_name: '',
  followup_date: new Date().toISOString().split('T')[0],
  feedback: '',
  action_taken: ''
};

const FEEDBACK_OPTIONS = [
  "Client requested update",
  "Client approved design",
  "Client requested changes",
  "Payment received",
  "Follow-up on payment",
  "Other"
];

const ACTION_OPTIONS = [
  "Sent update to client",
  "Updated design",
  "Proceeded to production",
  "Sent payment reminder",
  "Other"
];

export default function FollowupsPage() {
  const { data: followups, isLoading } = useFollowups();
  const { data: orders } = useOrders();
  const createFollowup = useCreateFollowup();
  const updateFollowup = useUpdateFollowup();

  const {
    searchTerm, setSearchTerm, currentPage, setCurrentPage,
    paginatedItems, totalPages, pageSize, totalCount
  } = usePaginatedSearch(followups, ['order_id', 'client_name', 'feedback', 'action_taken'], 10);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(DEFAULT_FORM_STATE);
  const [customFeedback, setCustomFeedback] = useState(false);
  const [customAction, setCustomAction] = useState(false);

  // Auto-fill client name when order_id changes
  useEffect(() => {
    if (formData.order_id && orders) {
      const order = orders.find((o: any) => String(o.order_id) === String(formData.order_id));
      if (order) {
        setFormData(prev => ({ ...prev, client_name: order.client_name }));
      }
    }
  }, [formData.order_id, orders]);

  const handleOpenNew = () => {
    setFormData(DEFAULT_FORM_STATE);
    setEditingId(null);
    setCustomFeedback(false);
    setCustomAction(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setFormData({
      order_id: item.order_id || '',
      client_name: item.client_name || '',
      followup_date: item.followup_date ? new Date(item.followup_date).toISOString().split('T')[0] : '',
      feedback: item.feedback || '',
      action_taken: item.action_taken || ''
    });
    setEditingId(item.followup_id);
    setCustomFeedback(!FEEDBACK_OPTIONS.includes(item.feedback) && item.feedback !== '');
    setCustomAction(!ACTION_OPTIONS.includes(item.action_taken) && item.action_taken !== '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateFollowup.mutateAsync({ id: editingId, data: formData });
      } else {
        await createFollowup.mutateAsync(formData);
      }
      setIsModalOpen(false);
    } catch (err) {
      alert('Error saving follow-up. Check console for details.');
      console.error(err);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Client Follow-ups</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Track client communication and feedback history</p>
          </div>
        </div>
        <button 
          onClick={handleOpenNew}
          className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 shadow-sm transition-all"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Follow-up
        </button>
      </div>

      <Card hoverEffect={false} className="p-0 overflow-hidden">
        {!followups && isLoading ? (
          <div className="animate-pulse space-y-4 p-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded bg-gray-200 dark:bg-gray-700"></div>
            ))}
          </div>
        ) : (
          <>
            <div className="border-b border-slate-200/60 p-6 dark:border-slate-800">
              <TableSearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search by order, client, feedback, or action..." />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500 backdrop-blur-sm dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Client Name</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Feedback</th>
                  <th className="px-6 py-4">Action Taken</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-transparent dark:divide-slate-800/60">
                {totalCount === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                      {followups?.length === 0 ? 'No follow-ups yet.' : 'No follow-ups match your search.'}
                    </td>
                  </tr>
                ) : (
                paginatedItems.map((item: any, i: number) => (
                  <motion.tr 
                    key={item.followup_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="text-slate-700 transition-colors hover:bg-slate-50/50 dark:text-slate-300 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">#{item.order_id}</td>
                    <td className="px-6 py-4">{item.client_name}</td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{new Date(item.followup_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 max-w-xs truncate text-slate-500 dark:text-slate-400">{item.feedback || '-'}</td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{item.action_taken || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleOpenEdit(item)}
                        className="rounded-full p-2 text-blue-400 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                      >
                        <Edit2 className="h-4 w-4" />
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
          </>
        )}
      </Card>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-800"
          >
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
              {editingId ? 'Edit Follow-up' : 'Add New Follow-up'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Order ID
                </label>
                <select 
                  required
                  value={formData.order_id}
                  onChange={e => setFormData({...formData, order_id: e.target.value})}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="" disabled>Select an Order</option>
                  {orders?.map((o: any) => (
                    <option key={o.order_id} value={o.order_id}>
                      #{o.order_id} - {o.client_name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Client Name
                </label>
                <input 
                  type="text" 
                  required
                  readOnly
                  value={formData.client_name}
                  onChange={e => setFormData({...formData, client_name: e.target.value})}
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Follow-up Date
                </label>
                <input 
                  type="date" 
                  required
                  value={formData.followup_date}
                  onChange={e => setFormData({...formData, followup_date: e.target.value})}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Feedback
                </label>
                {!customFeedback ? (
                  <select 
                    value={formData.feedback}
                    onChange={e => {
                      if (e.target.value === 'Other') {
                        setCustomFeedback(true);
                        setFormData({...formData, feedback: ''});
                      } else {
                        setFormData({...formData, feedback: e.target.value});
                      }
                    }}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="" disabled>Select feedback</option>
                    {FEEDBACK_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <div className="flex space-x-2">
                    <textarea 
                      rows={2}
                      value={formData.feedback}
                      onChange={e => setFormData({...formData, feedback: e.target.value})}
                      placeholder="Enter custom feedback..."
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                    <button 
                      type="button" 
                      onClick={() => {
                        setCustomFeedback(false);
                        setFormData({...formData, feedback: ''});
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Back
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Action Taken
                </label>
                {!customAction ? (
                  <select 
                    value={formData.action_taken}
                    onChange={e => {
                      if (e.target.value === 'Other') {
                        setCustomAction(true);
                        setFormData({...formData, action_taken: ''});
                      } else {
                        setFormData({...formData, action_taken: e.target.value});
                      }
                    }}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="" disabled>Select action taken</option>
                    {ACTION_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <div className="flex space-x-2">
                    <input 
                      type="text" 
                      value={formData.action_taken}
                      onChange={e => setFormData({...formData, action_taken: e.target.value})}
                      placeholder="Enter custom action..."
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                    <button 
                      type="button" 
                      onClick={() => {
                        setCustomAction(false);
                        setFormData({...formData, action_taken: ''});
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Back
                    </button>
                  </div>
                )}
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
                  disabled={createFollowup.isPending || updateFollowup.isPending}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {createFollowup.isPending || updateFollowup.isPending ? 'Saving...' : 'Save Follow-up'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
