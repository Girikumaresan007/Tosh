import { useEffect, useMemo, useState, type ChangeEvent, type CSSProperties } from 'react';
import { Button } from './Button';

export interface TablePaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  style?: CSSProperties;
}

export function TablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
  style,
}: TablePaginationProps) {
  if (total === 0) return null;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const start = Math.min((page - 1) * pageSize + 1, total);
  const end = Math.min(page * pageSize, total);

  return (
    <div className="table-footer" style={style}>
      <div className="pagination-left">
        <span className="pagination-summary">Showing {start}–{end} of {total}</span>
        <label className="pagination-size-select">
          <span className="pagination-size-label">Rows per page:</span>
          <select
            className="pagination-select"
            value={pageSize}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1);
            }}
            aria-label="Rows per page"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="button-row">
        <Button
          variant="secondary"
          size="small"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          Previous
        </Button>
        <span className="pagination-current-page">
          Page {page} of {pages}
        </span>
        <Button
          variant="secondary"
          size="small"
          disabled={page >= pages}
          onClick={() => onPageChange(Math.min(pages, page + 1))}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export function usePagination<T>(items: T[], defaultPageSize = 5) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (page > pages) {
      setPage(pages);
    }
  }, [page, pages]);

  const pagedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  return {
    page,
    setPage,
    pageSize,
    setPageSize,
    pages,
    total,
    pagedItems,
  };
}
