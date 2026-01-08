import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function usePlans() {
  return useQuery({
    queryKey: [api.plans.list.path],
    queryFn: async () => {
      const res = await fetch(api.plans.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch plans");
      return api.plans.list.responses[200].parse(await res.json());
    },
  });
}

export function usePlan(id: number) {
  return useQuery({
    queryKey: [api.plans.get.path, id],
    queryFn: async () => {
      // Note: We'd normally use buildUrl here if it was dynamic in the hook, 
      // but simplistic usage for now directly constructs or assumes context
      const res = await fetch(api.plans.get.path.replace(':id', id.toString()), { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch plan");
      return api.plans.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}
