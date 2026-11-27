CREATE TYPE "public"."report_fit" AS ENUM('fit', 'unsure', 'unfit');--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "fit" "report_fit";--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "fit_reason" text;