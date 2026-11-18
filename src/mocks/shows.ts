// 공연·페스티벌 mock. 단독 공연과 페스티벌을 같은 Show 로 다루고, 페스티벌만 timetable 을 가진다.
// 백엔드는 이 구조에 맞춰 설계한다.

/** 로그인·서버 연동 전 기준 날짜. 실제 연동 시 서버의 오늘 날짜로 바꾼다. */
export const MOCK_TODAY = '2026-11-18';

export type ShowCategory = 'indie' | 'overseas' | 'festival';

export const CATEGORY_LABEL: Record<ShowCategory, string> = {
  indie: '국내 인디',
  overseas: '내한',
  festival: '페스티벌',
};

export type Stage = { id: string; name: string };

export type TimetableSlot = {
  id: string;
  stageId: string;
  artistId: string;
  date: string; // 'YYYY-MM-DD'
  start: string; // 'HH:mm'
  end: string;
};

export type Show = {
  id: string;
  category: ShowCategory;
  title: string;
  artistIds: string[];
  startDate: string; // 'YYYY-MM-DD'
  endDate: string;
  venue: string;
  image?: string;
  description?: string;
  price?: string;
  ticketUrl?: string;
  ticketOpenAt?: string; // 'YYYY-MM-DD HH:mm'
  /** 페스티벌 시간표. 없으면 라인업만 보여준다. */
  timetable?: { stages: Stage[]; slots: TimetableSlot[] };
};

export const shows: Show[] = [
  {
    id: 'wednesday-seoul',
    category: 'overseas',
    title: 'Wednesday Live in Seoul',
    artistIds: ['wednesday'],
    startDate: '2026-12-17',
    endDate: '2026-12-20',
    venue: '롤링홀',
    description: '슈게이즈 굉음 위로 컨츄리 기타가 긁고 지나간다. 눅눅한데 이상하게 건조한 밴드.\n이 공연장에 오는 사람들은 서로 알아볼 거다.',
    price: '77,000원',
    ticketUrl: '#',
    ticketOpenAt: '2026-11-21 20:00',
  },
  {
    id: 'lee-taehoon-listening',
    category: 'indie',
    title: '이태훈 솔로 앨범 음감회',
    artistIds: ['lee-taehoon'],
    startDate: '2026-12-23',
    endDate: '2026-12-23',
    venue: '신당 스피커 스튜디오',
    description: '신당동의 작은 스피커 스튜디오에서 새 앨범에 대해 곡마다 이야기합니다.',
    price: '25,000원',
    ticketUrl: '#',
  },
  {
    id: 'bongje-solo',
    category: 'indie',
    title: '봉제인간 단독공연',
    artistIds: ['bongje'],
    startDate: '2026-12-23',
    endDate: '2026-12-23',
    venue: '롤링홀',
    price: '44,000원',
    ticketUrl: '#',
    ticketOpenAt: '2026-11-21 20:00',
  },
  {
    id: 'hanroro-solo',
    category: 'indie',
    title: '한로로 단독공연',
    artistIds: ['hanroro'],
    startDate: '2026-12-05',
    endDate: '2026-12-06',
    venue: '무신사 개러지',
    price: '55,000원',
    ticketUrl: '#',
  },
  {
    id: 'sumin-live',
    category: 'indie',
    title: 'SUMIN',
    artistIds: ['sumin'],
    startDate: '2026-11-25',
    endDate: '2026-11-25',
    venue: '롤링홀',
    price: '50,000원',
    ticketUrl: '#',
  },
  {
    id: 'silica-gel-live',
    category: 'indie',
    title: '실리카겔 연말공연',
    artistIds: ['silica-gel'],
    startDate: '2026-12-28',
    endDate: '2026-12-29',
    venue: '예스24 라이브홀',
    price: '66,000원',
    ticketUrl: '#',
    ticketOpenAt: '2026-11-19 20:00',
  },
  {
    id: 'joo-hyerin-live',
    category: 'indie',
    title: '주혜린',
    artistIds: ['joo-hyerin'],
    startDate: '2026-12-17',
    endDate: '2026-12-20',
    venue: '롤링홀',
    price: '33,000원',
    ticketUrl: '#',
    ticketOpenAt: '2026-11-24 20:00',
  },
  {
    id: 'vulfpeck-seoul',
    category: 'overseas',
    title: 'Vulfpeck Live in Seoul',
    artistIds: ['vulfpeck'],
    startDate: '2027-01-20',
    endDate: '2027-01-20',
    venue: '올림픽홀',
    price: '121,000원',
    ticketUrl: '#',
    ticketOpenAt: '2026-11-27 12:00',
  },
  {
    id: 'fujirock-2027',
    category: 'festival',
    title: 'Fujirock Festival 2027',
    artistIds: ['vulfpeck', 'wednesday', 'silica-gel'],
    startDate: '2027-07-23',
    endDate: '2027-07-25',
    venue: '나에바 스키리조트, 일본',
    description: '1차 라인업이 공개됐어요. 시간표는 공개되는 대로 업데이트합니다.',
    ticketUrl: '#',
  },
  {
    id: 'busan-rock-2027',
    category: 'festival',
    title: '2027 부산 국제 락 페스티벌',
    artistIds: ['silica-gel', 'hanroro', 'bongje', 'sumin', 'joo-hyerin', 'lee-taehoon'],
    startDate: '2027-10-01',
    endDate: '2027-10-02',
    venue: '삼락생태공원, 부산',
    price: '1일권 99,000원 / 2일권 165,000원',
    ticketUrl: '#',
    ticketOpenAt: '2026-12-10 14:00',
    timetable: {
      stages: [
        { id: 'main', name: 'MAIN' },
        { id: 'green', name: 'GREEN' },
      ],
      slots: [
        { id: 's1', stageId: 'main', artistId: 'joo-hyerin', date: '2027-10-01', start: '15:00', end: '15:50' },
        { id: 's2', stageId: 'green', artistId: 'lee-taehoon', date: '2027-10-01', start: '15:30', end: '16:20' },
        { id: 's3', stageId: 'main', artistId: 'hanroro', date: '2027-10-01', start: '17:00', end: '18:00' },
        { id: 's4', stageId: 'green', artistId: 'sumin', date: '2027-10-01', start: '17:30', end: '18:30' },
        { id: 's5', stageId: 'main', artistId: 'silica-gel', date: '2027-10-01', start: '19:30', end: '21:00' },
        { id: 's6', stageId: 'main', artistId: 'sumin', date: '2027-10-02', start: '16:00', end: '17:00' },
        { id: 's7', stageId: 'green', artistId: 'joo-hyerin', date: '2027-10-02', start: '16:30', end: '17:20' },
        { id: 's8', stageId: 'main', artistId: 'bongje', date: '2027-10-02', start: '19:00', end: '20:30' },
      ],
    },
  },
];

export function getShow(id: string) {
  return shows.find((show) => show.id === id);
}

export function getShowsByArtist(artistId: string) {
  return shows.filter((show) => show.artistIds.includes(artistId));
}

export function sortByDate(list: Show[]) {
  return [...list].sort((a, b) => a.startDate.localeCompare(b.startDate));
}
