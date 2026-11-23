'use server';

import { and, eq, notInArray, sql } from 'drizzle-orm';
import { updateTag } from 'next/cache';
import { db } from '@/db';
import { type ShowDetails, shows, showArtists, stages, ticketVendors, timetableSlots } from '@/db/schema';
import { assertAdmin } from '@/lib/admin/guard';
import { copyRemoteImage } from '@/lib/admin/remoteImage';
import { type ActionResult, check, DATE_RE, InputError, isReferenced, normalizeSlug, pgCode, SLUG_RE, TIME_RE, toResult } from '@/lib/admin/validate';
import { keyFromUrl } from '@/lib/storage';

export type ShowInput = {
  id: string;
  category: 'indie' | 'overseas' | 'festival';
  title: string;
  startDate: string;
  endDate: string;
  startTime: string; // 'HH:mm' 또는 ''
  timeZone: string;
  venue: string;
  image: string;
  description: string;
  price: string;
  /** 공연 현지 시각 'YYYY-MM-DDTHH:mm' 또는 '' */
  ticketOpenAt: string;
  soldOut: boolean;
  isPublished: boolean;
  artistIds: string[];
  vendors: { name: string; url: string }[];
  /** id 가 있으면 기존 스테이지. key 는 화면에서 무대가 스테이지를 가리키는 값 */
  stages: { id?: number; key: string; name: string }[];
  slots: { id?: number; stageKey: string; artistId: string; date: string; start: string; end: string }[];
  /** KOPIS 공연 ID 또는 '' */
  kopisId: string;
  details: ShowDetails;
};

// 빈 문구는 빼고, 모두 비면 null 로 저장한다.
function cleanDetails(details: ShowDetails): ShowDetails | null {
  const { images = [], ...texts } = details;
  const cleaned: ShowDetails = Object.fromEntries(
    Object.entries(texts).flatMap(([key, value]) => (typeof value === 'string' && value.trim() ? [[key, value.trim()]] : [])),
  );
  const urls = images.filter((url) => /^https:\/\//.test(url));
  if (urls.length) cleaned.images = urls;
  return Object.keys(cleaned).length ? cleaned : null;
}

const empty = (value: string) => (value.trim() === '' ? null : value.trim());

function validate(input: ShowInput) {
  check(SLUG_RE.test(input.id), 'id 는 영문 소문자·숫자·하이픈으로 적어주세요 (예: busan-rock-2027)');
  check(['indie', 'overseas', 'festival'].includes(input.category), '분류를 골라주세요');
  check(input.title.trim(), '공연 이름을 적어주세요');
  check(input.venue.trim(), '장소를 적어주세요');
  check(DATE_RE.test(input.startDate) && DATE_RE.test(input.endDate), '날짜를 골라주세요');
  check(input.startDate <= input.endDate, '끝나는 날이 시작일보다 빨라요');
  check(!input.startTime || TIME_RE.test(input.startTime), '시작 시각 형식이 맞지 않아요');
  check(!input.ticketOpenAt || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(input.ticketOpenAt), '티켓 오픈 시각 형식이 맞지 않아요');
  try {
    new Intl.DateTimeFormat('en', { timeZone: input.timeZone });
  } catch {
    throw new InputError(`시간대가 올바르지 않아요: ${input.timeZone} (예: Asia/Seoul)`);
  }
  check(new Set(input.artistIds).size === input.artistIds.length, '라인업에 같은 아티스트가 두 번 있어요');
  for (const vendor of input.vendors)
    check(vendor.name.trim() && /^https?:\/\//.test(vendor.url.trim()), '예매처는 이름과 http(s) 주소를 모두 적어주세요');
  for (const stage of input.stages) check(stage.name.trim(), '스테이지 이름을 적어주세요');
  const stageKeys = new Set(input.stages.map((stage) => stage.key));
  for (const slot of input.slots) {
    check(stageKeys.has(slot.stageKey), '무대의 스테이지를 골라주세요');
    check(slot.artistId, '무대의 아티스트를 골라주세요');
    check(DATE_RE.test(slot.date) && TIME_RE.test(slot.start) && TIME_RE.test(slot.end), '무대의 날짜·시간을 채워주세요');
    check(input.startDate <= slot.date && slot.date <= input.endDate, `무대 날짜(${slot.date})가 공연 기간 밖이에요`);
  }
}

/** existingId 가 없으면 새로 만든다. id 는 주소와 다른 테이블이 쓰므로 만든 뒤에는 바꾸지 않는다. */
export async function saveShow(existingId: string | null, input: ShowInput): Promise<ActionResult & { image?: string }> {
  await assertAdmin();
  const id = existingId ?? normalizeSlug(input.id);
  let image: string | null;
  try {
    validate({ ...input, id });
    image = await ownImage(input.image);
    const values = {
      category: input.category,
      title: input.title.trim(),
      startDate: input.startDate,
      endDate: input.endDate,
      startTime: empty(input.startTime),
      timeZone: input.timeZone,
      venue: input.venue.trim(),
      image,
      description: empty(input.description),
      price: empty(input.price),
      // 입력은 공연 현지 시각이다.
      ticketOpenAt: input.ticketOpenAt ? sql`(${input.ticketOpenAt.replace('T', ' ')}::timestamp AT TIME ZONE ${input.timeZone})` : null,
      soldOut: input.soldOut,
      isPublished: input.isPublished,
      kopisId: empty(input.kopisId),
      details: cleanDetails(input.details),
    };

    await db.transaction(async (tx) => {
      if (existingId) {
        await tx.update(shows).set(values).where(eq(shows.id, id));
      } else {
        try {
          await tx.insert(shows).values({ id, ...values });
        } catch (error) {
          if (pgCode(error) === '23505') throw new InputError(`이미 있는 id 예요: ${id}`);
          throw error;
        }
      }

      // 라인업·예매처는 다른 곳에서 참조하지 않아 통째로 바꾼다.
      await tx.delete(showArtists).where(eq(showArtists.showId, id));
      if (input.artistIds.length)
        await tx.insert(showArtists).values(input.artistIds.map((artistId, position) => ({ showId: id, artistId, position })));
      await tx.delete(ticketVendors).where(eq(ticketVendors.showId, id));
      if (input.vendors.length)
        await tx
          .insert(ticketVendors)
          .values(input.vendors.map((vendor, position) => ({ showId: id, name: vendor.name.trim(), url: vendor.url.trim(), position })));

      // 타임테이블은 사용자가 담아둔 무대(slot_picks)가 있어서 id 를 유지한 채 바뀐 것만 고친다.
      // 화면에서 지운 스테이지·무대만 지운다 (담아둔 기록도 같이 지워진다).
      const keepStageIds = input.stages.flatMap((stage) => (stage.id ? [stage.id] : []));
      await tx.delete(stages).where(and(eq(stages.showId, id), keepStageIds.length ? notInArray(stages.id, keepStageIds) : undefined));
      const stageIdByKey = new Map<string, number>();
      for (const [position, stage] of input.stages.entries()) {
        if (stage.id) {
          const [row] = await tx
            .update(stages)
            .set({ name: stage.name.trim(), position })
            .where(and(eq(stages.id, stage.id), eq(stages.showId, id)))
            .returning({ id: stages.id });
          check(row, '다른 공연의 스테이지는 고칠 수 없어요');
          stageIdByKey.set(stage.key, row.id);
        } else {
          const [row] = await tx.insert(stages).values({ showId: id, name: stage.name.trim(), position }).returning({ id: stages.id });
          stageIdByKey.set(stage.key, row.id);
        }
      }

      const keepSlotIds = input.slots.flatMap((slot) => (slot.id ? [slot.id] : []));
      await tx
        .delete(timetableSlots)
        .where(and(eq(timetableSlots.showId, id), keepSlotIds.length ? notInArray(timetableSlots.id, keepSlotIds) : undefined));
      for (const slot of input.slots) {
        const slotValues = {
          stageId: stageIdByKey.get(slot.stageKey)!,
          artistId: slot.artistId,
          date: slot.date,
          startTime: slot.start,
          endTime: slot.end,
        };
        if (slot.id) {
          const [row] = await tx
            .update(timetableSlots)
            .set(slotValues)
            .where(and(eq(timetableSlots.id, slot.id), eq(timetableSlots.showId, id)))
            .returning({ id: timetableSlots.id });
          check(row, '다른 공연의 무대는 고칠 수 없어요');
        } else {
          await tx.insert(timetableSlots).values({ showId: id, ...slotValues });
        }
      }
    });
  } catch (error) {
    return toResult(error);
  }
  updateTag('catalog');
  return { id, image: image ?? '' };
}

/** 외부 이미지 주소는 R2 로 복사한 주소로 바꾼다 (R2·/images/ 주소는 그대로). */
async function ownImage(value: string) {
  const url = empty(value);
  if (!url || url.startsWith('/') || keyFromUrl(url)) return url;
  check(/^https?:\/\//.test(url), '이미지 주소가 올바르지 않아요');
  const copied = await copyRemoteImage(url);
  check(copied, '이미지 주소에서 이미지를 가져오지 못했어요. 파일로 올려주세요.');
  return copied!;
}

export async function deleteShow(id: string): Promise<ActionResult> {
  await assertAdmin();
  try {
    await db.delete(shows).where(eq(shows.id, id));
  } catch (error) {
    if (isReferenced(error)) return { error: 'Pick 호에 들어간 공연은 지울 수 없어요. 비공개로 바꾸거나 Pick 에서 먼저 빼주세요.' };
    throw error;
  }
  updateTag('catalog');
  return { id };
}
