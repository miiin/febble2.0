// 홈 화면 mock 데이터. DB 연결 전까지 사용한다.
// image 가 없으면 회색 플레이스홀더로 그린다. 피그마에서 받은 이미지는 public/images 에 두고 경로를 넣는다.

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

export type Pick = Show & {
  curator: string;
};

export type FollowedArtistNews = {
  id: string;
  name: string;
  date: string;
  venue: string;
  image?: string;
  badge?: { type: Badge; label: string };
};

export type NewShow = {
  id: string;
  date: string;
  title: string;
  venue: string;
  image?: string;
  badge?: { type: Badge; label: string };
};

export type Festival = {
  id: string;
  title: string;
  date: string;
  location: string;
  image?: string;
};

export const pickIssue: { vol: number; main: Pick; others: Show[] } = {
  vol: 12,
  main: {
    id: 'pick-1',
    title: 'wednesday',
    description: '슈게이즈 굉음 위로 컨츄리 기타가 긁고 지나간다. 눅눅한데 이상하게 건조한 밴드.\n이 공연장에 오는 사람들은 서로 알아볼 거다.',
    date: '17 DEC — 20 DEC',
    venue: '롤링홀',
    curator: 'ming',
  },
  others: [
    {
      id: 'pick-2',
      title: '이태훈 솔로 앨범 음감회',
      description: '신당동의 작은 스피커 스튜디오에서 새 앨범에 대해 곡마다 이야기합니다.',
      date: '23 DEC',
      venue: '롤링홀',
    },
    {
      id: 'pick-3',
      title: '이태훈 솔로 앨범 음감회',
      description: '신당동의 작은 스피커 스튜디오에서 새 앨범에 대해 곡마다 이야기합니다.',
      date: '23 DEC',
      venue: '롤링홀',
      isToday: true,
    },
    {
      id: 'pick-4',
      title: '이태훈 솔로 앨범 음감회',
      description: '신당동의 작은 스피커 스튜디오에서 새 앨범에 대해 곡마다 이야기합니다.',
      date: '23 DEC',
      venue: '롤링홀',
    },
  ],
};

export const followedArtistNews: FollowedArtistNews[] = [
  { id: 'fa-1', name: '봉제인간', date: '23 DEC', venue: '롤링홀', badge: { type: 'new', label: '새공연' } },
  { id: 'fa-2', name: '봉제인간', date: '23 DEC', venue: '롤링홀', badge: { type: 'open-soon', label: '오픈 D-3' } },
  { id: 'fa-3', name: '봉제인간', date: '23 DEC', venue: '롤링홀' },
];

export const recommendation: { basedOn: string; shows: Show[] } = {
  basedOn: '봉제인간',
  shows: [
    { id: 'rec-1', title: '주혜린', date: '17 DEC — 20 DEC', venue: '롤링홀' },
    { id: 'rec-2', title: 'vulfpeck', date: '17 DEC — 20 DEC', venue: '롤링홀' },
  ],
};

export const newShows: NewShow[] = [
  { id: 'new-1', date: '11.23(수)', title: 'SUMIN', venue: '롤링홀', badge: { type: 'pick', label: 'PICK' } },
  { id: 'new-2', date: '11.23(수)', title: 'SUMIN', venue: '롤링홀' },
  { id: 'new-3', date: '11.23(수)', title: 'SUMIN', venue: '롤링홀', badge: { type: 'open-soon', label: '오픈 D-3' } },
  { id: 'new-4', date: '11.23(수)', title: 'SUMIN', venue: '롤링홀' },
];

export const ticketOpens = ['D-1 공연 내일 20:00', 'D-3 공연 21:00'];

export const festivals: Festival[] = [
  { id: 'fest-1', title: 'Fujirock Festival 2026', date: '17 JUL — 20 JUL', location: '나에바 스키리조트, 일본' },
  { id: 'fest-2', title: '2026 부산 국제 락 페스티벌', date: '2 OCT — 4 OCT', location: '삼락생태공원, 부산' },
];

export const pastIssueRange = 'Vol.01 — Vol.11';
