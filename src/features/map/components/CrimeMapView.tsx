import Mapbox from "@rnmapbox/maps";
import { StyleSheet, View } from "react-native";

// Initialize Mapbox
Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "");

interface MapViewProps {
  centerCoordinate?: [number, number];
  zoomLevel?: number;
  children?: React.ReactNode;
}

export function CrimeMapView({
  centerCoordinate = [121.0244, 14.4166], // Muntinlupa City default
  zoomLevel = 14,
  children,
}: MapViewProps) {
  return (
    <View style={styles.container}>
      <Mapbox.MapView
        style={styles.map}
        styleURL="mapbox://styles/mapbox/light-v11"
        zoomEnabled={true}
        scrollEnabled={true}
        rotateEnabled={true}
      >
        <Mapbox.Camera
          zoomLevel={zoomLevel}
          centerCoordinate={centerCoordinate}
          animationMode="flyTo"
          animationDuration={2000}
        />
        {children}
      </Mapbox.MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});
