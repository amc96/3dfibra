import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const plans = pgTable("plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  speed: text("speed").notNull(), // e.g., "500 MEGA"
  price: text("price").notNull(), // e.g., "99,90"
  description: text("description"),
  features: jsonb("features").$type<string[]>().notNull(), // List of features
  isHighlighted: boolean("is_highlighted").default(false),
  category: text("category").default("internet"), // internet, combo, etc.
});

export const insertPlanSchema = createInsertSchema(plans);

export type Plan = typeof plans.$inferSelect;
export type InsertPlan = z.infer<typeof insertPlanSchema>;
