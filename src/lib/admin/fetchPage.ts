// 제보의 참고 링크를 서버에서 열어 본문 글자만 뽑는다. 서버에서만 쓴다.
// 아무 주소나 열면 서버 내부망을 들여다보는 데 쓰일 수 있어(SSRF) 공개 인터넷 주소만 연다.
import 'server-only';
import dns from 'node:dns/promises';
import net from 'node:net';

const TIMEOUT_MS = 8000;
const MAX_BYTES = 1024 * 1024;
const MAX_TEXT = 15000;
const MAX_REDIRECTS = 3;

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      a >= 224 ||
      (a === 100 && b >= 64 && b < 128) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b < 32) ||
      (a === 192 && b === 168)
    );
  }
  const v6 = ip.toLowerCase();
  if (v6.startsWith('::ffff:')) return isPrivateIp(v6.slice(7));
  return (
    v6 === '::' ||
    v6 === '::1' ||
    v6.startsWith('fc') ||
    v6.startsWith('fd') ||
    v6.startsWith('fe8') ||
    v6.startsWith('fe9') ||
    v6.startsWith('fea') ||
    v6.startsWith('feb')
  );
}

async function assertPublic(url: URL) {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('http(s) 주소만 열 수 있어요');
  if (url.port && url.port !== '80' && url.port !== '443') throw new Error('기본 포트가 아닌 주소는 열지 않아요');
  const host = url.hostname.replace(/^\[|\]$/g, ''); // IPv6 는 [::1] 처럼 대괄호로 온다
  const addresses = net.isIP(host) ? [{ address: host }] : await dns.lookup(host, { all: true });
  if (addresses.length === 0 || addresses.some(({ address }) => isPrivateIp(address))) throw new Error('공개 인터넷 주소가 아니에요');
}

const decode = (text: string) =>
  text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));

function htmlToText(html: string) {
  const meta = (name: string) =>
    html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i'))?.[1] ??
    html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:name|property)=["']${name}["']`, 'i'))?.[1];
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const body = html
    .replace(/<(script|style|noscript|svg|template)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>|<\/(p|div|li|tr|h\d)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');
  const head = [
    title && `제목: ${title}`,
    meta('og:title') && `og:title: ${meta('og:title')}`,
    (meta('og:description') ?? meta('description')) && `설명: ${meta('og:description') ?? meta('description')}`,
  ]
    .filter(Boolean)
    .join('\n');
  return decode(`${head}\n\n${body}`)
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim()
    .slice(0, MAX_TEXT);
}

/** 성공하면 페이지 글자, 실패하면 이유 */
export async function fetchPageText(link: string): Promise<{ text?: string; error?: string }> {
  try {
    let url = new URL(link);
    for (let hop = 0; ; hop++) {
      await assertPublic(url);
      const response = await fetch(url, {
        redirect: 'manual',
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; febble-admin/1.0)', Accept: 'text/html,text/plain;q=0.9' },
        cache: 'no-store',
      });
      if (response.status >= 300 && response.status < 400 && response.headers.get('location')) {
        if (hop >= MAX_REDIRECTS) return { error: '리디렉션이 너무 많아요' };
        url = new URL(response.headers.get('location')!, url);
        continue;
      }
      if (!response.ok) return { error: `페이지를 열지 못했어요 (${response.status})` };
      const type = response.headers.get('content-type') ?? '';
      if (!/text\/html|text\/plain|application\/xhtml/.test(type)) return { error: '웹 페이지가 아니에요' };

      // 1MB 까지만 읽는다.
      const reader = response.body!.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      while (size < MAX_BYTES) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        size += value.length;
      }
      await reader.cancel().catch(() => {});
      const html = new TextDecoder().decode(Buffer.concat(chunks));
      const text = type.includes('html') ? htmlToText(html) : html.slice(0, MAX_TEXT);
      return text.length < 40 ? { error: '페이지에 읽을 글자가 거의 없어요 (로그인이 필요한 페이지일 수 있어요)' } : { text };
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') return { error: '페이지가 너무 늦게 응답해요' };
    return { error: error instanceof Error ? error.message : '페이지를 열지 못했어요' };
  }
}
