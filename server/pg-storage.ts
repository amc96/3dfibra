import fs from "fs";
import { Pool } from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { asc, eq, inArray, ne, sql } from "drizzle-orm";
import {
  plans,
  settings,
  tvChannels,
  planChannels,
  uploadedFiles,
  type Plan,
  type InsertPlan,
  type UpdatePlan,
  type Setting,
  type TvChannel,
  type InsertTvChannel,
  type UpdateTvChannel,
} from "@shared/schema";
import {
  type IStorage,
  type DbData,
  DATA_FILE,
  INITIAL_PLANS,
  DEFAULT_SETTINGS,
  buildInitialTvChannels,
} from "./storage";

// Channel lists per plan used to live in settings as "plan_channels_<planId>".
// In PostgreSQL they live in the plan_channels table; the old key format is
// still understood so backups and older admin calls keep working.
const PLAN_CHANNELS_KEY = /^plan_channels_(\d+)$/;

const CREATE_TABLES_SQL = `
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
CREATE TABLE IF NOT EXISTS "settings" (
  "id" serial PRIMARY KEY NOT NULL,
  "key" text NOT NULL,
  "value" text NOT NULL,
  CONSTRAINT "settings_key_unique" UNIQUE("key")
);
CREATE TABLE IF NOT EXISTS "tv_channels" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "logo_url" text DEFAULT '' NOT NULL,
  "group" text DEFAULT 'Geral' NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL
);
CREATE TABLE IF NOT EXISTS "plan_channels" (
  "plan_id" integer NOT NULL REFERENCES "plans"("id") ON DELETE CASCADE,
  "channel_id" integer NOT NULL REFERENCES "tv_channels"("id") ON DELETE CASCADE,
  "position" integer DEFAULT 0 NOT NULL,
  CONSTRAINT "plan_channels_plan_id_channel_id_pk" PRIMARY KEY("plan_id","channel_id")
);
CREATE TABLE IF NOT EXISTS "uploaded_files" (
  "path" text PRIMARY KEY NOT NULL,
  "mime_type" text DEFAULT 'application/octet-stream' NOT NULL,
  "data" bytea NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
`;

type Db = NodePgDatabase<Record<string, never>>;

export class PgStorage implements IStorage {
  private pool: Pool;
  private db: Db;
  private ready: Promise<void>;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString, max: 5 });
    this.pool.on("error", (err) => console.error("PostgreSQL: erro na conexão", err));
    this.db = drizzle(this.pool);
    this.ready = this.init();
    // Surface startup problems clearly in the Railway logs
    this.ready.catch((err) => console.error("PostgreSQL: falha ao iniciar o banco", err));
  }

  private async init() {
    await this.pool.query(CREATE_TABLES_SQL);
    await this.importFromJsonFileIfEmpty();
  }

  // ─── One-time migration from data/db.json ───────────────────────────────────

  private async importFromJsonFileIfEmpty() {
    const { rows } = await this.pool.query(
      `SELECT (SELECT count(*) FROM plans)::int + (SELECT count(*) FROM tv_channels)::int AS n`,
    );
    if (rows[0].n > 0) return;
    if (!fs.existsSync(DATA_FILE)) return;

    let data: DbData;
    try {
      data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    } catch (err) {
      console.warn("PostgreSQL: data/db.json ilegível, importação ignorada", err);
      return;
    }
    if (!data.plans?.length && !data.tvChannels?.length) return;

    await this.replaceEverything(
      { plans: data.plans ?? [], settings: data.settings ?? [], tvChannels: data.tvChannels ?? [] },
      { keepAdminPassword: false },
    );
    console.log(
      `PostgreSQL: dados importados de data/db.json (${data.plans?.length ?? 0} planos, ` +
        `${data.tvChannels?.length ?? 0} canais, ${data.settings?.length ?? 0} configurações).`,
    );
  }

  // Shared by the first import and by "Restaurar backup"
  private async replaceEverything(
    incoming: { plans: Plan[]; settings: Setting[]; tvChannels: TvChannel[] },
    { keepAdminPassword }: { keepAdminPassword: boolean },
  ) {
    await this.db.transaction(async (tx) => {
      await tx.delete(planChannels);
      await tx.delete(plans);
      await tx.delete(tvChannels);
      if (keepAdminPassword) await tx.delete(settings).where(ne(settings.key, "admin_password"));
      else await tx.delete(settings);

      if (incoming.plans.length) {
        await tx.insert(plans).values(
          incoming.plans.map((p) => ({
            id: p.id,
            name: p.name,
            speed: p.speed,
            price: p.price,
            description: p.description ?? null,
            features: Array.isArray(p.features) ? p.features : [],
            isHighlighted: p.isHighlighted ?? false,
            category: p.category ?? "internet",
          })),
        );
      }
      if (incoming.tvChannels.length) {
        await tx.insert(tvChannels).values(
          incoming.tvChannels.map((c) => ({
            id: c.id,
            name: c.name,
            logoUrl: c.logoUrl ?? "",
            group: c.group ?? "Geral",
            sortOrder: c.sortOrder ?? 0,
          })),
        );
      }

      const planIds = new Set(incoming.plans.map((p) => p.id));
      const channelIds = new Set(incoming.tvChannels.map((c) => c.id));
      const links: { planId: number; channelId: number; position: number }[] = [];
      const plainSettings = new Map<string, string>();

      for (const s of incoming.settings) {
        if (typeof s?.key !== "string" || typeof s?.value !== "string") continue;
        if (keepAdminPassword && s.key === "admin_password") continue;
        const m = s.key.match(PLAN_CHANNELS_KEY);
        if (!m) {
          plainSettings.set(s.key, s.value);
          continue;
        }
        const planId = Number(m[1]);
        if (!planIds.has(planId)) continue;
        let ids: unknown;
        try { ids = JSON.parse(s.value); } catch { continue; }
        if (!Array.isArray(ids)) continue;
        const seen = new Set<number>();
        ids.forEach((id) => {
          if (typeof id === "number" && channelIds.has(id) && !seen.has(id)) {
            seen.add(id);
            links.push({ planId, channelId: id, position: links.length });
          }
        });
      }

      if (plainSettings.size) {
        await tx.insert(settings).values(Array.from(plainSettings, ([key, value]) => ({ key, value })));
      }
      for (let i = 0; i < links.length; i += 1000) {
        await tx.insert(planChannels).values(links.slice(i, i + 1000));
      }

      // Keep the auto-increment counters ahead of the imported ids
      for (const table of ["plans", "tv_channels", "settings"]) {
        await tx.execute(
          sql.raw(
            `SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) FROM ${table}), 1), (SELECT COUNT(*) > 0 FROM ${table}))`,
          ),
        );
      }
    });
  }

  // ─── Plans ──────────────────────────────────────────────────────────────────

  async getPlans(): Promise<Plan[]> {
    await this.ready;
    return this.db.select().from(plans).orderBy(asc(plans.id));
  }

  async getPlan(id: number): Promise<Plan | undefined> {
    await this.ready;
    const [row] = await this.db.select().from(plans).where(eq(plans.id, id));
    return row;
  }

  async createPlan(plan: InsertPlan): Promise<Plan> {
    await this.ready;
    const { id: _ignore, ...values } = plan as InsertPlan & { id?: number };
    const [row] = await this.db
      .insert(plans)
      .values({ ...values, features: [...(values.features ?? [])] } as typeof plans.$inferInsert)
      .returning();
    return row;
  }

  async updatePlan(id: number, plan: UpdatePlan): Promise<Plan | undefined> {
    await this.ready;
    const { id: _ignore, ...values } = plan as UpdatePlan & { id?: number };
    if (Object.keys(values).length === 0) return this.getPlan(id);
    const patch = { ...values } as Partial<typeof plans.$inferInsert>;
    if (values.features) patch.features = [...values.features];
    const [row] = await this.db.update(plans).set(patch).where(eq(plans.id, id)).returning();
    return row;
  }

  async deletePlan(id: number): Promise<boolean> {
    await this.ready;
    const rows = await this.db.delete(plans).where(eq(plans.id, id)).returning({ id: plans.id });
    return rows.length > 0;
  }

  async seedPlans(): Promise<void> {
    await this.ready;
    const [{ n }] = await this.db.select({ n: sql<number>`count(*)::int` }).from(plans);
    if (n > 0) return;
    await this.db
      .insert(plans)
      .values(INITIAL_PLANS.map((p) => ({ ...p, features: [...(p.features ?? [])] }) as typeof plans.$inferInsert));
    console.log("Planos iniciais carregados.");
  }

  // ─── Settings ───────────────────────────────────────────────────────────────

  async getSetting(key: string): Promise<string | undefined> {
    await this.ready;
    const m = key.match(PLAN_CHANNELS_KEY);
    if (m) return JSON.stringify(await this.getPlanChannelIds(Number(m[1])));
    const [row] = await this.db.select().from(settings).where(eq(settings.key, key));
    return row?.value;
  }

  async setSetting(key: string, value: string): Promise<void> {
    await this.ready;
    const m = key.match(PLAN_CHANNELS_KEY);
    if (m) {
      let ids: unknown = [];
      try { ids = JSON.parse(value); } catch {}
      await this.setPlanChannelIds(Number(m[1]), Array.isArray(ids) ? ids.filter((x) => typeof x === "number") : []);
      return;
    }
    await this.db
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({ target: settings.key, set: { value } });
  }

  // Also returns channel lists as "plan_channels_<id>" so backups keep the same format
  async getAllSettings(): Promise<Setting[]> {
    await this.ready;
    const rows = await this.db.select().from(settings).orderBy(asc(settings.id));
    const links = await this.db
      .select()
      .from(planChannels)
      .orderBy(asc(planChannels.planId), asc(planChannels.position));
    const byPlan = new Map<number, number[]>();
    for (const l of links) {
      if (!byPlan.has(l.planId)) byPlan.set(l.planId, []);
      byPlan.get(l.planId)!.push(l.channelId);
    }
    const synthesized: Setting[] = Array.from(byPlan, ([planId, ids]) => ({
      id: 0,
      key: `plan_channels_${planId}`,
      value: JSON.stringify(ids),
    }));
    return [...rows, ...synthesized];
  }

  async seedSettings(): Promise<void> {
    await this.ready;
    await this.db
      .insert(settings)
      .values(DEFAULT_SETTINGS)
      .onConflictDoNothing({ target: settings.key });
  }

  // ─── TV Channels ────────────────────────────────────────────────────────────

  async getTvChannels(): Promise<TvChannel[]> {
    await this.ready;
    return this.db.select().from(tvChannels).orderBy(asc(tvChannels.sortOrder), asc(tvChannels.name));
  }

  async getTvChannel(id: number): Promise<TvChannel | undefined> {
    await this.ready;
    const [row] = await this.db.select().from(tvChannels).where(eq(tvChannels.id, id));
    return row;
  }

  async createTvChannel(channel: InsertTvChannel): Promise<TvChannel> {
    await this.ready;
    const [row] = await this.db.insert(tvChannels).values(channel).returning();
    return row;
  }

  async updateTvChannel(id: number, channel: UpdateTvChannel): Promise<TvChannel | undefined> {
    await this.ready;
    if (Object.keys(channel).length === 0) return this.getTvChannel(id);
    const [row] = await this.db.update(tvChannels).set(channel).where(eq(tvChannels.id, id)).returning();
    return row;
  }

  async deleteTvChannel(id: number): Promise<boolean> {
    await this.ready;
    const rows = await this.db.delete(tvChannels).where(eq(tvChannels.id, id)).returning({ id: tvChannels.id });
    return rows.length > 0;
  }

  async seedTvChannels(): Promise<void> {
    await this.ready;
    const [{ n }] = await this.db.select({ n: sql<number>`count(*)::int` }).from(tvChannels);
    if (n > 0) return;
    await this.db.insert(tvChannels).values(buildInitialTvChannels());
    console.log("Canais de TV iniciais carregados.");
  }

  // ─── Plan-Channel Assignments ─────────────────────────────────────────────

  async getPlanChannelIds(planId: number): Promise<number[]> {
    await this.ready;
    const rows = await this.db
      .select({ channelId: planChannels.channelId })
      .from(planChannels)
      .where(eq(planChannels.planId, planId))
      .orderBy(asc(planChannels.position));
    return rows.map((r) => r.channelId);
  }

  async setPlanChannelIds(planId: number, channelIds: number[]): Promise<void> {
    await this.ready;
    const unique = Array.from(new Set(channelIds));
    await this.db.transaction(async (tx) => {
      await tx.delete(planChannels).where(eq(planChannels.planId, planId));
      if (unique.length === 0) return;
      // Only link plans/channels that exist (avoids foreign key errors on stale ids)
      const [plan] = await tx.select({ id: plans.id }).from(plans).where(eq(plans.id, planId));
      if (!plan) return;
      const existing = await tx
        .select({ id: tvChannels.id })
        .from(tvChannels)
        .where(inArray(tvChannels.id, unique));
      const valid = new Set(existing.map((c) => c.id));
      const values = unique
        .filter((id) => valid.has(id))
        .map((channelId, position) => ({ planId, channelId, position }));
      if (values.length) await tx.insert(planChannels).values(values);
    });
  }

  // ─── Restore ─────────────────────────────────────────────────────────────

  async restoreAll(incoming: { plans: Plan[]; settings: Setting[]; tvChannels: TvChannel[] }): Promise<void> {
    await this.ready;
    await this.replaceEverything(incoming, { keepAdminPassword: true });
  }

  // ─── Uploaded files ──────────────────────────────────────────────────────

  async saveFile(relPath: string, mimeType: string, data: Buffer): Promise<void> {
    await this.ready;
    await this.db
      .insert(uploadedFiles)
      .values({ path: relPath, mimeType, data })
      .onConflictDoUpdate({ target: uploadedFiles.path, set: { mimeType, data } });
  }

  async getFile(relPath: string): Promise<{ mimeType: string; data: Buffer } | undefined> {
    await this.ready;
    const [row] = await this.db
      .select({ mimeType: uploadedFiles.mimeType, data: uploadedFiles.data })
      .from(uploadedFiles)
      .where(eq(uploadedFiles.path, relPath));
    return row;
  }

  async getAllFiles(): Promise<{ path: string; data: Buffer }[]> {
    await this.ready;
    return this.db.select({ path: uploadedFiles.path, data: uploadedFiles.data }).from(uploadedFiles);
  }
}

