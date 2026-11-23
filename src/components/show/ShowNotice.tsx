import IntroImages from '@/components/show/IntroImages';
import SectionTitle from '@/components/ui/SectionTitle';
import type { Show } from '@/mocks/shows';

// 공연 상세 아래 '공연 안내': 어드민이 직접 넣은 이미지(라인업 발표 등), 출연·회차·주최, 안내 문구.
// 공연 시간·관람 연령은 위 정보 표에 있어서 여기서는 빼고, 넣은 게 없으면 그리지 않는다.
export default function ShowNotice({ show }: { show: Show }) {
  const details = show.details ?? {};
  const rows = [
    { label: '출연', value: details.cast },
    { label: '회차', value: details.schedule },
    { label: '주최·기획', value: details.organizer },
  ].filter((row) => row.value);
  const images = details.images ?? [];
  if (rows.length === 0 && images.length === 0 && !details.story) return null;

  return (
    <section className="mt-10 px-4">
      <SectionTitle title="Info" sub="공연 안내" />
      {images.length > 0 && (
        <div className="mt-3">
          <IntroImages images={images} />
        </div>
      )}
      {rows.length > 0 && (
        <dl className="mt-4 border-t border-black text-sm">
          {rows.map((row) => (
            <div key={row.label} className="flex gap-4 border-b border-black py-2.5">
              <dt className="w-16 shrink-0 text-xs leading-5">{row.label}</dt>
              <dd className="tracking-[-0.04em]">{row.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {details.story && <p className="mt-4 text-sm leading-relaxed tracking-[-0.04em] whitespace-pre-line">{details.story}</p>}
    </section>
  );
}
