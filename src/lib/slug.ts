// 이름·제목으로 주소용 id(영문 소문자·숫자·하이픈)를 만든다. 어드민 id 자동 채우기에 쓴다.
// 한글은 국어의 로마자 표기법 글자 대응만 따른다 (발음 변화는 반영하지 않는다: 한로로 → hanroro).

const INITIALS = ['g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h'];
const MEDIALS = ['a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i'];
// prettier-ignore
const FINALS = ['', 'k', 'k', 'k', 'n', 'n', 'n', 't', 'l', 'k', 'm', 'l', 'l', 'l', 'p', 'l', 'm', 'p', 'p', 't', 't', 'ng', 't', 't', 'k', 't', 'p', 't'];

function romanize(text: string) {
  return text.replace(/[가-힣]/g, (char) => {
    const code = char.charCodeAt(0) - 0xac00;
    return INITIALS[Math.floor(code / 588)] + MEDIALS[Math.floor((code % 588) / 28)] + FINALS[code % 28];
  });
}

/** 'Silica Gel' → 'silica-gel', '한로로' → 'hanroro'. maxLength 를 넘으면 단어 경계에서 자른다. */
export function toSlug(text: string, maxLength = 40) {
  const slug = romanize(text.normalize('NFC'))
    .toLowerCase()
    .replace(/(\S)\s*&\s*(?=\S)/g, '$1 and ') // 'A & B' → 'a and b' (끝에 남는 & 는 버린다)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (slug.length <= maxLength) return slug;
  const cut = slug.slice(0, maxLength + 1);
  return cut.includes('-') ? cut.slice(0, cut.lastIndexOf('-')) : slug.slice(0, maxLength);
}

// 영문 표기가 같이 있으면 영문만 쓴다 ('The Black Skirts (검정치마)' → 'the-black-skirts').
function preferLatin(text: string) {
  const plain = text.normalize('NFKD').replace(/[̀-ͯ]/g, '').normalize('NFC'); // é → e
  const latin = plain.replace(/[^\x20-\x7e]/g, ' ');
  return toSlug((latin.match(/[a-z]/gi)?.length ?? 0) >= 4 ? latin : plain);
}

export const artistSlug = (name: string) => preferLatin(name);

/** 제목(영문 표기 우선) + 연도. '스키니브라운 단독 콘서트 Skinny Brown Concert' → 'skinny-brown-concert-2026' */
export function showSlug(title: string, startDate: string) {
  const base = preferLatin(title);
  const year = startDate.slice(0, 4);
  return base && /^\d{4}$/.test(year) && !base.includes(year) ? `${base}-${year}` : base;
}

/** 이미 있는 id 와 겹치면 -2, -3 … 을 붙인다. */
export function uniqueSlug(base: string, taken: Set<string>) {
  if (!base) return '';
  let slug = base;
  for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
  return slug;
}
