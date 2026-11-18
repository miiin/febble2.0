// 로그인 연동 전 임시 값. true/false 를 바꿔 로그인/비로그인 화면을 확인한다.
export const isLoggedIn = true;

export type LoginProvider = 'kakao' | 'google';

export const PROVIDER_LABEL: Record<LoginProvider, string> = { kakao: '카카오', google: 'Google' };

// 로그인한 사용자 프로필. 카카오는 이메일을 못 받을 수 있어 email 은 선택값.
export const currentUser: { name: string; email?: string; image?: string; provider: LoginProvider; joinedAt: string } = {
  name: '페블러',
  provider: 'kakao',
  joinedAt: '2026-11-01',
};

// 로그인한 사용자가 팔로우 중인 아티스트 (mocks/artists.ts 의 id).
export const followedArtistIds = ['bongje', 'silica-gel', 'hanroro', 'joo-hyerin'];

// 찜한 공연 (mocks/shows.ts 의 id).
export const likedShowIds = ['wednesday-seoul', 'busan-rock-2027', 'hanroro-solo'];

// 페스티벌별로 내 타임테이블에 담은 무대 (timetable.slots 의 id).
export const pickedSlotIds: Record<string, string[]> = {
  'busan-rock-2027': ['s3', 's5', 's8'],
};
