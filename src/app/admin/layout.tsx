import { Suspense } from 'react';
import Link from 'next/link';
import AdminNav from '@/components/admin/AdminNav';
import { Toaster } from '@/components/shadcn/sonner';

export const metadata = { title: 'Febble Admin', robots: { index: false } };

// 어드민 틀. 공개 화면(모바일 폭)과 달리 PC 폭으로 쓴다. .admin 은 shadcn 기본 테두리 색 범위 (globals.css).
export default function AdminLayout({ children }: LayoutProps<'/admin'>) {
  return (
    <div className="admin min-h-dvh bg-muted/40">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-8 px-6">
          <Link href="/admin" className="font-logo text-xl tracking-[-0.04em]">
            Febble <span className="font-plex text-xs font-normal italic">admin</span>
          </Link>
          <AdminNav />
          <Link href="/" className="ml-auto text-xs text-muted-foreground underline-offset-2 hover:underline">
            사이트로
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* 관리자 확인은 각 페이지(requireAdmin)와 서버 액션(assertAdmin)에서 한다. 틀은 미리 그려두고 내용만 요청 때 채운다. */}
        <Suspense fallback={<p className="text-sm text-muted-foreground">불러오는 중…</p>}>{children}</Suspense>
      </main>
      <Toaster position="bottom-center" />
    </div>
  );
}
