import GenreCleanup from '@/components/admin/GenreCleanup';
import { PageHeader, Section } from '@/components/admin/ui';
import { Badge } from '@/components/shadcn/badge';
import { requireAdmin } from '@/lib/admin/guard';
import { listArtists } from '@/lib/admin/queries';

export default async function AdminGenresPage() {
  await requireAdmin();
  const rows = await listArtists();
  const byGenre = new Map<string, string[]>();
  for (const row of rows) for (const genre of row.genres) byGenre.set(genre, [...(byGenre.get(genre) ?? []), row.name]);
  const genres = [...byGenre].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Genres" />
      <div className="mt-6 grid gap-6">
        <Section title="Rules" description="추천은 장르 글자가 같은 아티스트끼리 묶어요. 같은 장르는 같은 글자로 적어주세요.">
          <ul className="list-disc pl-4 text-xs leading-relaxed">
            <li>한글, 외래어 표기법: 록(락 ✗), 팝, 포크, 슈게이즈</li>
            <li>단어 사이 띄어쓰기: 인디 록, 사이키델릭 록</li>
            <li>굳어진 약어는 영문: R&amp;B, EDM, K-pop</li>
            <li>punk 는 펑크 록, funk 는 훵크</li>
            <li>그루브·몽환적 같은 분위기 말은 장르로 쓰지 않아요</li>
            <li>아티스트당 1~3개</li>
          </ul>
        </Section>
        <Section title="In use" description={`장르 ${genres.length}개 · 아티스트 ${rows.length}명`}>
          <ul className="grid gap-2 text-sm">
            {genres.map(([genre, names]) => (
              <li key={genre} className="flex items-baseline gap-2">
                <Badge variant="secondary">{genre}</Badge>
                <span className="text-xs text-muted-foreground">
                  {names.length} · {names.join(', ')}
                </span>
              </li>
            ))}
          </ul>
        </Section>
        <Section title="Cleanup">
          <GenreCleanup />
        </Section>
      </div>
    </div>
  );
}
