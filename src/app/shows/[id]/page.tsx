import { cloneElement, Suspense } from 'react';
import { notFound } from 'next/navigation';
import AddShowToCalendar from '@/components/calendar/AddShowToCalendar';
import Lineup from '@/components/show/Lineup';
import ShowActionBar from '@/components/show/ShowActionBar';
import Timetable from '@/components/show/Timetable';
import SectionTitle from '@/components/ui/SectionTitle';
import Thumb from '@/components/ui/Thumb';
import { getArtist, getShow, getShows } from '@/lib/catalog';
import { formatRange, formatShort } from '@/lib/date';
import { getCurrentUser, getPickedSlotIds } from '@/lib/user';
import { CATEGORY_LABEL, DEFAULT_TIME_ZONE, getTicketStatus, MOCK_TODAY } from '@/mocks/shows';

export async function generateStaticParams() {
  return (await getShows()).map((show) => ({ id: show.id }));
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

async function ShowDetail({ id }: { id: string }) {
  const show = await getShow(id);
  if (!show) notFound();

  const lineup = (await Promise.all(show.artistIds.map(getArtist))).filter((artist) => artist !== undefined);

  const info = [
    { label: '일시', value: formatRange(show.startDate, show.endDate) },
    { label: '장소', value: show.venue },
    { label: '티켓 오픈', value: show.ticketOpenAt && `${formatShort(show.ticketOpenAt.slice(0, 10))} ${show.ticketOpenAt.slice(11)}` },
    { label: '가격', value: show.price },
  ].filter((row) => row.value);

  const timetable = show.timetable && (
    <Timetable
      showId={show.id}
      title={show.title}
      venue={show.venue}
      timeZone={show.timeZone ?? DEFAULT_TIME_ZONE}
      stages={show.timetable.stages}
      slots={show.timetable.slots}
      artists={lineup}
    />
  );

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
        <div className="mt-2 flex justify-end">
          <AddShowToCalendar
            id={show.id}
            title={show.title}
            venue={show.venue}
            startDate={show.startDate}
            endDate={show.endDate}
            startTime={show.startTime}
            timeZone={show.timeZone}
          />
        </div>
      </div>

      <section className="mt-10 px-4">
        <SectionTitle title="Lineup" />
        <Lineup artists={lineup} />
      </section>

      {show.category === 'festival' && (
        <section id="timetable" className="mt-10 scroll-mt-16 px-4">
          <SectionTitle title="Timetable" sub={show.timetable ? '눌러서 미리 듣고, 하트로 담아보세요' : undefined} />
          <div className="mt-3">
            {show.timetable ? (
              <Suspense fallback={timetable}>
                <PickedTimetable showId={show.id}>{timetable!}</PickedTimetable>
              </Suspense>
            ) : (
              <p className="border border-black px-3 py-6 text-center text-sm">시간표는 공개되는 대로 알려드릴게요.</p>
            )}
          </div>
        </section>
      )}

      <ShowActionBar
        showId={show.id}
        status={getTicketStatus(show, MOCK_TODAY)}
        vendors={show.ticketVendors}
        ticketOpenAt={show.ticketOpenAt}
        hasTimetable={!!show.timetable}
      />
    </main>
  );
}

// 로그인했으면 담아둔 무대를 채운 타임테이블로 바꿔 그린다.
async function PickedTimetable({ showId, children }: { showId: string; children: React.ReactElement<{ initialPicked?: string[] }> }) {
  const user = await getCurrentUser();
  const picked = user && (await getPickedSlotIds(user.id))[showId];
  return picked ? cloneElement(children, { initialPicked: picked }) : children;
}
