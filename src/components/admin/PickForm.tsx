'use client';

import { useState, useTransition } from 'react';
import { ArrowDown, ArrowUp, Plus, Sparkles, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import ConfirmButton from '@/components/admin/ConfirmButton';
import DatePicker from '@/components/admin/DatePicker';
import SearchSelect from '@/components/admin/SearchSelect';
import { Field, Section } from '@/components/admin/ui';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Switch } from '@/components/shadcn/switch';
import { Textarea } from '@/components/shadcn/textarea';
import { deletePick, type PickInput, savePick } from '@/lib/admin/pickActions';
import { draftPickComment } from '@/lib/admin/pickAI';
import { formatVol } from '@/mocks/picks';

type Props = {
  issue?: PickInput;
  /** 새 호의 기본 호수 */
  nextVol: number;
  shows: { id: string; title: string; startDate: string }[];
};

// Pick 한 호: 첫 번째 공연이 메인, 나머지는 번호 목록. 공연마다 에디터 코멘트를 단다.
export default function PickForm({ issue, nextVol, shows }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<PickInput>(
    () => issue ?? { vol: nextVol, publishedAt: '', curator: '', isPublished: false, items: [{ showId: '', description: '' }] },
  );
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const [drafting, setDrafting] = useState<string>(); // 초안을 쓰는 중인 공연 id
  const showOptions = shows.map((show) => ({ value: show.id, label: show.title, hint: show.startDate }));
  const setItem = (index: number, patch: Partial<PickInput['items'][number]>) =>
    setForm((prev) => ({ ...prev, items: prev.items.map((item, i) => (i === index ? { ...item, ...patch } : item)) }));
  const moveItem = (index: number, delta: number) =>
    setForm((prev) => {
      const items = [...prev.items];
      const [item] = items.splice(index, 1);
      items.splice(index + delta, 0, item);
      return { ...prev, items };
    });

  // 칸에 적어둔 글이 있으면 메모로 보고 그걸 바탕으로 다시 쓴다. 바꾼 뒤 되돌릴 수 있다.
  const draft = async (index: number) => {
    const item = form.items[index];
    setDrafting(item.showId);
    const result = await draftPickComment({ showId: item.showId, isMain: index === 0, memo: item.description }).catch(() => ({
      error: '초안을 쓰지 못했어요. 잠시 뒤 다시 시도해주세요.',
      comment: undefined,
    }));
    setDrafting(undefined);
    if (!result.comment) return void toast.error(result.error);
    const previous = item.description;
    // 기다리는 사이 순서가 바뀌었을 수 있어 공연 id 로 찾아 넣는다.
    const put = (description: string) =>
      setForm((prev) => ({ ...prev, items: prev.items.map((it) => (it.showId === item.showId ? { ...it, description } : it)) }));
    put(result.comment);
    toast.success(previous.trim() ? '메모를 바탕으로 초안을 썼어요. 다듬어주세요.' : '초안을 썼어요. 다듬어주세요.', {
      action: { label: '되돌리기', onClick: () => put(previous) },
    });
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await savePick(issue?.vol ?? null, form);
      setError(result.error);
      if (result.error) return;
      toast.success(issue ? '저장했어요' : `${formatVol(form.vol)} 을(를) 만들었어요`);
      if (issue) router.refresh();
      else router.push(`/admin/picks/${result.id}`);
    });
  };

  const remove = () =>
    startTransition(async () => {
      const result = await deletePick(issue!.vol);
      setError(result.error);
      if (result.error) return;
      toast.success(`${formatVol(issue!.vol)} 을(를) 지웠어요`);
      router.push('/admin/picks');
    });

  return (
    <form onSubmit={submit} className="mt-6 grid gap-6">
      <Section title="Issue">
        <div className="grid grid-cols-4 gap-4">
          <Field label="호수" htmlFor="vol">
            <Input
              id="vol"
              type="number"
              min={1}
              required
              disabled={!!issue}
              value={form.vol}
              onChange={(e) => setForm({ ...form, vol: Number(e.target.value) })}
            />
          </Field>
          <Field label="발행일" htmlFor="publishedAt">
            <DatePicker id="publishedAt" value={form.publishedAt} onChange={(publishedAt) => setForm({ ...form, publishedAt })} />
          </Field>
          <Field label="큐레이터" htmlFor="curator">
            <Input id="curator" required value={form.curator} onChange={(e) => setForm({ ...form, curator: e.target.value })} />
          </Field>
          <Field label="상태">
            <div className="flex h-9 items-center gap-2">
              <Switch id="pickPublished" checked={form.isPublished} onCheckedChange={(isPublished) => setForm({ ...form, isPublished })} />
              <Label htmlFor="pickPublished" className="font-normal">
                {form.isPublished ? '공개' : '비공개'}
              </Label>
            </div>
          </Field>
        </div>
      </Section>

      <Section title="Shows" description="첫 번째 공연이 메인으로 크게 실려요. 공연마다 왜 골랐는지 한두 줄 적어주세요.">
        <ol className="grid gap-4">
          {form.items.map((item, index) => (
            <li key={index} className="grid gap-2 rounded-md border p-3">
              <div className="flex items-center gap-2">
                <span className="w-12 font-plex text-xs italic">{index === 0 ? 'MAIN' : String(index + 1).padStart(2, '0')}</span>
                <SearchSelect
                  options={showOptions}
                  value={item.showId}
                  onChange={(showId) => setItem(index, { showId })}
                  placeholder="공연 선택"
                  className="flex-1"
                />
                <Button type="button" size="icon-sm" variant="ghost" aria-label="위로" disabled={index === 0} onClick={() => moveItem(index, -1)}>
                  <ArrowUp />
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  aria-label="아래로"
                  disabled={index === form.items.length - 1}
                  onClick={() => moveItem(index, 1)}
                >
                  <ArrowDown />
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  aria-label="빼기"
                  disabled={form.items.length === 1}
                  onClick={() => setForm({ ...form, items: form.items.filter((_, i) => i !== index) })}
                >
                  <X />
                </Button>
              </div>
              <Textarea
                required
                rows={index === 0 ? 3 : 2}
                value={item.description}
                onChange={(e) => setItem(index, { description: e.target.value })}
                placeholder="왜 이 공연인지 한두 줄. 키워드만 적고 ‘메모로 초안 쓰기’를 눌러도 돼요."
                aria-label="코멘트"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                disabled={!item.showId || drafting !== undefined}
                onClick={() => draft(index)}
              >
                <Sparkles /> {drafting === item.showId ? '쓰는 중…' : item.description.trim() ? '메모로 초안 쓰기' : 'AI 초안'}
              </Button>
            </li>
          ))}
        </ol>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => setForm({ ...form, items: [...form.items, { showId: '', description: '' }] })}
        >
          <Plus /> 공연 추가
        </Button>
      </Section>

      <div className="flex items-center gap-2">
        {error && <p className="mr-auto text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={isPending} className={error ? '' : 'ml-auto'}>
          {isPending ? '저장 중…' : '저장'}
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/picks">목록</Link>
        </Button>
        {issue && (
          <ConfirmButton
            title={`${formatVol(issue.vol)} 을(를) 지울까요?`}
            description="되돌릴 수 없어요. 숨기기만 하려면 ‘공개’ 스위치를 끄고 저장하세요."
            onConfirm={remove}
            disabled={isPending}
            variant="outline"
            className="text-destructive"
          >
            삭제
          </ConfirmButton>
        )}
      </div>
    </form>
  );
}
