import Link from 'next/link';
import { notFound } from 'next/navigation';
import PickForm from '@/components/admin/PickForm';
import { PageHeader } from '@/components/admin/ui';
import { requireAdmin } from '@/lib/admin/guard';
import { getPickIssueForEdit, listShowOptions } from '@/lib/admin/queries';
import { formatVol } from '@/mocks/picks';

export default async function EditPickPage({ params }: PageProps<'/admin/picks/[vol]'>) {
  await requireAdmin();
  const vol = Number((await params).vol);
  const [issue, shows] = await Promise.all([Number.isInteger(vol) ? getPickIssueForEdit(vol) : undefined, listShowOptions()]);
  if (!issue) notFound();

  // 메인을 맨 앞에 둔다 (폼은 첫 번째를 메인으로 저장한다).
  const items = [...issue.items].sort((a, b) => Number(b.isMain) - Number(a.isMain)).map(({ showId, description }) => ({ showId, description }));

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={formatVol(issue.vol)} />
      {issue.isPublished && (
        <Link href={`/pick/${issue.vol}`} className="mt-2 inline-block text-xs underline underline-offset-2">
          사이트에서 보기
        </Link>
      )}
      <PickForm
        key={JSON.stringify(issue)}
        issue={{ vol: issue.vol, publishedAt: issue.publishedAt, curator: issue.curator, isPublished: issue.isPublished, items }}
        nextVol={issue.vol}
        shows={shows}
      />
    </div>
  );
}
