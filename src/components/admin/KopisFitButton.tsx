'use client';

import { useTransition } from 'react';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/shadcn/button';
import { judgeKopisPending } from '@/lib/admin/kopisActions';

/** 아직 판정하지 않은 처리 전 공연이 있을 때만 보인다. 한 번에 60개씩 판정한다. */
export default function KopisFitButton({ missing }: { missing: number }) {
  const [isPending, startTransition] = useTransition();
  if (missing === 0) return null;
  return (
    <Button
      variant="outline"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await judgeKopisPending();
          if (result.error) return void toast.error(result.error);
          toast.success(`${result.judged}개 공연을 판정했어요${result.remaining ? ` (남은 공연 ${result.remaining}개)` : ''}`);
        })
      }
    >
      <Sparkles /> {isPending ? '판정하는 중… (20~40초)' : `AI 판정 (${missing}개 남음)`}
    </Button>
  );
}
