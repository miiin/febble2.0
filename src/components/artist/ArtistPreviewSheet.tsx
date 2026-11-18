'use client';

import { useState } from 'react';
import Link from 'next/link';
import SpotifyEmbed from '@/components/artist/SpotifyEmbed';
import BottomSheet from '@/components/ui/BottomSheet';
import type { Artist } from '@/mocks/artists';

type Props = {
  artist?: Artist;
  onClose: () => void;
  /** 타임테이블에서 열었을 때: 무대 정보와 담기 버튼 */
  slot?: { label: string; isPicked: boolean; onTogglePick: () => void };
};

// 페이지 이동 없이 아티스트를 미리 들어보는 시트. 라인업·타임테이블에서 쓴다.
// artist 가 있으면 열린다. 닫히는 애니메이션 동안 내용은 남기고, Spotify iframe 만 빼서 재생을 멈춘다.
export default function ArtistPreviewSheet({ artist: openArtist, onClose, slot }: Props) {
  const [artist, setArtist] = useState(openArtist);
  if (openArtist && openArtist !== artist) setArtist(openArtist);

  return (
    <BottomSheet isOpen={!!openArtist} onClose={onClose} labelledBy="artist-preview-title">
      {artist && (
        <>
          <div className="mt-6">
            <h2 id="artist-preview-title" className="font-display text-2xl leading-tight tracking-[-0.02em]">
              {artist.name}
            </h2>
            <p className="mt-1 font-plex text-xs italic">{artist.genres.join(' · ')}</p>
            {slot && <p className="mt-2 text-xs">{slot.label}</p>}
          </div>

          <div className="mt-4 min-h-[152px]">
            {openArtist && <SpotifyEmbed artistName={artist.name} spotifyArtistId={artist.spotifyArtistId} />}
          </div>

          <div className="mt-4 flex gap-2">
            {slot && (
              <button
                type="button"
                aria-pressed={slot.isPicked}
                onClick={slot.onTogglePick}
                className={`flex h-11 flex-1 items-center justify-center rounded-lg border border-black text-sm ${slot.isPicked ? 'bg-white' : 'bg-brand-yellow'}`}
              >
                {slot.isPicked ? '담은 무대에서 빼기' : '내 타임테이블에 담기'}
              </button>
            )}
            <Link
              href={`/artists/${artist.id}`}
              className={`flex h-11 items-center justify-center rounded-lg border border-black text-sm ${slot ? 'shrink-0 px-4' : 'flex-1'}`}
            >
              아티스트 페이지 →
            </Link>
          </div>
        </>
      )}
    </BottomSheet>
  );
}
