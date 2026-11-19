import Link from 'next/link';
import { notFound } from 'next/navigation';
import ShowForm from '@/components/admin/ShowForm';
import { PageHeader } from '@/components/admin/ui';
import { requireAdmin } from '@/lib/admin/guard';
import { getShowForEdit, listArtistOptions } from '@/lib/admin/queries';

export default async function EditShowPage({ params }: PageProps<'/admin/shows/[id]'>) {
  await requireAdmin();
  const { id } = await params;
  const [show, artists] = await Promise.all([getShowForEdit(id), listArtistOptions()]);
  if (!show) notFound();

  return (
    <>
      <PageHeader title={show.title} />
      {show.isPublished && (
        <Link href={`/shows/${show.id}`} className="mt-2 inline-block text-xs underline underline-offset-2">
          사이트에서 보기
        </Link>
      )}
      {/* key: 저장 후 같은 주소로 돌아오면 새 값으로 폼을 다시 채운다 */}
      <ShowForm key={JSON.stringify(show)} show={show} artists={artists} />
    </>
  );
}
