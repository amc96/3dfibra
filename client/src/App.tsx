import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import Planos from "@/pages/Planos";
import NotFound from "@/pages/not-found";
import { SelectionProvider } from "@/hooks/use-selection";
import { SelectionBar } from "@/components/SelectionBar";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/planos" component={Planos} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SelectionProvider>
          <Toaster />
          <Router />
          <SelectionBar />
        </SelectionProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
