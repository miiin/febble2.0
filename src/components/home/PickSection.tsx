import Image from 'next/image';
import Link from 'next/link';
import PickIssueView from '@/components/pick/PickIssueView';
import { formatVol, getLatestIssue, pickIssues } from '@/mocks/picks';

export default function PickSection() {
  const issue = getLatestIssue();
  const past = pickIssues.slice(1);

  return (
    <section className="pt-8">
      <PickIssueView issue={issue} label="이번 호에 고른 공연" />

      {past.length > 0 && (
        <Link href="/pick" className="flex items-center justify-between px-4 py-3 text-xs">
          지난 호 보기 {formatVol(past.at(-1)!.vol)} — {formatVol(past[0].vol)}
          <Image src="/images/icon/arrow.svg" alt="" width={14} height={9} />
        </Link>
      )}
    </section>
  );
}
