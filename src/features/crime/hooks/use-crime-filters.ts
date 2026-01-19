import { useState, useCallback, useMemo } from "react";
import type { BarangayValue } from "@/constants/barangays";

export type TimeRange = "7d" | "30d" | "90d" | "365d" | null;

export const TIME_RANGE_OPTIONS = [
  { value: "7d" as const, label: "Last 7 Days" },
  { value: "30d" as const, label: "Last 30 Days" },
  { value: "90d" as const, label: "Last 90 Days" },
  { value: "365d" as const, label: "Last 365 Days" },
] as const;

export interface CrimeFilters {
  crimeTypes: number[];
  barangays: BarangayValue[];
  statuses: string[];
  timeRange: TimeRange;
}

const initialFilters: CrimeFilters = {
  crimeTypes: [],
  barangays: [],
  statuses: [],
  timeRange: null,
};

export function useCrimeFilters() {
  const [filters, setFilters] = useState<CrimeFilters>(initialFilters);
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const openFilters = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeFilters = useCallback(() => {
    setIsOpen(false);
  }, []);

  const setCrimeTypes = useCallback((types: number[]) => {
    setFilters((prev) => ({ ...prev, crimeTypes: types }));
  }, []);

  const setBarangays = useCallback((barangays: BarangayValue[]) => {
    setFilters((prev) => ({ ...prev, barangays }));
  }, []);

  const setStatuses = useCallback((statuses: string[]) => {
    setFilters((prev) => ({ ...prev, statuses }));
  }, []);

  const setTimeRange = useCallback((timeRange: TimeRange) => {
    setFilters((prev) => ({ ...prev, timeRange }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.crimeTypes.length > 0 ||
      filters.barangays.length > 0 ||
      filters.statuses.length > 0 ||
      filters.timeRange !== null
    );
  }, [filters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.crimeTypes.length > 0) count++;
    if (filters.barangays.length > 0) count++;
    if (filters.statuses.length > 0) count++;
    if (filters.timeRange !== null) count++;
    return count;
  }, [filters]);

  return {
    filters,
    isOpen,
    toggleOpen,
    openFilters,
    closeFilters,
    setCrimeTypes,
    setBarangays,
    setStatuses,
    setTimeRange,
    clearFilters,
    hasActiveFilters,
    activeFilterCount,
  };
}
