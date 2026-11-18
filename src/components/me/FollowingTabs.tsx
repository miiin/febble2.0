'use client';

import { useState } from 'react';
import Link from 'next/link';
import FollowButton from '@/components/artist/FollowButton';
import Badge from '@/components/ui/Badge';
import Thumb from '@/components/ui/Thumb';
import type { Artist } from '@/mocks/artists';

export type NewsItem = {
  showId: string;
  artist: Artist;
  title: string;
  startDate: string; // 정렬용 'YYYY-MM-DD'
  date: string;
  venue: string;
  /** 7일 안에 티켓 오픈이면 'D-3' 같은 라벨 */
  openLabel?: string;
};

type Props = {
  news: NewsItem[];
  artists: Artist[];
};

export default function FollowingTabs({ news, artists }: Props) {
  const [tab, setTab] = useState<'news' | 'artists'>('news');

  const tabClass = (active: boolean) => `flex-1 border-b-2 py-3 text-sm ${active ? 'border-black font-medium' : 'border-transparent text-black/50'}`;

  return (
    <>
      <div role="tablist" className="mt-4 flex border-b border-black">
        <button type="button" role="tab" aria-selected={tab === 'news'} onClick={() => setTab('news')} className={tabClass(tab === 'news')}>
          소식
        </button>
        <button type="button" role="tab" aria-selected={tab === 'artists'} onClick={() => setTab('artists')} className={tabClass(tab === 'artists')}>
          팔로우 중 {artists.length}
        </button>
      </div>

      {tab === 'news' ? (
        news.length > 0 ? (
          <ul>
            {news.map((item) => (
              <li key={`${item.showId}-${item.artist.id}`} className="relative border-b border-black">
                <Link href={`/shows/${item.showId}`} className="flex items-center gap-4 py-3">
                  <Thumb src={item.artist.image} alt={item.artist.name} className="size-14 rounded-full" />
                  <div className="min-w-0">
                    <p className="text-xs">{item.artist.name}</p>
                    <p className="truncate font-medium tracking-[-0.04em]">{item.title}</p>
                    <p className="text-xs">
                      {item.date} · {item.venue}
                    </p>
                  </div>
                </Link>
                {item.openLabel && (
                  <div className="absolute top-3 right-0">
                    <Badge type="open-soon">오픈 {item.openLabel}</Badge>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-10 text-center text-sm">팔로우한 아티스트의 예정된 공연이 없어요.</p>
        )
      ) : (
        <ul>
          {artists.map((artist) => (
            <li key={artist.id} className="flex items-center gap-4 border-b border-black py-3">
              <Link href={`/artists/${artist.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                <Thumb src={artist.image} alt={artist.name} className="size-14 rounded-full" />
                <div className="min-w-0">
                  <p className="truncate font-medium tracking-[-0.04em]">{artist.name}</p>
                  <p className="font-plex text-xs italic">{artist.genres.join(' · ')}</p>
                </div>
              </Link>
              <FollowButton initialFollowing />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
