import DocPage from '@/components/ui/DocPage';

// TODO: 법률 검토를 거친 실제 약관으로 교체. 지금은 들어갈 항목만 잡아둔 초안이다.
const SECTIONS = [
  { heading: '목적', body: 'febble 서비스 이용과 관련해 회사와 이용자의 권리·의무를 정합니다. (작성 예정)' },
  { heading: '회원 가입과 계정', body: '카카오·Google 계정으로 가입하며, 계정 정보 관리 책임에 대해 정합니다. (작성 예정)' },
  { heading: '서비스 내용', body: '공연·페스티벌 정보, 찜·팔로우, 내 타임테이블, 알림 기능을 제공합니다. (작성 예정)' },
  { heading: '외부 예매처 링크', body: '예매는 각 예매처에서 이뤄지며, febble 은 예매·결제·환불의 당사자가 아닙니다. (작성 예정)' },
  { heading: '공연 정보의 정확성', body: '공연 정보는 주최 측 발표를 기준으로 하며, 변경될 수 있습니다. (작성 예정)' },
  { heading: '회원 탈퇴와 이용 제한', body: '(작성 예정)' },
  { heading: '책임의 한계', body: '(작성 예정)' },
  { heading: '약관의 변경', body: '(작성 예정)' },
];

export default function TermsPage() {
  return <DocPage title="Terms" sub="이용약관" note="초안 · 법률 검토 후 확정 예정" sections={SECTIONS} />;
}
