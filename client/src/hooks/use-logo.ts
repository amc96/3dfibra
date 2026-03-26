import { useQuery } from "@tanstack/react-query";

export function useLogoUrl() {
  return useQuery<{ key: string; value: string }>({
    queryKey: ["/api/settings", "logo_url"],
    queryFn: async () => {
      const res = await fetch("/api/settings/logo_url");
      if (!res.ok) return { key: "logo_url", value: "" };
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}
