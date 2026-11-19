// 홈 For you(로그인) mock 데이터. 팔로우 기능을 DB 에 붙이면 지운다. 나머지 섹션은 lib/catalog 에서 만든다.
// image 가 없으면 회색 플레이스홀더로 그린다. 피그마에서 받은 이미지는 public/images 에 두고 경로를 넣는다.
// 각 항목의 id 는 mocks/shows.ts 의 공연 id 와 같다 (/shows/[id] 로 연결).

export type Badge = 'new' | 'open-soon' | 'pick';

export type Show = {
  id: string;
  title: string;
  description?: string;
  date: string;
  venue: string;
  image?: string;
  isToday?: boolean;
};

export type FollowedArtistNews = {
  id: string;
  name: string;
  date: string;
  venue: string;
  image?: string;
  badge?: { type: Badge; label: string };
};

export const followedArtistNews: FollowedArtistNews[] = [
  { id: 'bongje-solo', name: '봉제인간', date: '23 DEC', venue: '롤링홀', badge: { type: 'new', label: '새공연' } },
  { id: 'silica-gel-live', name: '실리카겔', date: '28 DEC — 29 DEC', venue: '예스24 라이브홀', badge: { type: 'open-soon', label: '오픈 D-1' } },
  { id: 'hanroro-solo', name: '한로로', date: '5 DEC — 6 DEC', venue: '무신사 개러지' },
];

export const recommendation: { basedOn: string; shows: Show[] } = {
  basedOn: '봉제인간',
  shows: [
    { id: 'joo-hyerin-live', title: '주혜린', date: '17 DEC — 20 DEC', venue: '롤링홀' },
    { id: 'vulfpeck-seoul', title: 'Vulfpeck', date: '20 JAN', venue: '올림픽홀' },
  ],
};
