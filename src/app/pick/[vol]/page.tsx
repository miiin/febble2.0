import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PickIssueView from '@/components/pick/PickIssueView';
import { formatShort } from '@/lib/date';
import { formatVol, getIssue, pickIssues } from '@/mocks/picks';

export function generateStaticParams() {
  return pickIssues.map((issue) => ({ vol: String(issue.vol) }));
}

export default function PickIssuePage({ params }: PageProps<'/pick/[vol]'>) {
  // cacheComponents: params 는 Suspense 안에서 await 한다.
  return (
    <Suspense>
      {params.then(({ vol }) => (
        <IssueDetail vol={Number(vol)} />
      ))}
    </Suspense>
  );
}

function IssueDetail({ vol }: { vol: number }) {
  const issue = getIssue(vol);
  if (!issue) notFound();

  const prev = getIssue(vol - 1);
  const next = getIssue(vol + 1);

  return (
    <main className="pt-8 pb-14">
      <PickIssueView issue={issue} label={`${formatShort(issue.publishedAt)} 발행 · 고른 공연`} />

      <nav className="flex items-center justify-between px-4 py-4 text-xs">
        {prev ? (
          <Link href={`/pick/${prev.vol}`} className="flex items-center gap-2">
            <Image src="/images/icon/arrow.svg" alt="" width={14} height={9} className="rotate-180" />
            {formatVol(prev.vol)}
          </Link>
        ) : (
          <span />
        )}
        <Link href="/pick" className="underline underline-offset-2">
          전체 호
        </Link>
        {next ? (
          <Link href={`/pick/${next.vol}`} className="flex items-center gap-2">
            {formatVol(next.vol)}
            <Image src="/images/icon/arrow.svg" alt="" width={14} height={9} />
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </main>
  );
}
