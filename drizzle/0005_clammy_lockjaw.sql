ALTER TABLE "shows" ADD COLUMN "published_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "following_seen_at" timestamp with time zone;--> statement-breakpoint
-- 이미 공개된 공연은 등록 시각을 공개 시각으로 둔다.
UPDATE "shows" SET "published_at" = "created_at" WHERE "is_published";
