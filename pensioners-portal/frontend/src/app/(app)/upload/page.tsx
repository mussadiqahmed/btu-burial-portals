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
  UserPlus,
  RefreshCw,
  XCircle,
  UserX,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { MONTHS } from '@/lib/format';
import { useAuthStore } from '@/store/authStore';
import { canWritePensioners } from '@/lib/roles';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { DataTable } from '@/components/shared/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';

type UploadSummary = {
  total_records?: number;
  new_pensioners?: number;
  updated_pensioners?: number;
  failed_rows?: number | Array<{ row: number; reason: string }>;
  missing_count?: number;
  missing_payroll_numbers?: string[];
};

type UploadBatch = {
  id: number;
  filename: string;
  upload_date: string;
  month: number;
  year: number;
  records_count: number;
  new_pensioners: number;
  updated_pensioners: number;
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
  const canWrite = canWritePensioners(user?.role);
  const queryClient = useQueryClient();
  const now = new Date();

  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [summary, setSummary] = useState<UploadSummary | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);

  const { data: uploads, isLoading } = useQuery({
    queryKey: ['uploads'],
    queryFn: async () => {
      const response = await api.get('/api/uploads');
      return response.data as UploadBatch[];
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setProgress(20);
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1] || result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      setProgress(60);
      const response = await api.post('/api/upload', {
        filename: file.name,
        month,
        year,
        file_base64: base64,
      });
      setProgress(100);
      return response.data;
    },
    onSuccess: (data) => {
      setSummary(data.summary || data);
      toast.success('Import completed successfully');
      queryClient.invalidateQueries({ queryKey: ['uploads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['pensioners-list'] });
      setTimeout(() => setProgress(0), 1000);
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(axiosErr.response?.data?.detail || 'Upload failed');
      setSummary(null);
      setProgress(0);
    },
  });

  const processFile = useCallback(
    (file: File) => {
      if (!file.name.endsWith('.xlsx')) {
        toast.error('Only .xlsx files are supported');
        return;
      }
      uploadMutation.mutate(file);
    },
    [uploadMutation]
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
      {
        id: 'period',
        header: 'Period',
        accessorFn: (row) => `${MONTHS[row.month - 1]} ${row.year}`,
      },
      { accessorKey: 'records_count', header: 'Records' },
      { accessorKey: 'new_pensioners', header: 'New' },
      { accessorKey: 'updated_pensioners', header: 'Updated' },
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
      subtitle="Import monthly pensioner data from Excel"
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
            animate={uploadMutation.isPending ? { y: [0, -8, 0] } : {}}
            transition={{ repeat: uploadMutation.isPending ? Infinity : 0, duration: 1 }}
          >
            <UploadCloud
              className={`mb-4 h-14 w-14 ${dragOver ? 'text-primary' : 'text-muted'}`}
            />
          </motion.div>
          <p className="text-lg font-medium text-foreground">
            {uploadMutation.isPending ? 'Processing…' : 'Drag & drop your Excel file'}
          </p>
          <p className="mt-1 text-sm text-muted">or click to browse · .xlsx only</p>
          <p className="mt-2 text-xs text-muted">
            Columns: Full Name, Payroll Number, Paid Amount
          </p>
          <input
            type="file"
            accept=".xlsx"
            className="hidden"
            disabled={uploadMutation.isPending}
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
                value={summary.total_records ?? 0}
                icon={FileUp}
                color="border-primary/20"
              />
              <SummaryCard
                label="New"
                value={summary.new_pensioners ?? 0}
                icon={UserPlus}
                color="border-success/20"
              />
              <SummaryCard
                label="Updated"
                value={summary.updated_pensioners ?? 0}
                icon={RefreshCw}
                color="border-warning/20"
              />
              <SummaryCard
                label="Failed"
                value={
                  Array.isArray(summary.failed_rows)
                    ? summary.failed_rows.length
                    : Number(summary.failed_rows ?? 0)
                }
                icon={XCircle}
                color="border-danger/20"
              />
              <SummaryCard
                label="Missing"
                value={
                  summary.missing_count ??
                  summary.missing_payroll_numbers?.length ??
                  0
                }
                icon={UserX}
                color="border-warning/20"
              />
            </div>
            {(summary.missing_count ?? summary.missing_payroll_numbers?.length ?? 0) > 0 && (
              <p className="mt-3 text-sm text-muted">
                {summary.missing_count ?? summary.missing_payroll_numbers?.length} active members
                were not in this upload file.
              </p>
            )}
            {Array.isArray(summary.failed_rows) && summary.failed_rows.length > 0 && (
              <div className="mt-4 rounded-lg border border-danger/20 bg-danger-muted/20 p-4">
                <p className="mb-2 text-sm font-medium text-danger">Failed rows</p>
                <ul className="max-h-32 space-y-1 overflow-y-auto text-xs text-muted">
                  {summary.failed_rows.slice(0, 10).map((item) => (
                    <li key={`${item.row}-${item.reason}`}>
                      Row {item.row}: {item.reason}
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
            description="Upload your first pensioner collection file to get started."
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
