// febble 2.0 DB 스키마 (Neon Postgres + Drizzle).
// src/mocks/ 의 타입을 그대로 옮겼다. 공연·아티스트 id 는 URL 에 쓰는 slug 를 그대로 기본키로 쓴다.
import { sql } from 'drizzle-orm';
import {
  boolean,
  date,
  foreignKey,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  time,
  timestamp,
  unique,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();

// ─── 유저 (Auth.js Drizzle 어댑터 형식) ───────────────────────────

export const userRole = pgEnum('user_role', ['user', 'admin']);

export const users = pgTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  /** 카카오는 이메일 동의를 안 하면 비어 있다. */
  email: text('email').unique(),
  emailVerified: timestamp('email_verified', { withTimezone: true, mode: 'date' }),
  image: text('image'),
  /** admin 이면 /admin(CMS) 에 들어갈 수 있다. */
  role: userRole('role').notNull().default('user'),
  createdAt: createdAt(),
});

/** 로그인 방식(kakao/google)별 계정. 마이페이지의 "카카오로 로그인" 은 여기서 읽는다. */
export const accounts = pgTable(
  'accounts',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] }), index('accounts_user_idx').on(t.userId)],
);

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { withTimezone: true, mode: 'date' }).notNull(),
});

// ─── 아티스트 ─────────────────────────────────────────────────────

export const artists = pgTable('artists', {
  id: text('id').primaryKey(), // slug, 예: 'silica-gel'
  name: text('name').notNull(),
  image: text('image'),
  genres: text('genres').array().notNull().default(sql`'{}'::text[]`),
  bio: text('bio').notNull().default(''),
  /** 비로그인 For you 배너에서 일정 있는 아티스트가 모자라면 이 아티스트로 채운다. */
  isEditorPick: boolean('is_editor_pick').notNull().default(false),
  /** 있으면 미리듣기 임베드를 띄운다. */
  spotifyArtistId: text('spotify_artist_id'),
  /** Spotify 프로필 사진 주소 (복사하지 않고 원본 주소를 쓴다). image 가 없을 때 대신 보여준다. */
  spotifyImageUrl: text('spotify_image_url'),
  createdAt: createdAt(),
});
// followerCount 는 컬럼으로 두지 않고 artist_follows 를 세서 구한다.

// ─── 공연 ─────────────────────────────────────────────────────────

export const showCategory = pgEnum('show_category', ['indie', 'overseas', 'festival']);

export const shows = pgTable(
  'shows',
  {
    id: text('id').primaryKey(), // slug, 예: 'busan-rock-2027'
    category: showCategory('category').notNull(),
    title: text('title').notNull(),
    startDate: date('start_date').notNull(), // 'YYYY-MM-DD'
    endDate: date('end_date').notNull(),
    /** 없으면 캘린더에 종일 일정으로 들어간다. */
    startTime: time('start_time'), // 'HH:mm:ss'
    /** IANA 시간대. 해외 공연은 꼭 바꾼다 (캘린더 시간이 어긋나지 않게). */
    timeZone: text('time_zone').notNull().default('Asia/Seoul'),
    venue: text('venue').notNull(),
    image: text('image'),
    description: text('description'),
    /** '77,000원' 처럼 화면에 보이는 문구 그대로. */
    price: text('price'),
    soldOut: boolean('sold_out').notNull().default(false),
    /** 공연 시간대 기준 시각을 절대 시각으로 저장한다. */
    ticketOpenAt: timestamp('ticket_open_at', { withTimezone: true }),
    /** 공개 여부. CMS 에서 작성 중인 공연은 false 로 숨긴다. */
    isPublished: boolean('is_published').notNull().default(false),
    /** 홈 New 섹션은 이 값 최신순. */
    createdAt: createdAt(),
  },
  (t) => [index('shows_start_date_idx').on(t.startDate), index('shows_ticket_open_idx').on(t.ticketOpenAt)],
);

/** 라인업. position 은 라인업 표시 순서. */
export const showArtists = pgTable(
  'show_artists',
  {
    showId: text('show_id')
      .notNull()
      .references(() => shows.id, { onDelete: 'cascade' }),
    artistId: text('artist_id')
      .notNull()
      .references(() => artists.id, { onDelete: 'restrict' }),
    position: integer('position').notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.showId, t.artistId] }), index('show_artists_artist_idx').on(t.artistId)],
);

/** 예매처. 여러 곳이면 하단 버튼에서 선택 시트를 띄운다. */
export const ticketVendors = pgTable(
  'ticket_vendors',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    showId: text('show_id')
      .notNull()
      .references(() => shows.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    url: text('url').notNull(),
    position: integer('position').notNull().default(0),
  },
  (t) => [index('ticket_vendors_show_idx').on(t.showId)],
);

// ─── 타임테이블 (페스티벌) ─────────────────────────────────────────

export const stages = pgTable(
  'stages',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    showId: text('show_id')
      .notNull()
      .references(() => shows.id, { onDelete: 'cascade' }),
    name: text('name').notNull(), // 'MAIN', 'GREEN'
    position: integer('position').notNull().default(0),
  },
  (t) => [unique('stages_show_id_id_uq').on(t.showId, t.id)],
);

export const timetableSlots = pgTable(
  'timetable_slots',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    showId: text('show_id').notNull(),
    stageId: integer('stage_id').notNull(),
    artistId: text('artist_id')
      .notNull()
      .references(() => artists.id, { onDelete: 'restrict' }),
    date: date('date').notNull(),
    startTime: time('start_time').notNull(),
    /** start 보다 이르면 다음 날 새벽으로 본다. */
    endTime: time('end_time').notNull(),
  },
  (t) => [
    // 슬롯의 스테이지가 같은 공연 소속인지 DB 가 보장한다.
    foreignKey({ columns: [t.showId, t.stageId], foreignColumns: [stages.showId, stages.id] }).onDelete('cascade'),
    index('timetable_slots_show_idx').on(t.showId, t.date),
  ],
);

// ─── Febble Pick ──────────────────────────────────────────────────

export const pickIssues = pgTable('pick_issues', {
  vol: integer('vol').primaryKey(),
  publishedAt: date('published_at').notNull(),
  curator: text('curator').notNull(),
  isPublished: boolean('is_published').notNull().default(false),
  createdAt: createdAt(),
});

/** 호마다 고른 공연과 에디터 코멘트. isMain 은 호당 하나. */
export const pickItems = pgTable(
  'pick_items',
  {
    issueVol: integer('issue_vol')
      .notNull()
      .references(() => pickIssues.vol, { onDelete: 'cascade' }),
    showId: text('show_id')
      .notNull()
      .references(() => shows.id, { onDelete: 'restrict' }),
    description: text('description').notNull(),
    isMain: boolean('is_main').notNull().default(false),
    position: integer('position').notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.issueVol, t.showId] }),
    uniqueIndex('pick_items_one_main_uq').on(t.issueVol).where(sql`${t.isMain}`),
  ],
);

// ─── 유저 활동 ────────────────────────────────────────────────────

export const artistFollows = pgTable(
  'artist_follows',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    artistId: text('artist_id')
      .notNull()
      .references(() => artists.id, { onDelete: 'cascade' }),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.artistId] }), index('artist_follows_artist_idx').on(t.artistId)],
);

export const showLikes = pgTable(
  'show_likes',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    showId: text('show_id')
      .notNull()
      .references(() => shows.id, { onDelete: 'cascade' }),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.showId] })],
);

/** 내 타임테이블에 담은 무대. */
export const slotPicks = pgTable(
  'slot_picks',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    slotId: integer('slot_id')
      .notNull()
      .references(() => timetableSlots.id, { onDelete: 'cascade' }),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.slotId] })],
);

// ─── 공연 제보 ────────────────────────────────────────────────────

export const reportStatus = pgEnum('report_status', ['pending', 'added', 'rejected']);

export const reports = pgTable(
  'reports',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    /** 비로그인 제보도 받는다. 탈퇴하면 제보는 남기고 작성자만 지운다. */
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    artist: text('artist'),
    date: text('date'), // 사용자가 적은 그대로
    venue: text('venue'),
    link: text('link'),
    message: text('message'),
    status: reportStatus('status').notNull().default('pending'),
    createdAt: createdAt(),
  },
  (t) => [index('reports_status_idx').on(t.status, t.createdAt)],
);
