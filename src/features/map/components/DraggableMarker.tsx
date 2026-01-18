import Mapbox, { type PointAnnotation } from "@rnmapbox/maps";
import { useEffect, useRef } from "react";
import { Platform, StyleSheet, View } from "react-native";
import Svg, { Circle, Ellipse, Path } from "react-native-svg";

interface DraggableMarkerProps {
  id: string;
  coordinate: [number, number]; // [longitude, latitude]
  onDragEnd?: (coordinate: [number, number]) => void;
  onDragStart?: () => void;
}

type DragPayload = {
  geometry: {
    coordinates: number[];
  };
};

export function DraggableMarker({
  id,
  coordinate,
  onDragEnd,
  onDragStart,
}: DraggableMarkerProps) {
  const pointRef = useRef<PointAnnotation>(null);

  // Android requires refresh() to render custom views properly
  useEffect(() => {
    if (Platform.OS === "android") {
      const timer = setTimeout(() => {
        pointRef.current?.refresh();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDragEnd = (payload: DragPayload) => {
    const coords = payload.geometry.coordinates;
    if (coords.length >= 2) {
      onDragEnd?.([coords[0], coords[1]]);
    }
    // Refresh after drag on Android
    if (Platform.OS === "android") {
      setTimeout(() => pointRef.current?.refresh(), 50);
    }
  };

  return (
    <Mapbox.PointAnnotation
      ref={pointRef}
      id={id}
      coordinate={coordinate}
      draggable={true}
      onDragStart={onDragStart}
      onDragEnd={handleDragEnd}
      anchor={{ x: 0.5, y: 1 }}
    >
      <View style={styles.container}>
        <Svg width={40} height={52} viewBox="0 0 40 52">
          {/* Shadow ellipse */}
          <Ellipse cx="20" cy="49" rx="8" ry="3" fill="rgba(0,0,0,0.2)" />
          {/* Pin body - teardrop shape */}
          <Path
            d="M20 0C9 0 0 9 0 20c0 15 20 30 20 30s20-15 20-30C40 9 31 0 20 0z"
            fill="#EA4335"
          />
          {/* Inner highlight */}
          <Path
            d="M20 2C10.1 2 2 10.1 2 20c0 13.5 18 27 18 27s18-13.5 18-27C38 10.1 29.9 2 20 2z"
            fill="#DC2626"
          />
          {/* White circle in center */}
          <Circle cx="20" cy="18" r="8" fill="#FFFFFF" />
        </Svg>
      </View>
    </Mapbox.PointAnnotation>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 52,
    alignItems: "center",
    justifyContent: "flex-start",
  },
});
