// Mapbox Searchbox API v1 response types
export interface MapboxSuggestion {
  mapbox_id: string;
  name: string;
  full_address?: string;
  place_formatted?: string;
  feature_type: string;
  address?: string;
  context?: {
    country?: { name: string; country_code: string };
    region?: { name: string };
    place?: { name: string };
    locality?: { name: string };
    neighborhood?: { name: string };
  };
}

export interface MapboxSuggestResponse {
  suggestions: MapboxSuggestion[];
  attribution: string;
}

// For the retrieve endpoint (getting full details with coordinates)
export interface MapboxRetrieveResponse {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: {
      type: "Point";
      coordinates: [number, number]; // [longitude, latitude]
    };
    properties: {
      mapbox_id: string;
      name: string;
      full_address?: string;
      place_formatted?: string;
    };
  }>;
}

// App-level suggestion type (unified)
export interface SearchSuggestion {
  id: string;
  name: string;
  description: string;
  type: "current_location" | "search_result";
  coordinates?: [number, number]; // [longitude, latitude]
  mapboxId?: string;
}
