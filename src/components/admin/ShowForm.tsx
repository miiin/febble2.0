'use client';

import { useRef, useState, useTransition } from 'react';
import { ArrowDown, ArrowUp, Plus, Sparkles, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import ConfirmButton from '@/components/admin/ConfirmButton';
import DatePicker, { DateTimePicker } from '@/components/admin/DatePicker';
import ImageUpload, { shrinkImage } from '@/components/admin/ImageUpload';
import SearchSelect from '@/components/admin/SearchSelect';
import { Field, Section, selectClass } from '@/components/admin/ui';
import { Button } from '@/components/shadcn/button';
import { Checkbox } from '@/components/shadcn/checkbox';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Switch } from '@/components/shadcn/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/shadcn/table';
import { Textarea } from '@/components/shadcn/textarea';
import type { ShowForEdit } from '@/lib/admin/queries';
import { readPoster } from '@/lib/admin/posterAI';
import { setReportStatus } from '@/lib/admin/reportActions';
import { draftFromReport } from '@/lib/admin/reportAI';
import type { ShowDraft } from '@/lib/admin/showDraft';
import { deleteShow, saveShow, type ShowInput } from '@/lib/admin/showActions';
import { readTimetable, type TimetableDraft } from '@/lib/admin/timetableAI';

type Option = { id: string; name: string };

export type ReportForShow = {
  id: number;
  title: string;
  artist: string | null;
  date: string | null;
  venue: string | null;
  link: string | null;
  message: string | null;
  source: 'user' | 'kopis';
  poster: string | null;
};

type Props = {
  show?: ShowForEdit;
  artists: Option[];
  /** 제보에서 만들 때: 폼 위에 제보를 보여주고, 저장하면 제보를 '추가함'으로 바꾼다 */
  report?: ReportForShow;
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
export default function ShowForm({ show, artists, report }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<ShowInput>(() => toInput(show));
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const set = <K extends keyof ShowInput>(key: K, value: ShowInput[K]) => setForm((prev) => ({ ...prev, [key]: value }));
  const artistName = (id: string) => artists.find((artist) => artist.id === id)?.name ?? id;
  const artistOptions = artists.map((artist) => ({ value: artist.id, label: artist.name }));
  const [posterNote, setPosterNote] = useState<{ filled: string[]; newArtists: string[]; notes: string[] }>();
  const [isReading, startReading] = useTransition();

  // 포스터·제보에서 읽은 값은 비어 있는 칸에만 넣는다 (이미 적은 값은 건드리지 않는다). 저장은 사람이 확인한 뒤.
  const applyDraft = (draft: ShowDraft, from: string) => {
    // 지금 폼 값에서 바로 계산한다 (setForm 콜백 안에서 세면 알림을 띄울 때 아직 비어 있다).
    const filled: string[] = [];
    const prev = form;
    const next = { ...prev };
    const fill = <K extends keyof ShowInput>(key: K, value: ShowInput[K] | null, label: string, isEmpty = !prev[key]) => {
      if (value === null || value === '' || !isEmpty) return;
      next[key] = value;
      filled.push(label);
    };
    // id 는 새 공연에서만 정한다 (만든 뒤에는 바꿀 수 없다).
    if (!show) fill('id', draft.slug, 'id');
    fill('title', draft.title, '공연 이름');
    // 분류·시간대는 기본값이 있어서, 새 공연이거나 기본값 그대로일 때만 바꾼다.
    fill('category', draft.category, '분류', !show);
    fill('startDate', draft.startDate, '시작일');
    fill('endDate', draft.endDate, '종료일');
    fill('startTime', draft.startTime, '시작 시각');
    fill('venue', draft.venue, '장소');
    fill('timeZone', draft.timeZone, '시간대', prev.timeZone === 'Asia/Seoul' && draft.timeZone !== 'Asia/Seoul');
    fill('price', draft.price, '가격');
    fill('ticketOpenAt', draft.ticketOpenAt, '티켓 오픈');
    if (prev.vendors.length === 0 && draft.ticketVendors.length > 0) {
      next.vendors = draft.ticketVendors.map((vendor) => ({ name: vendor.name, url: vendor.url ?? '' }));
      filled.push('예매처');
    }
    const matched = draft.lineup.flatMap((item) => (item.artistId && !prev.artistIds.includes(item.artistId) ? [item.artistId] : []));
    if (matched.length > 0) {
      next.artistIds = [...prev.artistIds, ...new Set(matched)];
      filled.push(`라인업 ${matched.length}명`);
    }
    setForm(next);
    const newArtists = draft.lineup.filter((item) => !item.artistId).map((item) => item.name);
    const vendorNotes = draft.ticketVendors.some((vendor) => !vendor.url) ? ['예매처 주소가 자료에 없어서 비워뒀어요. 저장 전에 채워주세요.'] : [];
    setPosterNote({ filled, newArtists, notes: [...draft.notes, ...vendorNotes] });
    toast.success(filled.length ? `${from}에서 ${filled.length}개 항목을 채웠어요. 확인해주세요.` : '새로 채울 항목이 없었어요');
  };

  // 타임테이블 이미지: 기존 무대는 두고 추가만 한다. 같은 이름의 스테이지는 그대로 쓰고,
  // 같은 스테이지·날짜·시작 시각의 무대는 건너뛴다.
  const timetableInput = useRef<HTMLInputElement>(null);
  const [timetableNote, setTimetableNote] = useState<{ summary: string; unmatched: string[]; notes: string[] }>();
  const applyTimetable = (draft: TimetableDraft) => {
    const stages = [...form.stages];
    const keyOf = (name: string) => {
      const found = stages.find((stage) => stage.name.trim().toLowerCase() === name.toLowerCase());
      if (found) return found.key;
      const stage = { key: newKey(), name };
      stages.push(stage);
      return stage.key;
    };
    const newStages = draft.stages.filter((name) => !form.stages.some((stage) => stage.name.trim().toLowerCase() === name.toLowerCase())).length;
    draft.stages.forEach(keyOf); // 스테이지 순서대로 먼저 만든다
    const exists = new Set(form.slots.map((slot) => `${slot.stageKey}|${slot.date}|${slot.start}`));
    const added = draft.slots.flatMap((slot) => {
      const stageKey = keyOf(slot.stage);
      const id = `${stageKey}|${slot.date}|${slot.start}`;
      if (exists.has(id)) return [];
      exists.add(id);
      return [{ stageKey, artistId: slot.artistId ?? '', date: slot.date, start: slot.start, end: slot.end }];
    });
    const addedIds = new Set(added.map((slot) => `${slot.stageKey}|${slot.date}|${slot.start}`));
    const stageOrder = (key: string) => stages.findIndex((stage) => stage.key === key);
    const slots = [...form.slots, ...added].sort(
      (a, b) => (a.date + a.start).localeCompare(b.date + b.start) || stageOrder(a.stageKey) - stageOrder(b.stageKey),
    );
    const lineupAdds = [...new Set(added.map((slot) => slot.artistId).filter((id) => id && !form.artistIds.includes(id)))];
    setForm({ ...form, stages, slots, artistIds: [...form.artistIds, ...lineupAdds] });

    const skipped = draft.slots.length - added.length;
    setTimetableNote({
      summary: [
        `무대 ${added.length}개 추가`,
        newStages && `스테이지 ${newStages}개 추가`,
        skipped && `이미 있는 무대 ${skipped}개 건너뜀`,
        lineupAdds.length && `라인업에 ${lineupAdds.length}명 추가`,
        draft.dropped && `읽기 어려운 ${draft.dropped}개 제외`,
      ]
        .filter(Boolean)
        .join(' · '),
      // 이번에 실제로 추가한 무대 중 아티스트를 못 찾은 것만
      unmatched: [
        ...new Set(
          draft.slots
            .filter((slot) => !slot.artistId && addedIds.has(`${keyOf(slot.stage)}|${slot.date}|${slot.start}`))
            .map((slot) => slot.artistName),
        ),
      ],
      notes: [...draft.notes, ...(added.some((slot) => !slot.end) ? ['끝 시각이 없는 무대가 있어요. 채워주세요.'] : [])],
    });
    toast.success(added.length ? `무대 ${added.length}개를 추가했어요. 확인해주세요.` : '새로 추가할 무대가 없었어요');
  };

  const readTimetableImage = (file: File | undefined) => {
    if (!file) return;
    startReading(async () => {
      const formData = new FormData();
      formData.set('file', await shrinkImage(file));
      formData.set('startDate', form.startDate);
      formData.set('endDate', form.endDate);
      formData.set('lineup', form.artistIds.join(','));
      const result = await readTimetable(formData).catch(() => ({
        error: '타임테이블을 읽지 못했어요. 잠시 뒤 다시 시도해주세요.',
        draft: undefined,
      }));
      if (result.draft) applyTimetable(result.draft);
      else toast.error(result.error);
    });
  };

  const readReport = () =>
    startReading(async () => {
      const result = await draftFromReport(report!.id).catch(() => ({
        error: '제보를 읽지 못했어요. 잠시 뒤 다시 시도해주세요.',
        draft: undefined,
        linkNote: undefined,
      }));
      if (result.draft)
        applyDraft(
          { ...result.draft, notes: [...(result.linkNote ? [result.linkNote] : []), ...result.draft.notes] },
          report!.source === 'kopis' ? 'KOPIS 정보' : '제보',
        );
      else toast.error(result.error);
    });

  const read = () =>
    startReading(async () => {
      const result = await readPoster(form.image).catch(() => ({ error: '포스터를 읽지 못했어요. 잠시 뒤 다시 시도해주세요.', draft: undefined }));
      if (result.draft) applyDraft(result.draft, '포스터');
      else toast.error(result.error);
    });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await saveShow(show?.id ?? null, form);
      setError(result.error);
      if (result.error) return;
      if (report) await setReportStatus(report.id, 'added').catch(() => toast.error('제보 상태는 바꾸지 못했어요. 제보 화면에서 바꿔주세요.'));
      toast.success(show ? '저장했어요' : report ? '공연을 추가하고 제보를 ‘추가함’으로 바꿨어요' : '공연을 추가했어요');
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
      {report && (
        <Section
          title="Report"
          description={
            report.source === 'kopis'
              ? 'KOPIS(공연예술통합전산망)에서 가져온 공연이에요. AI 가 KOPIS 상세 정보(출연진·가격·시간·예매처)로 비어 있는 칸을 채워줘요.'
              : '사용자가 보낸 제보예요. AI 가 제보와 참고 링크 페이지를 읽어 비어 있는 칸을 채워줘요.'
          }
        >
          <dl className="grid grid-cols-[5rem_1fr] gap-x-3 gap-y-1.5 rounded-md border bg-muted/40 p-3 text-sm">
            {(
              [
                ['공연 이름', report.title],
                ['아티스트', report.artist],
                ['날짜', report.date],
                ['장소', report.venue],
                ['하고 싶은 말', report.message],
              ] as const
            )
              .filter(([, value]) => value)
              .map(([label, value]) => (
                <div key={label} className="contents">
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="whitespace-pre-line">{value}</dd>
                </div>
              ))}
            {report.poster && (
              <>
                <dt className="text-xs text-muted-foreground">포스터</dt>
                <dd>
                  <a href={report.poster} target="_blank" rel="noreferrer" className="underline">
                    KOPIS 포스터 보기
                  </a>
                </dd>
              </>
            )}
            {report.link && (
              <>
                <dt className="text-xs text-muted-foreground">참고 링크</dt>
                <dd className="truncate">
                  <a href={report.link} target="_blank" rel="noreferrer" className="underline">
                    {report.link}
                  </a>
                </dd>
              </>
            )}
          </dl>
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" disabled={isReading} onClick={readReport}>
              <Sparkles /> {isReading ? '읽는 중…' : report.source === 'kopis' ? 'KOPIS 정보로 채우기' : '제보로 정보 채우기'}
            </Button>
            <p className="text-[11px] text-muted-foreground">비어 있는 칸만 채워요. 포스터가 있으면 아래에서 포스터로도 채울 수 있어요.</p>
          </div>
        </Section>
      )}

      <Section title="Poster" description="포스터를 올리면 공연 대표 이미지가 되고, AI 가 포스터를 읽어 비어 있는 칸을 채워줘요.">
        <ImageUpload folder="shows" value={form.image} onChange={(url) => set('image', url)} />
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" disabled={!form.image || isReading} onClick={read}>
            <Sparkles /> {isReading ? '포스터 읽는 중… (10~30초)' : '포스터로 정보 채우기'}
          </Button>
          <p className="text-[11px] text-muted-foreground">비어 있는 칸만 채워요. 저장 전에 꼭 확인해주세요.</p>
        </div>
        {posterNote && (
          <div className="grid gap-1.5 rounded-md border bg-muted/40 p-3 text-xs">
            <p>
              <span className="font-medium">채운 항목</span> · {posterNote.filled.join(', ') || '없음'}
            </p>
            {posterNote.newArtists.length > 0 && (
              <p>
                <span className="font-medium">목록에 없는 아티스트</span> · {posterNote.newArtists.join(', ')} —{' '}
                <Link href="/admin/artists/new" target="_blank" className="underline">
                  추가하기
                </Link>
              </p>
            )}
            {posterNote.notes.map((note) => (
              <p key={note} className="text-muted-foreground">
                · {note}
              </p>
            ))}
          </div>
        )}
      </Section>

      <Section title="Info">
        {!show && (
          <Field label="id (주소)" htmlFor="show-id" hint="영문 소문자·숫자·하이픈. /shows/[id] 주소가 되고 나중에 바꿀 수 없어요.">
            <Input id="show-id" required value={form.id} onChange={(e) => set('id', e.target.value)} placeholder="busan-rock-2027" />
          </Field>
        )}
        <div className="grid grid-cols-2 gap-4">
          <Field label="분류" htmlFor="category">
            <select
              id="category"
              value={form.category}
              onChange={(e) => set('category', e.target.value as ShowInput['category'])}
              className={selectClass}
            >
              <option value="indie">국내 인디</option>
              <option value="overseas">내한</option>
              <option value="festival">페스티벌</option>
            </select>
          </Field>
          <Field label="상태">
            <div className="flex h-9 items-center gap-2">
              <Switch id="isPublished" checked={form.isPublished} onCheckedChange={(checked) => set('isPublished', checked)} />
              <Label htmlFor="isPublished" className="font-normal">
                {form.isPublished ? '공개' : '비공개'}
              </Label>
            </div>
          </Field>
        </div>
        <Field label="공연 이름" htmlFor="title">
          <Input id="title" required value={form.title} onChange={(e) => set('title', e.target.value)} />
        </Field>
        <div className="grid grid-cols-3 gap-4">
          <Field label="시작일" htmlFor="startDate">
            <DatePicker
              id="startDate"
              value={form.startDate}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, startDate: value, endDate: prev.endDate && prev.endDate >= value ? prev.endDate : value }))
              }
            />
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
            <DateTimePicker
              id="ticketOpenAt"
              value={form.ticketOpenAt}
              onChange={(value) => set('ticketOpenAt', value)}
              placeholder="정해지면 입력"
              clearable
            />
          </Field>
          <Field label="가격" htmlFor="price" hint="화면에 그대로 보여요">
            <Input id="price" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="55,000원" />
          </Field>
        </div>
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
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  aria-label="위로"
                  disabled={index === 0}
                  onClick={() => set('artistIds', move(form.artistIds, index, -1))}
                >
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
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`${artistName(artistId)} 빼기`}
                  onClick={() =>
                    set(
                      'artistIds',
                      form.artistIds.filter((id) => id !== artistId),
                    )
                  }
                >
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
              onChange={(e) =>
                set(
                  'vendors',
                  form.vendors.map((v, i) => (i === index ? { ...v, name: e.target.value } : v)),
                )
              }
              className="max-w-44"
              placeholder="인터파크 티켓"
              aria-label="예매처 이름"
            />
            <Input
              value={vendor.url}
              onChange={(e) =>
                set(
                  'vendors',
                  form.vendors.map((v, i) => (i === index ? { ...v, url: e.target.value } : v)),
                )
              }
              placeholder="https://"
              aria-label="예매 주소"
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="예매처 빼기"
              onClick={() =>
                set(
                  'vendors',
                  form.vendors.filter((_, i) => i !== index),
                )
              }
            >
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
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={isReading || !form.startDate || !form.endDate}
              onClick={() => timetableInput.current?.click()}
            >
              <Sparkles /> {isReading ? '타임테이블 읽는 중… (20~60초)' : '타임테이블 이미지로 채우기'}
            </Button>
            <p className="text-[11px] text-muted-foreground">
              {form.startDate && form.endDate
                ? '기존 무대는 그대로 두고 추가만 해요. 이미지는 저장하지 않아요.'
                : '공연 시작일·종료일을 먼저 정해주세요.'}
            </p>
            <input
              ref={timetableInput}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                readTimetableImage(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </div>
          {timetableNote && (
            <div className="grid gap-1.5 rounded-md border bg-muted/40 p-3 text-xs" data-testid="timetable-note">
              <p>
                <span className="font-medium">읽은 결과</span> · {timetableNote.summary}
              </p>
              {timetableNote.unmatched.length > 0 && (
                <p>
                  <span className="font-medium">목록에 없는 아티스트</span> · {timetableNote.unmatched.join(', ')} — 무대의 아티스트 칸이 비어 있어요.{' '}
                  <Link href="/admin/artists/new" target="_blank" className="underline">
                    추가하기
                  </Link>
                </p>
              )}
              {timetableNote.notes.map((note) => (
                <p key={note} className="text-muted-foreground">
                  · {note}
                </p>
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium">스테이지</span>
            {form.stages.map((stage, index) => {
              const used = form.slots.filter((slot) => slot.stageKey === stage.key).length;
              const removeStage = () =>
                setForm((prev) => ({
                  ...prev,
                  stages: prev.stages.filter((s) => s.key !== stage.key),
                  slots: prev.slots.filter((slot) => slot.stageKey !== stage.key),
                }));
              return (
                <span key={stage.key} className="flex items-center rounded-md border">
                  <Input
                    value={stage.name}
                    onChange={(e) =>
                      set(
                        'stages',
                        form.stages.map((s, i) => (i === index ? { ...s, name: e.target.value } : s)),
                      )
                    }
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
                    const update = (patch: Partial<typeof slot>) =>
                      set(
                        'slots',
                        form.slots.map((s, i) => (i === index ? { ...s, ...patch } : s)),
                      );
                    return (
                      <TableRow key={slot.id ?? `new-slot-${index}`}>
                        <TableCell>
                          <DatePicker
                            value={slot.date}
                            min={form.startDate || undefined}
                            max={form.endDate || undefined}
                            onChange={(date) => update({ date })}
                            className="w-44"
                          />
                        </TableCell>
                        <TableCell>
                          <select
                            value={slot.stageKey}
                            onChange={(e) => update({ stageKey: e.target.value })}
                            className={selectClass}
                            aria-label="스테이지"
                          >
                            {form.stages.map((stage) => (
                              <option key={stage.key} value={stage.key}>
                                {stage.name || '(이름 없음)'}
                              </option>
                            ))}
                          </select>
                        </TableCell>
                        <TableCell>
                          <SearchSelect
                            options={artistOptions.map((option) => ({
                              ...option,
                              hint: form.artistIds.includes(option.value) ? undefined : '라인업 밖',
                            }))}
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
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            aria-label="무대 빼기"
                            onClick={() =>
                              set(
                                'slots',
                                form.slots.filter((_, i) => i !== index),
                              )
                            }
                          >
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
                  {
                    stageKey: last?.stageKey ?? form.stages[0].key,
                    artistId: '',
                    date: last?.date ?? form.startDate,
                    start: last?.end ?? '',
                    end: '',
                  },
                ]);
              }}
            >
              <Plus /> 무대 추가
            </Button>
            <p className="text-[11px] text-muted-foreground">
              끝 시각이 시작보다 이르면 다음 날 새벽으로 봐요. 무대를 추가하려면 스테이지가 하나 이상 있어야 해요.
            </p>
          </div>
        </Section>
      )}

      {/* 긴 폼에서도 저장 버튼이 보이게 아래에 붙인다. 배경은 페이지와 같은 색 (스크롤하는 내용이 비치지 않게 불투명). */}
      <div className="admin-page-bg sticky bottom-0 flex items-center gap-2 border-t py-3">
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
