import ArtistForm from '@/components/admin/ArtistForm';
import { PageHeader } from '@/components/admin/ui';
import { requireAdmin } from '@/lib/admin/guard';
import { listGenres } from '@/lib/admin/queries';

export default async function NewArtistPage() {
  await requireAdmin();
  return (
    <>
      <PageHeader title="New artist" />
      <ArtistForm knownGenres={await listGenres()} />
    </>
  );
}
