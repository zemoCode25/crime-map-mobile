// Web placeholder for CrimeMarkersLayer
// Mapbox GL JS implementation would go here if web support is needed

import type { CrimeCaseWithRelations, CrimeType } from "@/src/features/crime";

export type { CrimeCaseWithRelations } from "@/src/features/crime";

interface CrimeMarkersLayerProps {
  crimes: CrimeCaseWithRelations[];
  crimeTypes?: CrimeType[];
  onMarkerPress?: (crime: CrimeCaseWithRelations) => void;
}

export function CrimeMarkersLayer(_props: CrimeMarkersLayerProps) {
  // Web implementation placeholder
  return null;
}
