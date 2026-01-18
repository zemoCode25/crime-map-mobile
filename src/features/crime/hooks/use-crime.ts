import { useQuery } from "@tanstack/react-query";
import {
  getCrimeCaseById,
  getCrimeCases,
  getCrimeTypes,
} from "../services/crime-service";

// Query keys for cache management
export const crimeKeys = {
  all: ["crimes"] as const,
  lists: () => [...crimeKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...crimeKeys.lists(), filters] as const,
  details: () => [...crimeKeys.all, "detail"] as const,
  detail: (id: number) => [...crimeKeys.details(), id] as const,
  types: () => [...crimeKeys.all, "types"] as const,
};

// Hook to fetch all crime cases
export function useCrimeCases() {
  return useQuery({
    queryKey: crimeKeys.lists(),
    queryFn: getCrimeCases,
  });
}

// Hook to fetch a single crime case
export function useCrimeCase(id: number) {
  return useQuery({
    queryKey: crimeKeys.detail(id),
    queryFn: () => getCrimeCaseById(id),
    enabled: !!id,
  });
}

// Hook to fetch crime types
export function useCrimeTypes() {
  return useQuery({
    queryKey: crimeKeys.types(),
    queryFn: getCrimeTypes,
  });
}
