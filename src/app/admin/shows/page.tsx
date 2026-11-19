import ShowsTable from '@/components/admin/ShowsTable';
import { PageHeader } from '@/components/admin/ui';
import { requireAdmin } from '@/lib/admin/guard';
import { listShows } from '@/lib/admin/queries';

export default async function AdminShowsPage() {
  await requireAdmin();
  return (
    <>
      <PageHeader title="Shows" action={{ href: '/admin/shows/new', label: '공연 추가' }} />
      <ShowsTable shows={await listShows()} />
    </>
  );
}
