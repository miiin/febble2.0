@AGENTS.md

# febble 2.0

- 현재 **모바일 전용**. 반응형 브레이크포인트(`sm:` `md:` …)를 쓰지 않는다. 폭 제한은 `src/app/layout.tsx` 컨테이너(`max-w-mobile`) 하나뿐이다.
- 데이터는 아직 DB 연결 없이 `src/mocks/` 의 mock 을 쓴다.
- 폰트 역할 (`src/app/globals.css` 의 `@theme`):
  - `font-sans` IBM Plex Sans KR — 본문 기본
  - `font-display` Geist — 큰 영문 제목
  - `font-serif` Instrument Serif Italic — Pick / For you / New / Fest
  - `font-logo` Inter Tight Bold — 헤더 로고
  - `font-plex` IBM Plex Sans Italic — PICK, Vol.12 같은 작은 이탤릭
- 아이콘은 `public/images/icon/` 의 SVG 를 `next/image` 로 쓴다. 검정 배경 위에서는 `invert` 로 흰색 처리한다.
- 이미지는 `public/images/` 에 두고 mock 의 `image` 필드에 경로를 넣는다. 없으면 `Thumb` 이 회색 플레이스홀더를 그린다.
