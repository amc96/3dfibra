import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { insertPlanSchema, updatePlanSchema } from "@shared/schema";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

function requireAdmin(req: any, res: any, next: any) {
  const password = req.headers["x-admin-password"];
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ message: "Não autorizado" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  if (storage.seedPlans) {
    await storage.seedPlans();
  }

  // Public: list plans
  app.get(api.plans.list.path, async (_req, res) => {
    const plans = await storage.getPlans();
    res.json(plans);
  });

  // Public: get single plan
  app.get(api.plans.get.path, async (req, res) => {
    const plan = await storage.getPlan(Number(req.params.id));
    if (!plan) {
      return res.status(404).json({ message: "Plano não encontrado" });
    }
    res.json(plan);
  });

  // Admin: verify password
  app.post("/api/admin/login", (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
      res.json({ ok: true });
    } else {
      res.status(401).json({ message: "Senha incorreta" });
    }
  });

  // Admin: create plan
  app.post("/api/admin/plans", requireAdmin, async (req, res) => {
    const parsed = insertPlanSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Dados inválidos", errors: parsed.error.errors });
    }
    const plan = await storage.createPlan(parsed.data);
    res.status(201).json(plan);
  });

  // Admin: update plan
  app.patch("/api/admin/plans/:id", requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const parsed = updatePlanSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Dados inválidos", errors: parsed.error.errors });
    }
    const plan = await storage.updatePlan(id, parsed.data);
    if (!plan) {
      return res.status(404).json({ message: "Plano não encontrado" });
    }
    res.json(plan);
  });

  // Admin: delete plan
  app.delete("/api/admin/plans/:id", requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const ok = await storage.deletePlan(id);
    if (!ok) {
      return res.status(404).json({ message: "Plano não encontrado" });
    }
    res.json({ ok: true });
  });

  // Admin: get all settings
  app.get("/api/admin/settings", requireAdmin, async (_req, res) => {
    const allSettings = await storage.getAllSettings();
    res.json(allSettings);
  });

  // Admin: update a setting
  app.patch("/api/admin/settings/:key", requireAdmin, async (req, res) => {
    const { key } = req.params;
    const { value } = req.body;
    if (typeof value !== "string") {
      return res.status(400).json({ message: "Valor inválido" });
    }
    await storage.setSetting(key, value);
    res.json({ ok: true, key, value });
  });

  // Public: get a specific setting (for use in the frontend)
  app.get("/api/settings/:key", async (req, res) => {
    const value = await storage.getSetting(req.params.key);
    if (value === undefined) {
      return res.status(404).json({ message: "Configuração não encontrada" });
    }
    res.json({ key: req.params.key, value });
  });

  return httpServer;
}
