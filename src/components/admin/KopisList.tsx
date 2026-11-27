'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import ReportStatusSelect from '@/components/admin/ReportStatusSelect';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import { Checkbox } from '@/components/shadcn/checkbox';
import KopisAddDialog from '@/components/admin/KopisAddDialog';
import { addKopisShows, type KopisAddPreview, previewKopisAdd, rejectKopisReports } from '@/lib/admin/kopisBulkActions';

const MAX_ADD = 20; // kopisBulkActions 와 맞춘다

export type KopisRow = {
  id: number;
  /** KOPIS 공연 ID (PF…) */
  externalId: string | null;
  title: string;
  date: string | null;
  venue: string | null;
  /** null: 아직 받지 않음, '': KOPIS 에 없음 */
  cast: string | null;
  poster: string | null;
  status: 'pending' | 'added' | 'rejected';
  artistMatches: string[];
  venueMatches: string[];
  /** AI 판정. null 이면 아직 판정하지 않음 */
  fit: 'fit' | 'unsure' | 'unfit' | null;
  fitReason: string | null;
};

const FIT_LABEL = { fit: '대상', unsure: '애매', unfit: '대상 아님' } as const;

// 처리 전 공연은 골라서 한꺼번에 공연으로 추가(확인 창에서 새 아티스트·공개 여부 선택)하거나 반려할 수 있다.
export default function KopisList({ rows }: { rows: KopisRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [isPending, startTransition] = useTransition();
  const selectable = rows.filter((row) => row.status === 'pending');
  const allSelected = selectable.length > 0 && selectable.every((row) => selected.has(row.id));

  const toggle = (id: number, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  // 추가: 먼저 확인 창(출연진·새 아티스트·공개 여부)을 띄우고, 확인하면 만든다.
  const [preview, setPreview] = useState<KopisAddPreview[]>();
  const openPreview = () =>
    startTransition(async () => {
      const result = await previewKopisAdd([...selected]);
      if (result.error || !result.items) return void toast.error(result.error ?? '확인 창을 열지 못했어요');
      setPreview(result.items);
    });
  const add = (options: { newArtists: string[]; publish: boolean }) =>
    startTransition(async () => {
      const result = await addKopisShows(
        preview!.map((item) => item.reportId),
        options,
      );
      if (result.error) return void toast.error(result.error);
      if (result.added)
        toast.success(
          `${result.added}개 공연을 ${options.publish ? '공개로' : '비공개로'} 추가했어요${result.createdArtists ? ` · 새 아티스트 ${result.createdArtists}명` : ''}`,
        );
      for (const fail of result.failed) toast.error(`${fail.title}: ${fail.error}`);
      setPreview(undefined);
      setSelected(new Set());
      router.refresh();
    });

  const reject = () =>
    startTransition(async () => {
      const result = await rejectKopisReports([...selected]);
      toast.success(`${result.count}개 공연을 반려했어요`);
      setSelected(new Set());
      router.refresh();
    });

  return (
    <>
      {selectable.length > 0 && (
        <label className="mt-4 flex w-fit items-center gap-2 text-xs text-muted-foreground">
          <Checkbox checked={allSelected} onCheckedChange={(on) => setSelected(on ? new Set(selectable.map((row) => row.id)) : new Set())} />
          보이는 공연 모두 선택
        </label>
      )}
      <ul className="mt-2 divide-y rounded-md border bg-background">
        {rows.map((row) => (
          <li key={row.id} className="grid grid-cols-[auto_3rem_1fr_auto] items-start gap-4 px-4 py-3">
            <Checkbox
              aria-label={`${row.title} 선택`}
              className="mt-0.5"
              disabled={row.status !== 'pending'}
              checked={selected.has(row.id)}
              onCheckedChange={(on) => toggle(row.id, on === true)}
            />
            {row.poster ? (
              // KOPIS 포스터는 외부 주소라 next/image 대신 그대로 보여준다.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={row.poster} alt="" loading="lazy" className="h-16 w-12 rounded-sm bg-muted object-cover" />
            ) : (
              <div className="h-16 w-12 rounded-sm bg-muted" />
            )}
            <div className="min-w-0 text-sm">
              {row.externalId ? (
                <a
                  href={`https://www.kopis.or.kr/por/db/pblprfr/pblprfrView.do?menuId=MNU_00020&mt20Id=${row.externalId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium hover:underline"
                >
                  {row.title}
                </a>
              ) : (
                <p className="font-medium">{row.title}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">{[row.date, row.venue].filter(Boolean).join(' · ')}</p>
              {row.cast && <p className="mt-0.5 text-xs">출연 · {row.cast}</p>}
              {row.artistMatches.length + row.venueMatches.length > 0 || row.fit ? (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {row.fit && (
                    <Badge variant={row.fit === 'fit' ? 'default' : row.fit === 'unfit' ? 'secondary' : 'outline'}>
                      AI {FIT_LABEL[row.fit]}
                      {row.fitReason && ` · ${row.fitReason}`}
                    </Badge>
                  )}
                  {row.artistMatches.map((name) => (
                    <Badge key={name} className="bg-brand-yellow text-black">
                      아티스트 · {name}
                    </Badge>
                  ))}
                  {row.venueMatches.map((venue) => (
                    <Badge key={venue} variant="outline">
                      공연장 · {venue}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="flex flex-col items-end gap-2">
              <ReportStatusSelect id={row.id} status={row.status} />
              {row.status === 'pending' && (
                <Button asChild size="sm" variant="outline">
                  <Link href={`/admin/shows/new?report=${row.id}`}>공연으로 만들기</Link>
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {selected.size > 0 && (
        <div className="admin-page-bg sticky bottom-0 mt-4 flex items-center gap-2 border-t py-3">
          <p className="mr-auto text-sm">
            {selected.size}개 선택
            {selected.size > MAX_ADD && <span className="ml-2 text-xs text-muted-foreground">추가는 한 번에 {MAX_ADD}개까지</span>}
          </p>
          <Button variant="outline" disabled={isPending} onClick={() => setSelected(new Set())}>
            선택 해제
          </Button>
          <Button variant="outline" disabled={isPending} onClick={reject}>
            반려
          </Button>
          <Button disabled={isPending || selected.size > MAX_ADD} onClick={openPreview}>
            {isPending && !preview ? '출연진 확인하는 중…' : '공연으로 추가'}
          </Button>
        </div>
      )}
      <KopisAddDialog items={preview} isPending={isPending} onClose={() => setPreview(undefined)} onConfirm={add} />
    </>
  );
}
