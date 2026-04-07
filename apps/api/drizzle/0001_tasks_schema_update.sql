-- Remove existing task data to allow schema change (dev only)
DELETE FROM "tasks";--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "completed";--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "created_by" text NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
