import { useSelection } from "@/hooks/use-selection";
import { Button } from "./ui/button";
import { X, ShoppingCart, Send, Plus, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function SelectionBar() {
  const { selectedPlans, togglePlan, updateQuantity, clearSelection } = useSelection();

  if (selectedPlans.length === 0) return null;

  const handleCheckout = () => {
    const plansText = selectedPlans.map(p => {
      let text = `- ${p.name} (${p.speed})`;
      if (p.category === "adicionais") text += ` x${p.quantity}`;
      if (p.category === "tv" && p.quantity > 1) text += ` + ${p.quantity - 1} ponto(s) adicional(ais)`;
      return text;
    }).join("%0A");
    
    const whatsappUrl = `https://api.whatsapp.com/send?phone=5553999789222&text=Olá! Gostaria de assinar os seguintes planos:%0A${plansText}%0A%0A*Total Estimado: R$ ${totalPrice}*`;
    window.open(whatsappUrl, '_blank');
  };

  const getTvPointPrice = (planName: string) => {
    if (planName.includes("Light")) return 9;
    if (planName.includes("Plus")) return 20;
    if (planName.includes("Ultra") && !planName.includes("HBO")) return 27;
    return 0;
  };

  const calculateTotal = () => {
    return selectedPlans.reduce((acc, plan) => {
      let planPrice = parseFloat(plan.price.replace(',', '.'));
      let total = planPrice;

      if (plan.category === "adicionais") {
        total = planPrice * plan.quantity;
      } else if (plan.category === "tv") {
        const pointPrice = getTvPointPrice(plan.name);
        total = planPrice + (pointPrice * (plan.quantity - 1));
      }

      return acc + total;
    }, 0);
  };

  const totalPrice = calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        className="fixed bottom-0 left-0 right-0 z-[100] p-4 bg-background/80 backdrop-blur-xl border-t border-primary/20 shadow-[0_-10px_40px_-15px_rgba(var(--primary),0.3)]"
      >
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 overflow-x-auto pb-2 md:pb-0 no-scrollbar w-full md:w-auto">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 shrink-0">
              <div className="flex items-center gap-2 text-primary font-bold whitespace-nowrap">
                <ShoppingCart className="w-5 h-5" />
                <span>{selectedPlans.length} {selectedPlans.length === 1 ? 'item' : 'itens'}</span>
              </div>
              <div className="flex items-baseline gap-1 text-white whitespace-nowrap bg-primary/20 px-3 py-1 rounded-full border border-primary/30">
                <span className="text-xs font-medium opacity-70 uppercase tracking-wider">Total:</span>
                <span className="text-sm font-black">R$ {totalPrice}</span>
              </div>
            </div>
            <div className="flex gap-4">
              {selectedPlans.map((plan) => {
                const isTvWithPoints = plan.category === "tv" && !plan.name.includes("HBO");
                const maxQuantity = plan.category === "tv" ? 3 : 99; // 1 principal + 2 adicionais = 3 total

                return (
                  <div 
                    key={plan.id}
                    className="flex items-center gap-3 bg-primary/10 border border-primary/20 text-primary px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap"
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{plan.name}</span>
                        <span className="text-xs font-black bg-primary/20 px-1.5 py-0.5 rounded">R$ {plan.price}</span>
                      </div>
                      <span className="text-xs opacity-70">
                        {plan.category === "tv" && plan.quantity > 1 
                          ? `${plan.speed} (+${plan.quantity - 1} ponto)` 
                          : plan.speed}
                      </span>
                    </div>

                    {(plan.category === "adicionais" || isTvWithPoints) && (
                      <div className="flex flex-col items-center gap-1 ml-2">
                        {plan.category === "tv" && <span className="text-[10px] uppercase font-bold opacity-50">Pontos</span>}
                        <div className="flex items-center gap-2 bg-background/50 rounded-lg px-2 py-1">
                          <button 
                            onClick={() => updateQuantity(plan.id, plan.quantity - 1)}
                            className="p-1 hover:text-white transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-4 text-center font-bold">
                            {plan.category === "tv" ? plan.quantity : plan.quantity}
                          </span>
                          <button 
                            onClick={() => plan.quantity < maxQuantity ? updateQuantity(plan.id, plan.quantity + 1) : null}
                            className="p-1 hover:text-white transition-colors disabled:opacity-20"
                            disabled={plan.quantity >= maxQuantity}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}

                    <button onClick={() => togglePlan(plan)} className="ml-2 p-1 hover:text-red-500 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
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
