import {
  plans,
  settings,
  tvChannels,
  type Plan,
  type InsertPlan,
  type UpdatePlan,
  type Setting,
  type TvChannel,
  type InsertTvChannel,
  type UpdateTvChannel,
} from "@shared/schema";
import { db } from "./db";
import { eq, asc } from "drizzle-orm";
import { PLUS_CHANNELS, ULTRA_CHANNELS, HBO_CHANNELS } from "@shared/channels";

export interface IStorage {
  getPlans(): Promise<Plan[]>;
  getPlan(id: number): Promise<Plan | undefined>;
  createPlan(plan: InsertPlan): Promise<Plan>;
  updatePlan(id: number, plan: UpdatePlan): Promise<Plan | undefined>;
  deletePlan(id: number): Promise<boolean>;
  seedPlans(): Promise<void>;
  seedSettings(): Promise<void>;
  getSetting(key: string): Promise<string | undefined>;
  setSetting(key: string, value: string): Promise<void>;
  getAllSettings(): Promise<Setting[]>;
  // TV Channels
  getTvChannels(): Promise<TvChannel[]>;
  getTvChannel(id: number): Promise<TvChannel | undefined>;
  createTvChannel(channel: InsertTvChannel): Promise<TvChannel>;
  updateTvChannel(id: number, channel: UpdateTvChannel): Promise<TvChannel | undefined>;
  deleteTvChannel(id: number): Promise<boolean>;
  seedTvChannels(): Promise<void>;
  // Plan-channel assignments (stored as setting plan_channels_{planId})
  getPlanChannelIds(planId: number): Promise<number[]>;
  setPlanChannelIds(planId: number, channelIds: number[]): Promise<void>;
}

const INITIAL_PLANS: InsertPlan[] = [
  {
    name: "Básico",
    speed: "300 MEGA",
    price: "77,90",
    features: ["Wi-Fi Grátis", "Instalação Grátis", "Suporte 24h", "Fibra Óptica"],
    category: "internet",
    isHighlighted: false,
  },
  {
    name: "Essencial",
    speed: "400 MEGA",
    price: "87,90",
    features: ["Wi-Fi Grátis", "Instalação Grátis", "Suporte 24h", "Fibra Óptica"],
    category: "internet",
    isHighlighted: false,
  },
  {
    name: "Intermediário",
    speed: "500 MEGA",
    price: "97,90",
    features: ["Wi-Fi Grátis", "Instalação Grátis", "Suporte 24h", "Fibra Óptica"],
    category: "internet",
    isHighlighted: true,
  },
  {
    name: "Avançado",
    speed: "600 MEGA",
    price: "107,90",
    features: ["Wi-Fi Grátis", "Instalação Grátis", "Suporte 24h", "Fibra Óptica"],
    category: "internet",
    isHighlighted: false,
  },
  {
    name: "Ultra",
    speed: "700 MEGA",
    price: "117,90",
    features: ["Wi-Fi Grátis", "Instalação Grátis", "Suporte 24h", "Fibra Óptica"],
    category: "internet",
    isHighlighted: false,
  },
  {
    name: "Gamer",
    speed: "800 MEGA",
    price: "127,90",
    features: ["Wi-Fi Grátis", "Instalação Grátis", "Suporte 24h", "Fibra Óptica"],
    category: "internet",
    isHighlighted: false,
  },
  {
    name: "Premium",
    speed: "900 MEGA",
    price: "137,90",
    features: ["Wi-Fi Grátis", "Instalação Grátis", "Suporte 24h", "Fibra Óptica"],
    category: "internet",
    isHighlighted: false,
  },
  {
    name: "Canais Light",
    speed: "100+ Canais",
    price: "17,90",
    features: ["Canais abertos entre outros", "Qualidade HD", "Suporte para TV, iOS, Android e Web", "Lista de canais"],
    category: "tv",
    isHighlighted: false,
  },
  {
    name: "Canais Plus",
    speed: "150+ Canais",
    price: "39,90",
    features: ["Canais abertos entre outros", "Qualidade HD", "Suporte para TV, iOS, Android e Web", "Lista de canais"],
    category: "tv",
    isHighlighted: false,
  },
  {
    name: "Canais Ultra",
    speed: "200+ Canais",
    price: "53,90",
    features: ["Canais abertos entre outros", "Qualidade HD", "Suporte para TV, iOS, Android e Web", "Lista de canais"],
    category: "tv",
    isHighlighted: true,
  },
  {
    name: "Canais Ultra 1P + HBO",
    speed: "200+ Canais + HBO",
    price: "70,90",
    features: ["Canais abertos entre outros", "Qualidade HD", "Suporte para TV, iOS, Android e Web", "Lista de canais"],
    category: "tv",
    isHighlighted: false,
  },
  {
    name: "Câmera de Segurança",
    speed: "Câmera",
    price: "25,00",
    features: ["Acesse de onde estiver", "Aplicativo para Android e iOS", "Visão Noturna", "Câmera Full HD"],
    category: "adicionais",
    isHighlighted: false,
  },
  {
    name: "Roteador Extra",
    speed: "WIFI 6",
    price: "25,00",
    features: ["Maior Alcance", "Tecnologia Mesh", "Fácil Configuração", "Gigabit"],
    category: "adicionais",
    isHighlighted: false,
  },
  {
    name: "TV Box",
    speed: "Android TV",
    price: "25,00",
    features: ["Transforma sua TV", "Acesso a Apps", "Resolução Full HD", "Controle Remoto"],
    category: "adicionais",
    isHighlighted: false,
  },
];

const DEFAULT_SETTINGS: { key: string; value: string }[] = [
  { key: "whatsapp_number", value: "5553999789222" },
  { key: "logo_url", value: "" },
  { key: "admin_password", value: "" },
  { key: "channels_light", value: JSON.stringify(PLUS_CHANNELS) },
  { key: "channels_plus", value: JSON.stringify(PLUS_CHANNELS) },
  { key: "channels_ultra", value: JSON.stringify(ULTRA_CHANNELS) },
  { key: "channels_hbo", value: JSON.stringify(HBO_CHANNELS) },
];

// Seed TV channels from the existing ULTRA_CHANNELS list (deduplicated by name)
function buildInitialTvChannels(): InsertTvChannel[] {
  const seen = new Set<string>();
  const result: InsertTvChannel[] = [];
  let order = 0;
  for (const ch of ULTRA_CHANNELS) {
    if (!seen.has(ch.name)) {
      seen.add(ch.name);
      result.push({
        name: ch.name,
        logoUrl: "",
        group: ch.category,
        sortOrder: order++,
      });
    }
  }
  // Add HBO-only channels
  for (const ch of HBO_CHANNELS) {
    if (!seen.has(ch.name)) {
      seen.add(ch.name);
      result.push({
        name: ch.name,
        logoUrl: "",
        group: ch.category,
        sortOrder: order++,
      });
    }
  }
  return result;
}

export class HybridStorage implements IStorage {
  private memPlans: Plan[] = [];
  private memSettings: Map<string, string> = new Map();
  private memTvChannels: TvChannel[] = [];
  private useMemoryFallback: boolean = false;

  constructor() {
    this.memPlans = INITIAL_PLANS.map((p, i) => ({
      ...p,
      id: i + 1,
      description: p.description ?? null,
      isHighlighted: p.isHighlighted ?? false,
      category: p.category ?? "internet",
      features: [...p.features],
    }));
    for (const s of DEFAULT_SETTINGS) {
      this.memSettings.set(s.key, s.value);
    }
    const initialChannels = buildInitialTvChannels();
    this.memTvChannels = initialChannels.map((c, i) => ({ ...c, id: i + 1 }));
    if (!process.env.DATABASE_URL) {
      console.warn("DATABASE_URL not set, using memory storage fallback");
      this.useMemoryFallback = true;
    }
  }

  // ─── Plans ─────────────────────────────────────────────────────────────────

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
    if (this.useMemoryFallback) return this.memPlans.find((p) => p.id === id);
    try {
      const results = await db.select().from(plans).where(eq(plans.id, id));
      return results[0];
    } catch (err) {
      console.error("Database error in getPlan, falling back to memory:", err);
      this.useMemoryFallback = true;
      return this.memPlans.find((p) => p.id === id);
    }
  }

  async createPlan(plan: InsertPlan): Promise<Plan> {
    if (this.useMemoryFallback) {
      const newId = Math.max(0, ...this.memPlans.map((p) => p.id)) + 1;
      const newPlan: Plan = {
        ...plan,
        id: newId,
        description: plan.description ?? null,
        isHighlighted: plan.isHighlighted ?? false,
        category: plan.category ?? "internet",
      };
      this.memPlans.push(newPlan);
      return newPlan;
    }
    try {
      const results = await db.insert(plans).values(plan as any).returning();
      return results[0];
    } catch (err) {
      console.error("Database error in createPlan, falling back to memory:", err);
      this.useMemoryFallback = true;
      return this.createPlan(plan);
    }
  }

  async updatePlan(id: number, plan: UpdatePlan): Promise<Plan | undefined> {
    if (this.useMemoryFallback) {
      const idx = this.memPlans.findIndex((p) => p.id === id);
      if (idx === -1) return undefined;
      this.memPlans[idx] = { ...this.memPlans[idx], ...plan };
      return this.memPlans[idx];
    }
    try {
      const results = await db.update(plans).set(plan as any).where(eq(plans.id, id)).returning();
      return results[0];
    } catch (err) {
      console.error("Database error in updatePlan, falling back to memory:", err);
      this.useMemoryFallback = true;
      return this.updatePlan(id, plan);
    }
  }

  async deletePlan(id: number): Promise<boolean> {
    if (this.useMemoryFallback) {
      const idx = this.memPlans.findIndex((p) => p.id === id);
      if (idx === -1) return false;
      this.memPlans.splice(idx, 1);
      return true;
    }
    try {
      const results = await db.delete(plans).where(eq(plans.id, id)).returning();
      return results.length > 0;
    } catch (err) {
      console.error("Database error in deletePlan, falling back to memory:", err);
      this.useMemoryFallback = true;
      return this.deletePlan(id);
    }
  }

  // ─── Settings ──────────────────────────────────────────────────────────────

  async getSetting(key: string): Promise<string | undefined> {
    if (this.useMemoryFallback) return this.memSettings.get(key);
    try {
      const results = await db.select().from(settings).where(eq(settings.key, key));
      return results[0]?.value;
    } catch (err) {
      console.error("Database error in getSetting, falling back to memory:", err);
      this.useMemoryFallback = true;
      return this.memSettings.get(key);
    }
  }

  async setSetting(key: string, value: string): Promise<void> {
    if (this.useMemoryFallback) {
      this.memSettings.set(key, value);
      return;
    }
    try {
      const existing = await db.select().from(settings).where(eq(settings.key, key));
      if (existing.length > 0) {
        await db.update(settings).set({ value }).where(eq(settings.key, key));
      } else {
        await db.insert(settings).values({ key, value });
      }
    } catch (err) {
      console.error("Database error in setSetting, falling back to memory:", err);
      this.useMemoryFallback = true;
      this.memSettings.set(key, value);
    }
  }

  async getAllSettings(): Promise<Setting[]> {
    if (this.useMemoryFallback) {
      return Array.from(this.memSettings.entries()).map(([key, value], i) => ({
        id: i + 1,
        key,
        value,
      }));
    }
    try {
      const dbSettings = await db.select().from(settings);
      const result: Setting[] = [...dbSettings];
      for (const def of DEFAULT_SETTINGS) {
        if (!result.find((s) => s.key === def.key)) {
          await db.insert(settings).values(def);
          const inserted = await db.select().from(settings).where(eq(settings.key, def.key));
          if (inserted[0]) result.push(inserted[0]);
        }
      }
      return result;
    } catch (err) {
      console.error("Database error in getAllSettings, falling back to memory:", err);
      this.useMemoryFallback = true;
      return this.getAllSettings();
    }
  }

  // ─── TV Channels ───────────────────────────────────────────────────────────

  async getTvChannels(): Promise<TvChannel[]> {
    if (this.useMemoryFallback) return this.memTvChannels;
    try {
      return await db.select().from(tvChannels).orderBy(asc(tvChannels.sortOrder), asc(tvChannels.name));
    } catch (err) {
      console.error("Database error in getTvChannels, falling back to memory:", err);
      this.useMemoryFallback = true;
      return this.memTvChannels;
    }
  }

  async getTvChannel(id: number): Promise<TvChannel | undefined> {
    if (this.useMemoryFallback) return this.memTvChannels.find((c) => c.id === id);
    try {
      const results = await db.select().from(tvChannels).where(eq(tvChannels.id, id));
      return results[0];
    } catch (err) {
      this.useMemoryFallback = true;
      return this.memTvChannels.find((c) => c.id === id);
    }
  }

  async createTvChannel(channel: InsertTvChannel): Promise<TvChannel> {
    if (this.useMemoryFallback) {
      const newId = Math.max(0, ...this.memTvChannels.map((c) => c.id)) + 1;
      const newChannel: TvChannel = { ...channel, id: newId };
      this.memTvChannels.push(newChannel);
      return newChannel;
    }
    try {
      const results = await db.insert(tvChannels).values(channel as any).returning();
      return results[0];
    } catch (err) {
      console.error("Database error in createTvChannel, falling back to memory:", err);
      this.useMemoryFallback = true;
      return this.createTvChannel(channel);
    }
  }

  async updateTvChannel(id: number, channel: UpdateTvChannel): Promise<TvChannel | undefined> {
    if (this.useMemoryFallback) {
      const idx = this.memTvChannels.findIndex((c) => c.id === id);
      if (idx === -1) return undefined;
      this.memTvChannels[idx] = { ...this.memTvChannels[idx], ...channel };
      return this.memTvChannels[idx];
    }
    try {
      const results = await db
        .update(tvChannels)
        .set(channel as any)
        .where(eq(tvChannels.id, id))
        .returning();
      return results[0];
    } catch (err) {
      this.useMemoryFallback = true;
      return this.updateTvChannel(id, channel);
    }
  }

  async deleteTvChannel(id: number): Promise<boolean> {
    if (this.useMemoryFallback) {
      const idx = this.memTvChannels.findIndex((c) => c.id === id);
      if (idx === -1) return false;
      this.memTvChannels.splice(idx, 1);
      return true;
    }
    try {
      const results = await db.delete(tvChannels).where(eq(tvChannels.id, id)).returning();
      return results.length > 0;
    } catch (err) {
      this.useMemoryFallback = true;
      return this.deleteTvChannel(id);
    }
  }

  // Plan-channel assignments via settings key "plan_channels_{planId}"
  async getPlanChannelIds(planId: number): Promise<number[]> {
    const raw = await this.getSetting(`plan_channels_${planId}`);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as number[];
    } catch {
      return [];
    }
  }

  async setPlanChannelIds(planId: number, channelIds: number[]): Promise<void> {
    await this.setSetting(`plan_channels_${planId}`, JSON.stringify(channelIds));
  }

  // ─── Seeds ─────────────────────────────────────────────────────────────────

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

  async seedSettings(): Promise<void> {
    if (this.useMemoryFallback) return;
    try {
      const existingSettings = await db.select().from(settings);
      const existingKeys = new Set(existingSettings.map((s) => s.key));
      for (const def of DEFAULT_SETTINGS) {
        if (!existingKeys.has(def.key)) {
          await db.insert(settings).values(def);
        }
      }
    } catch (err) {
      console.error("Settings seed failed, switching to memory fallback:", err);
      this.useMemoryFallback = true;
    }
  }

  async seedTvChannels(): Promise<void> {
    if (this.useMemoryFallback) return;
    try {
      const existing = await db.select().from(tvChannels);
      if (existing.length === 0) {
        const initial = buildInitialTvChannels();
        await db.insert(tvChannels).values(initial as any);
        console.log("TV channels seeded successfully");
      }
    } catch (err) {
      console.error("TV channels seed failed, switching to memory fallback:", err);
      this.useMemoryFallback = true;
    }
  }
}

export const storage = new HybridStorage();
