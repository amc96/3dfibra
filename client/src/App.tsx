import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import Planos from "@/pages/Planos";
import NotFound from "@/pages/not-found";
import { SelectionProvider } from "@/hooks/use-selection";

export default App;
