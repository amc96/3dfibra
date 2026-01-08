import { db } from "./db";
import { plans, type Plan, type InsertPlan } from "@shared/schema";
import { eq } from "drizzle-orm";

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
    const results = await db.select().from(plans).where(eq(plans.id, id));
    return results[0];
  }

  async seedPlans(): Promise<void> {
    const existing = await db.select().from(plans);
    if (existing.length === 0) {
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
          name: "Intermediário",
          speed: "500 MEGA",
          price: "99,90",
          features: ["Wi-Fi 6 Grátis", "Instalação Grátis", "Suporte Prioritário", "Ideal para Streaming"],
          category: "internet",
          isHighlighted: true
        },
        {
          name: "Avançado",
          speed: "700 MEGA",
          price: "119,90",
          features: ["Wi-Fi 6 Mesh", "Instalação Grátis", "Suporte VIP", "Ultra Velocidade"],
          category: "internet",
          isHighlighted: false
        },
        {
          name: "Premium",
          speed: "900 MEGA",
          price: "139,90",
          features: ["Wi-Fi 6 Mesh Plus", "IP Fixo Opcional", "Latência Baixa", "Upload Simétrico"],
          category: "internet",
          isHighlighted: false
        },
        {
          name: "TV Light",
          speed: "100 Canais",
          price: "49,90",
          features: ["Canais Abertos", "Canais Infantis", "Qualidade HD"],
          category: "tv",
          isHighlighted: false
        },
        {
          name: "TV Premium",
          speed: "200 Canais",
          price: "89,90",
          features: ["Canais de Filmes", "Esportes ao Vivo", "Qualidade 4K", "Playback 24h"],
          category: "tv",
          isHighlighted: true
        },
        {
          name: "Câmeras de Segurança",
          speed: "Monitoramento 24h",
          price: "49,90",
          features: ["Acesso via App", "Gravação em Nuvem", "Detector de Movimento", "Visão Noturna"],
          category: "adicionais",
          isHighlighted: false
        }
      ]);
    }
  }
}

export const storage = new DatabaseStorage();
