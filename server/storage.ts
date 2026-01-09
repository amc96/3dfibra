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
          name: "Essencial",
          speed: "400 MEGA",
          price: "89,90",
          features: ["Wi-Fi 6 Grátis", "Instalação Grátis", "Suporte 24h", "Fibra Óptica"],
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
          speed: "600 MEGA",
          price: "109,90",
          features: ["Wi-Fi 6 Mesh", "Instalação Grátis", "Suporte VIP", "Ultra Velocidade"],
          category: "internet",
          isHighlighted: false
        },
        {
          name: "Ultra",
          speed: "700 MEGA",
          price: "119,90",
          features: ["Wi-Fi 6 Mesh", "Instalação Grátis", "Suporte VIP", "Ultra Velocidade"],
          category: "internet",
          isHighlighted: false
        },
        {
          name: "Gamer",
          speed: "800 MEGA",
          price: "129,90",
          features: ["Wi-Fi 6 Mesh", "IP Fixo Opcional", "Latência Baixa", "Upload Simétrico"],
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
          name: "Canais Light",
          speed: "100+ Canais",
          price: "17,90",
          features: ["Canais Abertos", "Canais Infantis", "Qualidade HD"],
          category: "tv",
          isHighlighted: false
        },
        {
          name: "Canais Plus",
          speed: "150+ Canais",
          price: "39,90",
          features: ["Canais de Filmes", "Esportes", "Qualidade HD"],
          category: "tv",
          isHighlighted: false
        },
        {
          name: "Canais Ultra",
          speed: "200+ Canais",
          price: "53,90",
          features: ["Premium", "Esportes ao Vivo", "Qualidade 4K"],
          category: "tv",
          isHighlighted: true
        },
        {
          name: "Canais Ultra 1P + HBO",
          speed: "200+ Canais + HBO",
          price: "70,90",
          features: ["Tudo do Ultra", "HBO Max Incluso", "Qualidade 4K", "Playback 24h"],
          category: "tv",
          isHighlighted: false
        },
        {
          name: "Câmera de Segurança",
          speed: "Câmera",
          price: "25,00",
          features: ["Acesso via App", "Gravação em Nuvem", "Detector de Movimento", "Visão Noturna"],
          category: "adicionais",
          isHighlighted: false
        },
        {
          name: "Roteador Extra",
          speed: "WIFI 6",
          price: "25,00",
          features: ["Maior Alcance", "Tecnologia Mesh", "Fácil Configuração", "Gigabit"],
          category: "adicionais",
          isHighlighted: false
        },
        {
          name: "TV Box",
          speed: "Android TV",
          price: "25,00",
          features: ["Transforma sua TV", "Acesso a Apps", "Resolução 4K", "Controle Remoto"],
          category: "adicionais",
          isHighlighted: false
        }
      ]);
    }
  }
}

export const storage = new DatabaseStorage();
