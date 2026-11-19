// 어드민 접근 확인. 페이지는 requireAdmin(), 서버 액션은 assertAdmin() 을 맨 앞에서 부른다.
import 'server-only';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/user';

/** 로그인 안 했으면 로그인 화면으로, 관리자가 아니면 404 (어드민이 있다는 것도 숨긴다). */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!user.isAdmin) notFound();
  return user;
}

export async function assertAdmin() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) throw new Error('관리자만 할 수 있어요');
  return user;
}
