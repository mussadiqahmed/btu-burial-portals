'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useDesignTypes } from '@/services/queries';
import { Quote, Plus, Trash2, Download, Edit2, ShoppingCart, Mail, X } from 'lucide-react';
import { buildQuotationPdf, quotationPdfBase64 } from '@/lib/quotationPdf';
import { usePaginatedSearch } from '@/hooks/usePaginatedSearch';
import { TableSearchBar } from '@/components/shared/TableSearchBar';
import { TablePagination } from '@/components/shared/TablePagination';
import { MaterialFamilySelect } from '@/components/shared/MaterialFamilySelect';

const EMPTY_FORM = {
  quote_type: 'standard' as 'standard' | 'custom',
  client_name: '',
  contact_number: '',
  client_email: '',
  design_code: '',
  design_name: '',
  description: '',
  dimensions: '',
  pricing_details: '',
  amount: 0,
  status: 'Draft',
  notes: '',
};

function quoteDesignLabel(q: any) {
  if (q.is_custom || q.is_custom === 1) {
    return q.design_name ? `Custom: ${q.design_name}` : 'Custom';
  }
  return q.design_code || '—';
}

export default function QuotationsPage() {
  const queryClient = useQueryClient();
  const { data: quotations, isLoading } = useQuery({
    queryKey: ['marketing-quotations'],
    queryFn: async () => (await api.get('/marketing/quotations')).data
  });
  const { data: designTypes } = useDesignTypes();
  const { data: emailStatus } = useQuery({
    queryKey: ['marketing-email-status'],
    queryFn: async () => (await api.get('/marketing/email-status')).data
  });

  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [sendModal, setSendModal] = useState<{ quote: any } | null>(null);
  const [convertModal, setConvertModal] = useState<{ quote: any } | null>(null);
  const [convertMaterialFamily, setConvertMaterialFamily] = useState('');
  const [sendTo, setSendTo] = useState('');
  const [sendMessage, setSendMessage] = useState('');

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  const buildPayload = (body: typeof EMPTY_FORM) => {
    const isCustom = body.quote_type === 'custom';
    return {
      client_name: body.client_name.trim(),
      contact_number: body.contact_number,
      client_email: body.client_email,
      amount: Number(body.amount),
      status: body.status,
      notes: body.notes,
      is_custom: isCustom,
      design_code: isCustom ? null : body.design_code,
      design_name: isCustom ? body.design_name.trim() : null,
      description: isCustom ? body.description : null,
      dimensions: isCustom ? body.dimensions : null,
      pricing_details: isCustom ? body.pricing_details : null,
    };
  };

  const createQuote = useMutation({
    mutationFn: async (body: typeof EMPTY_FORM) => (await api.post('/marketing/quotations', buildPayload(body))).data,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['marketing-quotations'] }); resetForm(); },
    onError: (err: any) => {
      alert(err?.response?.data?.error || 'Failed to create quotation.');
    },
  });

  const updateQuote = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof EMPTY_FORM }) =>
      (await api.put(`/marketing/quotations/${id}`, buildPayload(data))).data,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['marketing-quotations'] }); resetForm(); },
    onError: (err: any) => {
      alert(err?.response?.data?.error || 'Failed to update quotation.');
    },
  });

  const deleteQuote = useMutation({
    mutationFn: async (id: number) => (await api.delete(`/marketing/quotations/${id}`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['marketing-quotations'] })
  });

  const convertToOrder = useMutation({
    mutationFn: async ({ id, material_family }: { id: number; material_family?: string }) =>
      (await api.post(`/marketing/quotations/${id}/convert-to-order`, { material_family: material_family || null })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-quotations'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setConvertModal(null);
      setConvertMaterialFamily('');
      alert('Quotation converted to order successfully.');
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error || 'Failed to convert quotation to order.');
    },
  });

  const sendEmail = useMutation({
    mutationFn: async ({ id, to, pdfBase64, message }: { id: number; to: string; pdfBase64: string; message?: string }) =>
      (await api.post(`/marketing/quotations/${id}/send-email`, { to, pdfBase64, message })).data,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['marketing-quotations'] });
      setSendModal(null);
      setSendTo('');
      setSendMessage('');
      alert(data.message || 'Quotation sent by email.');
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error || 'Failed to send email.');
    },
  });

  const {
    searchTerm, setSearchTerm, currentPage, setCurrentPage,
    paginatedItems, totalPages, pageSize, totalCount
  } = usePaginatedSearch(quotations, ['client_name', 'design_code', 'design_name', 'status', 'contact_number'], 10);

  const designsWithCode = designTypes?.filter((d: any) => d.code) || [];
  const getDesign = (code: string) => designsWithCode.find((d: any) => d.code === code);

  const downloadQuotePDF = (q: any) => {
    buildQuotationPdf(q, getDesign(q.design_code)).save(
      `Quotation-Q${q.quotation_id}-${q.client_name.replace(/\s+/g, '_')}.pdf`
    );
  };

  const openSendModal = (q: any) => {
    if (!emailStatus?.configured) {
      alert(
        'Email is not configured on the server yet.\n\n' +
        'Please contact your administrator to set up SMTP email for sending quotations.'
      );
      return;
    }
    setSendTo((q as any).client_email || '');
    setSendMessage('');
    setSendModal({ quote: q });
  };

  const handleSendEmail = () => {
    if (!sendModal) return;
    const to = sendTo.trim();
    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      alert('Please enter a valid email address.');
      return;
    }
    const design = getDesign(sendModal.quote.design_code);
    const pdfBase64 = quotationPdfBase64(sendModal.quote, design);
    sendEmail.mutate({
      id: sendModal.quote.quotation_id,
      to,
      pdfBase64,
      message: sendMessage.trim() || undefined,
    });
  };

  const openEdit = (q: any) => {
    const isCustom = !!(q.is_custom || q.is_custom === 1);
    setForm({
      quote_type: isCustom ? 'custom' : 'standard',
      client_name: q.client_name || '',
      contact_number: q.contact_number || '',
      client_email: q.client_email || '',
      design_code: q.design_code || '',
      design_name: q.design_name || '',
      description: q.description || '',
      dimensions: q.dimensions || '',
      pricing_details: q.pricing_details || '',
      amount: Number(q.amount) || 0,
      status: q.status || 'Draft',
      notes: q.notes || '',
    });
    setEditingId(q.quotation_id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client_name.trim()) {
      alert('Client name is required.');
      return;
    }
    if (form.quote_type === 'standard' && !form.design_code) {
      alert('Please select a design code.');
      return;
    }
    if (form.quote_type === 'custom' && !form.design_name.trim()) {
      alert('Design name is required for custom quotations.');
      return;
    }
    const amount = Number(form.amount);
    if (Number.isNaN(amount) || amount < 0) {
      alert('Please enter a valid amount.');
      return;
    }
    if (editingId) {
      updateQuote.mutate({ id: editingId, data: form });
    } else {
      createQuote.mutate(form);
    }
  };

  const canConvert = (q: any) => q.status !== 'Accepted' && (q.design_code || q.is_custom || q.is_custom === 1);

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Quote className="h-6 w-6" /></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quotations</h1>
            <p className="text-sm text-gray-500">
              Generate, email PDF, edit, and convert quotes to orders
              {emailStatus?.configured ? (
                <span className="ml-2 text-emerald-600">• Email ready</span>
              ) : (
                <span className="ml-2 text-amber-600">• Email not configured on server</span>
              )}
            </p>
          </div>
        </div>
        <button onClick={() => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true); }} className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> New Quotation
        </button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <h2 className="mb-4 text-lg font-semibold">{editingId ? 'Edit Quotation' : 'New Quotation'}</h2>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Quotation Type</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="quote_type"
                    checked={form.quote_type === 'standard'}
                    onChange={() => setForm({ ...form, quote_type: 'standard' })}
                  />
                  <span className="text-sm">Standard Quotation</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="quote_type"
                    checked={form.quote_type === 'custom'}
                    onChange={() => setForm({ ...form, quote_type: 'custom', design_code: '' })}
                  />
                  <span className="text-sm">Custom Quotation</span>
                </label>
              </div>
            </div>

            <input required placeholder="Client name" className="rounded-lg border p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={form.client_name} onChange={e => setForm({...form, client_name: e.target.value})} />
            <input placeholder="Contact phone" className="rounded-lg border p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={form.contact_number} onChange={e => setForm({...form, contact_number: e.target.value})} />
            <input type="email" placeholder="Client email (for sending quote)" className="rounded-lg border p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={form.client_email} onChange={e => setForm({...form, client_email: e.target.value})} />

            {form.quote_type === 'standard' ? (
              <select required className="rounded-lg border p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={form.design_code} onChange={e => {
                const code = e.target.value;
                const d = designsWithCode.find((x: any) => x.code === code);
                setForm({...form, design_code: code, amount: d ? Number(d.price) : form.amount});
              }}>
                <option value="">Select design code</option>
                {designsWithCode.map((d: any) => <option key={d.id} value={d.code}>{d.code} - {d.category} (BWP {Number(d.price).toLocaleString()})</option>)}
              </select>
            ) : (
              <>
                <input required placeholder="Design name *" className="rounded-lg border p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={form.design_name} onChange={e => setForm({...form, design_name: e.target.value})} />
                <input placeholder="Dimensions (e.g. 204x85x5 cm)" className="rounded-lg border p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={form.dimensions} onChange={e => setForm({...form, dimensions: e.target.value})} />
                <textarea placeholder="Description" className="rounded-lg border p-2 sm:col-span-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                <textarea placeholder="Custom pricing details" className="rounded-lg border p-2 sm:col-span-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" rows={2} value={form.pricing_details} onChange={e => setForm({...form, pricing_details: e.target.value})} />
              </>
            )}

            <input type="number" placeholder="Amount (BWP)" className="rounded-lg border p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={form.amount} onChange={e => setForm({...form, amount: parseFloat(e.target.value)})} />
            <select className="rounded-lg border p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
              <option>Draft</option><option>Sent</option><option>Accepted</option><option>Rejected</option>
            </select>
            <textarea placeholder="Notes / additional specifications" className="rounded-lg border p-2 sm:col-span-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
            <div className="sm:col-span-2 flex gap-2">
              <button type="submit" disabled={createQuote.isPending || updateQuote.isPending} className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50">
                {editingId ? 'Update Quotation' : 'Save Quotation'}
              </button>
              <button type="button" onClick={resetForm} className="rounded-lg px-4 py-2 text-gray-600">Cancel</button>
            </div>
          </form>
        </Card>
      )}

      {sendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Email quotation Q-{sendModal.quote.quotation_id}</h2>
              <button type="button" onClick={() => setSendModal(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <p className="mb-4 text-sm text-gray-500">
              Sends the same PDF as download to the recipient. Client: <strong>{sendModal.quote.client_name}</strong>
            </p>
            <label className="mb-1 block text-sm font-medium">Recipient email *</label>
            <input
              type="email"
              required
              className="mb-4 w-full rounded-lg border p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="client@example.com"
              value={sendTo}
              onChange={e => setSendTo(e.target.value)}
            />
            <label className="mb-1 block text-sm font-medium">Optional message</label>
            <textarea
              rows={3}
              className="mb-4 w-full rounded-lg border p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Add a short note to the client..."
              value={sendMessage}
              onChange={e => setSendMessage(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSendEmail}
                disabled={sendEmail.isPending}
                className="flex flex-1 items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                <Mail className="mr-2 h-4 w-4" />
                {sendEmail.isPending ? 'Sending...' : 'Send PDF'}
              </button>
              <button type="button" onClick={() => setSendModal(null)} className="rounded-lg px-4 py-2 text-gray-600">Cancel</button>
            </div>
          </Card>
        </div>
      )}

      {convertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Convert Q-{convertModal.quote.quotation_id} to Order</h2>
              <button type="button" onClick={() => setConvertModal(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <p className="mb-4 text-sm text-gray-500">
              {convertModal.quote.is_custom || convertModal.quote.is_custom === 1
                ? `This custom quotation (${convertModal.quote.design_name}) will become a custom order.`
                : `Design: ${convertModal.quote.design_code}`}
            </p>
            <label className="mb-1 block text-sm font-medium">Material Family (optional)</label>
            <MaterialFamilySelect
              value={convertMaterialFamily}
              onChange={setConvertMaterialFamily}
              allowEmpty
              emptyLabel="-- Select material family --"
              className="mb-4 w-full rounded-lg border p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => convertToOrder.mutate({
                  id: convertModal.quote.quotation_id,
                  material_family: convertMaterialFamily || undefined,
                })}
                disabled={convertToOrder.isPending}
                className="flex flex-1 items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                {convertToOrder.isPending ? 'Converting...' : 'Convert to Order'}
              </button>
              <button type="button" onClick={() => setConvertModal(null)} className="rounded-lg px-4 py-2 text-gray-600">Cancel</button>
            </div>
          </Card>
        </div>
      )}

      <Card hoverEffect={false} className="p-0 overflow-hidden">
        <div className="border-b border-slate-200/60 p-6 dark:border-slate-800">
          <TableSearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search quotations by client, design, or status..." />
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/50 text-xs font-semibold uppercase text-slate-500 dark:bg-slate-800/50">
            <tr>
              <th className="px-6 py-4">Client</th>
              <th className="px-6 py-4">Design</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {isLoading ? <tr><td colSpan={5} className="px-6 py-8 text-center">Loading...</td></tr> :
            totalCount === 0 ? <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No quotations match your search.</td></tr> :
            paginatedItems.map((q: any) => (
              <tr key={q.quotation_id}>
                <td className="px-6 py-4 font-medium">{q.client_name}</td>
                <td className="px-6 py-4">
                  {quoteDesignLabel(q)}
                  {(q.is_custom || q.is_custom === 1) && (
                    <span className="ml-2 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">Custom</span>
                  )}
                </td>
                <td className="px-6 py-4">BWP {Number(q.amount).toLocaleString()}</td>
                <td className="px-6 py-4">{q.status}</td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => openEdit(q)} className="text-indigo-400 hover:text-indigo-600" title="Edit"><Edit2 className="h-4 w-4 inline" /></button>
                  <button onClick={() => openSendModal(q)} className="text-violet-500 hover:text-violet-700" title="Email PDF"><Mail className="h-4 w-4 inline" /></button>
                  <button onClick={() => downloadQuotePDF(q)} className="text-blue-400 hover:text-blue-600" title="Download PDF"><Download className="h-4 w-4 inline" /></button>
                  {canConvert(q) && (
                    <button
                      onClick={() => { setConvertMaterialFamily(''); setConvertModal({ quote: q }); }}
                      className="text-emerald-400 hover:text-emerald-600"
                      title="Convert to Order"
                    >
                      <ShoppingCart className="h-4 w-4 inline" />
                    </button>
                  )}
                  <button onClick={() => confirm('Delete?') && deleteQuote.mutate(q.quotation_id)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4 inline" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </Card>
    </div>
  );
}
