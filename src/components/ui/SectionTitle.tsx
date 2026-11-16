type Props = {
  title: string;
  sub?: string;
};

// "For you", "New", "Fest" 처럼 세리프 이탤릭 제목 + 작은 설명.
export default function SectionTitle({ title, sub }: Props) {
  return (
    <h2 className="flex items-baseline gap-1.5">
      <span className="font-serif text-[32px] leading-none">{title}</span>
      {sub && <span className="text-sm tracking-[-0.04em]">{sub}</span>}
    </h2>
  );
}
