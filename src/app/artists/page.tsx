import Link from 'next/link';
import SectionTitle from '@/components/ui/SectionTitle';
import Thumb from '@/components/ui/Thumb';
import { artists } from '@/mocks/artists';

export default function ArtistsPage() {
  const sorted = [...artists].sort((a, b) => a.name.localeCompare(b.name, 'ko'));

  return (
    <main className="px-4 pt-8 pb-14">
      <SectionTitle title="Artists" sub="아티스트" />
      <ul className="mt-6 grid grid-cols-3 gap-x-3 gap-y-6">
        {sorted.map((artist) => (
          <li key={artist.id}>
            <Link href={`/artists/${artist.id}`} className="flex flex-col items-center gap-2">
              <Thumb src={artist.image} alt={artist.name} className="aspect-square w-full rounded-full" />
              <span className="w-full truncate text-center text-sm tracking-[-0.04em]">{artist.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
