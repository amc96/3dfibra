import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get(api.plans.list.path, async (req, res) => {
    const plans = await storage.getPlans();
    res.json(plans);
  });

  app.get(api.plans.get.path, async (req, res) => {
    const plan = await storage.getPlan(Number(req.params.id));
    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }
    res.json(plan);
  });

  // Initialize seed data
  if (process.env.NODE_ENV !== "production") {
    await storage.seedPlans();
  }

  return httpServer;
}
