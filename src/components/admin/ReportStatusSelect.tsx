'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { selectClass } from '@/components/admin/ui';
import { setReportStatus } from '@/lib/admin/reportActions';
import { cn } from '@/lib/utils';

const LABEL = { pending: '대기', added: '추가함', rejected: '반려' } as const;

export default function ReportStatusSelect({ id, status }: { id: number; status: keyof typeof LABEL }) {
  const [isPending, startTransition] = useTransition();
  return (
    <select
      value={status}
      disabled={isPending}
      onChange={(e) => {
        const next = e.target.value as keyof typeof LABEL;
        startTransition(async () => {
          await setReportStatus(id, next);
          toast.success(`‘${LABEL[next]}’(으)로 바꿨어요`);
        });
      }}
      className={cn(selectClass, 'h-8 w-28 text-xs', status === 'pending' && 'border-foreground bg-brand-yellow')}
    >
      {Object.entries(LABEL).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}
