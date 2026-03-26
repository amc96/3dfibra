import { pgTable, text, serial, boolean, jsonb } from "drizzle-orm/pg-core";
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
