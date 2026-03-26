import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import Planos from "@/pages/Planos";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/not-found";
import { SelectionProvider } from "@/hooks/use-selection";
import { SelectionBar } from "@/components/SelectionBar";
import { Navbar } from "@/components/Navbar";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/planos" component={Planos} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const isAdmin = location.startsWith("/admin");

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SelectionProvider>
          <Toaster />
          {!isAdmin && <Navbar />}
          <Router />
          {!isAdmin && <SelectionBar />}
        </SelectionProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
