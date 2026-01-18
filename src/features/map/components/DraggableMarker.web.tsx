// Web fallback - Mapbox markers don't work on web with Metro bundler
// This is a no-op component for web compatibility

interface DraggableMarkerProps {
  id: string;
  coordinate: [number, number];
  onDragEnd?: (coordinate: [number, number]) => void;
  onDragStart?: () => void;
}

export function DraggableMarker(_props: DraggableMarkerProps) {
  // No-op on web since Mapbox doesn't render
  return null;
}
