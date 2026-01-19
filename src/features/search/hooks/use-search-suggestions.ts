import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useRef, useState } from "react";
import { useDebounce, useLocation } from "@/src/hooks";
import {
  fetchSuggestions,
  retrievePlace,
  generateSessionToken,
} from "../services/mapbox-search-service";
import type { SearchSuggestion } from "../types/search-types";

const DEBOUNCE_MS = 300;

// Query keys for cache management
export const searchKeys = {
  all: ["search"] as const,
  suggestions: (query: string) =>
    [...searchKeys.all, "suggestions", query] as const,
};

export function useSearchSuggestions() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query, DEBOUNCE_MS);

  // Maintain session token across searches (per Mapbox billing recommendations)
  const sessionTokenRef = useRef<string>(generateSessionToken());

  // Get user's current location for proximity bias
  const { coords } = useLocation({ enableHighAccuracy: true });

  // Proximity object for API
  const proximity = useMemo(() => {
    if (!coords) return undefined;
    return { longitude: coords.longitude, latitude: coords.latitude };
  }, [coords]);

  // "Your location" suggestion
  const currentLocationSuggestion: SearchSuggestion | null = useMemo(() => {
    if (!coords) return null;
    return {
      id: "current-location",
      name: "Your location",
      description: "Use your current location",
      type: "current_location",
      coordinates: [coords.longitude, coords.latitude],
    };
  }, [coords]);

  // Fetch suggestions from Mapbox
  const {
    data: apiSuggestions,
    isLoading,
    error,
  } = useQuery({
    queryKey: searchKeys.suggestions(debouncedQuery),
    queryFn: () =>
      fetchSuggestions({
        query: debouncedQuery,
        sessionToken: sessionTokenRef.current,
        proximity,
      }),
    enabled: debouncedQuery.length > 0,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
  });

  // Transform API response to app-level suggestions
  const suggestions: SearchSuggestion[] = useMemo(() => {
    const results: SearchSuggestion[] = [];

    // Add current location as first item when dropdown is open
    if (currentLocationSuggestion && isOpen) {
      results.push(currentLocationSuggestion);
    }

    // Add API results
    if (apiSuggestions?.suggestions) {
      const mapped = apiSuggestions.suggestions.map((s) => ({
        id: s.mapbox_id,
        name: s.name,
        description: s.place_formatted ?? s.full_address ?? "",
        type: "search_result" as const,
        mapboxId: s.mapbox_id,
      }));
      results.push(...mapped);
    }

    return results;
  }, [currentLocationSuggestion, apiSuggestions, isOpen]);

  // Select a suggestion and get its coordinates
  const selectSuggestion = useCallback(
    async (suggestion: SearchSuggestion): Promise<[number, number] | null> => {
      if (suggestion.type === "current_location") {
        setQuery("");
        setIsOpen(false);
        // Reset session token for next search session
        sessionTokenRef.current = generateSessionToken();
        return suggestion.coordinates ?? null;
      }

      if (suggestion.mapboxId) {
        try {
          const result = await retrievePlace(
            suggestion.mapboxId,
            sessionTokenRef.current
          );
          // Reset session token after retrieve
          sessionTokenRef.current = generateSessionToken();

          if (result.features.length > 0) {
            const coords = result.features[0].geometry.coordinates;
            setQuery(suggestion.name);
            setIsOpen(false);
            return coords;
          }
        } catch (err) {
          console.error("Failed to retrieve place:", err);
        }
      }

      setQuery(suggestion.name);
      setIsOpen(false);
      return null;
    },
    []
  );

  const clearSearch = useCallback(() => {
    setQuery("");
    setIsOpen(false);
    sessionTokenRef.current = generateSessionToken();
  }, []);

  const openDropdown = useCallback(() => setIsOpen(true), []);
  const closeDropdown = useCallback(() => setIsOpen(false), []);

  return {
    // State
    query,
    setQuery,
    isOpen,
    suggestions,
    isLoading: isLoading && debouncedQuery.length > 0,
    error: error instanceof Error ? error.message : null,

    // Actions
    openDropdown,
    closeDropdown,
    selectSuggestion,
    clearSearch,
  };
}
