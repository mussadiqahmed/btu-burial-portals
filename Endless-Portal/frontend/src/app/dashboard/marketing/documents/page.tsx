'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { FolderOpen, Plus, Trash2 } from 'lucide-react';
import { usePaginatedSearch } from '@/hooks/usePaginatedSearch';
import { TableSearchBar } from '@/components/shared/TableSearchBar';
import { TablePagination } from '@/components/shared/TablePagination';

export default function DocumentsPage() {
  const queryClient = useQueryClient();
  const { data: documents, isLoading } = useQuery({
    queryKey: ['marketing-documents'],
    queryFn: async () => (await api.get('/marketing/documents')).data
  });

  const [form, setForm] = useState({ title: '', category: 'Catalog', file_url: '', description: '' });
  const [showForm, setShowForm] = useState(false);

  const createDoc = useMutation({
    mutationFn: async (body: any) => (await api.post('/marketing/documents', body)).data,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['marketing-documents'] }); setShowForm(false); }
  });

  const deleteDoc = useMutation({
    mutationFn: async (id: number) => (await api.delete(`/marketing/documents/${id}`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['marketing-documents'] })
  });

  const {
    searchTerm, setSearchTerm, currentPage, setCurrentPage,
    paginatedItems, totalPages, pageSize, totalCount
  } = usePaginatedSearch(documents, ['title', 'category', 'description', 'file_url'], 10);

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
            <FolderOpen className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Document Library</h1>
            <p className="text-sm text-gray-500">Catalogs, tombstone images, and marketing materials</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Add Document
        </button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={e => { e.preventDefault(); createDoc.mutate(form); }} className="grid gap-4 sm:grid-cols-2">
            <input required placeholder="Title" className="rounded-lg border p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
            <select className="rounded-lg border p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
              <option>Catalog</option><option>Tombstone Image</option><option>Marketing Material</option><option>Other</option>
            </select>
            <input placeholder="File URL (link to PDF or image)" className="rounded-lg border p-2 sm:col-span-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={form.file_url} onChange={e => setForm({...form, file_url: e.target.value})} />
            <textarea placeholder="Description" className="rounded-lg border p-2 sm:col-span-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            <div className="sm:col-span-2 flex gap-2">
              <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-white">Save</button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg px-4 py-2 text-gray-600">Cancel</button>
            </div>
          </form>
        </Card>
      )}

      <Card hoverEffect={false} className="mb-6 p-6">
        <TableSearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search documents by title, category, or description..." />
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? <p className="text-slate-500">Loading...</p> :
        totalCount === 0 ? <p className="col-span-full py-12 text-center text-slate-500">No documents match your search.</p> :
        paginatedItems.map((doc: any) => (
          <Card key={doc.document_id}>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-medium text-blue-600">{doc.category}</span>
                <h3 className="mt-1 font-semibold text-gray-900 dark:text-white">{doc.title}</h3>
                <p className="mt-2 text-sm text-gray-500">{doc.description}</p>
                {doc.file_url && <a href={doc.file_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-blue-600 hover:underline">Open file</a>}
              </div>
              <button onClick={() => confirm('Delete?') && deleteDoc.mutate(doc.document_id)} className="text-red-400"><Trash2 className="h-4 w-4" /></button>
            </div>
          </Card>
        ))}
      </div>

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
