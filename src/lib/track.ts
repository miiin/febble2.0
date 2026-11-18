// 예매처로 나가는 클릭 기록. 광고 제안 때 "febble 이 예매처에 보낸 트래픽" 근거가 된다.
// TODO: 분석 도구(GA 등) 연동 시 여기서 이벤트를 보낸다.
export function trackTicketOutbound(params: { showId: string; vendor: string; source: 'show-detail' | 'pick' }) {
  if (process.env.NODE_ENV === 'development') {
    console.info('[track] ticket_outbound', params);
  }
}
