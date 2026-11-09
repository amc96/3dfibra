CREATE TABLE "plan_channels" (
	"plan_id" integer NOT NULL,
	"channel_id" integer NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "plan_channels_plan_id_channel_id_pk" PRIMARY KEY("plan_id","channel_id")
);
--> statement-breakpoint
CREATE TABLE "uploaded_files" (
	"path" text PRIMARY KEY NOT NULL,
	"mime_type" text DEFAULT 'application/octet-stream' NOT NULL,
	"data" "bytea" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "plan_channels" ADD CONSTRAINT "plan_channels_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_channels" ADD CONSTRAINT "plan_channels_channel_id_tv_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."tv_channels"("id") ON DELETE cascade ON UPDATE no action;