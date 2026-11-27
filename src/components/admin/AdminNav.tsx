'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSelectedLayoutSegment } from 'next/navigation';
import { cn } from '@/lib/utils';

const NAV = [
  { segment: null, href: '/admin', label: '대시보드' },
  { segment: 'shows', href: '/admin/shows', label: '공연' },
  { segment: 'artists', href: '/admin/artists', label: '아티스트' },
  { segment: 'picks', href: '/admin/picks', label: 'Pick' },
  { segment: 'reports', href: '/admin/reports', label: '제보' },
];

// 지금 보는 메뉴를 진하게 표시한다. 주소는 요청 때 정해지므로 Suspense 안에서 읽고, 그 전에는 표시 없이 그린다.
export default function AdminNav() {
  return (
    <Suspense fallback={<NavLinks segment={undefined} />}>
      <ActiveNav />
    </Suspense>
  );
}

function ActiveNav() {
  return <NavLinks segment={useSelectedLayoutSegment()} />;
}

function NavLinks({ segment }: { segment: string | null | undefined }) {
  return (
    <nav className="flex gap-1 text-sm">
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'rounded-md px-3 py-1.5 transition-colors hover:bg-accent',
            segment === item.segment ? 'bg-accent font-medium' : 'text-muted-foreground',
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
