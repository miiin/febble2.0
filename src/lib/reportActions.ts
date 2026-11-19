'use server';

// 공연 제보 저장 (로그인 없이도 받는다). 어드민 /admin/reports 에서 처리한다.
import { auth } from '@/auth';
import { db } from '@/db';
import { reports } from '@/db/schema';

const field = (formData: FormData, key: string, max: number) => {
  const value = String(formData.get(key) ?? '').trim().slice(0, max);
  return value === '' ? null : value;
};

export async function submitReport(formData: FormData): Promise<{ error?: string }> {
  const title = field(formData, 'title', 200);
  if (!title) return { error: '공연 이름을 적어주세요' };

  const userId = (await auth())?.user?.id ?? null;
  await db.insert(reports).values({
    userId,
    title,
    artist: field(formData, 'artists', 300),
    date: field(formData, 'date', 100),
    venue: field(formData, 'venue', 200),
    link: field(formData, 'link', 500),
    message: field(formData, 'message', 2000),
  });
  return {};
}
