import Link from 'next/link';
import { PageHeader } from '@/components/admin/ui';
import { Button } from '@/components/shadcn/button';
import { cn } from '@/lib/utils';
import { requireAdmin } from '@/lib/admin/guard';
import { getDashboardCounts } from '@/lib/admin/queries';

export default async function AdminHomePage() {
  const user = await requireAdmin();
  const counts = await getDashboardCounts();

  const cards = [
    { href: '/admin/shows', label: '공연', value: counts.shows, sub: counts.unpublished ? `비공개 ${counts.unpublished}` : undefined },
    { href: '/admin/artists', label: '아티스트', value: counts.artists },
    { href: '/admin/picks', label: 'Pick 호', value: counts.issues },
    { href: '/admin/reports', label: '처리할 제보', value: counts.pending, highlight: counts.pending > 0 },
  ];

  return (
    <>
      <PageHeader title="Admin" />
      <p className="mt-3 text-sm text-muted-foreground">
        {user.name}님, 안녕하세요. 가입자 {counts.users}명.
      </p>
      <ul className="mt-6 grid grid-cols-4 gap-3">
        {cards.map((card) => (
          <li key={card.href}>
            <Link href={card.href} className={cn('block rounded-lg border bg-background p-4 transition-colors hover:border-foreground', card.highlight && 'border-foreground bg-brand-yellow')}>
              <span className="text-xs">{card.label}</span>
              <span className="mt-2 block font-display text-4xl">{card.value}</span>
              {card.sub && <span className="text-[11px] text-muted-foreground">{card.sub}</span>}
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-8 flex gap-2">
        <Button asChild variant="outline">
          <Link href="/admin/shows/new">+ 공연 추가</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/picks/new">+ 새 Pick 호</Link>
        </Button>
      </div>
    </>
  );
}
