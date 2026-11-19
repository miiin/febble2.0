'use client';

import { useState, useTransition } from 'react';
import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import ConfirmButton from '@/components/admin/ConfirmButton';
import DatePicker, { DateTimePicker } from '@/components/admin/DatePicker';
import SearchSelect from '@/components/admin/SearchSelect';
import { Field, Section, selectClass } from '@/components/admin/ui';
import { Button } from '@/components/shadcn/button';
import { Checkbox } from '@/components/shadcn/checkbox';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/shadcn/table';
import { Textarea } from '@/components/shadcn/textarea';
import type { ShowForEdit } from '@/lib/admin/queries';
import { deleteShow, saveShow, type ShowInput } from '@/lib/admin/showActions';

type Option = { id: string; name: string };

type Props = {
  show?: ShowForEdit;
  artists: Option[];
};

const TIME_ZONES = ['Asia/Seoul', 'Asia/Tokyo', 'Asia/Taipei', 'Asia/Bangkok', 'Europe/London', 'America/New_York', 'America/Los_Angeles'];

let keySeq = 0;
const newKey = () => `new-${++keySeq}`;

function toInput(show?: ShowForEdit): ShowInput {
  if (!show) {
    return {
      id: '',
      category: 'indie',
      title: '',
      startDate: '',
      endDate: '',
      startTime: '',
      timeZone: 'Asia/Seoul',
      venue: '',
      image: '',
      description: '',
      price: '',
      ticketOpenAt: '',
      soldOut: false,
      isPublished: false,
      artistIds: [],
      vendors: [],
      stages: [],
      slots: [],
    };
  }
  return {
    ...show,
    image: show.image ?? '',
    description: show.description ?? '',
    price: show.price ?? '',
    ticketOpenAt: show.ticketOpenAt ?? '',
    stages: show.stages.map((stage) => ({ id: stage.id, key: String(stage.id), name: stage.name })),
    slots: show.slots.map((slot) => ({ ...slot, stageKey: String(slot.stageId) })),
  };
}

const move = <T,>(list: T[], index: number, delta: number) => {
  const next = [...list];
  const [item] = next.splice(index, 1);
  next.splice(index + delta, 0, item);
  return next;
};

// 공연 편집: 기본 정보, 라인업, 예매처, (페스티벌) 타임테이블을 한 번에 저장한다.
export default function ShowForm({ show, artists }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<ShowInput>(() => toInput(show));
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const set = <K extends keyof ShowInput>(key: K, value: ShowInput[K]) => setForm((prev) => ({ ...prev, [key]: value }));
  const artistName = (id: string) => artists.find((artist) => artist.id === id)?.name ?? id;
  const artistOptions = artists.map((artist) => ({ value: artist.id, label: artist.name }));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await saveShow(show?.id ?? null, form);
      setError(result.error);
      if (result.error) return;
      toast.success(show ? '저장했어요' : '공연을 추가했어요');
      if (show) router.refresh();
      else router.push(`/admin/shows/${result.id}`);
    });
  };

  const remove = () =>
    startTransition(async () => {
      const result = await deleteShow(show!.id);
      setError(result.error);
      if (result.error) return;
      toast.success(`${show!.title} 을(를) 지웠어요`);
      router.push('/admin/shows');
    });

  return (
    <form onSubmit={submit} className="mt-6 grid gap-6">
      <Section title="Info">
        {!show && (
          <Field label="id (주소)" htmlFor="show-id" hint="영문 소문자·숫자·하이픈. /shows/[id] 주소가 되고 나중에 바꿀 수 없어요.">
            <Input id="show-id" required value={form.id} onChange={(e) => set('id', e.target.value)} placeholder="busan-rock-2027" />
          </Field>
        )}
        <div className="grid grid-cols-2 gap-4">
          <Field label="분류" htmlFor="category">
            <select id="category" value={form.category} onChange={(e) => set('category', e.target.value as ShowInput['category'])} className={selectClass}>
              <option value="indie">국내 인디</option>
              <option value="overseas">내한</option>
              <option value="festival">페스티벌</option>
            </select>
          </Field>
          <Field label="공개">
            <div className="flex h-9 items-center gap-2">
              <Checkbox id="isPublished" checked={form.isPublished} onCheckedChange={(checked) => set('isPublished', checked === true)} />
              <Label htmlFor="isPublished" className="font-normal">
                사이트에 보이기
              </Label>
            </div>
          </Field>
        </div>
        <Field label="공연 이름" htmlFor="title">
          <Input id="title" required value={form.title} onChange={(e) => set('title', e.target.value)} />
        </Field>
        <div className="grid grid-cols-3 gap-4">
          <Field label="시작일" htmlFor="startDate">
            <DatePicker id="startDate" value={form.startDate} onChange={(value) => setForm((prev) => ({ ...prev, startDate: value, endDate: prev.endDate && prev.endDate >= value ? prev.endDate : value }))} />
          </Field>
          <Field label="종료일" htmlFor="endDate">
            <DatePicker id="endDate" value={form.endDate} min={form.startDate || undefined} onChange={(value) => set('endDate', value)} />
          </Field>
          <Field label="시작 시각" htmlFor="startTime" hint="비우면 캘린더에 종일 일정">
            <Input id="startTime" type="time" value={form.startTime} onChange={(e) => set('startTime', e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="장소" htmlFor="venue">
            <Input id="venue" required value={form.venue} onChange={(e) => set('venue', e.target.value)} />
          </Field>
          <Field label="시간대" htmlFor="timeZone" hint="해외 공연은 꼭 바꿔주세요 (캘린더·티켓 오픈 시각 기준)">
            <Input id="timeZone" list="time-zones" value={form.timeZone} onChange={(e) => set('timeZone', e.target.value)} />
            <datalist id="time-zones">
              {TIME_ZONES.map((zone) => (
                <option key={zone} value={zone} />
              ))}
            </datalist>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="티켓 오픈" htmlFor="ticketOpenAt" hint="공연 현지 시각">
            <DateTimePicker id="ticketOpenAt" value={form.ticketOpenAt} onChange={(value) => set('ticketOpenAt', value)} placeholder="정해지면 입력" clearable />
          </Field>
          <Field label="가격" htmlFor="price" hint="화면에 그대로 보여요">
            <Input id="price" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="55,000원" />
          </Field>
        </div>
        <Field label="이미지 주소" htmlFor="image" hint="public/images 아래 경로(/images/...) 또는 https 주소">
          <Input id="image" value={form.image} onChange={(e) => set('image', e.target.value)} />
        </Field>
        <Field label="소개" htmlFor="description">
          <Textarea id="description" rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </Field>
        <div className="flex items-center gap-2">
          <Checkbox id="soldOut" checked={form.soldOut} onCheckedChange={(checked) => set('soldOut', checked === true)} />
          <Label htmlFor="soldOut" className="font-normal">
            매진
          </Label>
        </div>
      </Section>

      <Section title="Lineup" description="위에서부터 라인업 순서예요.">
        {form.artistIds.length > 0 && (
          <ol className="divide-y rounded-md border">
            {form.artistIds.map((artistId, index) => (
              <li key={artistId} className="flex items-center gap-2 px-3 py-1.5 text-sm">
                <span className="w-5 text-xs text-muted-foreground">{index + 1}</span>
                <span className="flex-1">{artistName(artistId)}</span>
                <Button type="button" size="icon-sm" variant="ghost" aria-label="위로" disabled={index === 0} onClick={() => set('artistIds', move(form.artistIds, index, -1))}>
                  <ArrowUp />
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  aria-label="아래로"
                  disabled={index === form.artistIds.length - 1}
                  onClick={() => set('artistIds', move(form.artistIds, index, 1))}
                >
                  <ArrowDown />
                </Button>
                <Button type="button" size="icon-sm" variant="ghost" aria-label={`${artistName(artistId)} 빼기`} onClick={() => set('artistIds', form.artistIds.filter((id) => id !== artistId))}>
                  <X />
                </Button>
              </li>
            ))}
          </ol>
        )}
        <div className="flex items-center gap-3">
          <SearchSelect
            options={artistOptions.filter((option) => !form.artistIds.includes(option.value))}
            onChange={(id) => set('artistIds', [...form.artistIds, id])}
            placeholder="+ 아티스트 추가"
            keepPlaceholder
            className="w-56"
          />
          <p className="text-[11px] text-muted-foreground">
            없는 아티스트는{' '}
            <Link href="/admin/artists/new" target="_blank" className="underline">
              먼저 추가
            </Link>
            하고 이 화면을 새로고침하세요.
          </p>
        </div>
      </Section>

      <Section title="Tickets" description="여러 곳이면 사이트 하단 버튼에서 고르게 해요.">
        {form.vendors.map((vendor, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={vendor.name}
              onChange={(e) => set('vendors', form.vendors.map((v, i) => (i === index ? { ...v, name: e.target.value } : v)))}
              className="max-w-44"
              placeholder="인터파크 티켓"
              aria-label="예매처 이름"
            />
            <Input
              value={vendor.url}
              onChange={(e) => set('vendors', form.vendors.map((v, i) => (i === index ? { ...v, url: e.target.value } : v)))}
              placeholder="https://"
              aria-label="예매 주소"
            />
            <Button type="button" size="icon" variant="ghost" aria-label="예매처 빼기" onClick={() => set('vendors', form.vendors.filter((_, i) => i !== index))}>
              <X />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => set('vendors', [...form.vendors, { name: '', url: '' }])}>
          <Plus /> 예매처 추가
        </Button>
      </Section>

      {form.category === 'festival' && (
        <Section title="Timetable" description="스테이지나 무대를 지우고 저장하면, 사용자가 그 무대를 담아둔 기록도 같이 지워져요.">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium">스테이지</span>
            {form.stages.map((stage, index) => {
              const used = form.slots.filter((slot) => slot.stageKey === stage.key).length;
              const removeStage = () =>
                setForm((prev) => ({ ...prev, stages: prev.stages.filter((s) => s.key !== stage.key), slots: prev.slots.filter((slot) => slot.stageKey !== stage.key) }));
              return (
                <span key={stage.key} className="flex items-center rounded-md border">
                  <Input
                    value={stage.name}
                    onChange={(e) => set('stages', form.stages.map((s, i) => (i === index ? { ...s, name: e.target.value } : s)))}
                    className="h-8 w-28 border-0 shadow-none"
                    aria-label="스테이지 이름"
                    placeholder="MAIN"
                  />
                  {used > 0 ? (
                    <ConfirmButton
                      title={`${stage.name || '이 스테이지'} 를 뺄까요?`}
                      description={`이 스테이지의 무대 ${used}개도 같이 빠져요. 저장하기 전까지는 되돌릴 수 있어요.`}
                      confirmLabel="빼기"
                      onConfirm={removeStage}
                      variant="ghost"
                      size="icon-sm"
                    >
                      <X />
                    </ConfirmButton>
                  ) : (
                    <Button type="button" size="icon-sm" variant="ghost" aria-label="스테이지 빼기" onClick={removeStage}>
                      <X />
                    </Button>
                  )}
                </span>
              );
            })}
            <Button type="button" variant="outline" size="sm" onClick={() => set('stages', [...form.stages, { key: newKey(), name: '' }])}>
              <Plus /> 스테이지
            </Button>
          </div>

          {form.slots.length > 0 && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">날짜</TableHead>
                    <TableHead className="text-xs">스테이지</TableHead>
                    <TableHead className="text-xs">아티스트</TableHead>
                    <TableHead className="text-xs">시작</TableHead>
                    <TableHead className="text-xs">끝</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {form.slots.map((slot, index) => {
                    const update = (patch: Partial<typeof slot>) => set('slots', form.slots.map((s, i) => (i === index ? { ...s, ...patch } : s)));
                    return (
                      <TableRow key={slot.id ?? `new-slot-${index}`}>
                        <TableCell>
                          <DatePicker value={slot.date} min={form.startDate || undefined} max={form.endDate || undefined} onChange={(date) => update({ date })} className="w-44" />
                        </TableCell>
                        <TableCell>
                          <select value={slot.stageKey} onChange={(e) => update({ stageKey: e.target.value })} className={selectClass} aria-label="스테이지">
                            {form.stages.map((stage) => (
                              <option key={stage.key} value={stage.key}>
                                {stage.name || '(이름 없음)'}
                              </option>
                            ))}
                          </select>
                        </TableCell>
                        <TableCell>
                          <SearchSelect
                            options={artistOptions.map((option) => ({ ...option, hint: form.artistIds.includes(option.value) ? undefined : '라인업 밖' }))}
                            value={slot.artistId}
                            onChange={(artistId) => update({ artistId })}
                            placeholder="아티스트"
                            className="w-44"
                          />
                        </TableCell>
                        <TableCell>
                          <Input type="time" value={slot.start} onChange={(e) => update({ start: e.target.value })} aria-label="시작" />
                        </TableCell>
                        <TableCell>
                          <Input type="time" value={slot.end} onChange={(e) => update({ end: e.target.value })} aria-label="끝" />
                        </TableCell>
                        <TableCell>
                          <Button type="button" size="icon-sm" variant="ghost" aria-label="무대 빼기" onClick={() => set('slots', form.slots.filter((_, i) => i !== index))}>
                            <X />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={form.stages.length === 0}
              onClick={() => {
                const last = form.slots.at(-1);
                set('slots', [
                  ...form.slots,
                  { stageKey: last?.stageKey ?? form.stages[0].key, artistId: '', date: last?.date ?? form.startDate, start: last?.end ?? '', end: '' },
                ]);
              }}
            >
              <Plus /> 무대 추가
            </Button>
            <p className="text-[11px] text-muted-foreground">끝 시각이 시작보다 이르면 다음 날 새벽으로 봐요. 무대를 추가하려면 스테이지가 하나 이상 있어야 해요.</p>
          </div>
        </Section>
      )}

      <div className="sticky bottom-0 -mx-6 flex items-center gap-2 border-t bg-background/95 px-6 py-3 backdrop-blur">
        {error && <p className="mr-auto text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={isPending} className={error ? '' : 'ml-auto'}>
          {isPending ? '저장 중…' : '저장'}
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/shows">목록</Link>
        </Button>
        {show && (
          <ConfirmButton
            title={`${show.title} 을(를) 지울까요?`}
            description="찜·담은 무대 기록도 같이 지워지고 되돌릴 수 없어요. Pick 에 들어간 공연은 지울 수 없어요."
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
