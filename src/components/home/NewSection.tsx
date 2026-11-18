import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import SectionTitle from '@/components/ui/SectionTitle';
import Thumb from '@/components/ui/Thumb';
import { newShows } from '@/mocks/home';

export default function NewSection() {
  return (
    <section className="mt-10 px-4">
      <SectionTitle title="New" sub="새로 올라온 공연" />
      <ul className="mt-3 border-t-2 border-black">
        {newShows.map((show) => (
          <li key={show.id} className="relative border-b border-black">
            <Link href={`/shows/${show.id}`} className="flex items-center gap-3 py-3 pl-2">
              <span className="w-16 shrink-0 text-xs">{show.date}</span>
              <Thumb src={show.image} alt={show.title} className="size-14" />
              <div>
                <p className="font-medium">{show.title}</p>
                <p className="text-xs">{show.venue}</p>
              </div>
            </Link>
            {show.badge && (
              <div className="absolute top-3 right-0">
                <Badge type={show.badge.type}>{show.badge.label}</Badge>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
