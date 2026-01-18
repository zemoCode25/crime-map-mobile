import Mapbox from "@rnmapbox/maps";
import { StyleSheet, View } from "react-native";

// Initialize Mapbox with your access token
Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "");

export default function MapScreen() {
  return (
    <View style={styles.container}>
      <Mapbox.MapView
        style={styles.map}
        styleURL="mapbox://styles/mapbox/dark-v11"
        zoomEnabled={true}
        scrollEnabled={true}
        rotateEnabled={true}
      >
        <Mapbox.Camera
          zoomLevel={14}
          centerCoordinate={[121.0244, 14.4166]} // Muntinlupa City, Philippines
          animationMode="flyTo"
          animationDuration={2000}
        />
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
