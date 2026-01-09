import { plans, type Plan, type InsertPlan } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getPlans(): Promise<Plan[]>;
  getPlan(id: number): Promise<Plan | undefined>;
  seedPlans(): Promise<void>;
}

const INITIAL_PLANS: InsertPlan[] = [
  {
    name: "Básico",
    speed: "300 MEGA",
    price: "77,90",
    features: ["Wi-Fi Grátis", "Instalação Grátis", "Suporte 24h", "Fibra Óptica"],
    category: "internet",
    isHighlighted: false
  },
  {
    name: "Essencial",
    speed: "400 MEGA",
    price: "87,90",
    features: ["Wi-Fi Grátis", "Instalação Grátis", "Suporte 24h", "Fibra Óptica"],
    category: "internet",
    isHighlighted: false
  },
  {
    name: "Intermediário",
    speed: "500 MEGA",
    price: "97,90",
    features: ["Wi-Fi Grátis", "Instalação Grátis", "Suporte 24h", "Fibra Óptica"],
    category: "internet",
    isHighlighted: true
  },
  {
    name: "Avançado",
    speed: "600 MEGA",
    price: "107,90",
    features: ["Wi-Fi Grátis", "Instalação Grátis", "Suporte 24h", "Fibra Óptica"],
    category: "internet",
    isHighlighted: false
  },
  {
    name: "Ultra",
    speed: "700 MEGA",
    price: "117,90",
    features: ["Wi-Fi Grátis", "Instalação Grátis", "Suporte 24h", "Fibra Óptica"],
    category: "internet",
    isHighlighted: false
  },
  {
    name: "Gamer",
    speed: "800 MEGA",
    price: "127,90",
    features: ["Wi-Fi Grátis", "Instalação Grátis", "Suporte 24h", "Fibra Óptica"],
    category: "internet",
    isHighlighted: false
  },
  {
    name: "Premium",
    speed: "900 MEGA",
    price: "137,90",
    features: ["Wi-Fi Grátis", "Instalação Grátis", "Suporte 24h", "Fibra Óptica"],
    category: "internet",
    isHighlighted: false
  },
  {
    name: "Canais Light",
    speed: "100+ Canais",
    price: "17,90",
    features: ["Canais abertos entre outros", "Qualidade HD", "Suporte para TV, iOS, Android e Web", "Lista de canais"],
    category: "tv",
    isHighlighted: false
  },
  {
    name: "Canais Plus",
    speed: "150+ Canais",
    price: "39,90",
    features: ["Canais abertos entre outros", "Qualidade HD", "Suporte para TV, iOS, Android e Web", "Lista de canais"],
    category: "tv",
    isHighlighted: false
  },
  {
    name: "Canais Ultra",
    speed: "200+ Canais",
    price: "53,90",
    features: ["Canais abertos entre outros", "Qualidade HD", "Suporte para TV, iOS, Android e Web", "Lista de canais"],
    category: "tv",
    isHighlighted: true
  },
  {
    name: "Canais Ultra 1P + HBO",
    speed: "200+ Canais + HBO",
    price: "70,90",
    features: ["Canais abertos entre outros", "Qualidade HD", "Suporte para TV, iOS, Android e Web", "Lista de canais"],
    category: "tv",
    isHighlighted: false
  },
  {
    name: "Câmera de Segurança",
    speed: "Câmera",
    price: "25,00",
    features: ["Acesse de onde estiver", "Aplicativo para Android e iOS", "Visão Noturna", "Câmera Full HD"],
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
    features: ["Transforma sua TV", "Acesso a Apps", "Resolução Full HD", "Controle Remoto"],
    category: "adicionais",
    isHighlighted: false
  }
];

export class HybridStorage implements IStorage {
  private memPlans: Plan[] = [];
  private useMemoryFallback: boolean = false;

  constructor() {
    this.memPlans = INITIAL_PLANS.map((p, i) => ({
      ...p,
      id: i + 1,
      description: p.description ?? null,
      isHighlighted: p.isHighlighted ?? false,
      category: p.category ?? "internet",
      features: [...p.features]
    }));
    if (!process.env.DATABASE_URL) {
      console.warn("DATABASE_URL not set, using memory storage fallback");
      this.useMemoryFallback = true;
    }
  }

  async getPlans(): Promise<Plan[]> {
    if (this.useMemoryFallback) return this.memPlans;
    try {
      return await db.select().from(plans);
    } catch (err) {
      console.error("Database error in getPlans, falling back to memory:", err);
      this.useMemoryFallback = true;
      return this.memPlans;
    }
  }

  async getPlan(id: number): Promise<Plan | undefined> {
    if (this.useMemoryFallback) return this.memPlans.find(p => p.id === id);
    try {
      const results = await db.select().from(plans).where(eq(plans.id, id));
      return results[0];
    } catch (err) {
      console.error("Database error in getPlan, falling back to memory:", err);
      this.useMemoryFallback = true;
      return this.memPlans.find(p => p.id === id);
    }
  }

  async seedPlans(): Promise<void> {
    if (this.useMemoryFallback) return;
    try {
      const existing = await db.select().from(plans);
      if (existing.length === 0) {
        await db.insert(plans).values(INITIAL_PLANS as any);
        console.log("Database seeded successfully");
      }
    } catch (err) {
      console.error("Seed failed, switching to memory fallback:", err);
      this.useMemoryFallback = true;
    }
  }
}

export const storage = new HybridStorage();
