// 매일 KOPIS 공연을 가져와 제보 목록에 쌓는다 (vercel.json crons). Vercel 이 CRON_SECRET 을 붙여 부른다.
import { revalidatePath } from 'next/cache';
import { CAST_BATCH } from '@/lib/admin/kopisCast';
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
    revalidatePath('/admin/reports');
    return Response.json(result);
  } catch (error) {
    console.error('KOPIS cron', error);
    return Response.json({ error: error instanceof Error ? error.message : 'failed' }, { status: 500 });
  }
}
