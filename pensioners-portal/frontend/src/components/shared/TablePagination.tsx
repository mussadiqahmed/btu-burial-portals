import { ChevronLeft, ChevronRight } from 'lucide-react';

type TablePaginationProps = {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

export function TablePagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
}: TablePaginationProps) {
  if (totalCount === 0) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="flex items-center justify-between border-t border-zinc-800 bg-transparent px-6 py-4">
      <div className="text-sm text-zinc-400">
        Showing <span className="font-medium text-white">{start}</span> to{' '}
        <span className="font-medium text-white">{end}</span> of{' '}
        <span className="font-medium text-white">{totalCount}</span> results
      </div>
      {totalPages > 1 && (
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 disabled:opacity-50"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center space-x-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === page
                    ? 'bg-amber-600 text-white'
                    : 'text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 disabled:opacity-50"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
