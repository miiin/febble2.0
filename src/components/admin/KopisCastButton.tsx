'use client';

import { useTransition } from 'react';
import { Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/shadcn/button';
import { fillKopisCast } from '@/lib/admin/kopisActions';

/** 출연진을 아직 받지 않은 처리 전 공연이 있을 때만 보인다. 한 번에 50개씩 받는다. */
export default function KopisCastButton({ missing }: { missing: number }) {
  const [isPending, startTransition] = useTransition();
  if (missing === 0) return null;
  return (
    <Button
      variant="outline"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await fillKopisCast();
          if (result.error) return void toast.error(result.error);
          toast.success(`${result.filled}개 공연의 출연진을 받았어요${result.remaining ? ` (남은 공연 ${result.remaining}개)` : ''}`);
        })
      }
    >
      <Users /> {isPending ? '받는 중… (10~20초)' : `출연진 채우기 (${missing}개 남음)`}
    </Button>
  );
}
