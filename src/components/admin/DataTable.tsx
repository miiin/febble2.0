'use client';

import { useState } from 'react';
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/shadcn/table';

export type TableFilter = {
  columnId: string;
  label: string;
  options: { value: string; label: string }[];
};

type Props<T> = {
  columns: ColumnDef<T>[];
  data: T[];
  /** 검색창이 찾는 글자 (행마다 이어 붙인 문자열) */
  searchText: (row: T) => string;
  searchPlaceholder?: string;
  filters?: TableFilter[];
  initialSorting?: SortingState;
  pageSize?: number;
  empty?: string;
};

// 어드민 목록: 검색 + 선택 필터 + 열 정렬 + 페이지 나누기 (TanStack Table).
export default function DataTable<T>({ columns, data, searchText, searchPlaceholder = '검색', filters = [], initialSorting = [], pageSize = 20, empty = '없어요' }: Props<T>) {
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  // TanStack Table v8 은 React Compiler 자동 메모이즈와 맞지 않아 이 컴포넌트만 건너뛴다 (동작에는 영향 없음).
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, value: string) => searchText(row.original).toLowerCase().replace(/\s+/g, '').includes(value.toLowerCase().replace(/\s+/g, '')),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  const rows = table.getRowModel().rows;
  const total = table.getFilteredRowModel().rows.length;

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder={searchPlaceholder} className="max-w-xs" />
        {filters.map((filter) => {
          const column = table.getColumn(filter.columnId);
          const value = (column?.getFilterValue() as string | undefined) ?? '';
          return (
            <div key={filter.columnId} className="flex items-center gap-1 rounded-md border p-0.5">
              {[{ value: '', label: `${filter.label} 전체` }, ...filter.options].map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  size="sm"
                  variant={value === option.value ? 'default' : 'ghost'}
                  className="h-7"
                  onClick={() => column?.setFilterValue(option.value || undefined)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          );
        })}
        <span className="ml-auto text-xs text-muted-foreground">{total}개</span>
      </div>

      <div className="mt-3 rounded-md border bg-background">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => (
                  <TableHead key={header.id} className="text-xs">
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <button type="button" onClick={header.column.getToggleSortingHandler()} className="inline-flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <ArrowUpDown className="size-3 text-muted-foreground" />
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-sm text-muted-foreground">
                  {empty}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {table.getPageCount() > 1 && (
        <div className="mt-3 flex items-center justify-end gap-2 text-xs">
          <span>
            {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
          </span>
          <Button type="button" variant="outline" size="sm" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>
            이전
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>
            다음
          </Button>
        </div>
      )}
    </div>
  );
}
