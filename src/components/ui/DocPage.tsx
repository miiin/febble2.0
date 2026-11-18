import SectionTitle from '@/components/ui/SectionTitle';

type Props = {
  title: string;
  sub: string;
  /** 시행일 등 위쪽 작은 안내 */
  note?: string;
  sections: { heading: string; body: string }[];
};

// 약관·개인정보처리방침처럼 제목과 조항이 이어지는 문서 페이지.
export default function DocPage({ title, sub, note, sections }: Props) {
  return (
    <main className="px-4 pt-8 pb-14">
      <SectionTitle title={title} sub={sub} />
      {note && <p className="mt-3 text-xs text-black/60">{note}</p>}
      <ol className="mt-6 border-t border-black">
        {sections.map((section, index) => (
          <li key={section.heading} className="border-b border-black py-5">
            <h2 className="flex gap-2 text-sm font-medium tracking-[-0.04em]">
              <span className="font-display">{String(index + 1).padStart(2, '0')}</span>
              {section.heading}
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed tracking-[-0.04em] whitespace-pre-line">{section.body}</p>
          </li>
        ))}
      </ol>
    </main>
  );
}
