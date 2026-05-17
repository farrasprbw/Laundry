ALTER TABLE "orders" ADD COLUMN "discount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "parfume" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "rating" integer;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "deleted_at" timestamp;