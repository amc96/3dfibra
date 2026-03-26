import { useQuery } from "@tanstack/react-query";
import type { Channel } from "@shared/channels";

interface ChannelsData {
  plus: Channel[];
  ultra: Channel[];
  hbo: Channel[];
}

export function useChannels() {
  return useQuery<ChannelsData>({
    queryKey: ["/api/channels"],
    staleTime: 5 * 60 * 1000,
  });
}
