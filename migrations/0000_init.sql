CREATE TABLE IF NOT EXISTS "plans" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "speed" text NOT NULL,
        "price" text NOT NULL,
        "description" text,
        "features" jsonb NOT NULL,
        "is_highlighted" boolean DEFAULT false,
        "category" text DEFAULT 'internet'
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "settings" (
        "id" serial PRIMARY KEY NOT NULL,
        "key" text NOT NULL,
        "value" text NOT NULL,
        CONSTRAINT "settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tv_channels" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "logo_url" text DEFAULT '' NOT NULL,
        "group" text DEFAULT 'Geral' NOT NULL,
        "sort_order" integer DEFAULT 0 NOT NULL
);
