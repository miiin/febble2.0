import ShowForm from '@/components/admin/ShowForm';
import { PageHeader } from '@/components/admin/ui';
import { requireAdmin } from '@/lib/admin/guard';
import { listArtistOptions } from '@/lib/admin/queries';

export default async function NewShowPage() {
  await requireAdmin();
  return (
    <>
      <PageHeader title="New show" />
      <ShowForm artists={await listArtistOptions()} />
    </>
  );
}
