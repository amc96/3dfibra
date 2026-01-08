import { createContext, useContext, useState, ReactNode } from "react";
import { Plan } from "@shared/schema";

interface SelectionContextType {
  selectedPlans: Plan[];
  togglePlan: (plan: Plan) => void;
  clearSelection: () => void;
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [selectedPlans, setSelectedPlans] = useState<Plan[]>([]);

  const togglePlan = (plan: Plan) => {
    setSelectedPlans((prev) => {
      const exists = prev.find((p) => p.id === plan.id);
      if (exists) {
        return prev.filter((p) => p.id !== plan.id);
      }
      return [...prev, plan];
    });
  };

  const clearSelection = () => setSelectedPlans([]);

  return (
    <SelectionContext.Provider value={{ selectedPlans, togglePlan, clearSelection }}>
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
