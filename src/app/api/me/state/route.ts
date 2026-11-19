import { auth } from '@/auth';
import { getFollowedArtistIds, getLikedShowIds } from '@/lib/user';

// 클라이언트 하트·팔로우 버튼의 첫 상태. 로그인 안 했으면 빈 목록.
export async function GET() {
  const userId = (await auth())?.user?.id;
  const [likedShowIds, followedArtistIds] = userId ? await Promise.all([getLikedShowIds(userId), getFollowedArtistIds(userId)]) : [[], []];
  return Response.json({ likedShowIds, followedArtistIds }, { headers: { 'Cache-Control': 'private, no-store' } });
}
