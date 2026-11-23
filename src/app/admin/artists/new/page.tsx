import ArtistForm from '@/components/admin/ArtistForm';
import { PageHeader } from '@/components/admin/ui';
import { requireAdmin } from '@/lib/admin/guard';
import { listArtistOptions, listGenres } from '@/lib/admin/queries';

export default async function NewArtistPage() {
  await requireAdmin();
  const [genres, artists] = await Promise.all([listGenres(), listArtistOptions()]);
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="New artist" />
      <ArtistForm knownGenres={genres} takenIds={artists.map((artist) => artist.id)} />
    </div>
  );
}
