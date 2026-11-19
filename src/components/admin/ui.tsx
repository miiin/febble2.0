// 어드민 공통 UI. shadcn/ui 위에 febble 제목 톤(세리프 이탤릭)만 얹는다. PC 폭으로 쓴다.
import Link from 'next/link';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import { Label } from '@/components/shadcn/label';

/** 기본 <select> 를 shadcn Input 과 같은 모양으로 (짧은 고정 목록용. 긴 목록은 SearchSelect) */
export const selectClass =
  'h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50';

export function PageHeader({ title, action, children }: { title: string; action?: { href: string; label: string }; children?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4 border-b pb-3">
      <div>
        {/* Instrument Serif 에는 한글이 없어서, 공연 이름처럼 한글 제목은 본문 글꼴로 보여준다. */}
        <h1 className={/[ㄱ-ㅎ가-힣]/.test(title) ? 'text-2xl font-medium tracking-[-0.04em]' : 'font-serif text-[32px] leading-none'}>{title}</h1>
        {children}
      </div>
      {action && (
        <Button asChild>
          <Link href={action.href}>{action.label}</Link>
        </Button>
      )}
    </div>
  );
}

export function Field({ label, hint, htmlFor, children }: { label: string; hint?: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="grid content-start gap-1.5">
      <Label htmlFor={htmlFor} className="text-xs">
        {label}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 rounded-lg border bg-background p-5">
      <div>
        <h2 className="font-serif text-2xl leading-none">{title}</h2>
        {description && <p className="mt-1.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export function StatusPill({ on, onLabel = '공개', offLabel = '비공개' }: { on: boolean; onLabel?: string; offLabel?: string }) {
  return <Badge variant={on ? 'default' : 'outline'}>{on ? onLabel : offLabel}</Badge>;
}
