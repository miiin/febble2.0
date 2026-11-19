import DocPage from '@/components/ui/DocPage';

// TODO: 법률 검토를 거친 실제 개인정보처리방침으로 교체.
// 개인정보 보호법상 반드시 들어가야 하는 항목 순서로 틀만 잡아둔 초안이다.
const SECTIONS = [
  {
    heading: '수집하는 개인정보 항목',
    body: '카카오 로그인: 회원 식별값, 닉네임, 프로필 사진 (이메일은 동의한 경우)\nGoogle 로그인: 회원 식별값, 이름, 이메일, 프로필 사진\n서비스 이용 기록: 찜한 공연, 팔로우한 아티스트, 내 타임테이블, 알림 신청 (작성 예정)',
  },
  { heading: '수집·이용 목적', body: '회원 식별, 찜·팔로우·타임테이블 저장, 티켓 오픈·공연 소식 알림 (작성 예정)' },
  { heading: '보유 및 이용 기간', body: '회원 탈퇴 시 지체 없이 파기 (관계 법령에 따른 보관 예외는 작성 예정)' },
  { heading: '제3자 제공', body: '(작성 예정)' },
  { heading: '처리 위탁', body: '호스팅·분석 도구 등 위탁 업체 (작성 예정)' },
  { heading: '파기 절차 및 방법', body: '(작성 예정)' },
  { heading: '이용자의 권리와 행사 방법', body: '열람·정정·삭제·처리정지 요구, 회원 탈퇴 (작성 예정)' },
  { heading: '안전성 확보 조치', body: '(작성 예정)' },
  { heading: '개인정보 보호책임자', body: '이름 · 연락처 (작성 예정)' },
  { heading: '방침의 변경', body: '(작성 예정)' },
];

export default function PrivacyPage() {
  return <DocPage title="Privacy" sub="개인정보처리방침" note="초안 · 법률 검토 후 확정 예정" sections={SECTIONS} />;
}
