import { pgTable, text, serial, boolean, jsonb, integer, primaryKey, customType, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const plans = pgTable("plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  speed: text("speed").notNull(),
  price: text("price").notNull(),
  description: text("description"),
  features: jsonb("features").$type<string[]>().notNull(),
  isHighlighted: boolean("is_highlighted").default(false),
  category: text("category").default("internet"),
});

export const insertPlanSchema = createInsertSchema(plans);
export const updatePlanSchema = insertPlanSchema.partial();

export type Plan = typeof plans.$inferSelect;
export type InsertPlan = z.infer<typeof insertPlanSchema>;
export type UpdatePlan = z.infer<typeof updatePlanSchema>;

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

export const insertSettingSchema = createInsertSchema(settings).omit({ id: true });
export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;

// TV Channels catalog
export const tvChannels = pgTable("tv_channels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  logoUrl: text("logo_url").notNull().default(""),
  group: text("group").notNull().default("Geral"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const insertTvChannelSchema = createInsertSchema(tvChannels).omit({ id: true });
export const updateTvChannelSchema = insertTvChannelSchema.partial();

export type TvChannel = typeof tvChannels.$inferSelect;
export type InsertTvChannel = z.infer<typeof insertTvChannelSchema>;
export type UpdateTvChannel = z.infer<typeof updateTvChannelSchema>;

const bytea = customType<{ data: Buffer }>({ dataType: () => "bytea" });

// Images sent through the admin panel (logos, banners, channel logos).
// Kept in the database so they survive deploys on hosts without a disk volume.
export const uploadedFiles = pgTable("uploaded_files", {
  path: text("path").primaryKey(), // e.g. "site/123.png" (served at /uploads/site/123.png)
  mimeType: text("mime_type").notNull().default("application/octet-stream"),
  data: bytea("data").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Which channels each TV plan includes (removed automatically with the plan or channel)
export const planChannels = pgTable(
  "plan_channels",
  {
    planId: integer("plan_id").notNull().references(() => plans.id, { onDelete: "cascade" }),
    channelId: integer("channel_id").notNull().references(() => tvChannels.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.planId, t.channelId] })],
);

// Home page rotating banner (stored as JSON in the "banners" setting)
export const bannerSlideSchema = z.object({
  id: z.string().min(1),
  imageUrl: z.string().default(""),
  mobileImageUrl: z.string().default(""),
  title: z.string().default(""),
  subtitle: z.string().default(""),
  buttonText: z.string().default(""),
  link: z.string().default(""),
  active: z.boolean().default(true),
});
export const bannerSlidesSchema = z.array(bannerSlideSchema);

export type BannerSlide = z.infer<typeof bannerSlideSchema>;

export interface BannerConfig {
  enabled: boolean;
  interval: number; // seconds
  slides: BannerSlide[];
}
