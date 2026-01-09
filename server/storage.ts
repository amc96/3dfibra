import { plans, type Plan, type InsertPlan } from "@shared/schema";

export interface IStorage {
  getPlans(): Promise<Plan[]>;
  getPlan(id: number): Promise<Plan | undefined>;
}

export class MemStorage implements IStorage {
  private plans: Plan[];

  constructor() {
    this.plans = [
      {
        id: 1,
        name: "Básico",
        speed: "300 MEGA",
        price: "79,90",
        description: null,
        features: ["Wi-Fi Grátis", "Instalação Grátis", "Suporte 24h", "Fibra Óptica"],
        category: "internet",
        isHighlighted: false
      },
      {
        id: 2,
        name: "Essencial",
        speed: "400 MEGA",
        price: "89,90",
        description: null,
        features: ["Wi-Fi Grátis", "Instalação Grátis", "Suporte 24h", "Fibra Óptica"],
        category: "internet",
        isHighlighted: false
      },
      {
        id: 3,
        name: "Intermediário",
        speed: "500 MEGA",
        price: "99,90",
        description: null,
        features: ["Wi-Fi Grátis", "Instalação Grátis", "Suporte 24h", "Fibra Óptica"],
        category: "internet",
        isHighlighted: true
      },
      {
        id: 4,
        name: "Avançado",
        speed: "600 MEGA",
        price: "109,90",
        description: null,
        features: ["Wi-Fi Grátis", "Instalação Grátis", "Suporte 24h", "Fibra Óptica"],
        category: "internet",
        isHighlighted: false
      },
      {
        id: 5,
        name: "Ultra",
        speed: "700 MEGA",
        price: "119,90",
        description: null,
        features: ["Wi-Fi Grátis", "Instalação Grátis", "Suporte 24h", "Fibra Óptica"],
        category: "internet",
        isHighlighted: false
      },
      {
        id: 6,
        name: "Gamer",
        speed: "800 MEGA",
        price: "129,90",
        description: null,
        features: ["Wi-Fi Grátis", "Instalação Grátis", "Suporte 24h", "Fibra Óptica"],
        category: "internet",
        isHighlighted: false
      },
      {
        id: 7,
        name: "Premium",
        speed: "900 MEGA",
        price: "139,90",
        description: null,
        features: ["Wi-Fi Grátis", "Instalação Grátis", "Suporte 24h", "Fibra Óptica"],
        category: "internet",
        isHighlighted: false
      },
      {
        id: 8,
        name: "Canais Light",
        speed: "100+ Canais",
        price: "17,90",
        description: null,
        features: ["Canais abertos entre outros", "Qualidade HD", "Suporte para TV, iOS, Android e Web", "Lista de canais"],
        category: "tv",
        isHighlighted: false
      },
      {
        id: 9,
        name: "Canais Plus",
        speed: "150+ Canais",
        price: "39,90",
        description: null,
        features: ["Canais abertos entre outros", "Qualidade HD", "Suporte para TV, iOS, Android e Web", "Lista de canais"],
        category: "tv",
        isHighlighted: false
      },
      {
        id: 10,
        name: "Canais Ultra",
        speed: "200+ Canais",
        price: "53,90",
        description: null,
        features: ["Canais abertos entre outros", "Qualidade HD", "Suporte para TV, iOS, Android e Web", "Lista de canais"],
        category: "tv",
        isHighlighted: true
      },
      {
        id: 11,
        name: "Canais Ultra 1P + HBO",
        speed: "200+ Canais + HBO",
        price: "70,90",
        description: null,
        features: ["Canais abertos entre outros", "Qualidade HD", "Suporte para TV, iOS, Android e Web", "Lista de canais"],
        category: "tv",
        isHighlighted: false
      },
      {
        id: 12,
        name: "Câmera de Segurança",
        speed: "Câmera",
        price: "25,00",
        description: null,
        features: ["Acesse de onde estiver", "Aplicativo para Android e iOS", "Visão Noturna", "Câmera Full HD"],
        category: "adicionais",
        isHighlighted: false
      },
      {
        id: 13,
        name: "Roteador Extra",
        speed: "WIFI 6",
        price: "25,00",
        description: null,
        features: ["Maior Alcance", "Tecnologia Mesh", "Fácil Configuração", "Gigabit"],
        category: "adicionais",
        isHighlighted: false
      },
      {
        id: 14,
        name: "TV Box",
        speed: "Android TV",
        price: "25,00",
        description: null,
        features: ["Transforma sua TV", "Acesso a Apps", "Resolução Full HD", "Controle Remoto"],
        category: "adicionais",
        isHighlighted: false
      }
    ];
  }

  async getPlans(): Promise<Plan[]> {
    return this.plans;
  }

  async getPlan(id: number): Promise<Plan | undefined> {
    return this.plans.find(p => p.id === id);
  }
}

export const storage = new MemStorage();
