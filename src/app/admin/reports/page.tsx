import Link from 'next/link';
import ReportStatusSelect from '@/components/admin/ReportStatusSelect';
import { Button } from '@/components/shadcn/button';
import { PageHeader } from '@/components/admin/ui';
import { requireAdmin } from '@/lib/admin/guard';
import { listReports } from '@/lib/admin/queries';

const dateTime = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });

export default async function AdminReportsPage() {
  await requireAdmin();
  const reports = await listReports();

  return (
    <>
      <PageHeader title="Reports" />
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
