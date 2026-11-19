import Image from 'next/image';
import Link from 'next/link';
import PickIssueView from '@/components/pick/PickIssueView';
import { getCatalog } from '@/lib/catalog';
import { formatVol } from '@/mocks/picks';

export default async function PickSection() {
  const { pickIssues, shows } = await getCatalog();
  const [issue, ...past] = pickIssues;
  if (!issue) return null;

  return (
    <section className="pt-8">
      <PickIssueView issue={issue} label="이번 호에 고른 공연" shows={shows} />

      {past.length > 0 && (
        <Link href="/pick" className="flex items-center justify-between px-4 py-3 text-xs">
          지난 호 보기 {formatVol(past.at(-1)!.vol)} — {formatVol(past[0].vol)}
          <Image src="/images/icon/arrow.svg" alt="" width={14} height={9} />
        </Link>
      )}
    </section>
  );
}
