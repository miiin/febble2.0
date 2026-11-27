import Link from 'next/link';
import KopisCastButton from '@/components/admin/KopisCastButton';
import KopisFitButton from '@/components/admin/KopisFitButton';
import KopisImportButton from '@/components/admin/KopisImportButton';
import KopisList from '@/components/admin/KopisList';
import ReportStatusSelect from '@/components/admin/ReportStatusSelect';
import { Button } from '@/components/shadcn/button';
import { PageHeader } from '@/components/admin/ui';
import { requireAdmin } from '@/lib/admin/guard';
import { countKopisReports, getRelevanceHints, listKopisReports, listReports } from '@/lib/admin/queries';
import { cn } from '@/lib/utils';

const dateTime = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const KOPIS_LIMIT = 200;
const KOPIS_STATUS = [
  ['pending', '처리 전'],
  ['added', '추가함'],
  ['rejected', '반려'],
] as const;
type KopisStatus = (typeof KOPIS_STATUS)[number][0];
// AI 판정으로 처리 전 목록을 거른다.
const FIT_FILTER = [
  ['all', '전체'],
  ['fit', '대상'],
  ['unsure', '애매'],
  ['unfit', '대상 아님'],
  ['none', '판정 전'],
] as const;
type FitFilter = (typeof FIT_FILTER)[number][0];
const FIT_ORDER = { fit: 0, unsure: 1, none: 1, unfit: 2 } as const;

export default async function AdminReportsPage({ searchParams }: PageProps<'/admin/reports'>) {
  await requireAdmin();
  const params = await searchParams;
  const tab = params.tab === 'user' ? 'user' : 'kopis';
  const status = KOPIS_STATUS.find(([key]) => key === params.status)?.[0] ?? 'pending';
  const fit = FIT_FILTER.find(([key]) => key === params.fit)?.[0] ?? 'all';

  return (
    <>
      <PageHeader title="Reports" />
      <nav className="mt-4 flex gap-1 text-sm">
        {(
          [
            ['kopis', 'KOPIS', '/admin/reports'],
            ['user', '사용자 제보', '/admin/reports?tab=user'],
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
      {tab === 'user' ? <UserReports /> : <KopisReports status={status} fit={fit} />}
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

async function KopisReports({ status, fit }: { status: KopisStatus; fit: FitFilter }) {
  const [reports, counts, hints] = await Promise.all([listKopisReports(status), countKopisReports(), getRelevanceHints()]);
  const artists = hints.artists.filter((name) => normalize(name).length >= 2);
  // febble 공연장은 "공연장, 도시" 로 적으므로 앞부분만 본다.
  const venues = [...new Set(hints.venues.map((venue) => venue.split(',')[0].trim()).filter((venue) => normalize(venue).length >= 2))];

  // 등록된 아티스트 이름이 공연 이름·출연진에 있거나, febble 에 올린 적 있는 공연장이면 '관련'.
  const rows = reports
    .map((report) => ({
      report,
      artistMatches: artists.filter((name) => normalize(`${report.title} ${report.cast ?? ''}`).includes(normalize(name))),
      venueMatches: venues.filter((venue) => normalize(report.venue ?? '').includes(normalize(venue))),
    }))
    // 아티스트가 겹치는 공연이 맨 위, 그다음 AI 판정(대상 → 애매·판정 전 → 대상 아님), 그 안에서 공연장이 겹치는 공연 → 나머지.
    // 같은 순위 안에서는 날짜순 (안정 정렬).
    .map((row) => ({
      ...row,
      rank: row.artistMatches.length > 0 ? 2 : row.venueMatches.length > 0 ? 1 : 0,
      fit: row.report.fit ?? ('none' as const),
    }))
    .sort((a, b) => Number(b.rank === 2) - Number(a.rank === 2) || FIT_ORDER[a.fit] - FIT_ORDER[b.fit] || b.rank - a.rank);
  const related = rows.filter((row) => row.rank > 0).length;
  const fitCounts = Object.fromEntries(FIT_FILTER.map(([key]) => [key, key === 'all' ? rows.length : rows.filter((row) => row.fit === key).length]));
  const shown = fit === 'all' ? rows : rows.filter((row) => row.fit === fit);

  return (
    <>
      <div className="mt-3 flex items-end justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          KOPIS(공연예술통합전산망)에 등록된 앞으로 60일의 대중음악 공연이에요. {KOPIS_STATUS.find(([key]) => key === status)![1]} {reports.length}건
          중 관련 {related}건.
          <br />
          등록된 아티스트가 나오는 공연, AI 가 대상으로 본 공연, febble 에 올린 적 있는 공연장의 공연 순으로 위에 보여줘요. 여러 개를 골라 공연으로
          추가(출연진으로 라인업·새 아티스트까지)하거나 반려할 수 있어요.
        </p>
        <div className="flex shrink-0 gap-2">
          {status === 'pending' && <KopisFitButton missing={fitCounts.none} />}
          {status === 'pending' && <KopisCastButton missing={reports.filter((report) => report.cast === null).length} />}
          <KopisImportButton />
        </div>
      </div>
      <nav className="mt-4 flex gap-1 text-xs">
        {KOPIS_STATUS.map(([key, label]) => (
          <Link
            key={key}
            href={key === 'pending' ? '/admin/reports' : `/admin/reports?status=${key}`}
            className={cn(
              'rounded-full border px-3 py-1',
              status === key ? 'border-foreground bg-foreground text-background' : 'text-muted-foreground hover:bg-accent',
            )}
          >
            {label} {counts[key] ?? 0}
          </Link>
        ))}
      </nav>
      {status === 'pending' && reports.length > 0 && (
        <nav className="mt-2 flex gap-1 text-xs">
          {FIT_FILTER.map(([key, label]) => (
            <Link
              key={key}
              href={key === 'all' ? '/admin/reports' : `/admin/reports?fit=${key}`}
              className={cn('rounded-md px-2.5 py-1', fit === key ? 'bg-accent font-medium' : 'text-muted-foreground hover:bg-accent')}
            >
              AI {label} {fitCounts[key]}
            </Link>
          ))}
        </nav>
      )}
      {reports.length === 0 &&
        (status === 'pending' ? (
          <p className="mt-10 text-center text-sm">처리할 공연이 없어요. KOPIS에서 가져와 주세요.</p>
        ) : (
          <p className="mt-10 text-center text-sm">아직 없어요.</p>
        ))}
      <KopisList
        rows={shown.slice(0, KOPIS_LIMIT).map(({ report, artistMatches, venueMatches }) => ({
          id: report.id,
          externalId: report.externalId,
          title: report.title,
          date: report.date,
          venue: report.venue,
          cast: report.cast,
          poster: report.poster,
          status: report.status,
          artistMatches,
          venueMatches,
          fit: report.fit,
          fitReason: report.fitReason,
        }))}
      />
      {shown.length > KOPIS_LIMIT && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          {shown.length}건 중 {KOPIS_LIMIT}건만 보여줘요. 위에서부터 처리하면 다음 공연이 올라와요.
        </p>
      )}
    </>
  );
}
