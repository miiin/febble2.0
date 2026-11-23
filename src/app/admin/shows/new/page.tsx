import ShowForm from '@/components/admin/ShowForm';
import { PageHeader } from '@/components/admin/ui';
import { requireAdmin } from '@/lib/admin/guard';
import { getReport, listArtistOptions, listShowOptions } from '@/lib/admin/queries';

// ?report=<id> 로 오면 그 제보를 폼 위에 보여주고, 저장하면 제보를 '추가함'으로 바꾼다.
export default async function NewShowPage({ searchParams }: PageProps<'/admin/shows/new'>) {
  await requireAdmin();
  const reportId = Number((await searchParams).report);
  const [artists, shows, report] = await Promise.all([
    listArtistOptions(),
    listShowOptions(),
    Number.isInteger(reportId) && reportId > 0 ? getReport(reportId) : undefined,
  ]);

  return (
    <>
      <PageHeader title="New show" />
      <ShowForm
        artists={artists}
        takenIds={shows.map((item) => item.id)}
        report={
          report && {
            id: report.id,
            title: report.title,
            artist: report.artist,
            date: report.date,
            venue: report.venue,
            link: report.link,
            message: report.message,
            source: report.source,
            poster: report.poster,
          }
        }
      />
    </>
  );
}
