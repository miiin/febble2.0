import Link from 'next/link';
import { PageHeader, StatusPill } from '@/components/admin/ui';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/shadcn/table';
import { requireAdmin } from '@/lib/admin/guard';
import { listPickIssues, listShowOptions } from '@/lib/admin/queries';
import { formatVol } from '@/mocks/picks';

export default async function AdminPicksPage() {
  await requireAdmin();
  const [issues, shows] = await Promise.all([listPickIssues(), listShowOptions()]);
  const title = (id: string | null) => shows.find((show) => show.id === id)?.title ?? '—';

  return (
    <>
      <PageHeader title="Pick" action={{ href: '/admin/picks/new', label: '새 호 만들기' }} />
      <div className="mt-4 rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">호</TableHead>
              <TableHead className="text-xs">메인 공연</TableHead>
              <TableHead className="text-xs">공연 수</TableHead>
              <TableHead className="text-xs">발행일</TableHead>
              <TableHead className="text-xs">큐레이터</TableHead>
              <TableHead className="text-xs">상태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {issues.map((issue) => (
              <TableRow key={issue.vol}>
                <TableCell>
                  <Link href={`/admin/picks/${issue.vol}`} className="font-plex italic underline-offset-2 hover:underline">
                    {formatVol(issue.vol)}
                  </Link>
                </TableCell>
                <TableCell>{title(issue.main)}</TableCell>
                <TableCell>{issue.items}</TableCell>
                <TableCell className="text-xs">{issue.publishedAt}</TableCell>
                <TableCell className="text-xs">{issue.curator}</TableCell>
                <TableCell>
                  <StatusPill on={issue.isPublished} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
