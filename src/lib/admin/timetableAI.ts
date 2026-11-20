'use server';

// 페스티벌 타임테이블 이미지를 Claude 가 읽어 스테이지·무대 초안을 만든다. 이미지는 저장하지 않고 읽기만 한다.
// 폼에 추가만 하고, 저장은 사람이 확인한 뒤 한다.
import sharp from 'sharp';
import { z } from 'zod';
import { readImage } from '@/lib/admin/ai';
import { assertAdmin } from '@/lib/admin/guard';
import { listArtistOptions } from '@/lib/admin/queries';
import { DATE_RE, TIME_RE } from '@/lib/admin/validate';

const TimetableSchema = z.object({
  stages: z.array(z.object({ name: z.string() })).describe('이미지에 나온 스테이지, 왼쪽(또는 위)부터'),
  slots: z
    .array(
      z.object({
        stage: z.string().describe('stages 의 name 중 하나'),
        artistName: z.string().describe('이미지에 적힌 아티스트 이름 그대로'),
        artistId: z.string().nullable().describe('아티스트 목록에 같은 사람이 있으면 그 id, 없으면 null'),
        date: z.string().nullable().describe('YYYY-MM-DD (페스티벌 날짜 중 하나)'),
        start: z.string().describe('HH:mm 24시간'),
        end: z.string().nullable().describe('HH:mm 24시간. 이미지에 끝 시각이 없으면 null'),
      }),
    )
    .describe('무대(공연) 하나당 한 줄'),
  notes: z.array(z.string()).describe('확인이 필요한 점. 한국어로 짧게'),
});

export type TimetableDraft = {
  stages: string[];
  slots: { stage: string; artistName: string; artistId: string | null; date: string; start: string; end: string }[];
  notes: string[];
  /** 형식이 맞지 않아 버린 무대 수 */
  dropped: number;
};

const SYSTEM = `너는 한국 인디 공연·페스티벌 큐레이션 서비스 febble 의 편집 도우미야.
페스티벌 타임테이블 이미지에서 스테이지와 무대(아티스트별 공연 시간)를 읽어 정해진 형식으로 돌려줘.

규칙:
- 이미지에 실제로 적힌 것만 쓴다. 읽기 어려운 칸은 지어내지 말고 빼고 notes 에 적는다.
- 공연이 아닌 칸(개장, 입장, 사인회, 휴식, 불꽃놀이 등)은 넣지 않는다.
- 날짜는 아래 페스티벌 날짜 중 하나로 맞춘다. "DAY 1", "토요일", "10.1" 같은 표기를 날짜로 바꾼다.
- 시각은 24시간제 HH:mm. 자정을 넘겨 끝나면 끝 시각을 그대로 적는다 (예: 23:30 시작, 00:40 끝). 자정 이후에 시작하는 무대도 그 무대가 속한 페스티벌 날짜를 쓴다.
- 끝 시각이 없으면 end 는 null.
- 아티스트는 아래 목록과 같은 사람(한글/영문 표기 차이 포함)이면 그 id 를 쓰고, 없으면 artistId 를 null 로 둔다.`;

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function festivalDates(start: string, end: string) {
  const dates: string[] = [];
  for (let d = new Date(`${start}T00:00:00Z`); d <= new Date(`${end}T00:00:00Z`) && dates.length < 14; d.setUTCDate(d.getUTCDate() + 1)) {
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

export async function readTimetable(formData: FormData): Promise<{ draft?: TimetableDraft; error?: string }> {
  await assertAdmin();
  const file = formData.get('file');
  const startDate = String(formData.get('startDate'));
  const endDate = String(formData.get('endDate'));
  const lineup = String(formData.get('lineup') ?? '')
    .split(',')
    .filter(Boolean);
  if (!(file instanceof File) || !file.type.startsWith('image/')) return { error: '타임테이블 이미지를 골라주세요' };
  if (!DATE_RE.test(startDate) || !DATE_RE.test(endDate) || startDate > endDate) return { error: '공연 시작일·종료일을 먼저 정해주세요' };

  let image: Buffer;
  try {
    // 작은 글씨가 많아 포스터보다 덜 줄인다.
    image = await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate()
      .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 90 })
      .toBuffer();
  } catch {
    return { error: '이미지를 읽지 못했어요. 다른 파일로 시도해주세요.' };
  }

  const dates = festivalDates(startDate, endDate);
  const artists = await listArtistOptions();
  const inLineup = new Set(lineup);
  const result = await readImage({
    label: '타임테이블',
    schema: TimetableSchema,
    system: SYSTEM,
    image,
    mediaType: 'image/webp',
    text: [
      `페스티벌 날짜: ${dates.map((d, i) => `DAY ${i + 1} = ${d}(${WEEKDAYS[new Date(`${d}T00:00:00Z`).getUTCDay()]})`).join(', ')}`,
      `아티스트 목록 (id: 이름, * 는 이 페스티벌 라인업):\n${artists.map((a) => `${a.id}: ${a.name}${inLineup.has(a.id) ? ' *' : ''}`).join('\n')}`,
      '이 타임테이블의 스테이지와 무대를 읽어줘.',
    ].join('\n\n'),
  });
  if (!result.data) return { error: result.error };

  // 형식이 어긋난 무대는 버린다. 없는 아티스트 id 는 연결하지 않는다.
  const ids = new Set(artists.map((a) => a.id));
  const dateSet = new Set(dates);
  const stages = [...new Set(result.data.stages.map((s) => s.name.trim()).filter(Boolean))];
  const slots = result.data.slots.flatMap((slot) => {
    const stage = slot.stage.trim();
    const date = slot.date && dateSet.has(slot.date) ? slot.date : dates.length === 1 ? dates[0] : null;
    if (!stage || !date || !TIME_RE.test(slot.start)) return [];
    if (!stages.includes(stage)) stages.push(stage);
    return [
      {
        stage,
        artistName: slot.artistName.trim(),
        artistId: slot.artistId && ids.has(slot.artistId) ? slot.artistId : null,
        date,
        start: slot.start,
        end: slot.end && TIME_RE.test(slot.end) ? slot.end : '',
      },
    ];
  });
  return { draft: { stages, slots, notes: result.data.notes, dropped: result.data.slots.length - slots.length } };
}
