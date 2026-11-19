import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import FollowButton from '@/components/artist/FollowButton';
import SpotifyEmbed from '@/components/artist/SpotifyEmbed';
import ShowRow from '@/components/show/ShowRow';
import SectionTitle from '@/components/ui/SectionTitle';
import Thumb from '@/components/ui/Thumb';
import { getArtist, getArtists, getShowsByArtist } from '@/lib/catalog';
import { sortByDate } from '@/mocks/shows';

export async function generateStaticParams() {
  return (await getArtists()).map((artist) => ({ id: artist.id }));
}

export default function ArtistPage({ params }: PageProps<'/artists/[id]'>) {
  // cacheComponents: params 는 Suspense 안에서 await 한다.
  return (
    <Suspense>
      {params.then(({ id }) => (
        <ArtistDetail id={id} />
      ))}
    </Suspense>
  );
}

async function ArtistDetail({ id }: { id: string }) {
  const artist = await getArtist(id);
  if (!artist) notFound();

  const upcoming = sortByDate(await getShowsByArtist(artist.id));

  return (
    <main className="pb-14">
      <div className="px-4 pt-6">
        <Thumb src={artist.image} alt={artist.name} className="aspect-square w-full" />
        <div className="mt-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-[28px] leading-tight tracking-[-0.02em]">{artist.name}</h1>
            <p className="mt-1 font-plex text-xs italic">{artist.genres.join(' · ')}</p>
          </div>
          <FollowButton artistId={artist.id} />
        </div>
        <p className="mt-3 text-sm leading-relaxed tracking-[-0.04em]">{artist.bio}</p>
      </div>

      <section className="mt-10 px-4">
        <SectionTitle title="Listen" sub="미리듣기" />
        <div className="mt-3">
          <SpotifyEmbed artistName={artist.name} spotifyArtistId={artist.spotifyArtistId} />
        </div>
      </section>

      <section className="mt-10 px-4">
        <SectionTitle title="Shows" sub="예정된 공연" />
        {upcoming.length > 0 ? (
          <ul className="mt-3 border-t-2 border-black">
            {upcoming.map((show) => (
              <ShowRow key={show.id} show={show} />
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm">예정된 공연이 없어요.</p>
        )}
      </section>
    </main>
  );
}
