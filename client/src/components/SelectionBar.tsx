import { useSelection } from "@/hooks/use-selection";
import { Button } from "./ui/button";
import { X, ShoppingCart, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function SelectionBar() {
  const { selectedPlans, togglePlan, clearSelection } = useSelection();

  if (selectedPlans.length === 0) return null;

  const handleCheckout = () => {
    const plansText = selectedPlans.map(p => `- ${p.name} (${p.speed})`).join("%0A");
    const whatsappUrl = `https://api.whatsapp.com/send?phone=5553999789222&text=Olá! Gostaria de assinar os seguintes planos:%0A${plansText}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        className="fixed bottom-0 left-0 right-0 z-[100] p-4 bg-background/80 backdrop-blur-xl border-t border-primary/20 shadow-[0_-10px_40px_-15px_rgba(var(--primary),0.3)]"
      >
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            <div className="flex items-center gap-2 text-primary font-bold whitespace-nowrap">
              <ShoppingCart className="w-5 h-5" />
              <span>{selectedPlans.length} {selectedPlans.length === 1 ? 'plano selecionado' : 'planos selecionados'}:</span>
            </div>
            <div className="flex gap-2">
              {selectedPlans.map((plan) => (
                <div 
                  key={plan.id}
                  className="flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap"
                >
                  {plan.name}
                  <button onClick={() => togglePlan(plan)} className="hover:text-white transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button 
              variant="ghost" 
              onClick={clearSelection}
              className="text-muted-foreground hover:text-white"
            >
              Limpar
            </Button>
            <Button 
              onClick={handleCheckout}
              className="flex-1 md:flex-none bg-primary hover:bg-primary/90 text-white rounded-full px-8 py-6 shadow-lg shadow-primary/25"
            >
              Concluir Pedido
              <Send className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
