'use client';

import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import DataTable from '@/components/admin/DataTable';
import { ListThumb, StatusPill } from '@/components/admin/ui';
import { formatRange } from '@/lib/date';
import { CATEGORY_LABEL, type ShowCategory } from '@/mocks/shows';

export type ShowRow = {
  id: string;
  title: string;
  image: string | null;
  category: ShowCategory;
  startDate: string;
  endDate: string;
  venue: string;
  isPublished: boolean;
  soldOut: boolean;
};

const columns: ColumnDef<ShowRow>[] = [
  {
    accessorKey: 'title',
    header: '공연',
    cell: ({ row }) => (
      <Link href={`/admin/shows/${row.original.id}`} className="group flex items-center gap-3">
        <ListThumb src={row.original.image} className="h-12 w-9 rounded-sm" />
        <span className="font-medium underline-offset-2 group-hover:underline">
          {row.original.title}
          <span className="block text-[11px] font-normal text-muted-foreground">{row.original.id}</span>
        </span>
      </Link>
    ),
  },
  {
    accessorKey: 'category',
    header: '분류',
    filterFn: 'equalsString',
    cell: ({ row }) => <span className="text-xs">{CATEGORY_LABEL[row.original.category]}</span>,
  },
  {
    accessorKey: 'startDate',
    header: '일시',
    cell: ({ row }) => <span className="text-xs">{formatRange(row.original.startDate, row.original.endDate)}</span>,
  },
  { accessorKey: 'venue', header: '장소', enableSorting: false, cell: ({ row }) => <span className="text-xs">{row.original.venue}</span> },
  {
    id: 'status',
    accessorFn: (row) => (row.isPublished ? 'published' : 'draft'),
    header: '상태',
    filterFn: 'equalsString',
    enableSorting: false,
    cell: ({ row }) => (
      <span className="space-x-1">
        <StatusPill on={row.original.isPublished} />
        {row.original.soldOut && <StatusPill on onLabel="매진" tone="soldOut" />}
      </span>
    ),
  },
];

export default function ShowsTable({ shows }: { shows: ShowRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={shows}
      searchText={(show) => `${show.title} ${show.venue} ${show.id}`}
      searchPlaceholder="공연 이름·장소로 찾기"
      initialSorting={[{ id: 'startDate', desc: true }]}
      filters={[
        { columnId: 'category', label: '분류', options: Object.entries(CATEGORY_LABEL).map(([value, label]) => ({ value, label })) },
        {
          columnId: 'status',
          label: '상태',
          options: [
            { value: 'published', label: '공개' },
            { value: 'draft', label: '비공개' },
          ],
        },
      ]}
      empty="조건에 맞는 공연이 없어요"
    />
  );
}
