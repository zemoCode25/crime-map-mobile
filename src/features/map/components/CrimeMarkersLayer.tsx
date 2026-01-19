import Mapbox from "@rnmapbox/maps";
import { useMemo } from "react";
import type { CrimeCaseWithRelations, CrimeType } from "@/src/features/crime";
import { CRIME_TYPE_COLORS } from "@/constants/crime-type";

// Re-export for convenience
export type { CrimeCaseWithRelations } from "@/src/features/crime";

interface CrimeMarkersLayerProps {
  crimes: CrimeCaseWithRelations[];
  crimeTypes?: CrimeType[];
  onMarkerPress?: (crime: CrimeCaseWithRelations) => void;
}

const NAMED_COLOR_MAP: Record<string, string> = {
  white: "#FFFFFF",
  black: "#111827",
  red: "#EF4444",
  orange: "#F97316",
  yellow: "#FACC15",
  green: "#22C55E",
  blue: "#3B82F6",
  violet: "#8B5CF6",
  purple: "#A855F7",
  pink: "#EC4899",
  gray: "#6B7280",
  grey: "#6B7280",
};

const normalizeMapColor = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^#([0-9a-fA-F]{3,4}){1,2}$/.test(trimmed)) return trimmed;
  if (/^rgba?\(/i.test(trimmed)) return trimmed;
  const lower = trimmed.toLowerCase();
  return NAMED_COLOR_MAP[lower] ?? null;
};

export function CrimeMarkersLayer({
  crimes,
  crimeTypes,
  onMarkerPress,
}: CrimeMarkersLayerProps) {
  // Create a color map from crime types
  const colorMap = useMemo(() => {
    const map: Record<number, string> = {};
    if (crimeTypes) {
      crimeTypes.forEach((type, index) => {
        // Use crime type's own color if available, otherwise use fallback from palette
        const normalizedColor = normalizeMapColor(type.color);
        map[type.id] = normalizedColor ?? CRIME_TYPE_COLORS[index % CRIME_TYPE_COLORS.length];
      });
    }
    return map;
  }, [crimeTypes]);

  // Convert crime data to GeoJSON FeatureCollection
  const geoJsonData = useMemo(() => {
    const features = crimes
      .filter((crime) => crime.location?.lat != null && crime.location?.long != null)
      .map((crime) => {
        const crimeTypeId = crime.crime_type ?? 0;
        const color = colorMap[crimeTypeId] ?? CRIME_TYPE_COLORS[0];

        return {
          type: "Feature" as const,
          id: crime.id,
          properties: {
            id: crime.id,
            case_number: crime.case_number,
            case_status: crime.case_status,
            crime_type_id: crimeTypeId,
            crime_type_name: crime.crime_type_info?.label ?? crime.crime_type_info?.name ?? "Unknown",
            color: color,
            description: crime.description,
            incident_datetime: crime.incident_datetime,
          },
          geometry: {
            type: "Point" as const,
            coordinates: [crime.location!.long!, crime.location!.lat!],
          },
        };
      });

    return {
      type: "FeatureCollection" as const,
      features,
    };
  }, [crimes, colorMap]);

  const handlePress = (event: any) => {
    const feature = event.features?.[0];
    if (feature && onMarkerPress) {
      const crimeId = feature.properties?.id;
      const crime = crimes.find((c) => c.id === crimeId);
      if (crime) {
        onMarkerPress(crime);
      }
    }
  };

  if (geoJsonData.features.length === 0) {
    return null;
  }

  return (
    <Mapbox.ShapeSource
      id="crime-markers"
      shape={geoJsonData}
      onPress={handlePress}
    >
      <Mapbox.HeatmapLayer
        id="crime-heatmap"
        style={{
          heatmapIntensity: ["interpolate", ["linear"], ["zoom"], 9, 0.9, 12, 1.3, 15, 1.8, 18, 2.4, 21, 3.0],
          heatmapRadius: ["interpolate", ["linear"], ["zoom"], 9, 14, 12, 22, 15, 34, 18, 48, 21, 60],
          heatmapOpacity: ["interpolate", ["linear"], ["zoom"], 9, 0.7, 14, 0.85, 21, 0.95],
          heatmapColor: [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,
            "rgba(255,255,0,0)",
            0.15,
            "rgba(255,235,0,0.45)",
            0.35,
            "rgba(255,180,0,0.7)",
            0.55,
            "rgba(255,120,0,0.88)",
            0.7,
            "rgba(255,70,0,0.96)",
            0.85,
            "rgba(230,30,30,0.98)",
            1,
            "rgba(220,20,20,1)",
          ],
        }}
      />
      {/* Outer circle (border effect) */}
      <Mapbox.CircleLayer
        id="crime-markers-outer"
        style={{
          circleRadius: 10,
          circleColor: ["get", "color"],
          circleOpacity: 0.3,
          circleStrokeWidth: 2,
          circleStrokeColor: ["get", "color"],
          circleStrokeOpacity: 0.8,
        }}
      />
      {/* Inner circle (solid) */}
      <Mapbox.CircleLayer
        id="crime-markers-inner"
        style={{
          circleRadius: 6,
          circleColor: ["get", "color"],
          circleOpacity: 0.9,
        }}
      />
    </Mapbox.ShapeSource>
  );
}
