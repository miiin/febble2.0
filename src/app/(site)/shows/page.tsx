import { Suspense } from 'react';
import Link from 'next/link';
import ShowRow from '@/components/show/ShowRow';
import SectionTitle from '@/components/ui/SectionTitle';
import { addDays, formatMonth, weekday } from '@/lib/date';
import { getShows } from '@/lib/catalog';
import { getToday } from '@/lib/today';
import { CATEGORY_LABEL, type ShowCategory, sortByDate } from '@/mocks/shows';

const FILTERS: { value?: ShowCategory; label: string }[] = [
  { label: '전체' },
  { value: 'indie', label: CATEGORY_LABEL.indie },
  { value: 'overseas', label: CATEGORY_LABEL.overseas },
  { value: 'festival', label: CATEGORY_LABEL.festival },
];

type When = 'week' | 'weekend' | 'month';
const WHEN_FILTERS: { value?: When; label: string }[] = [
  { label: '전체 기간' },
  { value: 'week', label: '이번 주' },
  { value: 'weekend', label: '이번 주말' },
  { value: 'month', label: '이번 달' },
];

/** 오늘부터 기간 끝까지 [시작, 끝]. 한 주는 일요일에 끝난다. */
function range(when: When, today: string): [string, string] {
  const day = weekday(today);
  if (when === 'week') return [today, addDays(today, (7 - day) % 7)];
  if (when === 'weekend') return day === 0 ? [today, today] : [addDays(today, 6 - day), addDays(today, 7 - day)];
  const [y, m] = today.split('-').map(Number);
  return [today, addDays(`${m === 12 ? y + 1 : y}-${String((m % 12) + 1).padStart(2, '0')}-01`, -1)];
}

/** '롤링홀, 서울' → '서울'. 도시가 없으면 undefined */
const regionOf = (venue: string) => venue.match(/,\s*([^,]+)$/)?.[1].trim();

type Params = { category?: string; when?: string; region?: string };

export default function ShowsPage({ searchParams }: PageProps<'/shows'>) {
  return (
    <main className="px-4 pt-8 pb-14">
      <SectionTitle title="Shows" sub="전체 공연" />
      {/* cacheComponents: searchParams 는 Suspense 안에서 await 한다. */}
      <Suspense>
        {searchParams.then(({ category, when, region }) => (
          <ShowList
            params={{
              category: typeof category === 'string' ? category : undefined,
              when: typeof when === 'string' ? when : undefined,
              region: typeof region === 'string' ? region : undefined,
            }}
          />
        ))}
      </Suspense>
    </main>
  );
}

async function ShowList({ params }: { params: Params }) {
  const [shows, today] = await Promise.all([getShows(), getToday()]);
  const upcoming = shows.filter((show) => show.endDate >= today);
  const regions = [...new Set(upcoming.flatMap((show) => regionOf(show.venue) ?? []))].sort((a, b) => a.localeCompare(b, 'ko'));

  const { category, region } = params;
  const when = WHEN_FILTERS.some((filter) => filter.value === params.when) ? (params.when as When) : undefined;
  const [from, to] = when ? range(when, today) : [today, '9999-12-31'];
  const filtered = sortByDate(
    upcoming.filter(
      (show) =>
        (!category || show.category === category) &&
        (!region || regionOf(show.venue) === region) &&
        show.startDate <= to &&
        show.endDate >= from,
    ),
  );

  // 월별로 묶는다. 정렬돼 있으니 순서대로 넣으면 된다.
  const groups = new Map<string, typeof filtered>();
  for (const show of filtered) {
    const month = formatMonth(show.startDate);
    groups.set(month, [...(groups.get(month) ?? []), show]);
  }

  // 다른 필터는 그대로 두고 하나만 바꾼 주소
  const hrefWith = (change: Params) => {
    const query = new URLSearchParams(Object.entries({ ...params, ...change }).filter((entry): entry is [string, string] => !!entry[1]));
    return query.size ? `/shows?${query}` : '/shows';
  };

  return (
    <>
      <FilterRow items={FILTERS.map((filter) => ({ ...filter, href: hrefWith({ category: filter.value }), active: filter.value === category }))} />
      <FilterRow items={WHEN_FILTERS.map((filter) => ({ ...filter, href: hrefWith({ when: filter.value }), active: filter.value === when }))} />
      {regions.length > 1 && (
        <FilterRow
          items={[undefined, ...regions].map((value) => ({
            label: value ?? '전체 지역',
            href: hrefWith({ region: value }),
            active: value === region,
          }))}
        />
      )}

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

function FilterRow({ items }: { items: { label: string; href: string; active: boolean }[] }) {
  return (
    <nav className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 first-of-type:mt-4">
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          aria-current={item.active ? 'page' : undefined}
          className={`flex h-8 shrink-0 items-center rounded-full border border-black px-3 text-xs ${item.active ? 'bg-black text-white' : ''}`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
