// 나만의 타임테이블을 휴대폰 잠금화면 배경으로 쓸 수 있게 캔버스에 그린다.
// 화면 캡처가 아니라 처음부터 기기 해상도에 맞춰 그리므로 어느 기기에서도 선명하다.

export type WallpaperRow = { start: string; end: string; artist: string; stage: string };

type Options = {
  title: string;
  dateLabel: string; // '10.1(금)'
  rows: WallpaperRow[];
  fontFamily: string;
};

const YELLOW = '#f3f724';

// 잠금화면에서 가려지는 영역: 위쪽 시계·위젯, 아래쪽 손전등·카메라 버튼.
const TOP_SAFE = 0.3;
const BOTTOM_SAFE = 0.86;

/**
 * 저장할 이미지 크기(px). 모바일은 실제 화면 해상도(CSS px × devicePixelRatio)를 그대로 쓰고,
 * 데스크톱처럼 기준이 없으면 흔한 휴대폰 해상도(1179×2556, iPhone 15/16 Pro)로 만든다.
 */
export function getWallpaperSize() {
  const isPhone = window.matchMedia('(pointer: coarse)').matches;
  if (!isPhone) return { width: 1179, height: 2556 };

  const dpr = window.devicePixelRatio || 1;
  const short = Math.min(window.screen.width, window.screen.height);
  const long = Math.max(window.screen.width, window.screen.height);
  return { width: Math.round(short * dpr), height: Math.round(long * dpr) };
}

export function drawWallpaper(canvas: HTMLCanvasElement, { title, dateLabel, rows, fontFamily }: Options) {
  const { width: W, height: H } = canvas;
  const ctx = canvas.getContext('2d')!;
  const u = W / 100; // 가로 기준 단위. 해상도가 달라도 같은 비율로 그려진다.
  const font = (weight: number, size: number, italic = false) => `${italic ? 'italic ' : ''}${weight} ${size}px ${fontFamily}`;

  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#000';

  const left = 8 * u;
  const right = W - 8 * u;
  let y = H * TOP_SAFE;

  // 날짜 + 페스티벌 이름 (넘치면 글자 크기를 줄인다)
  ctx.font = font(400, 3.6 * u);
  ctx.fillText(dateLabel, left, y);
  y += 7 * u;

  let titleSize = 7 * u;
  ctx.font = font(500, titleSize);
  while (ctx.measureText(title).width > right - left && titleSize > 4 * u) {
    titleSize -= 0.2 * u;
    ctx.font = font(500, titleSize);
  }
  ctx.fillText(title, left, y);
  y += 7 * u;

  ctx.lineWidth = 0.3 * u;
  ctx.beginPath();
  ctx.moveTo(left, y);
  ctx.lineTo(right, y);
  ctx.stroke();
  y += 4 * u;

  // 담은 무대 목록. 칸이 많으면 아래 안전 영역을 넘지 않게 행 높이를 줄인다.
  const gap = 2 * u;
  const available = H * BOTTOM_SAFE - y;
  const rowHeight = Math.min(13 * u, (available - gap * (rows.length - 1)) / rows.length);
  const scale = rowHeight / (13 * u);

  for (const row of rows) {
    ctx.fillStyle = YELLOW;
    ctx.fillRect(left, y, right - left, rowHeight);
    ctx.strokeRect(left, y, right - left, rowHeight);

    const mid = y + rowHeight / 2;
    ctx.fillStyle = '#000';
    ctx.font = font(400, 3.4 * u * scale);
    ctx.fillText(`${row.start} – ${row.end}`, left + 3 * u, mid);

    ctx.font = font(500, 4.8 * u * scale);
    ctx.fillText(row.artist, left + 27 * u, mid);

    ctx.font = font(400, 3.2 * u * scale, true);
    ctx.textAlign = 'right';
    ctx.fillText(row.stage, right - 3 * u, mid);
    ctx.textAlign = 'left';

    y += rowHeight + gap;
  }

  ctx.font = font(400, 2.8 * u);
  ctx.textAlign = 'center';
  ctx.fillText('febble', W / 2, H * 0.9);
  ctx.textAlign = 'left';
}

/** 모바일은 공유 시트(→ 이미지 저장), 지원하지 않으면 파일 다운로드. */
export async function saveCanvas(canvas: HTMLCanvasElement, fileName: string) {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('이미지를 만들지 못했어요');

  const file = new File([blob], fileName, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return;
    } catch (error) {
      if ((error as Error).name === 'AbortError') return; // 사용자가 공유 시트를 닫음
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
