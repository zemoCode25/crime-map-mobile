import type {
  MapboxSuggestResponse,
  MapboxRetrieveResponse,
} from "../types/search-types";

const MAPBOX_BASE_URL = "https://api.mapbox.com/search/searchbox/v1";

// Generate a unique session token for billing optimization
export function generateSessionToken(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export interface SuggestParams {
  query: string;
  sessionToken: string;
  proximity?: { longitude: number; latitude: number };
  limit?: number;
}

export async function fetchSuggestions({
  query,
  sessionToken,
  proximity,
  limit = 10,
}: SuggestParams): Promise<MapboxSuggestResponse> {
  const accessToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("Mapbox access token not configured");
  }

  if (!query.trim()) {
    return { suggestions: [], attribution: "" };
  }

  const params = new URLSearchParams({
    q: query.trim(),
    access_token: accessToken,
    session_token: sessionToken,
    language: "en",
    limit: String(limit),
    country: "PH",
    types: "place,locality,neighborhood,address,poi,street",
  });

  // Add proximity if available (for location-biased results)
  if (proximity) {
    params.append("proximity", `${proximity.longitude},${proximity.latitude}`);
  }

  const response = await fetch(`${MAPBOX_BASE_URL}/suggest?${params}`);

  if (!response.ok) {
    throw new Error(`Mapbox API error: ${response.status}`);
  }

  return response.json();
}

export async function retrievePlace(
  mapboxId: string,
  sessionToken: string
): Promise<MapboxRetrieveResponse> {
  const accessToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("Mapbox access token not configured");
  }

  const params = new URLSearchParams({
    access_token: accessToken,
    session_token: sessionToken,
  });

  const response = await fetch(
    `${MAPBOX_BASE_URL}/retrieve/${mapboxId}?${params}`
  );

  if (!response.ok) {
    throw new Error(`Mapbox retrieve error: ${response.status}`);
  }

  return response.json();
}
