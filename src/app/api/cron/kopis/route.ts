// 매일 KOPIS 공연을 가져와 제보 목록에 쌓고 AI 로 판정한다 (vercel.json crons). Vercel 이 CRON_SECRET 을 붙여 부른다.
import { revalidatePath } from 'next/cache';
import { CAST_BATCH } from '@/lib/admin/kopisCast';
import { judgeKopisFit } from '@/lib/admin/kopisFit';
import { runKopisImport } from '@/lib/admin/kopisImport';

export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  try {
    // 출연진은 시간 안에 끝나도록 한 번에 CAST_BATCH 개만 받는다.
    const result = await runKopisImport(CAST_BATCH);
    // 판정은 실패해도 가져온 결과는 남긴다. 못 한 공연은 다음 크론이나 어드민 버튼으로 판정한다.
    const judged = await judgeKopisFit().catch((error) => {
      console.error('KOPIS fit cron', error);
      return 0;
    });
    revalidatePath('/admin/reports');
    return Response.json({ ...result, judged });
  } catch (error) {
    console.error('KOPIS cron', error);
    return Response.json({ error: error instanceof Error ? error.message : 'failed' }, { status: 500 });
  }
}
