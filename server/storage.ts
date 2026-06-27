import fs from "fs";
import path from "path";
import type {
  Plan,
  InsertPlan,
  UpdatePlan,
  Setting,
  TvChannel,
  InsertTvChannel,
  UpdateTvChannel,
} from "@shared/schema";
import { PLUS_CHANNELS, ULTRA_CHANNELS, HBO_CHANNELS } from "@shared/channels";

const DATA_FILE = path.resolve(process.cwd(), "data/db.json");

interface DbData {
  plans: Plan[];
  settings: Setting[];
  tvChannels: TvChannel[];
  nextPlanId: number;
  nextSettingId: number;
  nextChannelId: number;
}

function loadData(): DbData {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")) as DbData;
    }
  } catch (e) {
    console.warn("Não foi possível carregar data/db.json, iniciando do zero:", e);
  }
  return { plans: [], settings: [], tvChannels: [], nextPlanId: 1, nextSettingId: 1, nextChannelId: 1 };
}

function saveData(data: DbData): void {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

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
  getTvChannels(): Promise<TvChannel[]>;
  getTvChannel(id: number): Promise<TvChannel | undefined>;
  createTvChannel(channel: InsertTvChannel): Promise<TvChannel>;
  updateTvChannel(id: number, channel: UpdateTvChannel): Promise<TvChannel | undefined>;
  deleteTvChannel(id: number): Promise<boolean>;
  seedTvChannels(): Promise<void>;
  getPlanChannelIds(planId: number): Promise<number[]>;
  setPlanChannelIds(planId: number, channelIds: number[]): Promise<void>;
  restoreAll(data: { plans: Plan[]; settings: Setting[]; tvChannels: TvChannel[] }): Promise<void>;
}

const INITIAL_PLANS: InsertPlan[] = [
  { name: "Básico", speed: "300 MEGA", price: "77,90", features: ["Wi-Fi Grátis", "Instalação Grátis", "Suporte 24h", "Fibra Óptica"], category: "internet", isHighlighted: false },
  { name: "Essencial", speed: "400 MEGA", price: "87,90", features: ["Wi-Fi Grátis", "Instalação Grátis", "Suporte 24h", "Fibra Óptica"], category: "internet", isHighlighted: false },
  { name: "Intermediário", speed: "500 MEGA", price: "97,90", features: ["Wi-Fi Grátis", "Instalação Grátis", "Suporte 24h", "Fibra Óptica"], category: "internet", isHighlighted: true },
  { name: "Avançado", speed: "600 MEGA", price: "107,90", features: ["Wi-Fi Grátis", "Instalação Grátis", "Suporte 24h", "Fibra Óptica"], category: "internet", isHighlighted: false },
  { name: "Ultra", speed: "700 MEGA", price: "117,90", features: ["Wi-Fi Grátis", "Instalação Grátis", "Suporte 24h", "Fibra Óptica"], category: "internet", isHighlighted: false },
  { name: "Gamer", speed: "800 MEGA", price: "127,90", features: ["Wi-Fi Grátis", "Instalação Grátis", "Suporte 24h", "Fibra Óptica"], category: "internet", isHighlighted: false },
  { name: "Premium", speed: "900 MEGA", price: "137,90", features: ["Wi-Fi Grátis", "Instalação Grátis", "Suporte 24h", "Fibra Óptica"], category: "internet", isHighlighted: false },
  { name: "Canais Light", speed: "100+ Canais", price: "17,90", features: ["Canais abertos entre outros", "Qualidade HD", "Suporte para TV, iOS, Android e Web", "Lista de canais"], category: "tv", isHighlighted: false },
  { name: "Canais Plus", speed: "150+ Canais", price: "39,90", features: ["Canais abertos entre outros", "Qualidade HD", "Suporte para TV, iOS, Android e Web", "Lista de canais"], category: "tv", isHighlighted: false },
  { name: "Canais Ultra", speed: "200+ Canais", price: "53,90", features: ["Canais abertos entre outros", "Qualidade HD", "Suporte para TV, iOS, Android e Web", "Lista de canais"], category: "tv", isHighlighted: true },
  { name: "Canais Ultra 1P + HBO", speed: "200+ Canais + HBO", price: "70,90", features: ["Canais abertos entre outros", "Qualidade HD", "Suporte para TV, iOS, Android e Web", "Lista de canais"], category: "tv", isHighlighted: false },
  { name: "Câmera de Segurança", speed: "Câmera", price: "25,00", features: ["Acesse de onde estiver", "Aplicativo para Android e iOS", "Visão Noturna", "Câmera Full HD"], category: "adicionais", isHighlighted: false },
  { name: "Roteador Extra", speed: "WIFI 6", price: "25,00", features: ["Maior Alcance", "Tecnologia Mesh", "Fácil Configuração", "Gigabit"], category: "adicionais", isHighlighted: false },
  { name: "TV Box", speed: "Android TV", price: "25,00", features: ["Transforma sua TV", "Acesso a Apps", "Resolução Full HD", "Controle Remoto"], category: "adicionais", isHighlighted: false },
];

const DEFAULT_SETTINGS: { key: string; value: string }[] = [
  { key: "whatsapp_number", value: "5553999789222" },
  { key: "logo_url", value: "" },
  { key: "favicon_url", value: "" },
  { key: "admin_password", value: "" },
  { key: "channels_light", value: JSON.stringify(PLUS_CHANNELS) },
  { key: "channels_plus", value: JSON.stringify(PLUS_CHANNELS) },
  { key: "channels_ultra", value: JSON.stringify(ULTRA_CHANNELS) },
  { key: "channels_hbo", value: JSON.stringify(HBO_CHANNELS) },
];

function buildInitialTvChannels(): InsertTvChannel[] {
  const seen = new Set<string>();
  const result: InsertTvChannel[] = [];
  let order = 0;
  for (const ch of ULTRA_CHANNELS) {
    if (!seen.has(ch.name)) {
      seen.add(ch.name);
      result.push({ name: ch.name, logoUrl: "", group: ch.category, sortOrder: order++ });
    }
  }
  for (const ch of HBO_CHANNELS) {
    if (!seen.has(ch.name)) {
      seen.add(ch.name);
      result.push({ name: ch.name, logoUrl: "", group: ch.category, sortOrder: order++ });
    }
  }
  return result;
}

export class JsonStorage implements IStorage {
  private data: DbData;

  constructor() {
    this.data = loadData();
  }

  private save() {
    saveData(this.data);
  }

  // ─── Plans ──────────────────────────────────────────────────────────────────

  async getPlans(): Promise<Plan[]> {
    return [...this.data.plans];
  }

  async getPlan(id: number): Promise<Plan | undefined> {
    return this.data.plans.find((p) => p.id === id);
  }

  async createPlan(plan: InsertPlan): Promise<Plan> {
    const newPlan: Plan = {
      ...plan,
      id: this.data.nextPlanId++,
      description: plan.description ?? null,
      isHighlighted: plan.isHighlighted ?? false,
      category: plan.category ?? "internet",
    };
    this.data.plans.push(newPlan);
    this.save();
    return newPlan;
  }

  async updatePlan(id: number, plan: UpdatePlan): Promise<Plan | undefined> {
    const idx = this.data.plans.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;
    this.data.plans[idx] = { ...this.data.plans[idx], ...plan };
    this.save();
    return this.data.plans[idx];
  }

  async deletePlan(id: number): Promise<boolean> {
    const idx = this.data.plans.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    this.data.plans.splice(idx, 1);
    this.save();
    return true;
  }

  async seedPlans(): Promise<void> {
    if (this.data.plans.length > 0) return;
    for (const p of INITIAL_PLANS) {
      await this.createPlan(p);
    }
    console.log("Planos iniciais carregados.");
  }

  // ─── Settings ───────────────────────────────────────────────────────────────

  async getSetting(key: string): Promise<string | undefined> {
    return this.data.settings.find((s) => s.key === key)?.value;
  }

  async setSetting(key: string, value: string): Promise<void> {
    const idx = this.data.settings.findIndex((s) => s.key === key);
    if (idx !== -1) {
      this.data.settings[idx].value = value;
    } else {
      this.data.settings.push({ id: this.data.nextSettingId++, key, value });
    }
    this.save();
  }

  async getAllSettings(): Promise<Setting[]> {
    return [...this.data.settings];
  }

  async seedSettings(): Promise<void> {
    const existingKeys = new Set(this.data.settings.map((s) => s.key));
    for (const def of DEFAULT_SETTINGS) {
      if (!existingKeys.has(def.key)) {
        this.data.settings.push({ id: this.data.nextSettingId++, key: def.key, value: def.value });
      }
    }
    this.save();
  }

  // ─── TV Channels ─────────────────────────────────────────────────────────────

  async getTvChannels(): Promise<TvChannel[]> {
    return [...this.data.tvChannels].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  }

  async getTvChannel(id: number): Promise<TvChannel | undefined> {
    return this.data.tvChannels.find((c) => c.id === id);
  }

  async createTvChannel(channel: InsertTvChannel): Promise<TvChannel> {
    const newChannel: TvChannel = { ...channel, id: this.data.nextChannelId++ };
    this.data.tvChannels.push(newChannel);
    this.save();
    return newChannel;
  }

  async updateTvChannel(id: number, channel: UpdateTvChannel): Promise<TvChannel | undefined> {
    const idx = this.data.tvChannels.findIndex((c) => c.id === id);
    if (idx === -1) return undefined;
    this.data.tvChannels[idx] = { ...this.data.tvChannels[idx], ...channel };
    this.save();
    return this.data.tvChannels[idx];
  }

  async deleteTvChannel(id: number): Promise<boolean> {
    const idx = this.data.tvChannels.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    this.data.tvChannels.splice(idx, 1);
    this.save();
    return true;
  }

  async seedTvChannels(): Promise<void> {
    if (this.data.tvChannels.length > 0) return;
    const initial = buildInitialTvChannels();
    for (const ch of initial) {
      this.data.tvChannels.push({ ...ch, id: this.data.nextChannelId++ });
    }
    this.save();
    console.log("Canais de TV iniciais carregados.");
  }

  // ─── Plan-Channel Assignments ─────────────────────────────────────────────

  async getPlanChannelIds(planId: number): Promise<number[]> {
    const raw = await this.getSetting(`plan_channels_${planId}`);
    if (!raw) return [];
    try { return JSON.parse(raw) as number[]; } catch { return []; }
  }

  async setPlanChannelIds(planId: number, channelIds: number[]): Promise<void> {
    await this.setSetting(`plan_channels_${planId}`, JSON.stringify(channelIds));
  }

  // ─── Restore ─────────────────────────────────────────────────────────────

  async restoreAll(incoming: { plans: Plan[]; settings: Setting[]; tvChannels: TvChannel[] }): Promise<void> {
    const maxPlanId = incoming.plans.length > 0 ? Math.max(...incoming.plans.map((p) => p.id)) + 1 : 1;
    const maxSettingId = incoming.settings.length > 0 ? Math.max(...incoming.settings.map((s) => s.id)) + 1 : 1;
    const maxChannelId = incoming.tvChannels.length > 0 ? Math.max(...incoming.tvChannels.map((c) => c.id)) + 1 : 1;

    // Keep current admin_password
    const currentAdminPw = this.data.settings.find((s) => s.key === "admin_password");
    const restoredSettings = incoming.settings.filter((s) => s.key !== "admin_password");
    if (currentAdminPw) restoredSettings.push(currentAdminPw);

    this.data = {
      plans: incoming.plans,
      settings: restoredSettings,
      tvChannels: incoming.tvChannels,
      nextPlanId: maxPlanId,
      nextSettingId: maxSettingId,
      nextChannelId: maxChannelId,
    };
    this.save();
  }
}

export const storage = new JsonStorage();
