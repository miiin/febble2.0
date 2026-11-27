'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import DataTable from '@/components/admin/DataTable';
import { ListThumb, StatusPill } from '@/components/admin/ui';
import { Button } from '@/components/shadcn/button';
import { setShowsPublished } from '@/lib/admin/showActions';
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
  /** 라인업에 연결된 아티스트 이름 */
  lineup: string[];
};

const LINEUP_SHOWN = 3;

const columns: ColumnDef<ShowRow>[] = [
  {
    accessorKey: 'title',
    header: '공연',
    cell: ({ row }) => (
      <Link href={`/admin/shows/${row.original.id}`} className="group flex min-w-56 items-center gap-3 whitespace-normal">
        <ListThumb src={row.original.image} className="h-12 w-9 rounded-sm" />
        <span className="font-medium underline-offset-2 group-hover:underline">
          <span className="line-clamp-2">{row.original.title}</span>
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
  {
    id: 'lineup',
    accessorFn: (row) => (row.lineup.length ? 'linked' : 'none'),
    header: '아티스트',
    filterFn: 'equalsString',
    enableSorting: false,
    cell: ({ row }) => {
      const { lineup } = row.original;
      if (!lineup.length) return <span className="text-xs font-medium text-destructive">연결 없음</span>;
      return (
        <span className="block min-w-28 text-xs whitespace-normal">
          {lineup.slice(0, LINEUP_SHOWN).join(', ')}
          {lineup.length > LINEUP_SHOWN && <span className="text-muted-foreground"> 외 {lineup.length - LINEUP_SHOWN}</span>}
        </span>
      );
    },
  },
  {
    accessorKey: 'venue',
    header: '장소',
    enableSorting: false,
    cell: ({ row }) => <span className="block min-w-24 text-xs whitespace-normal">{row.original.venue}</span>,
  },
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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const setPublished = (selected: ShowRow[], publish: boolean, clear: () => void) =>
    startTransition(async () => {
      const result = await setShowsPublished(
        selected.map((show) => show.id),
        publish,
      );
      if (result.error) return void toast.error(result.error);
      toast.success(`${result.count}개 공연을 ${publish ? '공개' : '비공개'}로 바꿨어요`);
      clear();
      router.refresh();
    });

  return (
    <DataTable
      columns={columns}
      data={shows}
      searchText={(show) => `${show.title} ${show.venue} ${show.id} ${show.lineup.join(' ')}`}
      searchPlaceholder="공연 이름·장소·아티스트로 찾기"
      initialSorting={[{ id: 'startDate', desc: true }]}
      filters={[
        { columnId: 'category', label: '분류', options: Object.entries(CATEGORY_LABEL).map(([value, label]) => ({ value, label })) },
        {
          columnId: 'lineup',
          label: '아티스트',
          options: [
            { value: 'linked', label: '연결됨' },
            { value: 'none', label: '연결 없음' },
          ],
        },
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
      selection={{
        getRowId: (show) => show.id,
        actions: (selected, clear) => (
          <>
            <Button type="button" variant="outline" disabled={isPending} onClick={() => setPublished(selected, false, clear)}>
              비공개로
            </Button>
            <Button type="button" disabled={isPending} onClick={() => setPublished(selected, true, clear)}>
              공개로
            </Button>
          </>
        ),
      }}
    />
  );
}
