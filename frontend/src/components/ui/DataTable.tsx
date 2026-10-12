import { useMemo, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { LoadingSkeleton } from './feedback';

export interface Column<T> {
  key: string;
  header: ReactNode;
  render?: (row: T, index: number) => ReactNode;
  className?: string;
  headerClassName?: string;
  align?: 'left' | 'right' | 'center';
  sortValue?: (row: T) => string | number;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  loading?: boolean;
  onRowClick?: (row: T) => void;
  empty?: ReactNode;
  footer?: ReactNode;
  rowClassName?: (row: T) => string;
  dense?: boolean;
}

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  loading,
  onRowClick,
  empty,
  footer,
  rowClassName,
  dense,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (av === bv) return 0;
      return (av > bv ? 1 : -1) * (sort.dir === 'asc' ? 1 : -1);
    });
    return copy;
  }, [rows, sort, columns]);

  if (loading) return <div className="p-4"><LoadingSkeleton rows={6} /></div>;
  if (!rows.length) return <div>{empty}</div>;

  const align = (a?: string) => (a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left');

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`table-head px-4 py-3 ${align(col.align)} ${col.headerClassName ?? ''}`}
                aria-sort={sort?.key === col.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
              >
                {col.sortValue ? (
                  <button
                    className="inline-flex items-center gap-1 hover:text-roast"
                    onClick={() => setSort((s) => (s?.key === col.key ? { key: col.key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key: col.key, dir: 'asc' }))}
                  >
                    {col.header}
                    {sort?.key === col.key && (sort.dir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                  </button>
                ) : (
                  col.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr
              key={getRowId(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`border-b border-line/60 transition-colors last:border-0 ${onRowClick ? 'cursor-pointer hover:bg-sand/60' : ''} ${rowClassName?.(row) ?? ''}`}
            >
              {columns.map((col) => (
                <td key={col.key} className={`px-4 ${dense ? 'py-2.5' : 'py-3.5'} ${align(col.align)} ${col.className ?? ''}`}>
                  {col.render ? col.render(row, i) : (row as Record<string, ReactNode>)[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {footer}
    </div>
  );
}
