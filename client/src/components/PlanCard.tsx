import { Plan, TvChannel } from "@shared/schema";
import { Check, Wifi, ArrowRight, Tv } from "lucide-react";
import { Button } from "./ui/button";
import { motion } from "framer-motion";
import { useSelection } from "@/hooks/use-selection";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";

interface PlanCardProps {
  plan: Plan;
  index: number;
}

function usePlanChannels(planId: number, enabled: boolean) {
  const { data: allChannels = [] } = useQuery<TvChannel[]>({
    queryKey: ["/api/tv-channels"],
    staleTime: 5 * 60 * 1000,
    enabled,
  });
  const { data: enabledIds = [] } = useQuery<number[]>({
    queryKey: ["/api/plans", planId, "channels"],
    queryFn: async () => {
      const res = await fetch(`/api/plans/${planId}/channels`);
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    enabled,
  });

  const channels = useMemo(() => {
    const idSet = new Set(enabledIds);
    return allChannels.filter((c) => idSet.has(c.id));
  }, [allChannels, enabledIds]);

  // Group by category
  const groups = useMemo(() => {
    const map = new Map<string, TvChannel[]>();
    for (const ch of channels) {
      const g = ch.group || "Geral";
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(ch);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [channels]);

  return { groups, total: channels.length };
}

export function PlanCard({ plan, index }: PlanCardProps) {
  const isHighlighted = plan.isHighlighted;
  const { selectedPlans, togglePlan } = useSelection();
  const { toast } = useToast();
  const isSelected = selectedPlans.some(p => p.id === plan.id);
  const [isOpen, setIsOpen] = useState(false);

  const isTv = plan.category === "tv";
  const { groups, total } = usePlanChannels(plan.id, isTv && isOpen);

  const handleToggle = () => {
    const isInternetPlanSelected = selectedPlans.some(p => p.category === "internet");

    if (plan.category !== "internet" && !isInternetPlanSelected) {
      toast({
        title: "Plano Requerido",
        description: "Selecione um plano de internet antes de adicionar TV ou outros serviços.",
        variant: "destructive",
      });
      return;
    }

    if (plan.name === "TV Box" && plan.category === "adicionais") {
      toast({
        title: "Produto Indisponível",
        description: "A TV Box não está disponível no momento.",
        variant: "destructive",
      });
      return;
    }
    togglePlan(plan);
  };

  const buttonText = plan.category === "adicionais" ? "Selecionar" : (isSelected ? "Remover" : "Selecionar Plano");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className={`relative rounded-3xl p-1 ${
        isSelected
          ? "bg-primary shadow-2xl shadow-primary/40 scale-[1.02]"
          : isHighlighted
            ? "bg-gradient-to-b from-primary via-blue-500 to-purple-600 shadow-2xl shadow-primary/20"
            : "bg-border/50 border border-border/50 hover:border-primary/50 transition-all"
      }`}
    >
      <div className="h-full bg-card rounded-[1.4rem] p-6 sm:p-8 flex flex-col relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10" />

        {(isHighlighted || isSelected) && (
          <div className="absolute top-4 right-4 bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full border border-primary/20 uppercase tracking-wide">
            {isSelected ? "Selecionado" : "Mais Popular"}
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-lg font-medium text-muted-foreground mb-2">{plan.name}</h3>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl sm:text-5xl font-black text-foreground tracking-tight font-display">
              {plan.speed}
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-sm text-muted-foreground font-medium">R$</span>
            <span className={`text-3xl font-bold ${(isHighlighted || isSelected) ? 'text-primary' : 'text-foreground'}`}>
              {plan.price}
            </span>
            <span className="text-sm text-muted-foreground">/mês</span>
          </div>
        </div>

        <div className="space-y-4 mb-8 flex-grow">
          <div className="w-full h-px bg-border/50 mb-6" />

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Wifi className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium">Fibra Óptica 100%</span>
          </div>

          {plan.features.map((feature, i) => {
            const isChannelList = feature.toLowerCase().includes("lista de canais") && isTv;

            if (isChannelList) {
              return (
                <Dialog key={i} open={isOpen} onOpenChange={setIsOpen}>
                  <DialogTrigger asChild>
                    <div className="flex items-center gap-3 cursor-pointer group/feature">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 group-hover/feature:bg-emerald-500/20 transition-colors">
                        <Check className="w-4 h-4" />
                      </div>
                      <span className="text-sm text-muted-foreground underline decoration-dotted decoration-emerald-500/50 underline-offset-4">{feature}</span>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] w-full md:max-w-[80vw] lg:max-w-[70vw] h-[85vh] p-0 border-primary/20 shadow-2xl bg-card/95 backdrop-blur-xl overflow-hidden flex flex-col rounded-3xl">
                    <DialogHeader className="p-6 md:p-8 border-b border-border/50 bg-primary/5 flex flex-row items-center justify-between space-y-0">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                          <Tv className="w-8 h-8" />
                        </div>
                        <div>
                          <DialogTitle className="text-2xl md:text-3xl font-black font-display text-foreground">
                            Grade de Canais
                          </DialogTitle>
                          <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest mt-1">
                            Plano {plan.name} · {total} canais
                          </p>
                        </div>
                      </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-6 md:p-8">
                      {groups.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                          <Tv className="w-10 h-10 opacity-30" />
                          <p className="text-sm">Nenhum canal configurado para este plano.</p>
                        </div>
                      ) : (
                        <div className="space-y-8">
                          {groups.map(([groupName, channels]) => (
                            <div key={groupName}>
                              {/* Category header */}
                              <div className="flex items-center gap-2 mb-4">
                                <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary">
                                  {groupName}
                                </h4>
                                <span className="text-xs text-muted-foreground/50 font-normal normal-case tracking-normal">
                                  ({channels.length})
                                </span>
                                <div className="flex-1 h-px bg-primary/10 ml-1" />
                              </div>

                              {/* Logos grid */}
                              <div className="flex flex-wrap gap-3">
                                {channels.map((ch) => (
                                  <motion.div
                                    key={ch.id}
                                    whileHover={{ scale: 1.08 }}
                                    title={ch.name}
                                    className="w-14 h-14 rounded-xl bg-background border border-border/60 flex items-center justify-center overflow-hidden hover:border-primary/40 transition-colors"
                                  >
                                    {ch.logoUrl ? (
                                      <img
                                        src={ch.logoUrl}
                                        alt={ch.name}
                                        className="w-11 h-11 object-contain"
                                        onError={(e) => {
                                          const parent = (e.target as HTMLImageElement).parentElement;
                                          if (parent) {
                                            (e.target as HTMLImageElement).style.display = "none";
                                            parent.innerHTML = `<span class="text-[10px] text-muted-foreground text-center leading-tight px-1 font-medium">${ch.name}</span>`;
                                          }
                                        }}
                                      />
                                    ) : (
                                      <span className="text-[10px] text-muted-foreground text-center leading-tight px-1 font-medium">
                                        {ch.name}
                                      </span>
                                    )}
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="p-6 border-t border-border/50 bg-primary/5 flex justify-center">
                      <p className="text-xs text-muted-foreground text-center max-w-lg">
                        A grade de canais pode sofrer alterações sem aviso prévio conforme disponibilidade da programadora.
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              );
            }

            return (
              <div key={i} className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <Check className="w-4 h-4" />
                </div>
                <span className="text-sm text-muted-foreground">{feature}</span>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-3">
          <Button
            className={`w-full py-6 text-base font-semibold rounded-xl group transition-all duration-300 ${
              isSelected
                ? "bg-white text-primary hover:bg-white/90"
                : isHighlighted
                  ? "bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-1"
                  : "bg-secondary hover:bg-secondary/80 text-foreground hover:-translate-y-1"
            }`}
            onClick={handleToggle}
          >
            {buttonText}
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
