'use client';

import { useEffect, useState, useTransition } from 'react';
import { ExternalLink, Search, X } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { lookupSpotifyArtist, searchSpotifyArtists } from '@/lib/admin/spotifyActions';
import type { SpotifyArtist } from '@/lib/spotify';

type Props = {
  /** 저장된 Spotify 아티스트 ID */
  initialId: string | null;
  /** 저장된 Spotify 사진 주소 (최신 정보를 불러오기 전까지 그대로 넘긴다) */
  initialImageUrl: string | null;
  /** 검색창이 비었을 때 찾을 이름 (아티스트 이름 칸) */
  getDefaultQuery: () => string;
  /** 검색 결과에서 아티스트를 골랐을 때 */
  onChoose?: (artist: SpotifyArtist) => void;
};

const followers = (count: number) => (count >= 10_000 ? `${(count / 10_000).toFixed(count >= 100_000 ? 0 : 1)}만` : count.toLocaleString('ko-KR'));

function ArtistRow({ artist, action }: { artist: SpotifyArtist; action: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <div className="relative size-10 shrink-0 overflow-hidden rounded-full bg-muted">
        {artist.image && <Image src={artist.image} alt="" fill sizes="40px" unoptimized className="object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{artist.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          팔로워 {followers(artist.followers)}
          {artist.genres.length > 0 && ` · ${artist.genres.slice(0, 3).join(', ')}`}
        </p>
      </div>
      <a href={artist.url} target="_blank" rel="noreferrer" aria-label="Spotify 에서 열기" className="text-muted-foreground hover:text-foreground">
        <ExternalLink className="size-3.5" />
      </a>
      {action}
    </div>
  );
}

// Spotify 아티스트 연결: 이름으로 찾거나 링크·ID 를 붙여 넣어 고른다. 사진·팔로워 수로 동명이인을 가린다.
// 폼에는 hidden input(spotifyArtistId)으로 넘긴다.
export default function SpotifyPicker({ initialId, initialImageUrl, getDefaultQuery, onChoose }: Props) {
  const [selected, setSelected] = useState<SpotifyArtist>();
  const [selectedId, setSelectedId] = useState(initialId ?? '');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SpotifyArtist[]>();
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  // 저장된 ID 가 있으면 누구인지 보여준다.
  useEffect(() => {
    if (!initialId) return;
    let ignore = false;
    lookupSpotifyArtist(initialId).then((result) => {
      if (ignore) return;
      if (result.artist) setSelected(result.artist);
      else setError(result.error);
    });
    return () => {
      ignore = true;
    };
  }, [initialId]);

  const search = () =>
    startTransition(async () => {
      const text = query.trim() || getDefaultQuery().trim();
      if (!text) return setError('찾을 이름을 적어주세요');
      setError(undefined);
      // 링크·ID 를 붙여 넣었으면 바로 조회한다.
      if (/spotify\.com\/artist\/|^[A-Za-z0-9]{22}$/.test(text)) {
        const result = await lookupSpotifyArtist(text);
        if (result.artist) choose(result.artist);
        else setError(result.error);
        return;
      }
      const result = await searchSpotifyArtists(text);
      setResults(result.artists);
      setError(result.error ?? (result.artists?.length === 0 ? `‘${text}’ 검색 결과가 없어요` : undefined));
    });

  const choose = (artist: SpotifyArtist) => {
    setSelected(artist);
    setSelectedId(artist.id);
    setResults(undefined);
    setQuery('');
    onChoose?.(artist);
  };

  return (
    <div className="grid gap-2">
      <input type="hidden" name="spotifyArtistId" value={selectedId} />
      {/* 업로드한 사진이 없을 때 사이트가 대신 보여줄 Spotify 사진 주소. 편집 화면을 열 때마다 최신 주소로 다시 받는다. */}
      <input type="hidden" name="spotifyImageUrl" value={selectedId ? (selected ? (selected.imageLarge ?? '') : (initialImageUrl ?? '')) : ''} />
      {selectedId && (
        <div className="rounded-md border bg-muted/30">
          {selected ? (
            <ArtistRow
              artist={selected}
              action={
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Spotify 연결 빼기"
                  onClick={() => {
                    setSelected(undefined);
                    setSelectedId('');
                  }}
                >
                  <X />
                </Button>
              }
            />
          ) : (
            <p className="px-3 py-2 text-xs text-muted-foreground">연결된 ID {selectedId} 를 불러오는 중…</p>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return;
            e.preventDefault(); // 폼 제출 대신 검색
            search();
          }}
          placeholder="이름으로 찾기 (비우면 위 이름으로) · 링크·ID 붙여 넣기"
          aria-label="Spotify 에서 찾기"
        />
        <Button type="button" variant="outline" disabled={isPending} onClick={search}>
          <Search /> {isPending ? '찾는 중…' : selectedId ? '다시 찾기' : 'Spotify 에서 찾기'}
        </Button>
      </div>

      {results && results.length > 0 && (
        <ul className="divide-y rounded-md border" aria-label="Spotify 검색 결과">
          {results.map((artist) => (
            <li key={artist.id}>
              <ArtistRow
                artist={artist}
                action={
                  <Button type="button" size="sm" variant={artist.id === selectedId ? 'default' : 'outline'} onClick={() => choose(artist)}>
                    {artist.id === selectedId ? '연결됨' : '고르기'}
                  </Button>
                }
              />
            </li>
          ))}
        </ul>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
