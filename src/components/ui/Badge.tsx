import type { Badge as BadgeType } from '@/mocks/home';

const STYLE: Record<BadgeType, string> = {
  new: 'bg-black text-white',
  'open-soon': 'border border-black bg-brand-yellow text-black',
  pick: 'bg-black font-plex italic text-white',
};

type Props = {
  type: BadgeType;
  children: React.ReactNode;
};

export default function Badge({ type, children }: Props) {
  return (
    <span className={`inline-flex h-5 items-center rounded-[50%] px-2.5 text-[11px] leading-none tracking-[-0.02em] ${STYLE[type]}`}>{children}</span>
  );
}
