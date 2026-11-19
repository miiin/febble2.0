import { Suspense } from 'react';
import Link from 'next/link';
import ShowRow from '@/components/show/ShowRow';
import SectionTitle from '@/components/ui/SectionTitle';
import { formatMonth } from '@/lib/date';
import { getShows } from '@/lib/catalog';
import { CATEGORY_LABEL, type ShowCategory, sortByDate } from '@/mocks/shows';

const FILTERS: { value?: ShowCategory; label: string }[] = [
  { label: '전체' },
  { value: 'indie', label: CATEGORY_LABEL.indie },
  { value: 'overseas', label: CATEGORY_LABEL.overseas },
  { value: 'festival', label: CATEGORY_LABEL.festival },
];

export default function ShowsPage({ searchParams }: PageProps<'/shows'>) {
  return (
    <main className="px-4 pt-8 pb-14">
      <SectionTitle title="Shows" sub="전체 공연" />
      {/* cacheComponents: searchParams 는 Suspense 안에서 await 한다. */}
      <Suspense>
        {searchParams.then(({ category }) => (
          <ShowList category={typeof category === 'string' ? category : undefined} />
        ))}
      </Suspense>
    </main>
  );
}

async function ShowList({ category }: { category?: string }) {
  const shows = await getShows();
  const filtered = sortByDate(category ? shows.filter((show) => show.category === category) : shows);

  // 월별로 묶는다. 정렬돼 있으니 순서대로 넣으면 된다.
  const groups = new Map<string, typeof filtered>();
  for (const show of filtered) {
    const month = formatMonth(show.startDate);
    groups.set(month, [...(groups.get(month) ?? []), show]);
  }

  return (
    <>
      <nav className="mt-4 flex gap-2">
        {FILTERS.map((filter) => {
          const isActive = filter.value === category;
          return (
            <Link
              key={filter.label}
              href={filter.value ? `/shows?category=${filter.value}` : '/shows'}
              aria-current={isActive ? 'page' : undefined}
              className={`flex h-8 items-center rounded-full border border-black px-3 text-xs ${isActive ? 'bg-black text-white' : ''}`}
            >
              {filter.label}
            </Link>
          );
        })}
      </nav>

      {groups.size === 0 && <p className="mt-10 text-center text-sm">예정된 공연이 없어요.</p>}

      {[...groups].map(([month, list]) => (
        <section key={month} className="mt-8">
          <h2 className="font-display text-lg">{month}</h2>
          <ul className="mt-2 border-t-2 border-black">
            {list.map((show) => (
              <ShowRow key={show.id} show={show} />
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
