import Link from 'next/link';
import KopisImportButton from '@/components/admin/KopisImportButton';
import ReportStatusSelect from '@/components/admin/ReportStatusSelect';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import { PageHeader } from '@/components/admin/ui';
import { requireAdmin } from '@/lib/admin/guard';
import { getRelevanceHints, listKopisPending, listReports } from '@/lib/admin/queries';
import { cn } from '@/lib/utils';

const dateTime = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const KOPIS_LIMIT = 200;

export default async function AdminReportsPage({ searchParams }: PageProps<'/admin/reports'>) {
  await requireAdmin();
  const tab = (await searchParams).tab === 'kopis' ? 'kopis' : 'user';

  return (
    <>
      <PageHeader title="Reports" />
      <nav className="mt-4 flex gap-1 text-sm">
        {(
          [
            ['user', '사용자 제보', '/admin/reports'],
            ['kopis', 'KOPIS', '/admin/reports?tab=kopis'],
          ] as const
        ).map(([key, label, href]) => (
          <Link
            key={key}
            href={href}
            className={cn('rounded-md px-3 py-1.5', tab === key ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-accent')}
          >
            {label}
          </Link>
        ))}
      </nav>
      {tab === 'user' ? <UserReports /> : <KopisReports />}
    </>
  );
}

async function UserReports() {
  const reports = await listReports();
  return (
    <>
      <p className="mt-3 text-xs text-muted-foreground">사이트의 공연 제보하기로 들어온 내용이에요. 공연을 올렸으면 ‘추가함’으로 바꿔주세요.</p>
      {reports.length === 0 && <p className="mt-10 text-center text-sm">아직 들어온 제보가 없어요.</p>}
      <ul className="mt-4 divide-y rounded-md border bg-background">
        {reports.map((report) => (
          <li key={report.id} className="grid grid-cols-[1fr_auto] gap-4 px-4 py-4">
            <div className="min-w-0 text-sm">
              <p className="font-medium">{report.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {[report.artist, report.date, report.venue].filter(Boolean).join(' · ') || '추가 정보 없음'}
              </p>
              {report.link && (
                <a href={report.link} target="_blank" rel="noreferrer" className="mt-1 block truncate text-xs underline">
                  {report.link}
                </a>
              )}
              {report.message && <p className="mt-2 text-xs whitespace-pre-line">{report.message}</p>}
              <p className="mt-2 text-[11px] text-muted-foreground">
                {dateTime.format(report.createdAt)} · {report.userId ? '로그인 사용자' : '비로그인'}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <ReportStatusSelect id={report.id} status={report.status} />
              {report.status === 'pending' && (
                <Button asChild size="sm" variant="outline">
                  <Link href={`/admin/shows/new?report=${report.id}`}>공연으로 만들기</Link>
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

// 공백·대소문자를 무시하고 비교한다.
const normalize = (text: string) => text.toLowerCase().replace(/\s+/g, '');

async function KopisReports() {
  const [pending, hints] = await Promise.all([listKopisPending(), getRelevanceHints()]);
  const artists = hints.artists.filter((name) => normalize(name).length >= 2);
  // febble 공연장은 "공연장, 도시" 로 적으므로 앞부분만 본다.
  const venues = [...new Set(hints.venues.map((venue) => venue.split(',')[0].trim()).filter((venue) => normalize(venue).length >= 2))];

  // 등록된 아티스트 이름이 공연 이름에 있거나, febble 에 올린 적 있는 공연장이면 '관련'.
  const rows = pending
    .map((report) => ({
      report,
      artistMatches: artists.filter((name) => normalize(report.title).includes(normalize(name))),
      venueMatches: venues.filter((venue) => normalize(report.venue ?? '').includes(normalize(venue))),
    }))
    // 아티스트가 겹치는 공연 → 공연장만 겹치는 공연 → 나머지. 같은 순위 안에서는 날짜순 (안정 정렬).
    .map((row) => ({ ...row, rank: row.artistMatches.length > 0 ? 2 : row.venueMatches.length > 0 ? 1 : 0 }))
    .sort((a, b) => b.rank - a.rank);
  const related = rows.filter((row) => row.rank > 0).length;

  return (
    <>
      <div className="mt-3 flex items-end justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          KOPIS(공연예술통합전산망)에 등록된 앞으로 60일의 대중음악 공연이에요. 처리하지 않은 공연 {pending.length}건 중 관련 {related}건.
          <br />
          등록된 아티스트가 나오는 공연, febble 에 올린 적 있는 공연장의 공연 순으로 위에 보여줘요. 올리지 않을 공연은 ‘반려’로 넘겨주세요.
        </p>
        <KopisImportButton />
      </div>
      {pending.length === 0 && <p className="mt-10 text-center text-sm">처리할 공연이 없어요. KOPIS에서 가져와 주세요.</p>}
      <ul className="mt-4 divide-y rounded-md border bg-background">
        {rows.slice(0, KOPIS_LIMIT).map(({ report, artistMatches, venueMatches }) => (
          <li key={report.id} className="grid grid-cols-[3rem_1fr_auto] items-start gap-4 px-4 py-3">
            {report.poster ? (
              // KOPIS 포스터는 외부 주소라 next/image 대신 그대로 보여준다.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={report.poster} alt="" loading="lazy" className="h-16 w-12 rounded-sm bg-muted object-cover" />
            ) : (
              <div className="h-16 w-12 rounded-sm bg-muted" />
            )}
            <div className="min-w-0 text-sm">
              <p className="font-medium">{report.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{[report.date, report.venue].filter(Boolean).join(' · ')}</p>
              {artistMatches.length + venueMatches.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {artistMatches.map((name) => (
                    <Badge key={name} className="bg-brand-yellow text-black">
                      아티스트 · {name}
                    </Badge>
                  ))}
                  {venueMatches.map((venue) => (
                    <Badge key={venue} variant="outline">
                      공연장 · {venue}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <ReportStatusSelect id={report.id} status={report.status} />
              <Button asChild size="sm" variant="outline">
                <Link href={`/admin/shows/new?report=${report.id}`}>공연으로 만들기</Link>
              </Button>
            </div>
          </li>
        ))}
      </ul>
      {rows.length > KOPIS_LIMIT && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          {rows.length}건 중 {KOPIS_LIMIT}건만 보여줘요. 위에서부터 처리하면 다음 공연이 올라와요.
        </p>
      )}
    </>
  );
}
