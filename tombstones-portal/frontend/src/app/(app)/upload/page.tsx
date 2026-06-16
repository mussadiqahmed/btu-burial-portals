'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  FileUp,
  RefreshCw,
  XCircle,
  UserX,
  Check,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { MONTHS } from '@/lib/format';
import { useAuthStore } from '@/store/authStore';
import { canWritePortal } from '@/lib/roles';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { DataTable } from '@/components/shared/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';

type UploadSummary = {
  total_records?: number;
  imported?: number;
  updated?: number;
  matched?: number;
  failed?: number;
  missing_count?: number;
  failed_rows?: Array<{ row: number; payroll?: string; reason: string }>;
  comparison_summary?: {
    match: number;
    underpaid: number;
    overpaid: number;
  };
};

type SheetPreview = {
  sheet_name: string;
  row_count: number;
  columns: {
    payroll: boolean;
    name: boolean;
    amount: boolean;
    payroll_header?: string;
    name_header?: string;
    amount_header?: string;
  };
};

type UploadBatch = {
  id: number;
  filename: string;
  sheet_name?: string;
  upload_date: string;
  month: number;
  year: number;
  records_count: number;
  successful_rows?: number;
  matched_rows?: number;
  failed_rows: number;
};

function SummaryCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`glass-card p-4 ${color}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
        <Icon className="h-8 w-8 opacity-40" />
      </div>
    </motion.div>
  );
}

export default function UploadPage() {
  const user = useAuthStore((state) => state.user);
  const canWrite = canWritePortal(user?.role);
  const queryClient = useQueryClient();
  const now = new Date();

  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [summary, setSummary] = useState<UploadSummary | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);

  const [pendingFile, setPendingFile] = useState<{ file: File; base64: string } | null>(null);
  const [sheets, setSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string | null>(null);
  const [showSheetModal, setShowSheetModal] = useState(false);
  const [preview, setPreview] = useState<SheetPreview | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const { data: uploads, isLoading } = useQuery({
    queryKey: ['uploads'],
    queryFn: async () => {
      const response = await api.get('/api/uploads');
      return response.data as UploadBatch[];
    },
  });

  const readFileBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1] || result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const sheetsMutation = useMutation({
    mutationFn: async (file: File) => {
      setProgress(20);
      const base64 = await readFileBase64(file);
      setProgress(50);
      const response = await api.post('/api/upload/sheets', {
        filename: file.name,
        file_base64: base64,
      });
      setProgress(100);
      return { file, base64, ...response.data };
    },
    onSuccess: (data) => {
      setPendingFile({ file: data.file, base64: data.base64 });
      setSheets(data.sheets || []);
      if (data.auto_select) {
        setSelectedSheet(data.auto_select);
        loadPreview(data.base64, data.file.name, data.auto_select);
      } else {
        setShowSheetModal(true);
        setSelectedSheet(data.sheets[0] || null);
      }
      setTimeout(() => setProgress(0), 500);
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      toast.error(axiosErr.response?.data?.detail || 'Failed to read workbook');
      setProgress(0);
    },
  });

  const previewMutation = useMutation({
    mutationFn: async ({
      base64,
      filename,
      sheet_name,
    }: {
      base64: string;
      filename: string;
      sheet_name: string;
    }) => {
      const response = await api.post('/api/upload/preview', {
        filename,
        file_base64: base64,
        sheet_name,
      });
      return response.data as SheetPreview;
    },
    onSuccess: (data) => {
      setPreview(data);
      setShowPreview(true);
      setShowSheetModal(false);
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      toast.error(axiosErr.response?.data?.detail || 'Preview failed');
    },
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!pendingFile || !selectedSheet) throw new Error('No file selected');
      setProgress(30);
      const response = await api.post('/api/upload', {
        filename: pendingFile.file.name,
        month,
        year,
        sheet_name: selectedSheet,
        file_base64: pendingFile.base64,
        uploaded_by: user?.username,
      });
      setProgress(100);
      return response.data;
    },
    onSuccess: (data) => {
      setSummary(data.summary || data);
      setShowPreview(false);
      setPendingFile(null);
      setPreview(null);
      setSelectedSheet(null);
      toast.success('Import completed successfully');
      queryClient.invalidateQueries({ queryKey: ['uploads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['members-list'] });
      setTimeout(() => setProgress(0), 1000);
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      toast.error(axiosErr.response?.data?.detail || 'Upload failed');
      setProgress(0);
    },
  });

  const loadPreview = (base64: string, filename: string, sheetName: string) => {
    setSelectedSheet(sheetName);
    previewMutation.mutate({ base64, filename, sheet_name: sheetName });
  };

  const processFile = useCallback(
    (file: File) => {
      if (!file.name.endsWith('.xlsx')) {
        toast.error('Only .xlsx files are supported');
        return;
      }
      setSummary(null);
      sheetsMutation.mutate(file);
    },
    [sheetsMutation]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const columns = useMemo<ColumnDef<UploadBatch>[]>(
    () => [
      { accessorKey: 'filename', header: 'Filename' },
      { accessorKey: 'sheet_name', header: 'Sheet' },
      {
        id: 'period',
        header: 'Period',
        accessorFn: (row) => `${MONTHS[row.month - 1]} ${row.year}`,
      },
      { accessorKey: 'records_count', header: 'Rows' },
      { accessorKey: 'matched_rows', header: 'Matched' },
      { accessorKey: 'failed_rows', header: 'Failed' },
      {
        accessorKey: 'upload_date',
        header: 'Date',
        cell: ({ row }) => new Date(row.original.upload_date).toLocaleDateString(),
      },
    ],
    []
  );

  if (!canWrite) {
    return (
      <PageWrapper title="Uploads">
        <EmptyState
          icon={AlertCircle}
          title="Access Denied"
          description="You do not have permission to upload files. Contact an administrator."
        />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="Upload Collections"
      subtitle="Import monthly tombstone payments from Excel"
      actions={
        <>
          <Select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTHS.map((name, i) => (
              <option key={name} value={i + 1}>
                {name}
              </option>
            ))}
          </Select>
          <Select value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
        </>
      }
    >
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`glass-card mb-8 border-2 border-dashed p-8 transition-all ${
          dragOver ? 'border-primary bg-primary-muted/30' : 'border-border'
        }`}
      >
        <label className="flex cursor-pointer flex-col items-center justify-center py-8">
          <motion.div
            animate={sheetsMutation.isPending ? { y: [0, -8, 0] } : {}}
            transition={{ repeat: sheetsMutation.isPending ? Infinity : 0, duration: 1 }}
          >
            <UploadCloud
              className={`mb-4 h-14 w-14 ${dragOver ? 'text-primary' : 'text-muted'}`}
            />
          </motion.div>
          <p className="text-lg font-medium text-foreground">
            {sheetsMutation.isPending ? 'Reading workbook…' : 'Drag & drop your Excel file'}
          </p>
          <p className="mt-1 text-sm text-muted">or click to browse · .xlsx only</p>
          <p className="mt-2 text-xs text-muted">
            Supports multi-sheet workbooks · matches by Payroll Number
          </p>
          <input
            type="file"
            accept=".xlsx"
            className="hidden"
            disabled={sheetsMutation.isPending || importMutation.isPending}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) processFile(file);
              e.target.value = '';
            }}
          />
        </label>

        <AnimatePresence>
          {progress > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4"
            >
              <div className="h-2 overflow-hidden rounded-full bg-surface/50">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Modal
        open={showSheetModal}
        onClose={() => setShowSheetModal(false)}
        title="Excel File Contains Multiple Sheets"
      >
        <p className="mb-4 text-sm text-muted">Select sheet to import</p>
        <div className="space-y-2">
          {sheets.map((sheet) => (
            <label
              key={sheet}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
                selectedSheet === sheet
                  ? 'border-primary bg-primary-muted/30'
                  : 'border-border hover:bg-surface/30'
              }`}
            >
              <input
                type="radio"
                name="sheet"
                value={sheet}
                checked={selectedSheet === sheet}
                onChange={() => setSelectedSheet(sheet)}
                className="accent-primary"
              />
              <Layers className="h-4 w-4 text-muted" />
              <span className="text-sm font-medium text-foreground">{sheet}</span>
            </label>
          ))}
        </div>
        <div className="mt-6 flex gap-2">
          <Button
            disabled={!selectedSheet || !pendingFile}
            loading={previewMutation.isPending}
            onClick={() =>
              pendingFile &&
              selectedSheet &&
              loadPreview(pendingFile.base64, pendingFile.file.name, selectedSheet)
            }
          >
            Import Selected Sheet
          </Button>
          <Button variant="secondary" onClick={() => setShowSheetModal(false)}>
            Cancel
          </Button>
        </div>
      </Modal>

      <Modal
        open={showPreview}
        onClose={() => {
          setShowPreview(false);
          setPendingFile(null);
          setPreview(null);
        }}
        title="Import Preview"
      >
        {preview && (
          <>
            <p className="text-sm text-muted">
              Selected Sheet: <strong className="text-foreground">{preview.sheet_name}</strong>
            </p>
            <p className="mt-2 text-sm text-muted">
              Rows Found: <strong className="text-foreground">{preview.row_count.toLocaleString()}</strong>
            </p>
            <div className="mt-4 rounded-lg border border-border bg-surface/20 p-4">
              <p className="mb-2 text-xs font-medium uppercase text-muted">Detected Columns</p>
              <ul className="space-y-1 text-sm">
                {preview.columns.payroll && (
                  <li className="flex items-center gap-2 text-success">
                    <Check className="h-4 w-4" /> Payroll Number
                    {preview.columns.payroll_header && (
                      <span className="text-muted">({preview.columns.payroll_header})</span>
                    )}
                  </li>
                )}
                {preview.columns.name && (
                  <li className="flex items-center gap-2 text-success">
                    <Check className="h-4 w-4" /> Full Name
                    {preview.columns.name_header && (
                      <span className="text-muted">({preview.columns.name_header})</span>
                    )}
                  </li>
                )}
                {preview.columns.amount && (
                  <li className="flex items-center gap-2 text-success">
                    <Check className="h-4 w-4" /> Paid Amount
                    {preview.columns.amount_header && (
                      <span className="text-muted">({preview.columns.amount_header})</span>
                    )}
                  </li>
                )}
              </ul>
            </div>
            <div className="mt-6 flex gap-2">
              <Button loading={importMutation.isPending} onClick={() => importMutation.mutate()}>
                Continue Import
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowPreview(false);
                  setPendingFile(null);
                  setPreview(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </>
        )}
      </Modal>

      <AnimatePresence>
        {summary && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-8"
          >
            <div className="mb-4 flex items-center gap-2 text-success">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-semibold">Import Complete</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <SummaryCard
                label="Imported"
                value={(summary.imported ?? 0) + (summary.updated ?? 0)}
                icon={FileUp}
                color="border-primary/20"
              />
              <SummaryCard
                label="Matched"
                value={summary.matched ?? 0}
                icon={CheckCircle2}
                color="border-success/20"
              />
              <SummaryCard
                label="Match"
                value={summary.comparison_summary?.match ?? 0}
                icon={Check}
                color="border-success/20"
              />
              <SummaryCard
                label="Underpaid"
                value={summary.comparison_summary?.underpaid ?? 0}
                icon={AlertCircle}
                color="border-warning/20"
              />
              <SummaryCard
                label="Overpaid"
                value={summary.comparison_summary?.overpaid ?? 0}
                icon={RefreshCw}
                color="border-violet-500/20"
              />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <SummaryCard
                label="Failed"
                value={summary.failed ?? 0}
                icon={XCircle}
                color="border-danger/20"
              />
              <SummaryCard
                label="Missing Payments"
                value={summary.missing_count ?? 0}
                icon={UserX}
                color="border-warning/20"
              />
            </div>
            {Array.isArray(summary.failed_rows) && summary.failed_rows.length > 0 && (
              <div className="mt-4 rounded-lg border border-danger/20 bg-danger-muted/20 p-4">
                <p className="mb-2 text-sm font-medium text-danger">Failed rows</p>
                <ul className="max-h-32 space-y-1 overflow-y-auto text-xs text-muted">
                  {summary.failed_rows.slice(0, 10).map((item, idx) => (
                    <li key={`${item.row}-${idx}`}>
                      Row {item.row}
                      {item.payroll ? ` (${item.payroll})` : ''}: {item.reason}
                    </li>
                  ))}
                  {summary.failed_rows.length > 10 && (
                    <li>…and {summary.failed_rows.length - 10} more</li>
                  )}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <h2 className="mb-4 flex items-center text-lg font-semibold text-foreground">
          <FileSpreadsheet className="mr-2 h-5 w-5 text-primary" />
          Upload History
        </h2>
        {!isLoading && !uploads?.length ? (
          <EmptyState
            icon={UploadCloud}
            title="No uploads yet"
            description="Upload your first monthly collection file to get started."
          />
        ) : (
          <DataTable
            data={uploads || []}
            columns={columns}
            loading={isLoading}
            exportFilename="upload-history"
          />
        )}
      </div>
    </PageWrapper>
  );
}
