import Link from 'next/link';
import { notFound } from 'next/navigation';
import ArtistForm from '@/components/admin/ArtistForm';
import { PageHeader } from '@/components/admin/ui';
import { requireAdmin } from '@/lib/admin/guard';
import { getArtistRow, listGenres } from '@/lib/admin/queries';

export default async function EditArtistPage({ params }: PageProps<'/admin/artists/[id]'>) {
  await requireAdmin();
  const { id } = await params;
  const [artist, knownGenres] = await Promise.all([getArtistRow(id), listGenres()]);
  if (!artist) notFound();

  return (
    <>
      <PageHeader title={artist.name} />
      <Link href={`/artists/${artist.id}`} className="mt-2 inline-block text-xs underline underline-offset-2">
        사이트에서 보기
      </Link>
      <ArtistForm artist={artist} knownGenres={knownGenres} />
    </>
  );
}
