import { createContext, useContext, useState, ReactNode } from "react";
import { Plan } from "@shared/schema";

interface SelectedPlan extends Plan {
  quantity: number;
}

interface SelectionContextType {
  selectedPlans: SelectedPlan[];
  togglePlan: (plan: Plan) => void;
  updateQuantity: (planId: number, quantity: number) => void;
  clearSelection: () => void;
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [selectedPlans, setSelectedPlans] = useState<SelectedPlan[]>([]);

  const togglePlan = (plan: Plan) => {
    setSelectedPlans((prev) => {
      const exists = prev.find((p) => p.id === plan.id);
      if (exists) {
        return prev.filter((p) => p.id !== plan.id);
      }
      return [...prev, { ...plan, quantity: 1 }];
    });
  };

  const updateQuantity = (planId: number, quantity: number) => {
    setSelectedPlans((prev) => 
      prev.map((p) => p.id === planId ? { ...p, quantity: Math.max(1, quantity) } : p)
    );
  };

  const clearSelection = () => setSelectedPlans([]);

  return (
    <SelectionContext.Provider value={{ selectedPlans, togglePlan, updateQuantity, clearSelection }}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error("useSelection must be used within a SelectionProvider");
  }
  return context;
}
