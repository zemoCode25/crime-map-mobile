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
        map[type.id] = type.color ?? CRIME_TYPE_COLORS[index % CRIME_TYPE_COLORS.length];
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
