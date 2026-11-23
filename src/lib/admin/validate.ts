// 어드민 폼 입력 정리·검사. 서버 액션에서만 쓴다.

/** 주소에 쓰는 id: 소문자·숫자·하이픈 */
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_RE = /^\d{2}:\d{2}$/;

/** 입력한 id 정리: 대문자는 소문자로, 띄어쓰기는 하이픈으로 ('Silica Gel' → 'silica-gel') */
export const normalizeSlug = (value: string) => value.trim().toLowerCase().replace(/\s+/g, '-');

export class InputError extends Error {}

export function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

/** 빈 문자열이면 null */
export function optional(value: string) {
  return value === '' ? null : value;
}

export function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new InputError(message);
}

/** 실패면 error, 성공이면 저장한 항목의 id. 화면 이동과 알림은 클라이언트가 한다. */
export type ActionResult = { error?: string; id?: string };

/** InputError 는 화면에 보여줄 메시지로, 나머지는 다시 던진다 (redirect 포함). */
export function toResult(error: unknown): ActionResult {
  if (error instanceof InputError) return { error: error.message };
  throw error;
}

/** Postgres 오류 코드 (unique 23505, FK 23503) */
export function pgCode(error: unknown) {
  const cause = (error as { cause?: { code?: string } })?.cause;
  return cause?.code ?? (error as { code?: string })?.code;
}

/** 다른 데이터가 참조하고 있어서 지울 수 없는 경우. ON DELETE RESTRICT 는 23001, NO ACTION 은 23503. */
export function isReferenced(error: unknown) {
  const code = pgCode(error);
  return code === '23001' || code === '23503';
}
