import { useEffect, useMemo, useState } from 'react';

export function matchesSearch(item: Record<string, unknown>, search: string, fields: string[]): boolean {
  const q = search.toLowerCase().trim();
  if (!q) return true;
  return fields.some(field => String(item[field] ?? '').toLowerCase().includes(q));
}

export function usePaginatedSearch<T extends Record<string, unknown>>(
  items: T[] | undefined,
  searchFields: string[],
  pageSize: number = 10
) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredItems = useMemo(() => {
    if (!items) return [];
    return items.filter(item => matchesSearch(item, searchTerm, searchFields));
  }, [items, searchTerm, searchFields]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize) || 1);
  const safePage = Math.min(currentPage, totalPages);
  const paginatedItems = filteredItems.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  return {
    searchTerm,
    setSearchTerm,
    currentPage: safePage,
    setCurrentPage,
    filteredItems,
    paginatedItems,
    totalPages,
    pageSize,
    totalCount: filteredItems.length,
  };
}
