import PickForm from '@/components/admin/PickForm';
import { PageHeader } from '@/components/admin/ui';
import { requireAdmin } from '@/lib/admin/guard';
import { listPickIssues, listShowOptions } from '@/lib/admin/queries';

export default async function NewPickPage() {
  await requireAdmin();
  const [issues, shows] = await Promise.all([listPickIssues(), listShowOptions()]);
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="New issue" />
      <PickForm nextVol={(issues[0]?.vol ?? 0) + 1} shows={shows} />
    </div>
  );
}
