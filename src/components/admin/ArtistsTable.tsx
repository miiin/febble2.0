'use client';

import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import DataTable from '@/components/admin/DataTable';
import { StatusPill } from '@/components/admin/ui';

export type ArtistRow = {
  id: string;
  name: string;
  genres: string[];
  isEditorPick: boolean;
  spotifyArtistId: string | null;
  followers: number;
};

const columns: ColumnDef<ArtistRow>[] = [
  {
    accessorKey: 'name',
    header: '이름',
    cell: ({ row }) => (
      <Link href={`/admin/artists/${row.original.id}`} className="font-medium underline-offset-2 hover:underline">
        {row.original.name}
        <span className="block text-[11px] font-normal text-muted-foreground">{row.original.id}</span>
      </Link>
    ),
  },
  {
    accessorKey: 'genres',
    header: '장르',
    enableSorting: false,
    cell: ({ row }) => <span className="text-xs">{row.original.genres.join(', ')}</span>,
  },
  { accessorKey: 'followers', header: '팔로워' },
  {
    id: 'pick',
    accessorFn: (row) => (row.isEditorPick ? 'yes' : 'no'),
    header: '에디터 추천',
    filterFn: 'equalsString',
    enableSorting: false,
    cell: ({ row }) => row.original.isEditorPick && <StatusPill on onLabel="추천" />,
  },
  {
    id: 'spotify',
    header: 'Spotify',
    enableSorting: false,
    cell: ({ row }) => <span className="text-xs">{row.original.spotifyArtistId ? '있음' : '—'}</span>,
  },
];

export default function ArtistsTable({ artists }: { artists: ArtistRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={artists}
      searchText={(artist) => `${artist.name} ${artist.id} ${artist.genres.join(' ')}`}
      searchPlaceholder="이름·장르로 찾기"
      initialSorting={[{ id: 'name', desc: false }]}
      filters={[{ columnId: 'pick', label: '추천', options: [{ value: 'yes', label: '에디터 추천만' }] }]}
      empty="조건에 맞는 아티스트가 없어요"
    />
  );
}
