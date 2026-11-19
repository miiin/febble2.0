// 아티스트 mock. 백엔드는 이 구조에 맞춰 설계한다.

export type Artist = {
  id: string;
  name: string;
  image?: string;
  genres: string[];
  bio: string;
  followerCount: number;
  /** 에디터 추천. 비로그인 For you 배너에서 일정 있는 아티스트가 6명이 안 되면 이 아티스트로 채운다. */
  isEditorPick?: boolean;
  /** Spotify 아티스트 ID. 있으면 상세에서 미리듣기 임베드를 띄운다. */
  spotifyArtistId?: string;
};

export const artists: Artist[] = [
  {
    id: 'wednesday',
    name: 'Wednesday',
    genres: ['인디 록', '슈게이즈'],
    bio: '노스캐롤라이나 애슈빌 출신 밴드. 슈게이즈 굉음 위로 컨트리 기타가 긁고 지나간다.',
    followerCount: 3200,
  },
  { id: 'bongje', name: '봉제인간', genres: ['인디 록'], bio: '서울에서 활동하는 4인조 록 밴드.', followerCount: 5400 },
  { id: 'sumin', name: 'SUMIN', genres: ['R&B', '일렉트로닉'], bio: '싱어송라이터이자 프로듀서.', followerCount: 8900 },
  { id: 'lee-taehoon', name: '이태훈', genres: ['포크'], bio: '첫 솔로 앨범을 준비 중인 싱어송라이터.', followerCount: 1200, isEditorPick: true },
  { id: 'joo-hyerin', name: '주혜린', genres: ['포크', '인디 팝'], bio: '담담한 목소리로 일상을 노래한다.', followerCount: 2100 },
  { id: 'vulfpeck', name: 'Vulfpeck', genres: ['펑크', '그루브'], bio: '미시간 출신의 미니멀 펑크 밴드.', followerCount: 7600, isEditorPick: true },
  { id: 'silica-gel', name: '실리카겔', genres: ['사이키델릭 록'], bio: '사운드와 영상을 함께 다루는 밴드.', followerCount: 12000 },
  { id: 'hanroro', name: '한로로', genres: ['인디 록', '포크'], bio: '청춘의 장면을 노래하는 싱어송라이터.', followerCount: 9800 },
];
