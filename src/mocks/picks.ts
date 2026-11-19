// Febble Pick 호(issue) mock. 공연 정보는 showId 로 mocks/shows.ts 를 참조하고,
// 에디터 코멘트(description)만 호마다 따로 가진다. 백엔드는 이 구조에 맞춰 설계한다.

export type PickItem = {
  showId: string;
  description: string;
};

export type PickIssue = {
  vol: number;
  publishedAt: string; // 'YYYY-MM-DD'
  curator: string;
  main: PickItem;
  others: PickItem[];
};

const LATEST: PickIssue = {
  vol: 12,
  publishedAt: '2026-11-16',
  curator: 'ming',
  main: {
    showId: 'wednesday-seoul',
    description: '슈게이즈 굉음 위로 컨츄리 기타가 긁고 지나간다. 눅눅한데 이상하게 건조한 밴드.\n이 공연장에 오는 사람들은 서로 알아볼 거다.',
  },
  others: [
    { showId: 'lee-taehoon-listening', description: '신당동의 작은 스피커 스튜디오에서 새 앨범에 대해 곡마다 이야기합니다.' },
    { showId: 'bongje-solo', description: '올해 마지막 단독공연. 새 EP 수록곡을 처음으로 라이브로 들려줍니다.' },
    { showId: 'hanroro-solo', description: '이틀 동안 셋리스트를 다르게 꾸린 단독공연.' },
  ],
};

// 지난 호(Vol.01–11)는 화면 확인용으로 기존 공연을 돌려 쓰며 만든다. 2주 간격 발행.
const SHOW_IDS = ['sumin-live', 'silica-gel-live', 'joo-hyerin-live', 'vulfpeck-seoul', 'busan-rock-2027', 'fujirock-2027', 'hanroro-solo', 'bongje-solo'];
const CURATORS = ['ming', 'jay', 'ming', 'hoon'];

const PAST: PickIssue[] = Array.from({ length: 11 }, (_, i) => {
  const vol = i + 1;
  const date = new Date(2026, 10, 16 - (12 - vol) * 14);
  const pick = (offset: number) => ({
    showId: SHOW_IDS[(vol + offset) % SHOW_IDS.length],
    description: '에디터가 이번 호에 고른 공연. 왜 이 공연인지 짧게 적어둡니다.',
  });

  return {
    vol,
    publishedAt: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
    curator: CURATORS[vol % CURATORS.length],
    main: pick(0),
    others: [pick(1), pick(2), pick(3)],
  };
});

/** 최신 호가 앞에 오도록 정렬 */
export const pickIssues: PickIssue[] = [LATEST, ...PAST.reverse()];

/** 'Vol.01' */
export function formatVol(vol: number) {
  return `Vol.${String(vol).padStart(2, '0')}`;
}
