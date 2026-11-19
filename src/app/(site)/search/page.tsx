import { Suspense } from 'react';
import Form from 'next/form';
import Image from 'next/image';
import Link from 'next/link';
import ShowRow from '@/components/show/ShowRow';
import Thumb from '@/components/ui/Thumb';
import { search, suggestedQueries } from '@/lib/search';

export default function SearchPage({ searchParams }: PageProps<'/search'>) {
  return (
    <main className="px-4 pt-6 pb-14">
      {/* cacheComponents: searchParams 는 Suspense 안에서 await 한다. */}
      <Suspense fallback={<SearchForm />}>
        {searchParams.then(({ q }) => (
          <Results query={typeof q === 'string' ? q.trim() : ''} />
        ))}
      </Suspense>
    </main>
  );
}

function SearchForm({ query = '' }: { query?: string }) {
  return (
    <Form action="/search" className="flex items-center gap-3 border-b-2 border-black pb-2">
      <Image src="/images/icon/search.svg" alt="" width={16} height={16} />
      <input
        // key 로 검색어가 바뀌면 입력창도 새 값으로 다시 그린다
        key={query}
        name="q"
        type="search"
        defaultValue={query}
        autoFocus={!query}
        placeholder="아티스트, 공연, 공연장"
        aria-label="검색어"
        className="min-w-0 flex-1 bg-transparent text-lg tracking-[-0.04em] outline-none placeholder:text-black/30"
      />
    </Form>
  );
}

async function Results({ query }: { query: string }) {
  if (!query) {
    return (
      <>
        <SearchForm />
        <p className="mt-8 text-xs">이런 아티스트는 어때요</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {(await suggestedQueries()).map((name) => (
            <li key={name}>
              <Link href={`/search?q=${encodeURIComponent(name)}`} className="flex h-8 items-center rounded-full border border-black px-3 text-xs">
                {name}
              </Link>
            </li>
          ))}
        </ul>
      </>
    );
  }

  const result = await search(query);
  const isEmpty = result.artists.length === 0 && result.shows.length === 0;

  return (
    <>
      <SearchForm query={query} />

      {isEmpty && (
        <div className="mt-12 text-center">
          <p className="text-sm">‘{query}’에 대한 결과가 없어요.</p>
          <Link href="/report" className="mt-3 inline-block text-xs underline underline-offset-2">
            찾는 공연이 없다면 제보해주세요
          </Link>
        </div>
      )}

      {result.artists.length > 0 && (
        <section className="mt-8">
          <h2 className="flex items-baseline gap-1.5">
            <span className="font-serif text-[28px] leading-none">Artists</span>
            <span className="text-sm">{result.artists.length}</span>
          </h2>
          <ul className="mt-3 border-t-2 border-black">
            {result.artists.map((artist) => (
              <li key={artist.id} className="border-b border-black">
                <Link href={`/artists/${artist.id}`} className="flex items-center gap-4 py-3 pl-2">
                  <Thumb src={artist.image} alt={artist.name} className="size-12 rounded-full" />
                  <div className="min-w-0">
                    <p className="truncate font-medium tracking-[-0.04em]">{artist.name}</p>
                    <p className="font-plex text-xs italic">{artist.genres.join(' · ')}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {result.shows.length > 0 && (
        <section className="mt-8">
          <h2 className="flex items-baseline gap-1.5">
            <span className="font-serif text-[28px] leading-none">Shows</span>
            <span className="text-sm">{result.shows.length}</span>
          </h2>
          <ul className="mt-3 border-t-2 border-black">
            {result.shows.map((show) => (
              <ShowRow key={show.id} show={show} />
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
