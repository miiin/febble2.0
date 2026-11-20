CREATE TYPE "public"."report_source" AS ENUM('user', 'kopis');--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "source" "report_source" DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "external_id" text;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "poster" text;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_external_id_unique" UNIQUE("external_id");