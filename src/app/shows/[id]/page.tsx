import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Timetable from '@/components/show/Timetable';
import LikeButton from '@/components/ui/LikeButton';
import SectionTitle from '@/components/ui/SectionTitle';
import Thumb from '@/components/ui/Thumb';
import { formatRange } from '@/lib/date';
import { getArtist } from '@/mocks/artists';
import { CATEGORY_LABEL, getShow, shows } from '@/mocks/shows';

export function generateStaticParams() {
  return shows.map((show) => ({ id: show.id }));
}

export default function ShowPage({ params }: PageProps<'/shows/[id]'>) {
  // cacheComponents: params 는 Suspense 안에서 await 한다.
  return (
    <Suspense>
      {params.then(({ id }) => (
        <ShowDetail id={id} />
      ))}
    </Suspense>
  );
}

function ShowDetail({ id }: { id: string }) {
  const show = getShow(id);
  if (!show) notFound();

  const lineup = show.artistIds.map(getArtist).filter((artist) => artist !== undefined);
  const artistNames = Object.fromEntries(lineup.map((artist) => [artist.id, artist.name]));

  const info = [
    { label: '일시', value: formatRange(show.startDate, show.endDate) },
    { label: '장소', value: show.venue },
    { label: '티켓 오픈', value: show.ticketOpenAt },
    { label: '가격', value: show.price },
  ].filter((row) => row.value);

  return (
    <main>
      <div className="px-4 pt-6">
        <Thumb src={show.image} alt={show.title} className="aspect-square w-full" />
        <span className="mt-4 inline-block font-plex text-xs italic">{CATEGORY_LABEL[show.category]}</span>
        <h1 className="mt-1 font-display text-[28px] leading-tight tracking-[-0.02em]">{show.title}</h1>
        {show.description && <p className="mt-3 text-sm leading-relaxed tracking-[-0.04em] whitespace-pre-line">{show.description}</p>}

        <dl className="mt-5 border-t border-black text-sm">
          {info.map((row) => (
            <div key={row.label} className="flex gap-4 border-b border-black py-2.5">
              <dt className="w-16 shrink-0 text-xs leading-5">{row.label}</dt>
              <dd className="tracking-[-0.04em]">{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <section className="mt-10 px-4">
        <SectionTitle title="Lineup" />
        <ul className="mt-3 flex gap-3 overflow-x-auto pb-1">
          {lineup.map((artist) => (
            <li key={artist.id} className="w-16 shrink-0">
              <Link href={`/artists/${artist.id}`} className="flex flex-col items-center gap-1.5">
                <Thumb src={artist.image} alt={artist.name} className="size-16 rounded-full" />
                <span className="w-full truncate text-center text-xs">{artist.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {show.category === 'festival' && (
        <section className="mt-10 px-4">
          <SectionTitle title="Timetable" sub={show.timetable ? '보고 싶은 무대를 눌러 담아보세요' : undefined} />
          <div className="mt-3">
            {show.timetable ? (
              <Timetable stages={show.timetable.stages} slots={show.timetable.slots} artistNames={artistNames} />
            ) : (
              <p className="border border-black px-3 py-6 text-center text-sm">시간표는 공개되는 대로 알려드릴게요.</p>
            )}
          </div>
        </section>
      )}

      <div className="sticky bottom-0 mt-10 flex gap-3 border-t border-black bg-white px-4 py-3">
        <Link
          href={show.ticketUrl ?? '#'}
          className="flex h-11 flex-1 items-center justify-center rounded-lg border border-black bg-brand-yellow text-sm"
        >
          예매하러 가기
        </Link>
        <LikeButton className="flex size-11 items-center justify-center rounded-full border border-black" />
      </div>
    </main>
  );
}
