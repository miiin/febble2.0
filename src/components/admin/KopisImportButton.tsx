'use client';

import { useTransition } from 'react';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/shadcn/button';
import { importFromKopis } from '@/lib/admin/kopisActions';

export default function KopisImportButton() {
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await importFromKopis();
          if (result.error) return void toast.error(result.error);
          toast.success(
            result.added ? `새 공연 ${result.added}건을 가져왔어요 (KOPIS ${result.total}건 중)` : `새 공연이 없어요 (KOPIS ${result.total}건 확인)`,
          );
        })
      }
    >
      <Download /> {isPending ? '가져오는 중…' : 'KOPIS에서 가져오기'}
    </Button>
  );
}
