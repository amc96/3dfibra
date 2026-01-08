import { db } from "./db";
import { plans, type Plan, type InsertPlan } from "@shared/schema";

export interface IStorage {
  getPlans(): Promise<Plan[]>;
  getPlan(id: number): Promise<Plan | undefined>;
  seedPlans(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getPlans(): Promise<Plan[]> {
    return await db.select().from(plans);
  }

  async getPlan(id: number): Promise<Plan | undefined> {
    // We don't really need individual plan fetch for a landing page, but good to have
    const results = await db.select().from(plans).where(plans.id.eq(id) as any); // Type assertion for drizzle weirdness if any
    return results[0];
  }

  async seedPlans(): Promise<void> {
    const count = await db.select().from(plans);
    if (count.length === 0) {
      await db.insert(plans).values([
        {
          name: "Básico",
          speed: "300 MEGA",
          price: "79,90",
          features: ["Wi-Fi Grátis", "Instalação Grátis", "Suporte 24h", "Fibra Óptica"],
          category: "internet",
          isHighlighted: false
        },
        {
          name: "Popular",
          speed: "500 MEGA",
          price: "99,90",
          features: ["Wi-Fi 6 Grátis", "Instalação Grátis", "Suporte Prioritário", "Ideal para Streaming"],
          category: "internet",
          isHighlighted: true
        },
        {
          name: "Gamer",
          speed: "800 MEGA",
          price: "129,90",
          features: ["Wi-Fi 6 Mesh", "IP Fixo Opcional", "Latência Baixa", "Upload Simétrico"],
          category: "internet",
          isHighlighted: false
        }
      ]);
    }
  }
}

export const storage = new DatabaseStorage();
