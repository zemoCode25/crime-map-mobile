import { useQuery } from "@tanstack/react-query";
import { getHotlines } from "../services/hotline-service";

export const emergencyKeys = {
  all: ["emergency"] as const,
  hotlines: () => [...emergencyKeys.all, "hotlines"] as const,
};

export function useHotlines() {
  return useQuery({
    queryKey: emergencyKeys.hotlines(),
    queryFn: getHotlines,
    staleTime: 1000 * 60 * 60 * 24,
  });
}
