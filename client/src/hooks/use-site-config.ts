import { useQuery } from "@tanstack/react-query";

export interface SiteConfig {
  whatsapp: string;
  facebook: string;
  instagram: string;
}

// Used while loading or if the API fails, so links never break
export const FALLBACK_SITE_CONFIG: SiteConfig = {
  whatsapp: "5553999789222",
  facebook: "",
  instagram: "",
};

export function useSiteConfig(): SiteConfig {
  const { data } = useQuery<SiteConfig>({
    queryKey: ["/api/site-config"],
    queryFn: async () => {
      const res = await fetch("/api/site-config");
      if (!res.ok) return FALLBACK_SITE_CONFIG;
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
  return {
    whatsapp: data?.whatsapp || FALLBACK_SITE_CONFIG.whatsapp,
    facebook: data?.facebook ?? "",
    instagram: data?.instagram ?? "",
  };
}

export function whatsappLink(number: string, text?: string) {
  return `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

// 5553999789222 -> (53) 99978-9222
export function formatWhatsapp(number: string) {
  const local = number.startsWith("55") ? number.slice(2) : number;
  const m = local.match(/^(\d{2})(\d{4,5})(\d{4})$/);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : number;
}
