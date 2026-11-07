import { useQuery } from "@tanstack/react-query";
import type { BannerConfig } from "@shared/schema";

const EMPTY: BannerConfig = { enabled: false, interval: 6, slides: [] };

export function useBanners() {
  return useQuery<BannerConfig>({
    queryKey: ["/api/banners"],
    queryFn: async () => {
      const res = await fetch("/api/banners");
      if (!res.ok) return EMPTY;
      return res.json();
    },
    staleTime: 60 * 1000,
  });
}
