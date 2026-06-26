import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import Planos from "@/pages/Planos";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/not-found";
import { SelectionProvider } from "@/hooks/use-selection";
import { SelectionBar } from "@/components/SelectionBar";
import { Navbar } from "@/components/Navbar";
import { useEffect } from "react";

function useDynamicFavicon() {
  const { data } = useQuery<{ key: string; value: string }>({
    queryKey: ["/api/settings", "favicon_url"],
    queryFn: async () => {
      const res = await fetch("/api/settings/favicon_url");
      if (!res.ok) return { key: "favicon_url", value: "" };
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const url = data?.value;
    if (!url) return;
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = url;
  }, [data?.value]);
}

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

function AppInner() {
  const [location] = useLocation();
  const isAdmin = location.startsWith("/admin");
  useDynamicFavicon();

  return (
    <TooltipProvider>
      <SelectionProvider>
        <Toaster />
        {!isAdmin && <Navbar />}
        <Router />
        {!isAdmin && <SelectionBar />}
      </SelectionProvider>
    </TooltipProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
    </QueryClientProvider>
  );
}

export default App;
