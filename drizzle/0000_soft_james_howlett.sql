CREATE TYPE "public"."report_status" AS ENUM('pending', 'added', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."show_category" AS ENUM('indie', 'overseas', 'festival');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "accounts" (
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "artist_follows" (
	"user_id" text NOT NULL,
	"artist_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "artist_follows_user_id_artist_id_pk" PRIMARY KEY("user_id","artist_id")
);
--> statement-breakpoint
CREATE TABLE "artists" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"image" text,
	"genres" text[] DEFAULT '{}'::text[] NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"is_editor_pick" boolean DEFAULT false NOT NULL,
	"spotify_artist_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pick_issues" (
	"vol" integer PRIMARY KEY NOT NULL,
	"published_at" date NOT NULL,
	"curator" text NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pick_items" (
	"issue_vol" integer NOT NULL,
	"show_id" text NOT NULL,
	"description" text NOT NULL,
	"is_main" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "pick_items_issue_vol_show_id_pk" PRIMARY KEY("issue_vol","show_id")
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "reports_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" text,
	"title" text NOT NULL,
	"artist" text,
	"date" text,
	"venue" text,
	"link" text,
	"message" text,
	"status" "report_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "show_artists" (
	"show_id" text NOT NULL,
	"artist_id" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "show_artists_show_id_artist_id_pk" PRIMARY KEY("show_id","artist_id")
);
--> statement-breakpoint
CREATE TABLE "show_likes" (
	"user_id" text NOT NULL,
	"show_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "show_likes_user_id_show_id_pk" PRIMARY KEY("user_id","show_id")
);
--> statement-breakpoint
CREATE TABLE "shows" (
	"id" text PRIMARY KEY NOT NULL,
	"category" "show_category" NOT NULL,
	"title" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"start_time" time,
	"time_zone" text DEFAULT 'Asia/Seoul' NOT NULL,
	"venue" text NOT NULL,
	"image" text,
	"description" text,
	"price" text,
	"sold_out" boolean DEFAULT false NOT NULL,
	"ticket_open_at" timestamp with time zone,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "slot_picks" (
	"user_id" text NOT NULL,
	"slot_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "slot_picks_user_id_slot_id_pk" PRIMARY KEY("user_id","slot_id")
);
--> statement-breakpoint
CREATE TABLE "stages" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "stages_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"show_id" text NOT NULL,
	"name" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "stages_show_id_id_uq" UNIQUE("show_id","id")
);
--> statement-breakpoint
CREATE TABLE "ticket_vendors" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ticket_vendors_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"show_id" text NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timetable_slots" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "timetable_slots_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"show_id" text NOT NULL,
	"stage_id" integer NOT NULL,
	"artist_id" text NOT NULL,
	"date" date NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"email_verified" timestamp with time zone,
	"image" text,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artist_follows" ADD CONSTRAINT "artist_follows_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artist_follows" ADD CONSTRAINT "artist_follows_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pick_items" ADD CONSTRAINT "pick_items_issue_vol_pick_issues_vol_fk" FOREIGN KEY ("issue_vol") REFERENCES "public"."pick_issues"("vol") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pick_items" ADD CONSTRAINT "pick_items_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "show_artists" ADD CONSTRAINT "show_artists_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "show_artists" ADD CONSTRAINT "show_artists_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "show_likes" ADD CONSTRAINT "show_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "show_likes" ADD CONSTRAINT "show_likes_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slot_picks" ADD CONSTRAINT "slot_picks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slot_picks" ADD CONSTRAINT "slot_picks_slot_id_timetable_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."timetable_slots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stages" ADD CONSTRAINT "stages_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_vendors" ADD CONSTRAINT "ticket_vendors_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_show_id_stage_id_stages_show_id_id_fk" FOREIGN KEY ("show_id","stage_id") REFERENCES "public"."stages"("show_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_user_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "artist_follows_artist_idx" ON "artist_follows" USING btree ("artist_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pick_items_one_main_uq" ON "pick_items" USING btree ("issue_vol") WHERE "pick_items"."is_main";--> statement-breakpoint
CREATE INDEX "reports_status_idx" ON "reports" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "show_artists_artist_idx" ON "show_artists" USING btree ("artist_id");--> statement-breakpoint
CREATE INDEX "shows_start_date_idx" ON "shows" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "shows_ticket_open_idx" ON "shows" USING btree ("ticket_open_at");--> statement-breakpoint
CREATE INDEX "ticket_vendors_show_idx" ON "ticket_vendors" USING btree ("show_id");--> statement-breakpoint
CREATE INDEX "timetable_slots_show_idx" ON "timetable_slots" USING btree ("show_id","date");