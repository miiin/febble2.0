'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import { Checkbox } from '@/components/shadcn/checkbox';
import { applyGenreChanges } from '@/lib/admin/artistActions';
import { type GenreChange, suggestGenreCleanup } from '@/lib/admin/genreAI';

// AI 정리 안을 받아 아티스트별로 고른 것만 적용한다.
export default function GenreCleanup() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [suggestion, setSuggestion] = useState<{ changes: GenreChange[]; notes: string[] }>();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const suggest = () =>
    startTransition(async () => {
      const result = await suggestGenreCleanup();
      if (result.error) return void toast.error(result.error);
      const changes = result.changes ?? [];
      setSuggestion({ changes, notes: result.notes ?? [] });
      setSelected(new Set(changes.map((change) => change.artistId)));
      if (changes.length === 0) toast.success('바꿀 장르가 없어요');
    });

  const apply = () =>
    startTransition(async () => {
      const picked = suggestion!.changes.filter((change) => selected.has(change.artistId));
      const result = await applyGenreChanges(picked.map(({ artistId, after }) => ({ artistId, genres: after })));
      if (result.error) return void toast.error(result.error);
      toast.success(`${picked.length}명의 장르를 바꿨어요`);
      setSuggestion(undefined);
      router.refresh();
    });

  const toggle = (id: string, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  return (
    <div className="grid gap-4">
      <div>
        <Button onClick={suggest} disabled={isPending}>
          {isPending && !suggestion ? 'AI가 살펴보는 중…' : 'AI로 정리 안 받기'}
        </Button>
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          지금 장르·소개·Spotify 장르를 근거로 표기만 맞춰요. 바로 바뀌지 않고, 고른 것만 적용돼요.
        </p>
      </div>

      {suggestion && suggestion.changes.length > 0 && (
        <>
          <ul className="divide-y rounded-md border bg-background">
            {suggestion.changes.map((change) => (
              <li key={change.artistId} className="flex items-start gap-3 px-4 py-3 text-sm">
                <Checkbox
                  id={`genre-${change.artistId}`}
                  checked={selected.has(change.artistId)}
                  onCheckedChange={(on) => toggle(change.artistId, on === true)}
                  className="mt-0.5"
                />
                <label htmlFor={`genre-${change.artistId}`} className="grid flex-1 gap-1.5">
                  <span className="font-medium">{change.name}</span>
                  <span className="flex flex-wrap items-center gap-1">
                    {change.before.map((genre) => (
                      <Badge key={genre} variant="outline" className="text-muted-foreground line-through">
                        {genre}
                      </Badge>
                    ))}
                    <span className="px-1 text-muted-foreground">→</span>
                    {change.after.map((genre) => (
                      <Badge key={genre} variant="secondary">
                        {genre}
                      </Badge>
                    ))}
                  </span>
                  <span className="text-xs text-muted-foreground">{change.reason}</span>
                </label>
              </li>
            ))}
          </ul>
          <div>
            <Button onClick={apply} disabled={isPending || selected.size === 0}>
              {isPending ? '적용 중…' : `고른 ${selected.size}명 적용`}
            </Button>
          </div>
        </>
      )}

      {suggestion && suggestion.notes.length > 0 && (
        <div className="rounded-md bg-muted/40 px-4 py-3 text-xs">
          <p className="font-medium">확인할 점</p>
          <ul className="mt-1 list-disc pl-4">
            {suggestion.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
