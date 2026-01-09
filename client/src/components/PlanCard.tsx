import { Plan } from "@shared/schema";
import { Check, Wifi, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { motion } from "framer-motion";
import { useSelection } from "@/hooks/use-selection";
import { useToast } from "@/hooks/use-toast";

interface PlanCardProps {
  plan: Plan;
  index: number;
}

export function PlanCard({ plan, index }: PlanCardProps) {
  const isHighlighted = plan.isHighlighted;
  const { selectedPlans, togglePlan } = useSelection();
  const { toast } = useToast();
  const isSelected = selectedPlans.some(p => p.id === plan.id);

  const handleToggle = () => {
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
        {/* Background Pattern */}
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

          {plan.features.map((feature, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                <Check className="w-4 h-4" />
              </div>
              <span className="text-sm text-muted-foreground">{feature}</span>
            </div>
          ))}
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
