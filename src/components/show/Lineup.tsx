'use client';

import { useState } from 'react';
import ArtistPreviewSheet from '@/components/artist/ArtistPreviewSheet';
import Thumb from '@/components/ui/Thumb';
import type { Artist } from '@/mocks/artists';

// 공연 상세 라인업. 누르면 페이지 이동 없이 미리듣기 시트를 띄운다.
export default function Lineup({ artists }: { artists: Artist[] }) {
  const [previewId, setPreviewId] = useState<string>();

  return (
    <>
      <ul className="mt-3 flex gap-3 overflow-x-auto pb-1">
        {artists.map((artist) => (
          <li key={artist.id} className="w-16 shrink-0">
            <button type="button" onClick={() => setPreviewId(artist.id)} className="flex w-full flex-col items-center gap-1.5">
              <Thumb src={artist.image} alt={artist.name} className="size-16 rounded-full" />
              <span className="w-full truncate text-center text-xs">{artist.name}</span>
            </button>
          </li>
        ))}
      </ul>

      <ArtistPreviewSheet artist={artists.find((artist) => artist.id === previewId)} onClose={() => setPreviewId(undefined)} />
    </>
  );
}
