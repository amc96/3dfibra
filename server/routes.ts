import express from "express";
import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { insertPlanSchema, updatePlanSchema, insertTvChannelSchema, updateTvChannelSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadsChannelsDir = path.resolve(process.cwd(), "uploads/channels");
if (!fs.existsSync(uploadsChannelsDir)) fs.mkdirSync(uploadsChannelsDir, { recursive: true });

const uploadsSiteDir = path.resolve(process.cwd(), "uploads/site");
if (!fs.existsSync(uploadsSiteDir)) fs.mkdirSync(uploadsSiteDir, { recursive: true });

const channelLogoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsChannelsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".png";
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, unique);
  },
});

const uploadChannelLogo = multer({
  storage: channelLogoStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Apenas imagens são permitidas"));
  },
}).single("logo");

const siteAssetStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsSiteDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".png";
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, unique);
  },
});

const uploadSiteAsset = multer({
  storage: siteAssetStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Apenas imagens são permitidas"));
  },
});

const ENV_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

async function getActivePassword(): Promise<string> {
  const stored = await storage.getSetting("admin_password");
  return stored && stored.trim() !== "" ? stored : ENV_PASSWORD;
}

async function requireAdmin(req: any, res: any, next: any) {
  const password = req.headers["x-admin-password"];
  const active = await getActivePassword();
  if (password !== active) {
    return res.status(401).json({ message: "Não autorizado" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  if (storage.seedPlans) await storage.seedPlans();
  if (storage.seedSettings) await storage.seedSettings();
  if (storage.seedTvChannels) await storage.seedTvChannels();

  // ── Public: plans ──────────────────────────────────────────────────────────

  app.get(api.plans.list.path, async (_req, res) => {
    const plans = await storage.getPlans();
    res.json(plans);
  });

  app.get(api.plans.get.path, async (req, res) => {
    const plan = await storage.getPlan(Number(req.params.id));
    if (!plan) return res.status(404).json({ message: "Plano não encontrado" });
    res.json(plan);
  });

  // ── Public: TV channels ────────────────────────────────────────────────────

  app.get("/api/tv-channels", async (_req, res) => {
    const channels = await storage.getTvChannels();
    res.json(channels);
  });

  // Get enabled channel IDs for a specific TV plan (public)
  app.get("/api/plans/:id/channels", async (req, res) => {
    const planId = Number(req.params.id);
    const channelIds = await storage.getPlanChannelIds(planId);
    res.json(channelIds);
  });

  // ── Public: settings ───────────────────────────────────────────────────────

  app.get("/api/settings/:key", async (req, res) => {
    const value = await storage.getSetting(req.params.key);
    if (value === undefined) return res.status(404).json({ message: "Configuração não encontrada" });
    res.json({ key: req.params.key, value });
  });

  // Legacy channel lists endpoint
  app.get("/api/channels", async (_req, res) => {
    const [light, plus, ultra, hbo] = await Promise.all([
      storage.getSetting("channels_light"),
      storage.getSetting("channels_plus"),
      storage.getSetting("channels_ultra"),
      storage.getSetting("channels_hbo"),
    ]);
    res.json({
      light: light ? JSON.parse(light) : [],
      plus: plus ? JSON.parse(plus) : [],
      ultra: ultra ? JSON.parse(ultra) : [],
      hbo: hbo ? JSON.parse(hbo) : [],
    });
  });

  // ── Admin: auth ────────────────────────────────────────────────────────────

  app.post("/api/admin/login", async (req, res) => {
    const { password } = req.body;
    const active = await getActivePassword();
    if (password === active) {
      res.json({ ok: true });
    } else {
      res.status(401).json({ message: "Senha incorreta" });
    }
  });

  app.post("/api/admin/change-password", requireAdmin, async (req, res) => {
    const { newPassword } = req.body;
    if (!newPassword || typeof newPassword !== "string" || newPassword.trim().length < 6) {
      return res.status(400).json({ message: "A nova senha deve ter pelo menos 6 caracteres" });
    }
    await storage.setSetting("admin_password", newPassword.trim());
    res.json({ ok: true });
  });

  // ── Admin: plans ───────────────────────────────────────────────────────────

  app.post("/api/admin/plans", requireAdmin, async (req, res) => {
    const parsed = insertPlanSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Dados inválidos", errors: parsed.error.errors });
    const plan = await storage.createPlan(parsed.data);
    res.status(201).json(plan);
  });

  app.patch("/api/admin/plans/:id", requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const parsed = updatePlanSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Dados inválidos", errors: parsed.error.errors });
    const plan = await storage.updatePlan(id, parsed.data);
    if (!plan) return res.status(404).json({ message: "Plano não encontrado" });
    res.json(plan);
  });

  app.delete("/api/admin/plans/:id", requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const ok = await storage.deletePlan(id);
    if (!ok) return res.status(404).json({ message: "Plano não encontrado" });
    res.json({ ok: true });
  });

  // Plan-channel assignments (admin set, public read)
  app.put("/api/admin/plans/:id/channels", requireAdmin, async (req, res) => {
    const planId = Number(req.params.id);
    const { channelIds } = req.body;
    if (!Array.isArray(channelIds)) return res.status(400).json({ message: "channelIds deve ser um array" });
    await storage.setPlanChannelIds(planId, channelIds.map(Number));
    res.json({ ok: true, planId, channelIds });
  });

  // ── Admin: logo upload (channel) ─────────────────────────────────────────

  app.post("/api/admin/upload-logo", requireAdmin, (req, res) => {
    uploadChannelLogo(req, res, (err) => {
      if (err) return res.status(400).json({ message: err.message || "Erro no upload" });
      if (!req.file) return res.status(400).json({ message: "Nenhum arquivo enviado" });
      const url = `/uploads/channels/${req.file.filename}`;
      res.json({ url });
    });
  });

  // ── Admin: site logo upload ───────────────────────────────────────────────

  app.post("/api/admin/upload-site-logo", requireAdmin, (req, res) => {
    uploadSiteAsset.single("logo")(req, res, async (err) => {
      if (err) return res.status(400).json({ message: err.message || "Erro no upload" });
      if (!req.file) return res.status(400).json({ message: "Nenhum arquivo enviado" });
      const url = `/uploads/site/${req.file.filename}`;
      await storage.setSetting("logo_url", url);
      res.json({ url });
    });
  });

  // ── Admin: favicon upload ─────────────────────────────────────────────────

  app.post("/api/admin/upload-favicon", requireAdmin, (req, res) => {
    uploadSiteAsset.single("favicon")(req, res, async (err) => {
      if (err) return res.status(400).json({ message: err.message || "Erro no upload" });
      if (!req.file) return res.status(400).json({ message: "Nenhum arquivo enviado" });
      const url = `/uploads/site/${req.file.filename}`;
      await storage.setSetting("favicon_url", url);
      res.json({ url });
    });
  });

  // ── Admin: TV channels ─────────────────────────────────────────────────────

  app.post("/api/admin/tv-channels", requireAdmin, async (req, res) => {
    const parsed = insertTvChannelSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Dados inválidos", errors: parsed.error.errors });
    const channel = await storage.createTvChannel(parsed.data);
    res.status(201).json(channel);
  });

  app.patch("/api/admin/tv-channels/:id", requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const parsed = updateTvChannelSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Dados inválidos", errors: parsed.error.errors });
    const channel = await storage.updateTvChannel(id, parsed.data);
    if (!channel) return res.status(404).json({ message: "Canal não encontrado" });
    res.json(channel);
  });

  app.delete("/api/admin/tv-channels/:id", requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const ok = await storage.deleteTvChannel(id);
    if (!ok) return res.status(404).json({ message: "Canal não encontrado" });
    res.json({ ok: true });
  });

  // ── Admin: settings ────────────────────────────────────────────────────────

  app.get("/api/admin/settings", requireAdmin, async (_req, res) => {
    const allSettings = await storage.getAllSettings();
    res.json(allSettings);
  });

  app.patch("/api/admin/settings/:key", requireAdmin, async (req, res) => {
    const { key } = req.params;
    const { value } = req.body;
    if (typeof value !== "string") return res.status(400).json({ message: "Valor inválido" });
    await storage.setSetting(key, value);
    res.json({ ok: true, key, value });
  });

  // ── Admin: backup ──────────────────────────────────────────────────────────

  app.get("/api/admin/backup", requireAdmin, async (_req, res) => {
    try {
      const [allPlans, allSettings, allTvChannels] = await Promise.all([
        storage.getPlans(),
        storage.getAllSettings(),
        storage.getTvChannels(),
      ]);

      // Collect all uploaded files as base64
      const uploadFiles: Record<string, string> = {};
      const uploadsDir = path.resolve(process.cwd(), "uploads");

      function walkDir(dir: string, base: string) {
        if (!fs.existsSync(dir)) return;
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          const rel = path.posix.join(base, entry.name);
          if (entry.isDirectory()) {
            walkDir(full, rel);
          } else {
            try {
              uploadFiles[rel] = fs.readFileSync(full).toString("base64");
            } catch {}
          }
        }
      }
      walkDir(uploadsDir, "");

      const backup = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        plans: allPlans,
        settings: allSettings.filter((s) => s.key !== "admin_password"),
        tvChannels: allTvChannels,
        uploads: uploadFiles,
      };

      const date = new Date().toISOString().slice(0, 10);
      res.setHeader("Content-Disposition", `attachment; filename="backup-3dfibra-${date}.json"`);
      res.setHeader("Content-Type", "application/json");
      res.json(backup);
    } catch (err: any) {
      res.status(500).json({ message: "Erro ao gerar backup: " + err.message });
    }
  });

  // ── Admin: restore ─────────────────────────────────────────────────────────

  app.post("/api/admin/restore", requireAdmin, express.json({ limit: "50mb" }), async (req, res) => {
    try {
      const { plans: bkPlans, settings: bkSettings, tvChannels: bkChannels, uploads: bkUploads } = req.body;

      if (!Array.isArray(bkPlans) || !Array.isArray(bkSettings) || !Array.isArray(bkChannels)) {
        return res.status(400).json({ message: "Arquivo de backup inválido ou corrompido" });
      }

      // Restore all data via file-based storage
      await storage.restoreAll({
        plans: bkPlans,
        settings: bkSettings,
        tvChannels: bkChannels,
      });

      // Restore uploaded files from base64
      if (bkUploads && typeof bkUploads === "object") {
        const uploadsDir = path.resolve(process.cwd(), "uploads");
        for (const [relPath, b64] of Object.entries(bkUploads as Record<string, string>)) {
          if (typeof b64 !== "string") continue;
          const safePath = relPath.replace(/\.\./g, "").replace(/^\/+/, "");
          const fullPath = path.join(uploadsDir, safePath);
          if (!fullPath.startsWith(uploadsDir)) continue;
          fs.mkdirSync(path.dirname(fullPath), { recursive: true });
          fs.writeFileSync(fullPath, Buffer.from(b64, "base64"));
        }
      }

      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ message: "Erro ao restaurar backup: " + err.message });
    }
  });

  return httpServer;
}
