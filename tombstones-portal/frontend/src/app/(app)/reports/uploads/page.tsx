'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { FileSpreadsheet } from 'lucide-react';
import api from '@/lib/api';
import { MONTHS } from '@/lib/format';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { DataTable } from '@/components/shared/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';

type UploadBatch = {
  id: number;
  filename: string;
  sheet_name?: string;
  upload_date: string;
  uploaded_by?: string;
  month: number;
  year: number;
  records_count: number;
  successful_rows?: number;
  matched_rows?: number;
  failed_rows: number;
  summary_json?: string | Record<string, unknown>;
};

function parseSummary(batch: UploadBatch) {
  if (!batch.summary_json) return {};
  if (typeof batch.summary_json === 'object') return batch.summary_json;
  try {
    return JSON.parse(batch.summary_json) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export default function UploadHistoryReportPage() {
  const { data: uploads, isLoading } = useQuery({
    queryKey: ['upload-history-report'],
    queryFn: async () => {
      const response = await api.get('/api/uploads');
      return response.data as UploadBatch[];
    },
  });

  const rows = (uploads || []).map((batch) => {
    const summary = parseSummary(batch);
    return {
      ...batch,
      imported: Number(summary.imported ?? 0) + Number(summary.updated ?? 0),
      updated: Number(summary.updated ?? 0),
      matched: Number(summary.matched ?? batch.matched_rows ?? 0),
      failed: Number(summary.failed ?? batch.failed_rows ?? 0),
      missing: Number(summary.missing_count ?? 0),
    };
  });

  const columns = useMemo<
    ColumnDef<
      UploadBatch & {
        imported: number;
        updated: number;
        matched: number;
        failed: number;
        missing: number;
      }
    >[]
  >(
    () => [
      { accessorKey: 'filename', header: 'Filename' },
      { accessorKey: 'sheet_name', header: 'Sheet' },
      {
        id: 'period',
        header: 'Period',
        accessorFn: (row) => `${MONTHS[row.month - 1]} ${row.year}`,
      },
      { accessorKey: 'records_count', header: 'Rows' },
      { accessorKey: 'imported', header: 'Imported' },
      { accessorKey: 'updated', header: 'Updated' },
      { accessorKey: 'matched', header: 'Matched' },
      { accessorKey: 'failed', header: 'Failed' },
      { accessorKey: 'missing', header: 'Missing' },
      {
        accessorKey: 'upload_date',
        header: 'Date',
        cell: ({ row }) => new Date(row.original.upload_date).toLocaleString(),
      },
    ],
    []
  );

  return (
    <PageWrapper
      title="Upload History Report"
      subtitle="All monthly collection imports"
    >
      {!isLoading && !rows.length ? (
        <EmptyState
          icon={FileSpreadsheet}
          title="No uploads yet"
          description="Upload history will appear here after the first import."
        />
      ) : (
        <DataTable
          data={rows}
          columns={columns}
          loading={isLoading}
          searchPlaceholder="Search filename or sheet…"
          exportFilename="upload-history-report"
        />
      )}
    </PageWrapper>
  );
}
