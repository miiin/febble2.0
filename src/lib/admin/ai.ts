// 어드민 AI 공통: Claude 로 이미지를 읽어 정해진 형식(zod)으로 받는다. 서버에서만 쓴다.
// ANTHROPIC_API_KEY 는 서버 환경 변수로만 둔다.
import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import type { z } from 'zod';

// 정확도가 부족하면 'claude-sonnet-5-5' → 'claude-opus-5-5' 순으로 올린다.
// Haiku 는 서버 측 fallbacks(거절 시 다른 모델로 재시도)를 지원하지 않아 거절되면 안내만 한다.
export const AI_MODEL = 'claude-haiku-5-5';

let client: Anthropic | undefined;

/** 'YYYY-MM-DD' (Asia/Seoul) */
export const todayInSeoul = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date());

type AskOptions<T extends z.ZodType> = {
  /** 로그·오류 문구에 쓰는 이름 (예: '포스터') */
  label: string;
  schema: T;
  system: string;
  content: Anthropic.ContentBlockParam[];
};

/** Claude 에게 묻고 정해진 형식(zod)으로 받는다. 실패는 화면에 보여줄 error 로 바꾼다. */
export async function askClaude<T extends z.ZodType>({
  label,
  schema,
  system,
  content,
}: AskOptions<T>): Promise<{ data?: z.infer<T>; error?: string }> {
  client ??= new Anthropic();
  try {
    const response = await client.messages.parse({
      model: AI_MODEL,
      max_tokens: 16000,
      system,
      messages: [{ role: 'user', content }],
      output_config: { format: zodOutputFormat(schema) },
    });

    console.info(`[ai:${label}]`, AI_MODEL, JSON.stringify(response.usage)); // 비용 확인용
    if (response.stop_reason === 'refusal') return { error: `이 ${label}는 읽을 수 없다고 해요. 직접 입력해주세요.` };
    if (response.stop_reason === 'max_tokens' || !response.parsed_output) return { error: `${label}를 끝까지 읽지 못했어요. 다시 시도해주세요.` };
    return { data: response.parsed_output as z.infer<T> };
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) return { error: 'ANTHROPIC_API_KEY 가 올바르지 않아요' };
    if (error instanceof Anthropic.RateLimitError) return { error: '요청이 많아요. 잠시 뒤 다시 시도해주세요.' };
    if (error instanceof Anthropic.APIError) return { error: `${label}를 읽지 못했어요 (${error.status})` };
    throw error;
  }
}

/** 이미지 한 장 + 안내문 */
export async function readImage<T extends z.ZodType>({
  image,
  mediaType,
  text,
  ...options
}: Omit<AskOptions<T>, 'content'> & { image: Buffer; mediaType: 'image/webp' | 'image/jpeg' | 'image/png'; text: string }) {
  return askClaude({
    ...options,
    content: [
      { type: 'image', source: { type: 'base64', media_type: mediaType, data: image.toString('base64') } },
      { type: 'text', text },
    ],
  });
}
