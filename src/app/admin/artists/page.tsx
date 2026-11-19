import ArtistsTable from '@/components/admin/ArtistsTable';
import { PageHeader } from '@/components/admin/ui';
import { requireAdmin } from '@/lib/admin/guard';
import { listArtists } from '@/lib/admin/queries';

export default async function AdminArtistsPage() {
  await requireAdmin();
  return (
    <>
      <PageHeader title="Artists" action={{ href: '/admin/artists/new', label: '아티스트 추가' }} />
      <ArtistsTable artists={await listArtists()} />
    </>
  );
}
