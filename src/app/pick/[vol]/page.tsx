import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PickIssueView from '@/components/pick/PickIssueView';
import { formatShort } from '@/lib/date';
import { getIssue, getPickIssues, getShows } from '@/lib/catalog';
import { formatVol } from '@/mocks/picks';

export async function generateStaticParams() {
  return (await getPickIssues()).map((issue) => ({ vol: String(issue.vol) }));
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

async function IssueDetail({ vol }: { vol: number }) {
  const issue = await getIssue(vol);
  if (!issue) notFound();

  const [prev, next, shows] = await Promise.all([getIssue(vol - 1), getIssue(vol + 1), getShows()]);

  return (
    <main className="pt-8 pb-14">
      <PickIssueView issue={issue} label={`${formatShort(issue.publishedAt)} 발행 · 고른 공연`} shows={shows} />

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
