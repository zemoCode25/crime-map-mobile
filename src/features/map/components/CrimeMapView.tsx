import Mapbox from "@rnmapbox/maps";
import { StyleSheet, View } from "react-native";

// Initialize Mapbox
Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "");

interface MapViewProps {
  centerCoordinate?: [number, number];
  zoomLevel?: number;
  pitch?: number;
  styleURL?: string;
  followUserLocation?: boolean;
  followUserMode?: Mapbox.UserTrackingMode;
  followZoomLevel?: number;
  compassEnabled?: boolean;
  compassPosition?: OrnamentPosition;
  scaleBarEnabled?: boolean;
  scaleBarPosition?: OrnamentPosition;
  children?: React.ReactNode;
}

type OrnamentPosition =
  | { top: number; left: number }
  | { top: number; right: number }
  | { bottom: number; left: number }
  | { bottom: number; right: number };

export function CrimeMapView({
  centerCoordinate = [121.0244, 14.4166], // Muntinlupa City default
  zoomLevel = 14,
  pitch = 45,
  styleURL,
  followUserLocation = false,
  followUserMode = Mapbox.UserTrackingMode.FollowWithHeading,
  followZoomLevel = 15,
  compassEnabled = true,
  compassPosition,
  scaleBarEnabled = true,
  scaleBarPosition,
  children,
}: MapViewProps) {
  return (
    <View style={styles.container}>
      <Mapbox.MapView
        style={styles.map}
        styleURL={styleURL ?? "mapbox://styles/mapbox/outdoors-v12"}
        zoomEnabled={true}
        scrollEnabled={true}
        rotateEnabled={true}
        compassEnabled={compassEnabled}
        compassFadeWhenNorth={true}
        compassPosition={compassPosition}
        scaleBarEnabled={scaleBarEnabled}
        scaleBarPosition={scaleBarPosition}
      >
        <Mapbox.RasterDemSource
          id="terrain-source"
          url="mapbox://mapbox.mapbox-terrain-dem-v1"
          tileSize={512}
          maxZoomLevel={14}
        >
          <Mapbox.Terrain style={{ exaggeration: 1.15 }} />
        </Mapbox.RasterDemSource>
        <Mapbox.Camera
          zoomLevel={zoomLevel}
          centerCoordinate={centerCoordinate}
          pitch={pitch}
          animationMode="flyTo"
          animationDuration={2000}
          followUserLocation={followUserLocation}
          followUserMode={followUserMode}
          followZoomLevel={followZoomLevel}
        />
        {/* Blue puck showing user's live location with heading indicator */}
        <Mapbox.UserLocation
          visible={true}
          showsUserHeadingIndicator={true}
          androidRenderMode="compass"
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
